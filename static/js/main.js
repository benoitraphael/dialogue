let currentConversationId = null;
let editingMessage = null;

// Regrouper toute l'initialisation dans un seul DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    const textarea = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    
    // Auto-resize du textarea
    autoResizeTextarea(textarea);
    textarea.addEventListener('input', () => autoResizeTextarea(textarea));
    
    // Gestion de l'envoi des messages
    textarea.addEventListener('keydown', handleKeyPress);
    sendButton.addEventListener('click', handleSendClick);
    
    // Charger les conversations existantes
    loadConversations();
    
    // Délégation d'événement pour les boutons de suppression dans la modal
    document.getElementById('notes-modal').addEventListener('click', async (e) => {
        const deleteButton = e.target.closest('.delete-note');
        if (!deleteButton) return;
        
        console.log('Clic sur bouton supprimer détecté');
        e.preventDefault();
        e.stopPropagation();
        
        const timestamp = deleteButton.getAttribute('data-timestamp');
        if (!timestamp) {
            console.error('Pas de timestamp trouvé sur le bouton');
            return;
        }
        
        if (await handleDeleteNote(timestamp)) {
            showNotification('Note supprimée !');
        }
    });
});

async function handleDeleteNote(timestamp) {
    if (!confirm('Voulez-vous vraiment supprimer cette note ?')) {
        return false;
    }

    try {
        const response = await fetch('/delete_note', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ timestamp })
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la suppression');
        }

        // 1. Supprimer la note de l'affichage modal
        const noteItem = document.querySelector(`.delete-note[data-timestamp="${timestamp}"]`).closest('.note-item');
        if (noteItem) {
            noteItem.remove();
        }

        // 2. Mettre à jour l'icône dans la conversation
        const messages = document.querySelectorAll('.message');
        let found = false;
        messages.forEach(message => {
            const messageTimestamp = message.getAttribute('data-timestamp');
            console.log('Comparaison timestamps:', { message: messageTimestamp, delete: timestamp });
            if (messageTimestamp === timestamp) {
                found = true;
                const saveButton = message.querySelector('.save-note-button');
                if (saveButton) {
                    saveButton.classList.remove('saved');
                    saveButton.querySelector('i').classList.remove('fas');
                    saveButton.querySelector('i').classList.add('far');
                    console.log('Icône mise à jour pour le message:', messageTimestamp);
                }
            }
        });

        if (!found) {
            console.warn('Aucun message trouvé avec le timestamp:', timestamp);
        }

        // Vérifier s'il reste des notes
        const notesDisplay = document.getElementById('notes-display');
        if (!notesDisplay.querySelector('.note-item')) {
            notesDisplay.innerHTML = "<p>Aucune note pour le moment</p>";
        }

        return true;
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        showNotification('Erreur lors de la suppression', true);
        return false;
    }
}

