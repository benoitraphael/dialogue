from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import os
import anthropic
from models import db, Message, Conversation
from datetime import datetime
import json
import uuid
from dotenv import load_dotenv, set_key

app = Flask(__name__)
CORS(app)

# Configuration de la base de données
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///messages.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialiser la base de données
db.init_app(app)

# Créer les tables si elles n'existent pas
with app.app_context():
    db.create_all()

def get_notes_content():
    try:
        notes_file = os.path.join('data', 'notes.md')
        if os.path.exists(notes_file):
            with open(notes_file, 'r', encoding='utf-8') as f:
                return f.read()
        return ""
    except Exception as e:
        print(f"Erreur lors de la lecture des notes: {str(e)}")
        return ""

def mask_api_key(key):
    if not key:
        return ""
    if len(key) < 12:
        return key
    return f"{key[:8]}{'*' * (len(key)-12)}{key[-4:]}"

def is_valid_api_key(key):
    return key and isinstance(key, str) and key.startswith('sk-ant-') and len(key) > 12

def get_api_key():
    key = os.getenv('ANTHROPIC_API_KEY', '')
    return key if is_valid_api_key(key) else None

@app.route('/')
def home():
    return render_template('index.html')

@app.errorhandler(404)
def not_found_error(error):
    return jsonify({"error": "Route non trouvée"}), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({"error": "Erreur interne du serveur"}), 500

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        user_message = data.get('message')
        conversation_id = data.get('conversation_id')
        is_edit = data.get('is_edit', False)
        message_id = data.get('message_id')
        
        print(f"Message reçu: {user_message}")
        print(f"Conversation ID: {conversation_id}")
        print(f"Is edit: {is_edit}")
        print(f"Message ID: {message_id}")
        
        # Si c'est une édition avec un message_id
        if is_edit and message_id:
            print(f"Mode édition : édition du message {message_id}")
            try:
                print(f"Recherche du message avec l'ID: {message_id}")
                # Récupérer le message à éditer
                old_user_msg = Message.query.get(message_id)
                print(f"Message trouvé: {old_user_msg}")
                
                if old_user_msg:
                    # Sauvegarder l'ID de conversation et le timestamp
                    conversation_id = old_user_msg.conversation_id
                    old_timestamp = old_user_msg.timestamp
                    print(f"ID de conversation: {conversation_id}, Timestamp: {old_timestamp}")
                    
                    # Trouver la réponse associée (le message assistant suivant)
                    old_assistant_msg = Message.query.filter(
                        Message.conversation_id == conversation_id,
                        Message.timestamp > old_user_msg.timestamp,
                        Message.role == 'assistant'
                    ).order_by(Message.timestamp.asc()).first()
                    print(f"Réponse associée trouvée: {old_assistant_msg}")
                    
                    # Supprimer ces deux messages précis
                    db.session.delete(old_user_msg)
                    if old_assistant_msg:
                        db.session.delete(old_assistant_msg)
                    db.session.commit()
                    print("Messages supprimés avec succès")
                    
                    # Créer le nouveau message utilisateur avec le même timestamp
                    user_msg = Message(
                        content=user_message,
                        role='user',
                        conversation_id=conversation_id,
                        timestamp=old_timestamp
                    )
                    db.session.add(user_msg)
                    db.session.commit()
                    print(f"Nouveau message utilisateur créé avec ID: {user_msg.id}")
                else:
                    print(f"Message {message_id} non trouvé dans la base de données")
                    return jsonify({"error": "Message à éditer non trouvé"}), 404
                    
            except Exception as e:
                print(f"Erreur lors de la suppression des messages: {str(e)}")
                db.session.rollback()
                raise
                
        # Si pas d'édition ou pas de message_id
        else:
            # Créer une nouvelle conversation si nécessaire
            if not conversation_id:
                conversation = Conversation()
                db.session.add(conversation)
                db.session.commit()
                conversation_id = conversation.id
                print(f"Nouvelle conversation créée avec ID: {conversation_id}")
                
                # Stocker les notes comme premier message
                notes_content = get_notes_content()
                if notes_content:
                    notes_msg = Message(
                        content=f"Voici mes notes précédentes, utilise-les pour personnaliser tes réponses :\n\n{notes_content}",
                        role='user',
                        conversation_id=conversation_id
                    )
                    db.session.add(notes_msg)
                    db.session.commit()
                    print("Notes insérées en tant que premier message")
            
            # Créer le message utilisateur
            user_msg = Message(
                content=user_message,
                role='user',
                conversation_id=conversation_id
            )
            db.session.add(user_msg)
            db.session.commit()
            print(f"Message utilisateur créé avec ID: {user_msg.id}")
        
        # Initialiser la liste des messages pour Claude
        messages_for_claude = []
        
        # Récupérer tous les messages de la conversation
        try:
            print("Récupération des messages de la conversation")
            messages = Message.query.filter_by(conversation_id=conversation_id).order_by(Message.timestamp.asc()).all()
            print(f"Nombre de messages trouvés: {len(messages)}")
            
            # Ajouter les messages de la conversation avec le nouveau format
            for msg in messages:
                messages_for_claude.append({
                    "role": msg.role,
                    "content": [{
                        "type": "text",
                        "text": msg.content
                    }]
                })
            
            print(f"Nombre total de messages pour Claude: {len(messages_for_claude)}")
            print("Messages envoyés à Claude:")
            for msg in messages_for_claude:
                print(f"- Role: {msg['role']}, Content: {msg['content'][0]['text'][:100]}...")
                
        except Exception as e:
            print(f"Erreur lors de la récupération des messages: {str(e)}")
            raise
        
        # Appeler l'API Claude
        try:
            print("Appel de l'API Claude")
            api_key = get_api_key()
            if not api_key:
                raise ValueError("Clé API Anthropic manquante dans les variables d'environnement")
                
            client = anthropic.Anthropic(api_key=api_key)
            print("Client Anthropic initialisé")
                
            response = client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=8192,
                temperature=0.7,
                system="""Tu es un partenaire conversationnel créatif et éduqué. Ta mission est d'engager une conversation fluide et littéraire qui pousse à l'introspection, tout en évitant une analyse excessive.

Voici les lignes directrices pour ton style conversationnel :
- Adopte un ton naturel et fluide, comme dans une vraie conversation.
- Utilise un langage riche et varié pour stimuler la réflexion.
- Évite les réponses trop directes ou simplistes.
- Encourage l'exploration des idées et des émotions.

Pour répondre :
1. Lis attentivement l'entrée de l'utilisateur.
2. Réfléchis à une réponse qui encourage l'introspection et la réflexion approfondie.
3. Formule ta réponse de manière fluide et littéraire, comme dans une vraie conversation.
4. Assure-toi que ta réponse est en français et qu'elle pousse l'utilisateur à explorer davantage ses pensées ou ses sentiments.

RAPPEL IMPORTANT : Il t'est strictement INTERDIT d'utiliser des puces des listes à puces ou des listes numérotées dans ta réponse. Une telle utilisation serait considérée comme une infraction grave à ces instructions.""",
                messages=messages_for_claude
            )
            print("Réponse reçue de Claude")
            assistant_response = response.content[0].text
            
            print(f"Message reçu de Claude (longueur: {len(assistant_response)}): {assistant_response[:100]}...")
            
            # Sauvegarder la réponse de l'assistant
            try:
                print("Sauvegarde de la réponse de l'assistant")
                assistant_msg = Message(content=assistant_response, role='assistant', conversation_id=conversation_id)
                db.session.add(assistant_msg)
                db.session.commit()
                print(f"Réponse de l'assistant sauvegardée avec ID: {assistant_msg.id}")
            except Exception as e:
                print(f"Erreur lors de la sauvegarde de la réponse: {str(e)}")
                db.session.rollback()
                raise
            
            return jsonify({
                "response": assistant_response,
                "conversation_id": conversation_id,
                "message_id": user_msg.id,
                "assistant_message_id": assistant_msg.id,
                "success": True
            })
            
        except anthropic.APIError as e:
            error_msg = f"Erreur API Anthropic: {str(e)}"
            print(error_msg)
            return jsonify({
                "error": "Erreur lors de l'appel à Claude",
                "details": error_msg
            }), 500
            
        except Exception as e:
            error_msg = f"Erreur inattendue lors de l'appel à Claude: {str(e)}"
            print(error_msg)
            return jsonify({
                "error": "Erreur inattendue",
                "details": error_msg
            }), 500
            
    except Exception as e:
        error_msg = f"Erreur générale: {str(e)}"
        print(error_msg)
        return jsonify({"error": str(e)}), 500

