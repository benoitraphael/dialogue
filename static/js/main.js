let currentConversationId = null;

document.addEventListener('DOMContentLoaded', function() {
    const textarea = document.getElementById('user-input');
    const sendButton = document.querySelector('button');
    loadConversations();

    // Ajuster automatiquement la hauteur du textarea
    textarea.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });

    // Envoyer le message avec Entrée (mais nouvelle ligne avec Shift+Entrée)
    textarea.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Désactiver le bouton quand le textarea est vide
    textarea.addEventListener('input', function() {
        sendButton.disabled = !this.value.trim();
    });
});

function loadConversations() {
    fetch('/conversations')
        .then(response => response.json())
        .then(conversations => {
            const sidebar = document.getElementById('conversations-list');
            sidebar.innerHTML = '';
            conversations.forEach(conv => {
                const convElement = document.createElement('div');
                convElement.className = 'conversation-item';
                convElement.dataset.id = conv.id;
                if (conv.id === currentConversationId) {
                    convElement.classList.add('selected');
                }
                convElement.onclick = () => loadConversation(conv.id);
                
                // Récupérer le premier message de la conversation
                const firstMessage = conv.messages[0];
                const date = firstMessage ? new Date(firstMessage.timestamp).toLocaleString('fr-FR') : 'Nouvelle conversation';
                const preview = firstMessage ? firstMessage.content.substring(0, 50) + '...' : '';
                
                convElement.innerHTML = `
                    <div class="conversation-preview">
                        <div class="conversation-date">${date}</div>
                        <div class="conversation-text">${preview}</div>
                    </div>
                `;
                sidebar.appendChild(convElement);
            });
        });
}

function loadConversation(conversationId) {
    currentConversationId = conversationId;
    
    // Mettre à jour la sélection visuelle
    const conversations = document.querySelectorAll('.conversation-item');
    conversations.forEach(conv => conv.classList.remove('selected'));
    const selectedConv = Array.from(conversations).find(conv => conv.dataset.id === String(conversationId));
    if (selectedConv) {
        selectedConv.classList.add('selected');
    }
    
    // Charger les messages de la conversation
    fetch('/conversations')
        .then(response => response.json())
        .then(conversations => {
            const conversation = conversations.find(conv => conv.id === conversationId);
            if (conversation) {
                const messagesDiv = document.getElementById('chat-messages');
                messagesDiv.innerHTML = '';
                conversation.messages.forEach(msg => {
                    addMessage(msg.content, msg.role === 'user' ? 'user-message' : 'assistant-message');
                });
            }
        });
}

function startNewConversation() {
    // Réinitialiser l'ID de conversation courante
    currentConversationId = null;
    
    // Vider la zone de messages
    const messagesDiv = document.getElementById('chat-messages');
    messagesDiv.innerHTML = '<div class="message assistant-message">Je t\'écoute !</div>';
    
    // Vider le champ de saisie
    const input = document.getElementById('user-input');
    input.value = '';
    input.focus();
    
    // Mettre à jour visuellement la sélection dans la liste
    const conversations = document.querySelectorAll('.conversation-item');
    conversations.forEach(conv => conv.classList.remove('selected'));
}