async function addMessage(text, className) {
    const messages = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${className}`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    const messageText = document.createElement('div');
    messageText.className = 'message-text';
    
    // Appliquer la coloration syntaxique si nécessaire
    if (className === 'assistant-message') {
        messageText.innerHTML = marked.parse(text);
        // Appliquer highlight.js aux blocs de code
        messageText.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightBlock(block);
        });
    } else {
        messageText.textContent = text;
    }
    
    const saveButton = document.createElement('button');
    saveButton.className = 'save-note-button';
    saveButton.innerHTML = '<i class="far fa-bookmark"></i>';
    saveButton.title = 'Sauvegarder comme note';
    
    // Ajouter l'événement de clic pour la sauvegarde
    saveButton.onclick = async (e) => {
        e.preventDefault();
        console.log('Clic sur sauvegarder pour le message:', text);
        try {
            const role = className === 'user-message' ? 'user' : 'assistant';
            await saveNote(text, messageDiv, role);
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
        }
    };
    
    messageContent.appendChild(messageText);
    messageContent.appendChild(saveButton);
    messageDiv.appendChild(messageContent);
    
    messages.appendChild(messageDiv);
    messages.scrollTop = messages.scrollHeight;
    
    return messageDiv;
}

async function saveNote(text, messageDiv, role) {
    if (!messageDiv || !messageDiv.querySelector) {
        console.error('messageDiv invalide:', messageDiv);
        return false;
    }

    try {
        console.log('Tentative de sauvegarde de la note:', { text, role });
        const response = await fetch('/save_note', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text, role })
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la sauvegarde');
        }

        const data = await response.json();
        console.log('Réponse de sauvegarde:', data);

        if (!data.timestamp) {
            throw new Error('Pas de timestamp dans la réponse');
        }

        // Mettre à jour l'icône et le timestamp
        const saveButton = messageDiv.querySelector('.save-note-button');
        if (saveButton) {
            saveButton.classList.add('saved');
            saveButton.querySelector('i').classList.remove('far');
            saveButton.querySelector('i').classList.add('fas');
        }
        
        // Stocker le timestamp sur le message pour la suppression future
        messageDiv.setAttribute('data-timestamp', data.timestamp);
        console.log('Message mis à jour avec timestamp:', data.timestamp);

        showNotification('Note sauvegardée !');
        return true;
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        showNotification('Erreur lors de la sauvegarde', true);
        return false;
    }
}

function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = (textarea.scrollHeight) + 'px';
}

function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!e.target.value.trim()) return;
        sendMessage();
    }
}

function handleSendClick() {
    if (!document.getElementById('message-input').value.trim()) return;
    sendMessage();
}

async function sendMessage() {
    const userInput = document.getElementById('message-input');
    const message = userInput.value.trim();
    
    if (!message) return;

    // Ajouter le message de l'utilisateur
    addMessage(message, 'user-message');
    
    // Effacer l'input et réinitialiser sa hauteur
    userInput.value = '';
    userInput.style.height = 'auto';
    
    // Afficher l'indicateur de frappe
    showTypingIndicator();
    
    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                conversation_id: currentConversationId,
                is_edit: false
            })
        });

        if (!response.ok) {
            throw new Error('Erreur lors de l\'envoi du message');
        }

        const data = await response.json();
        
        // Cacher l'indicateur de frappe
        hideTypingIndicator();
        
        if (data.error) {
            throw new Error(data.error);
        }

        // Mettre à jour l'ID de la conversation si c'est une nouvelle conversation
        if (data.conversation_id && !currentConversationId) {
            currentConversationId = data.conversation_id;
            loadConversations();  // Recharger la liste des conversations
        }

        // Ajouter la réponse de l'assistant
        if (data.response) {
            addMessage(data.response, 'assistant-message');
        }
        
    } catch (error) {
        console.error('Error:', error);
        hideTypingIndicator();
        showNotification(error.message, true);
    }
}

function loadConversations() {
    fetch('/get_conversations')
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors du chargement des conversations');
            }
            return response.json();
        })
        .then(data => {
            if (!data.conversations || !Array.isArray(data.conversations)) {
                throw new Error('Format de réponse invalide');
            }
            
            const conversationsList = document.getElementById('conversations-list');
            conversationsList.innerHTML = '';
            
            data.conversations.forEach(conversation => {
                const conversationDiv = document.createElement('div');
                conversationDiv.className = 'conversation-item';
                conversationDiv.dataset.id = conversation.id;
                if (conversation.id === currentConversationId) {
                    conversationDiv.classList.add('selected');
                }
                
                // Créer le conteneur pour le titre et la date
                const infoDiv = document.createElement('div');
                infoDiv.className = 'conversation-info';
                
                // Ajouter la date
                const dateDiv = document.createElement('div');
                dateDiv.className = 'conversation-date';
                dateDiv.textContent = new Date(conversation.timestamp).toLocaleString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                infoDiv.appendChild(dateDiv);
                
                // Ajouter le titre
                const titleDiv = document.createElement('div');
                titleDiv.className = 'conversation-title';
                titleDiv.textContent = conversation.title || 'Sans titre';
                infoDiv.appendChild(titleDiv);
                
                conversationDiv.appendChild(infoDiv);
                
                // Ajouter le bouton de suppression (visible uniquement quand sélectionné)
                const deleteButton = document.createElement('button');
                deleteButton.className = 'delete-conversation';
                deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
                deleteButton.title = 'Supprimer cette conversation';
                deleteButton.onclick = (e) => {
                    e.stopPropagation();
                    if (confirm('Êtes-vous sûr de vouloir supprimer cette conversation ?')) {
                        deleteConversation(conversation.id);
                    }
                };
                conversationDiv.appendChild(deleteButton);
                
                conversationDiv.onclick = () => loadConversation(conversation.id);
                conversationsList.appendChild(conversationDiv);
            });
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Erreur lors du chargement des conversations', true);
        });
}

function deleteConversation(conversationId) {
    fetch('/delete_conversation', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ conversation_id: conversationId })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erreur lors de la suppression');
        }
        return response.json();
    })
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }
        showNotification('Conversation supprimée !');
        
        // Si c'est la conversation courante, on vide le contenu
        if (currentConversationId === conversationId) {
            currentConversationId = null;
            document.getElementById('messages').innerHTML = '';
        }
        
        // Supprimer visuellement la conversation de la liste
        const conversationElement = document.querySelector(`.conversation-item[data-id="${conversationId}"]`);
        if (conversationElement) {
            conversationElement.remove();
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Erreur lors de la suppression', true);
    });
}

function loadConversation(conversationId) {
    currentConversationId = conversationId;
    const messages = document.getElementById('messages');
    messages.innerHTML = '';
    
    // Mettre à jour la sélection visuelle
    document.querySelectorAll('.conversation-item').forEach(item => {
        if (item.dataset.id === conversationId.toString()) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
    
    fetch(`/conversation/${conversationId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Conversation non trouvée');
            }
            return response.json();
        })
        .then(data => {
            if (data.messages && Array.isArray(data.messages)) {
                data.messages.forEach(msg => {
                    addMessage(msg.content, msg.role === 'user' ? 'user-message' : 'assistant-message');
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Erreur lors du chargement de la conversation', true);
        });
}

function startNewConversation() {
    currentConversationId = null;
    document.getElementById('messages').innerHTML = '';
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.remove('selected');
    });
    showNotification('Nouvelle conversation démarrée');
}