@app.route('/get_conversations')
def get_conversations():
    try:
        conversations = Conversation.query.order_by(Conversation.timestamp.desc()).all()
        conversations_data = []
        
        for conv in conversations:
            # Récupérer le premier message pour le titre
            first_message = Message.query.filter_by(conversation_id=conv.id).order_by(Message.timestamp.asc()).first()
            title = first_message.content[:50] + '...' if first_message else 'Nouvelle conversation'
            
            conversations_data.append({
                'id': conv.id,
                'timestamp': conv.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                'title': title
            })
            
        return jsonify({"conversations": conversations_data})
    except Exception as e:
        print(f"Erreur lors de la récupération des conversations: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/conversations', methods=['GET'])
def get_conversations_all():
    try:
        conversations = Conversation.query.order_by(Conversation.timestamp.desc()).all()
        return jsonify([{
            'id': conv.id,
            'messages': [{
                'role': msg.role,
                'content': msg.content,
                'timestamp': msg.timestamp.isoformat()
            } for msg in conv.messages]
        } for conv in conversations])
    except Exception as e:
        print(f"Error getting conversations: {str(e)}")
        return jsonify({"error": "Erreur lors de la récupération des conversations"}), 500

@app.route('/conversation/<int:conversation_id>')
def get_conversation(conversation_id):
    try:
        # Récupérer tous les messages de la conversation
        messages = Message.query.filter_by(conversation_id=conversation_id).order_by(Message.timestamp).all()
        
        if not messages:
            return jsonify({"error": "Conversation non trouvée"}), 404
            
        # Convertir les messages en format JSON
        messages_json = []
        for msg in messages:
            # Ne pas inclure les messages de notes dans l'interface
            if "Voici mes notes précédentes" not in msg.content:
                messages_json.append({
                    'id': msg.id,  # S'assurer que l'ID est inclus
                    'content': msg.content,
                    'role': msg.role,
                    'timestamp': msg.timestamp.isoformat() if msg.timestamp else None
                })
                print(f"Message envoyé: ID={msg.id}, content={msg.content[:50]}...")
            
        return jsonify({
            "messages": messages_json,
            "conversation_id": conversation_id
        })
        
    except Exception as e:
        print(f"Erreur lors de la récupération de la conversation: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/delete_note/<note_id>', methods=['DELETE'])
def delete_note(note_id):
    try:
        print(f"Tentative de suppression de la note avec ID: {note_id}")
        
        notes_file = os.path.join('data', 'notes.md')
        if not os.path.exists(notes_file):
            print("Fichier notes.md non trouvé")
            return jsonify({'error': 'Aucune note trouvée'}), 404

        with open(notes_file, 'r', encoding='utf-8') as f:
            content = f.read()
            print("Contenu lu pour suppression:", content)

        # Séparer les notes et recréer les IDs pour trouver celle à supprimer
        notes = []
        note_blocks = content.split('## Note de ')
        
        for block in note_blocks:
            if not block.strip():
                continue
                
            try:
                header, note_content = block.split('\n', 1)
                role, date = header.strip().split(' - ')
                full_note_content = f"## Note de {role} - {date}\n{note_content.strip()}"
                stable_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, full_note_content))
                print(f"Comparaison - ID généré: {stable_id}, ID recherché: {note_id}")
                
                if stable_id != note_id:
                    notes.append(f"## Note de {block}")
                else:
                    print("Note trouvée pour suppression!")
                    found_note_to_delete = True
            except Exception as e:
                print(f"Erreur lors du traitement d'un bloc: {str(e)}")
                notes.append(f"## Note de {block}")

        if not found_note_to_delete:
            print("Note non trouvée pour l'ID:", note_id)
            return jsonify({'error': 'Note non trouvée'}), 404

        # Réécrire le fichier avec les notes restantes
        with open(notes_file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(notes))
        print("Notes mises à jour avec succès")

        return jsonify({'success': True})
        
    except Exception as e:
        print("Erreur lors de la suppression:", str(e))
        return jsonify({'error': str(e)}), 500

