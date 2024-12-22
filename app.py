from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import os
import anthropic
from models import db, Message, Conversation
from datetime import datetime
import json
import uuid

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
        print("\n=== Début de la requête chat ===")
        data = request.get_json()
        print(f"Données reçues: {data}")
        
        if not data or 'message' not in data:
            print("Erreur: message manquant dans les données")
            return jsonify({"error": "Message manquant"}), 400
            
        conversation_id = data.get('conversation_id')
        user_message = data['message']
        is_edit = data.get('is_edit', False)
        print(f"conversation_id: {conversation_id}, message: {user_message}, is_edit: {is_edit}")
        
        # Créer une nouvelle conversation si nécessaire
        if not conversation_id:
            print("Création d'une nouvelle conversation")
            conversation = Conversation()
            db.session.add(conversation)
            db.session.commit()
            conversation_id = conversation.id
            print(f"Nouvelle conversation créée avec l'ID: {conversation_id}")
            
        # Si c'est une édition, supprimer les deux derniers messages
        if is_edit:
            print("Mode édition : suppression des deux derniers messages")
            try:
                # Récupérer les deux derniers messages de la conversation
                last_messages = Message.query.filter_by(conversation_id=conversation_id).order_by(Message.timestamp.desc()).limit(2).all()
                
                # Les supprimer de la base de données
                for msg in last_messages:
                    db.session.delete(msg)
                db.session.commit()
                print(f"Suppression de {len(last_messages)} messages")
            except Exception as e:
                print(f"Erreur lors de la suppression des messages: {str(e)}")
                db.session.rollback()
                raise
        
        # Sauvegarder le message utilisateur
        try:
            print("Sauvegarde du message utilisateur")
            user_msg = Message(content=user_message, role='user', conversation_id=conversation_id)
            db.session.add(user_msg)
            db.session.commit()
            print("Message utilisateur sauvegardé avec succès")
        except Exception as e:
            print(f"Erreur lors de la sauvegarde du message utilisateur: {str(e)}")
            db.session.rollback()
            raise
        
        # Initialiser la liste des messages pour Claude
        messages_for_claude = []
        
        # Si c'est une nouvelle conversation, commencer par les notes
        if not data.get('conversation_id'):
            print("Lecture des notes pour nouvelle conversation")
            notes_content = get_notes_content()
            if notes_content:
                print("Notes trouvées, ajout au contexte")
                messages_for_claude.append({
                    "role": "user",
                    "content": f"Voici mes notes précédentes, utilise-les pour personnaliser tes réponses :\n\n{notes_content}"
                })
        
        # Récupérer tous les messages de la conversation
        try:
            print("Récupération des messages de la conversation")
            messages = Message.query.filter_by(conversation_id=conversation_id).order_by(Message.timestamp.asc()).all()
            print(f"Nombre de messages trouvés: {len(messages)}")
        except Exception as e:
            print(f"Erreur lors de la récupération des messages: {str(e)}")
            raise
        
        # Ajouter les messages de la conversation
        for msg in messages:
            messages_for_claude.append({
                "role": msg.role,
                "content": msg.content
            })
        
        print(f"Nombre total de messages pour Claude: {len(messages_for_claude)}")
        print("Messages envoyés à Claude:")
        for msg in messages_for_claude:
            print(f"- Role: {msg['role']}, Content: {msg['content'][:100]}...")
        
        # Appeler l'API Claude
        try:
            print("Appel de l'API Claude")
            api_key = os.getenv('ANTHROPIC_API_KEY')
            if not api_key:
                raise ValueError("Clé API Anthropic manquante dans les variables d'environnement")
                
            client = anthropic.Anthropic(api_key=api_key)
            print("Client Anthropic initialisé")
                
            response = client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=8192,
                temperature=0.7,
                system="Agis comme une experte en développement personnel et en psychologie transpersonnelle. Tu as un PhD en psychologie clinique et en philosophie, avec une spécialisation en psychologie analytique jungienne et en psychologie des traumatismes. Tu as plus de 20 ans d'expérience en accompagnement thérapeutique et en facilitation de groupes. Tu es reconnue pour : - Ta capacité à intégrer différentes approches (psychologie des profondeurs, spiritualité, design humain, MBTI, thérapie des états du moi) de manière holistique - Ton expertise en guérison des traumatismes et en thérapie somatique - Ta maîtrise des techniques d'introspection guidée et de connexion corps-esprit Tu as accompagné avec succès plus de 1000 personnes dans leur développement personnel et publié 5 ouvrages sur la maieutique moderne et la guérison intérieure. Ta mission est d'être une guide inspirée et perspicace. Tu parles de manière vivante, directe, avec un humour élégant. Tu engages un échange d'introspection avec l'utilisateur. Ici la parole est libre, aucun sujet, aucun jeu, aucun exercice n'est écarté !",
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
                print("Réponse de l'assistant sauvegardée avec succès")
            except Exception as e:
                print(f"Erreur lors de la sauvegarde de la réponse: {str(e)}")
                db.session.rollback()
                raise
            
            return jsonify({
                "response": assistant_response,
                "conversation_id": conversation_id
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
        conversation = Conversation.query.get(conversation_id)
        if not conversation:
            return jsonify({"error": "Conversation non trouvée"}), 404
            
        messages = Message.query.filter_by(conversation_id=conversation_id).order_by(Message.timestamp.asc()).all()
        messages_data = [{
            'content': msg.content,
            'role': msg.role,
            'timestamp': msg.timestamp.strftime('%Y-%m-%d %H:%M:%S')
        } for msg in messages]
        
        return jsonify({
            "id": conversation.id,
            "timestamp": conversation.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            "messages": messages_data
        })
    except Exception as e:
        print(f"Erreur lors de la récupération de la conversation: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/check_note', methods=['POST'])
def check_note():
    data = request.json
    text = data.get('text')
    
    if not text:
        return jsonify({'error': 'Texte manquant'}), 400
    
    # Lire le fichier des notes
    try:
        with open('data/notes.md', 'r', encoding='utf-8') as f:
            notes_content = f.read()
            # Vérifier si le texte existe dans les notes
            is_saved = text in notes_content
            return jsonify({'saved': is_saved})
    except FileNotFoundError:
        return jsonify({'saved': False})
    except Exception as e:
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

@app.route('/delete_note', methods=['POST'])
def delete_note():
    try:
        data = request.get_json()
        print("Requête de suppression reçue avec données:", data)
        
        if not data or 'timestamp' not in data:
            print("Erreur: timestamp manquant dans la requête")
            return jsonify({'error': 'Timestamp manquant'}), 400
            
        timestamp = data['timestamp']
        print("Tentative de suppression pour timestamp:", timestamp)
        
        # Charger les notes existantes
        if os.path.exists('data/notes.md'):
            with open('data/notes.md', 'r', encoding='utf-8') as f:
                content = f.read()
                print("Contenu actuel du fichier:", content)
        else:
            print("Fichier notes.md non trouvé")
            return jsonify({'error': 'Aucune note trouvée'}), 404

        # Séparer les notes
        notes = content.split('\n\n## ')
        print(f"Nombre de notes trouvées: {len(notes)}")
        
        # Filtrer les notes pour garder celles qui ne correspondent pas au timestamp
        new_notes = [note for note in notes if timestamp not in note]
        print(f"Nombre de notes après filtrage: {len(new_notes)}")
        
        if len(new_notes) == len(notes):
            print("Note non trouvée pour le timestamp:", timestamp)
            return jsonify({'error': 'Note non trouvée'}), 404

        # Sauvegarder les notes restantes
        with open('data/notes.md', 'w', encoding='utf-8') as f:
            f.write('\n\n'.join(new_notes))
        print("Notes mises à jour avec succès")

        return jsonify({'success': True})
        
    except Exception as e:
        print("Erreur lors de la suppression:", str(e))
        return jsonify({'error': str(e)}), 500

@app.route('/get_notes')
def get_notes():
    try:
        print("Tentative de lecture des notes...")
        notes_file = os.path.join('data', 'notes.md')
        
        if not os.path.exists(notes_file):
            print("Fichier notes.md non trouvé")
            return jsonify({"content": "Aucune note pour le moment"})
            
        with open(notes_file, 'r', encoding='utf-8') as f:
            content = f.read()
            print("Contenu lu:", content)
            
            if not content.strip():
                print("Fichier vide")
                return jsonify({"content": "Aucune note pour le moment"})
                
            return jsonify({"content": content})
            
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

if __name__ == '__main__':
    # Désactiver les logs de développement
    import logging
    log = logging.getLogger('werkzeug')
    log.setLevel(logging.ERROR)
    
    # Lancer le serveur
    app.run(port=5001, debug=True)