function editMessage(messageDiv) {
    // Si on est déjà en train d'éditer un message, on annule
    if (editingMessage) {
        cancelEdit();
        return;
    }

    editingMessage = messageDiv;
    const textDiv = messageDiv.querySelector('.message-text');
    const originalText = textDiv.textContent;

    // Ajouter la classe editing
    messageDiv.classList.add('editing');

    // Créer la zone de texte
    const textarea = document.createElement('textarea');
    textarea.className = 'edit-textarea';
    textarea.value = originalText;
    textarea.rows = 1;

    // Créer les boutons d'action
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'edit-actions';

    const saveButton = document.createElement('button');
    saveButton.className = 'action-button save-button';
    saveButton.innerHTML = '<i class="fas fa-check"></i> Sauvegarder';
    saveButton.onclick = () => saveEdit(textarea.value);

    const cancelButton = document.createElement('button');
    cancelButton.className = 'action-button cancel-button';
    cancelButton.innerHTML = '<i class="fas fa-times"></i> Annuler';
    cancelButton.onclick = cancelEdit;

    actionsDiv.appendChild(saveButton);
    actionsDiv.appendChild(cancelButton);

    // Remplacer le contenu du message
    textDiv.replaceWith(textarea);
    messageDiv.appendChild(actionsDiv);

    // Masquer le bouton d'édition original
    const editButton = messageDiv.querySelector('.edit-button');
    if (editButton) {
        editButton.style.display = 'none';
    }

    // Ajuster la hauteur du textarea
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
    textarea.focus();
}