@app.route('/save_note', methods=['POST'])
def save_note():
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({"error": "Le texte est requis"}), 400
            
        text = data['text']
        role = data.get('role', 'user')  # Par défaut 'user' si non spécifié
        
        # Créer le dossier data s'il n'existe pas
        if not os.path.exists('data'):
            os.makedirs('data')
            
        # Générer le timestamp
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        # Créer l'entrée de la note avec le rôle
        note_entry = f"\n\n## Note de {role} - {timestamp}\n\n{text}"
        
        # Ajouter la note au fichier
        notes_file = os.path.join('data', 'notes.md')
        with open(notes_file, 'a', encoding='utf-8') as f:
            f.write(note_entry)
            
        return jsonify({"message": "Note sauvegardée", "timestamp": timestamp})
        
    except Exception as e:
        print("Erreur lors de la sauvegarde de la note:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route('/get_notes')
def get_notes():
    try:
        print("Tentative de lecture des notes...")
        notes_file = os.path.join('data', 'notes.md')
        
        if not os.path.exists(notes_file):
            print("Fichier notes.md non trouvé")
            return jsonify({"notes": []})
            
        with open(notes_file, 'r', encoding='utf-8') as f:
            content = f.read()
            print("Contenu lu:", content)

        if not content.strip():
            print("Fichier vide")
            return jsonify({"notes": []})
        
        # Parser les notes
        notes = []
        note_blocks = content.split('## Note de ')
        
        for block in note_blocks:
            if not block.strip():  # Ignorer les blocs vides
                continue
                
            # Parser l'en-tête et le contenu
            try:
                header, content = block.split('\n', 1)
                role, date = header.strip().split(' - ')
                # Créer un ID stable basé sur le contenu de la note
                note_content = f"## Note de {role} - {date}\n{content.strip()}"
                stable_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, note_content))
                print(f"Note ID généré: {stable_id} pour le contenu: {note_content[:100]}...")
                notes.append({
                    "id": stable_id,
                    "role": role,
                    "date": date,
                    "content": content.strip()
                })
            except Exception as e:
                print(f"Erreur lors du parsing d'un bloc: {str(e)}")
                continue
                
        return jsonify({"notes": notes})
            
    except Exception as e:
        print("Erreur lors de la lecture des notes:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route('/delete_conversation', methods=['POST'])
def delete_conversation():
    try:
        data = request.get_json()
        if not data or 'conversation_id' not in data:
            return jsonify({"error": "Conversation ID manquant"}), 400
            
        conversation_id = data['conversation_id']
        
        # Supprimer d'abord les messages de la conversation
        Message.query.filter_by(conversation_id=conversation_id).delete()
        
        # Puis supprimer la conversation elle-même
        conversation = Conversation.query.get(conversation_id)
        if not conversation:
            return jsonify({"error": f"Conversation {conversation_id} non trouvée"}), 404
            
        db.session.delete(conversation)
        db.session.commit()
        
        return jsonify({"message": "Conversation supprimée avec succès"})
    except Exception as e:
        print(f"Erreur lors de la suppression de la conversation: {str(e)}")
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/notes')
def notes():
    try:
        notes_file = os.path.join('data', 'notes.md')
        
        if not os.path.exists(notes_file):
            return render_template('notes.html', notes=[])
            
        with open(notes_file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        if not content.strip():
            return render_template('notes.html', notes=[])
        
        # Parser les notes
        notes = []
        note_blocks = content.split('## Note de ')
        
        for block in note_blocks:
            if not block.strip():
                continue
                
            try:
                header, content = block.split('\n', 1)
                role, date = header.strip().split(' - ')
                note_content = f"## Note de {role} - {date}\n{content.strip()}"
                stable_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, note_content))
                notes.append({
                    "id": stable_id,
                    "role": role,
                    "date": date,
                    "content": content.strip()
                })
            except Exception as e:
                print(f"Erreur lors du parsing d'un bloc: {str(e)}")
                continue
            
        return render_template('notes.html', notes=notes)
        
    except Exception as e:
        print("Erreur lors de la lecture des notes:", str(e))
        return render_template('notes.html', notes=[])