function addMessage(text, className) {
    const messages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${className}`;
    
    // Créer le conteneur de texte
    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    
    // Convertir le Markdown en HTML et nettoyer
    const htmlContent = DOMPurify.sanitize(marked.parse(text));
    textDiv.innerHTML = htmlContent;
    
    // Appliquer la coloration syntaxique
    textDiv.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
    });
    
    messageDiv.appendChild(textDiv);
    
    // Ajouter le bouton d'édition seulement pour les messages utilisateur
    if (className === 'user-message') {
        const editButton = document.createElement('button');
        editButton.className = 'edit-button';
        editButton.textContent = 'Éditer';
        editButton.onclick = () => startEditing(messageDiv);
        messageDiv.appendChild(editButton);
    }
    
    messages.appendChild(messageDiv);
    messageDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
    
    return messageDiv;
}

function startEditing(messageDiv) {
    // Empêcher l'édition si une édition est déjà en cours
    if (document.querySelector('.message.editing')) {
        return;
    }
    
    messageDiv.classList.add('editing');
    const textDiv = messageDiv.querySelector('.message-text');
    const originalText = textDiv.textContent;
    
    // Créer la zone de texte
    const textarea = document.createElement('textarea');
    textarea.value = originalText;
    textDiv.replaceWith(textarea);
    
    // Créer les boutons d'action
    const actions = document.createElement('div');
    actions.className = 'edit-actions';
    
    const saveButton = document.createElement('button');
    saveButton.className = 'save';
    saveButton.textContent = 'Enregistrer';
    saveButton.onclick = () => saveEdit(messageDiv, textarea, originalText);
    
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Annuler';
    cancelButton.onclick = () => cancelEdit(messageDiv, textarea, originalText);
    
    actions.appendChild(saveButton);
    actions.appendChild(cancelButton);
    messageDiv.appendChild(actions);
    
    textarea.focus();
}

function saveEdit(messageDiv, textarea, originalText) {
    const newText = textarea.value.trim();
    if (!newText || newText === originalText) {
        cancelEdit(messageDiv, textarea, originalText);
        return;
    }
    
    // Mettre à jour le message édité
    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    textDiv.textContent = newText;
    textarea.replaceWith(textDiv);
    
    // Nettoyer l'interface d'édition
    messageDiv.classList.remove('editing');
    const actionsDiv = messageDiv.querySelector('.edit-actions');
    if (actionsDiv) {
        actionsDiv.remove();
    }
    
    // Supprimer tous les messages suivants
    let nextElement = messageDiv.nextElementSibling;
    while (nextElement) {
        const elementToRemove = nextElement;
        nextElement = nextElement.nextElementSibling;
        elementToRemove.remove();
    }
    
    // Ajouter un indicateur de chargement
    const loadingMessage = addMessage('...', 'assistant-message');
    
    // Envoyer le message édité
    fetch('/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({ 
            message: newText,
            conversation_id: currentConversationId,
            is_edit: true
        })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(data => {
                throw new Error(data.error || 'Erreur réseau');
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Mettre à jour le message de chargement avec la réponse
        if (loadingMessage && loadingMessage.querySelector('.message-text')) {
            loadingMessage.querySelector('.message-text').textContent = data.response;
        }
        
        // Mettre à jour l'ID de la conversation si nécessaire
        if (data.conversation_id) {
            currentConversationId = data.conversation_id;
        }
        
        // Rafraîchir la liste des conversations
        loadConversations();
    })
    .catch(error => {
        console.error('Error:', error);
        if (loadingMessage && loadingMessage.querySelector('.message-text')) {
            loadingMessage.querySelector('.message-text').textContent = error.message || "Désolé, une erreur s'est produite. Veuillez réessayer.";
            loadingMessage.style.color = '#e74c3c';
        }
    });
}

function cancelEdit(messageDiv, textarea, originalText) {
    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    textDiv.textContent = originalText;
    textarea.replaceWith(textDiv);
    
    messageDiv.classList.remove('editing');
    const actionsDiv = messageDiv.querySelector('.edit-actions');
    if (actionsDiv) {
        actionsDiv.remove();
    }
}

function sendMessage(message = null, isEdit = false) {
    const input = document.getElementById('user-input');
    const messageToSend = message || input.value.trim();
    
    if (!messageToSend) return;
    
    // Désactiver l'input pendant l'envoi
    input.disabled = true;
    const sendButton = document.querySelector('.chat-input button');
    if (sendButton) sendButton.disabled = true;
    
    // Si ce n'est pas une édition, ajouter le message de l'utilisateur
    if (!isEdit) {
        addMessage(messageToSend, 'user-message');
        input.value = '';
        input.style.height = 'auto';
    }
    
    // Ajouter un indicateur de chargement
    const loadingMessage = addMessage('...', 'assistant-message');
    
    // Envoyer la requête au serveur
    fetch('/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            message: messageToSend,
            conversation_id: currentConversationId,
            is_edit: isEdit
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erreur réseau');
        }
        return response.json();
    })
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }
        loadingMessage.querySelector('.message-text').textContent = data.response;
        currentConversationId = data.conversation_id;
        loadConversations();
    })
    .catch(error => {
        console.error('Error:', error);
        loadingMessage.querySelector('.message-text').textContent = "Désolé, une erreur s'est produite. Veuillez réessayer.";
        loadingMessage.style.color = '#e74c3c';
    })
    .finally(() => {
        input.disabled = false;
        if (sendButton) sendButton.disabled = false;
        input.focus();
    });
}