function cancelEdit() {
    if (!editingMessage) return;

    // Récupérer les éléments
    const textarea = editingMessage.querySelector('.edit-textarea');
    const actionsDiv = editingMessage.querySelector('.edit-actions');
    const editButton = editingMessage.querySelector('.edit-button');

    if (!textarea || !actionsDiv) return;

    // Enlever la classe editing
    editingMessage.classList.remove('editing');

    // Créer un nouveau div pour le texte
    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    textDiv.innerHTML = DOMPurify.sanitize(marked.parse(textarea.value));

    // Restaurer l'affichage
    textarea.replaceWith(textDiv);
    actionsDiv.remove();
    if (editButton) {
        editButton.style.display = '';
    }

    editingMessage = null;
}

async function saveEdit(newText) {
    if (!editingMessage || !newText.trim()) return;

    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: newText,
                conversation_id: currentConversationId,
                is_edit: true
            })
        });

        if (!response.ok) {
            throw new Error('Erreur lors de l\'édition');
        }

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }

        // Créer le nouveau message
        const newMessage = document.createElement('div');
        newMessage.className = editingMessage.className;
        
        const textDiv = document.createElement('div');
        textDiv.className = 'message-text';
        textDiv.innerHTML = DOMPurify.sanitize(marked.parse(newText));
        
        // Ajouter le bouton d'édition
        const editButton = document.createElement('button');
        editButton.className = 'edit-button';
        editButton.innerHTML = '<i class="fas fa-edit"></i>';
        editButton.onclick = () => editMessage(newMessage);
        
        newMessage.appendChild(textDiv);
        newMessage.appendChild(editButton);
        
        // Remplacer l'ancien message
        editingMessage.replaceWith(newMessage);
        editingMessage = null;

        // Ajouter la réponse de l'assistant si présente
        if (data.response) {
            addMessage(data.response, 'assistant-message');
        }

    } catch (error) {
        console.error('Erreur lors de l\'édition:', error);
        showNotification(error.message, true);
    }
}