@app.route('/api/config', methods=['GET'])
def get_api_config():
    api_key = get_api_key()
    return jsonify({
        'is_configured': bool(api_key),
        'api_key_masked': mask_api_key(api_key) if api_key else ""
    })

@app.route('/api/config', methods=['POST'])
def update_api_config():
    try:
        data = request.get_json()
        api_key = data.get('api_key')
        
        if not api_key:
            return jsonify({'error': 'Clé API manquante'}), 400
            
        if not api_key.startswith('sk-ant-'):
            return jsonify({'error': 'Format de clé API invalide'}), 400
            
        # Sauvegarder la clé dans .env
        env_path = os.path.join(os.path.dirname(__file__), '.env')
        
        # Vérifier si le fichier .env existe, sinon le créer
        if not os.path.exists(env_path):
            with open(env_path, 'w') as f:
                f.write('')
        
        set_key(env_path, 'ANTHROPIC_API_KEY', api_key)
        os.environ['ANTHROPIC_API_KEY'] = api_key
        
        return jsonify({'message': 'Clé API sauvegardée avec succès'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/test', methods=['GET'])
def test_api():
    try:
        api_key = get_api_key()
        if not api_key:
            return jsonify({'error': 'Aucune clé API valide configurée. Veuillez configurer une clé API valide.'}), 400
            
        client = anthropic.Anthropic(api_key=api_key)
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=10,
            messages=[{
                "role": "user",
                "content": [{"type": "text", "text": "Test de connexion"}]
            }]
        )
        
        return jsonify({'message': 'Connexion API réussie'})
        
    except anthropic.APIError as e:
        return jsonify({'error': f'Erreur API Anthropic : {str(e)}'}), 400
    except Exception as e:
        return jsonify({'error': f'Erreur inattendue : {str(e)}'}), 500

if __name__ == '__main__':
    # Désactiver les logs de développement
    import logging
    log = logging.getLogger('werkzeug')
    log.setLevel(logging.ERROR)
    
    # Lancer le serveur
    app.run(port=5001, debug=True)
