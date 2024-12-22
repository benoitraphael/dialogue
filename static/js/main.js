let currentConversationId = null;
let editingMessage = null;

document.addEventListener('DOMContentLoaded', function() {
    const textarea = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    
    // Charger les conversations au démarrage
    loadConversations();

    // Fonction pour ajuster automatiquement la hauteur du textarea
    function autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = (textarea.scrollHeight) + 'px';
    }

    // Initialisation
    autoResizeTextarea(textarea);

    // Événement pour l'auto-resize du textarea
    textarea.addEventListener('input', function() {
        autoResizeTextarea(this);
        // Activer/désactiver le bouton d'envoi
        sendButton.disabled = !this.value.trim();
    });

    // Événement pour la touche Entrée (sans Shift)
    textarea.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!this.value.trim()) return;
            sendMessage();
        }
    });

    // Événement pour le bouton d'envoi
    sendButton.addEventListener('click', function() {
        if (!textarea.value.trim()) return;
        sendMessage();
    });
});

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

function addMessage(text, className) {
    const messages = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${className}`;
    
    // Créer le conteneur de texte
    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    
    // Convertir le Markdown en HTML et nettoyer
    const htmlContent = DOMPurify.sanitize(marked.parse(text));
    textDiv.innerHTML = htmlContent;
    
    // Ajouter le bouton d'édition pour les messages utilisateur
    if (className === 'user-message') {
        const editButton = document.createElement('button');
        editButton.className = 'edit-button';
        editButton.innerHTML = '<i class="fas fa-edit"></i>';
        editButton.onclick = () => editMessage(messageDiv);
        messageDiv.appendChild(editButton);
    }
    
    messageDiv.appendChild(textDiv);
    messages.appendChild(messageDiv);
    
    // Appliquer la coloration syntaxique
    messageDiv.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
    });
    
    // Faire défiler jusqu'au nouveau message
    messageDiv.scrollIntoView({ behavior: 'smooth' });
    
    return messageDiv;
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

function deleteNote(timestamp, noteElement) {
    fetch('/delete_note', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ timestamp })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }
        noteElement.remove();
        showNotification('Note supprimée !');
        
        // Si c'était la dernière note, afficher le message
        const notesContent = document.querySelector('.notes-content');
        if (!notesContent.querySelector('.note-item')) {
            notesContent.innerHTML = "<p>Aucune note pour le moment</p>";
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Erreur lors de la suppression', true);
    });
}

function saveNote(content, role) {
    return fetch('/save_note', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content, role })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }
        showNotification('Note sauvegardée !');
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Erreur lors de la sauvegarde', true);
        throw error; // Propager l'erreur pour que le bouton ne change pas de style
    });
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

async function loadNotes() {
    try {
        const response = await fetch('/get_notes');
        if (!response.ok) {
            throw new Error('Erreur lors du chargement des notes');
        }
        
        const data = await response.json();
        const notesDisplay = document.querySelector('.notes-display');
        
        // Si le contenu est vide, initialiser avec un message
        if (!data.content) {
            notesDisplay.innerHTML = '<div class="note-item"><div class="note-content">Commencez à prendre des notes...</div></div>';
            return;
        }
        
        // Si le contenu est déjà formaté en HTML
        if (data.content.includes('note-item')) {
            notesDisplay.innerHTML = data.content;
        } else {
            // Formatter le texte en notes
            const notes = data.content.split('\n\n').filter(note => note.trim());
            const formattedNotes = notes.map(note => {
                const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
                return `<div class="note-item">
                    <div class="note-header">${timestamp} - Vous</div>
                    <div class="note-content">${note.trim()}</div>
                    <button class="delete-note" title="Supprimer cette note">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>`;
            }).join('\n');
            notesDisplay.innerHTML = formattedNotes;
        }
        
        // Ajouter les gestionnaires d'événements pour les boutons de suppression
        notesDisplay.querySelectorAll('.delete-note').forEach(button => {
            button.onclick = (e) => {
                e.preventDefault();
                if (confirm('Voulez-vous vraiment supprimer cette note ?')) {
                    const noteItem = button.closest('.note-item');
                    noteItem.remove();
                    saveCurrentDisplay();
                }
            };
        });
        
    } catch (error) {
        console.error('Erreur:', error);
        displayErrorMessage("Erreur lors du chargement des notes");
    }
}

async function saveNotes() {
    const notesDisplay = document.querySelector('.notes-display');
    const saveButton = document.getElementById('save-notes');
    
    try {
        // Sauvegarder le contenu HTML actuel
        const response = await fetch('/save_notes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content: notesDisplay.innerHTML })
        });
        
        if (!response.ok) {
            throw new Error('Erreur lors de la sauvegarde des notes');
        }
        
        // Ajouter la classe 'saved' au bouton
        saveButton.classList.add('saved');
        
        // Retirer la classe après 2 secondes
        setTimeout(() => {
            saveButton.classList.remove('saved');
        }, 2000);
        
    } catch (error) {
        console.error('Erreur:', error);
        displayErrorMessage("Erreur lors de la sauvegarde des notes");
    }
}

function saveCurrentDisplay() {
    const notesDisplay = document.querySelector('.notes-display');
    
    fetch('/save_notes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: notesDisplay.innerHTML })
    })
    .catch(error => {
        console.error('Erreur lors de la sauvegarde:', error);
        displayErrorMessage("Erreur lors de la sauvegarde des notes");
    });
}

function openNotesModal() {
    const modal = document.getElementById('notes-modal');
    modal.classList.add('show');
    loadNotes();
}

function closeNotesModal() {
    const modal = document.getElementById('notes-modal');
    modal.classList.remove('show');
}

function appendMessage(message, role) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}-message`;
    
    // Créer le conteneur pour le texte et les actions
    const contentContainer = document.createElement('div');
    contentContainer.className = 'message-content';
    
    // Ajouter le texte du message
    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    textDiv.textContent = message;
    contentContainer.appendChild(textDiv);
    
    // Si c'est un message de l'assistant, ajouter le bouton de sauvegarde
    if (role === 'assistant') {
        const bookmarkButton = document.createElement('button');
        bookmarkButton.className = 'bookmark-button';
        bookmarkButton.innerHTML = '<i class="far fa-bookmark"></i>';
        bookmarkButton.title = 'Sauvegarder dans les notes';
        
        bookmarkButton.onclick = async () => {
            try {
                await saveNote(message, role);
                bookmarkButton.innerHTML = '<i class="fas fa-bookmark"></i>';
                bookmarkButton.classList.add('saved');
                showNotification('Note sauvegardée !');
            } catch (error) {
                console.error('Erreur lors de la sauvegarde:', error);
                showNotification('Erreur lors de la sauvegarde', true);
            }
        };
        
        contentContainer.appendChild(bookmarkButton);
    }
    
    messageDiv.appendChild(contentContainer);
    document.getElementById('messages').appendChild(messageDiv);
    scrollToBottom();
}