function displayMessage(content, role) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}-message`;
    
    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    textDiv.innerHTML = DOMPurify.sanitize(marked.parse(content));
    messageDiv.appendChild(textDiv);
    
    // Ajouter le bouton d'édition uniquement pour les messages utilisateur
    if (role === 'user') {
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'message-actions';
        
        const editButton = document.createElement('button');
        editButton.className = 'edit-button';
        editButton.textContent = 'Éditer';
        editButton.onclick = () => editMessage(messageDiv);
        actionsDiv.appendChild(editButton);
        
        messageDiv.appendChild(actionsDiv);
    }
    
    document.getElementById('messages').appendChild(messageDiv);
    messageDiv.scrollIntoView({ behavior: 'smooth' });
    
    // Appliquer la coloration syntaxique
    messageDiv.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
    });
    
    return messageDiv;
}

function displayErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <div class="error-content">
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        </div>
        <button onclick="this.parentElement.remove()" class="error-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    document.querySelector('.chat-container').appendChild(errorDiv);
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
        if (errorDiv.parentElement) {
            errorDiv.remove();
        }
    }, 10000);
}

function showTypingIndicator() {
    const template = document.getElementById('typing-indicator');
    const indicator = template.content.cloneNode(true);
    document.getElementById('messages').appendChild(indicator);
    scrollToBottom();
}

function hideTypingIndicator() {
    const indicator = document.querySelector('.typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

function scrollToBottom() {
    const chatMessages = document.getElementById('messages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function loadNotes() {
    try {
        console.log('Chargement des notes...');
        const response = await fetch('/get_notes');
        const data = await response.json();
        console.log('Notes reçues:', data);
        
        const notesDisplay = document.getElementById('notes-display');
        
        if (!data.content || data.content === "Aucune note pour le moment") {
            notesDisplay.innerHTML = "<p>Aucune note pour le moment</p>";
            return;
        }

        // Convertir le contenu Markdown en HTML
        const rawHtml = marked.parse(data.content);
        console.log('HTML brut:', rawHtml);
        
        // Créer un conteneur temporaire pour parser le HTML
        const temp = document.createElement('div');
        temp.innerHTML = DOMPurify.sanitize(rawHtml);
        
        // Extraire les notes
        const notes = [];
        const titles = temp.querySelectorAll('h2');
        console.log('Titres trouvés:', titles.length);
        
        titles.forEach(title => {
            const titleText = title.textContent;
            console.log('Traitement du titre:', titleText);
            
            if (!titleText.includes(' - ')) return;
            
            const [notePrefix, timestamp] = titleText.split(' - ');
            let content = '';
            let next = title.nextElementSibling;
            
            while (next && next.tagName !== 'H2') {
                content += next.outerHTML;
                next = next.nextElementSibling;
            }
            
            notes.push({
                timestamp,
                title: notePrefix,
                content
            });
        });
        
        console.log('Notes extraites:', notes);
        
        // Générer le HTML des notes
        const notesHtml = notes.map(note => `
            <div class="note-item">
                <button class="delete-note" data-timestamp="${note.timestamp}">
                    <i class="fas fa-trash"></i>
                </button>
                <h2>${note.title} - ${note.timestamp}</h2>
                <div class="note-content">
                    ${note.content}
                </div>
            </div>
        `).join('');
        
        notesDisplay.innerHTML = notesHtml || "<p>Aucune note pour le moment</p>";
        console.log('Affichage des notes terminé');
        
    } catch (error) {
        console.error('Erreur lors du chargement des notes:', error);
        displayErrorMessage("Erreur lors du chargement des notes");
    }
}

async function openNotesModal() {
    console.log('Ouverture de la modal des notes');
    const modal = document.getElementById('notes-modal');
    modal.style.display = 'block';
    await loadNotes();
}

function closeNotesModal() {
    console.log('Fermeture de la modal des notes');
    const modal = document.getElementById('notes-modal');
    modal.style.display = 'none';
}

// Gestionnaire pour fermer la modal quand on clique en dehors
window.addEventListener('click', (event) => {
    const modal = document.getElementById('notes-modal');
    if (event.target === modal) {
        closeNotesModal();
    }
});

async function deleteNote(timestamp, noteElement) {
    console.log('Début de la suppression pour:', timestamp);
    try {
        const response = await fetch('/delete_note', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ timestamp })
        });

        console.log('Réponse reçue:', response.status);
        const data = await response.json();
        console.log('Données de suppression:', data);

        if (!response.ok) {
            throw new Error(data.error || 'Erreur lors de la suppression');
        }

        // Supprimer la note de l'affichage
        console.log('Suppression de la note de l\'affichage');
        noteElement.remove();
        showNotification('Note supprimée !');

        // Mettre à jour l'icône du message original
        const messages = document.querySelectorAll('.message');
        messages.forEach(message => {
            const messageTimestamp = message.getAttribute('data-timestamp');
            if (messageTimestamp === timestamp) {
                const saveButton = message.querySelector('.save-note-button');
                if (saveButton) {
                    console.log('Mise à jour de l\'icône du message');
                    saveButton.classList.remove('saved');
                    saveButton.querySelector('i').classList.remove('fas');
                    saveButton.querySelector('i').classList.add('far');
                }
            }
        });

        // Vérifier s'il reste des notes
        const notesDisplay = document.getElementById('notes-display');
        if (!notesDisplay.querySelector('.note-item')) {
            console.log('Plus de notes, affichage du message vide');
            notesDisplay.innerHTML = "<p>Aucune note pour le moment</p>";
        }
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        showNotification('Erreur lors de la suppression', true);
    }
}

function showNotification(message, isError = false) {
    const notification = document.createElement('div');
    notification.className = `notification ${isError ? 'error' : 'success'}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

async function checkIfNoteSaved(text) {
    try {
        const response = await fetch('/check_note', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text })
        });
        
        if (!response.ok) {
            throw new Error('Erreur lors de la vérification');
        }
        
        const data = await response.json();
        return data.saved;
    } catch (error) {
        console.error('Erreur lors de la vérification:', error);
        return false;
    }
}
