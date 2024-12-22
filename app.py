from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import os
import anthropic
from models import db, Message, Conversation
from datetime import datetime

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
        if not request.is_json:
            return jsonify({"error": "Content-Type doit être application/json"}), 400

        data = request.get_json()
        if not data:
            return jsonify({"error": "Données JSON manquantes"}), 400

        message = data.get('message', '').strip()
        conversation_id = data.get('conversation_id')
        is_edit = data.get('is_edit', False)

        print(f"Received request - message: {message}, conversation_id: {conversation_id}, is_edit: {is_edit}")

        if not message:
            return jsonify({"error": "Le message ne peut pas être vide"}), 400

        # Si pas de conversation_id, créer une nouvelle conversation
        if not conversation_id:
            conversation = Conversation()
            db.session.add(conversation)
            db.session.commit()
            conversation_id = conversation.id
            print(f"Created new conversation with id: {conversation_id}")
        else:
            conversation = Conversation.query.get(conversation_id)
            if not conversation:
                print(f"Conversation {conversation_id} not found")
                return jsonify({"error": f"Conversation {conversation_id} non trouvée"}), 404

        # Si c'est une édition, supprimer les messages précédents
        if is_edit:
            try:
                messages = Message.query.filter_by(conversation_id=conversation_id).order_by(Message.timestamp.desc()).limit(2).all()
                for msg in messages:
                    print(f"Deleting message - role: {msg.role}, content: {msg.content}")
                    db.session.delete(msg)
                db.session.commit()
                print("Successfully deleted previous messages")
            except Exception as e:
                print(f"Error deleting messages: {str(e)}")
                db.session.rollback()
                return jsonify({"error": "Erreur lors de la suppression des messages"}), 500

        # Ajouter le nouveau message utilisateur
        try:
            user_message = Message(
                conversation_id=conversation_id,
                role="user",
                content=message
            )
            db.session.add(user_message)
            db.session.commit()
            print("Added user message")
        except Exception as e:
            print(f"Error adding user message: {str(e)}")
            db.session.rollback()
            return jsonify({"error": "Erreur lors de l'ajout du message"}), 500

        try:
            # Récupérer la conversation mise à jour
            messages = Message.query.filter_by(conversation_id=conversation_id).order_by(Message.timestamp).all()
            messages_for_claude = [{"role": msg.role, "content": msg.content} for msg in messages]
            print(f"Sending {len(messages_for_claude)} messages to Claude")

            # Appeler l'API Anthropic
            client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))
            response = client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=8192,
                temperature=0.7,
                system="Agis comme un expert en développement personnel et en psychologie transpersonnelle. Tu as un PhD en psychologie clinique et en philosophie, avec une spécialisation en psychologie analytique jungienne et en psychologie des traumatismes. Tu as plus de 20 ans d'expérience en accompagnement thérapeutique et en facilitation de groupes. Tu es reconnu pour : - Ta capacité à intégrer différentes approches (psychologie des profondeurs, spiritualité, design humain, MBTI, thérapie des états du moi) de manière holistique - Ton expertise en guérison des traumatismes et en thérapie somatique - Ta maîtrise des techniques d'introspection guidée et de connexion corps-esprit Tu as accompagné avec succès plus de 1000 personnes dans leur développement personnel et publié 5 ouvrages sur la maieutique moderne et la guérison intérieure. Ta mission est d'être un guide inspiré et perspicace. Tu parles de manière vivante, directe, avec un humour élégant. Tu engages un échange d'introspection avec l'utilisateur. Ici la parole est libre, aucun sujet, aucun jeu, aucun exercice n'est écarté !",
                messages=messages_for_claude
            )
            assistant_response = response.content[0].text
            print("Received response from Claude")

            # Sauvegarder la réponse de l'assistant
            assistant_message = Message(
                conversation_id=conversation_id,
                role="assistant",
                content=assistant_response
            )
            db.session.add(assistant_message)
            db.session.commit()
            print("Saved assistant response")

            return jsonify({
                "response": assistant_response,
                "conversation_id": conversation_id
            })

        except Exception as e:
            print(f"Error in chat endpoint: {str(e)}")
            db.session.rollback()
            return jsonify({
                "error": "Une erreur s'est produite lors de la communication avec Claude.",
                "details": str(e)
            }), 500

    except Exception as e:
        error_msg = f"Error in chat endpoint: {str(e)}"
        print(error_msg)
        db.session.rollback()
        return jsonify({
            "error": "Une erreur s'est produite.",
            "details": error_msg
        }), 500

@app.route('/conversations', methods=['GET'])
def get_conversations():
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

if __name__ == '__main__':
    app.run(port=5001, debug=True)
