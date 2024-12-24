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
    
    // Créer le conteneur de contenu
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // Créer le conteneur de texte
    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    textDiv.textContent = text;
    
    // Ajouter le texte au conteneur de contenu
    contentDiv.appendChild(textDiv);
    
    // Créer le conteneur des boutons
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'message-buttons';
    
    // Créer le bouton d'édition (uniquement pour les messages utilisateur)
    if (className === 'user-message') {
        const editButton = document.createElement('button');
        editButton.className = 'edit-button';
        editButton.innerHTML = '<i class="fas fa-edit"></i>';
        editButton.onclick = () => editMessage(messageDiv);
        buttonContainer.appendChild(editButton);
    }
    
    // Créer le bouton de sauvegarde en note
    const saveNoteButton = document.createElement('button');
    saveNoteButton.className = 'save-note-button';
    saveNoteButton.innerHTML = '<i class="far fa-bookmark"></i>';
    
    // Vérifier si le message est déjà sauvegardé
    const isSaved = await checkIfNoteSaved(text);
    if (isSaved) {
        saveNoteButton.innerHTML = '<i class="fas fa-bookmark"></i>';
    }
    
    saveNoteButton.onclick = () => saveNote(text, saveNoteButton);
    buttonContainer.appendChild(saveNoteButton);
    
    // Ajouter les boutons au conteneur de contenu
    contentDiv.appendChild(buttonContainer);
    
    // Ajouter le conteneur de contenu au message
    messageDiv.appendChild(contentDiv);
    
    // Ajouter le message à la liste
    messages.appendChild(messageDiv);
    
    // Faire défiler jusqu'au nouveau message
    messageDiv.scrollIntoView({ behavior: 'smooth' });
    
    return messageDiv;
}

async function saveNote(text, saveButton) {
    if (!saveButton || !saveButton.querySelector) {
        console.error('saveButton invalide:', saveButton);
        return false;
    }

    try {
        console.log('Tentative de sauvegarde de la note:', { text });
        const response = await fetch('/save_note', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text })
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la sauvegarde');
        }

        const data = await response.json();
        console.log('Réponse de sauvegarde:', data);

        if (!data.timestamp) {
            throw new Error('Pas de timestamp dans la réponse');
        }

        // Mettre à jour l'icône
        saveButton.innerHTML = '<i class="fas fa-bookmark"></i>';
        
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
    const userMessage = userInput.value.trim();
    
    if (!userMessage) return;
    
    // Désactiver l'input pendant l'envoi
    userInput.disabled = true;
    
    try {
        // Ajouter le message de l'utilisateur
        const messageDiv = await addMessage(userMessage, 'user-message');
        userInput.value = '';
        autoResizeTextarea(userInput);
        
        // Afficher l'indicateur de frappe
        showTypingIndicator();
        
        // Envoyer le message au serveur
        const response = await fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: userMessage,
                conversation_id: currentConversationId
            })
        });
        
        if (!response.ok) {
            throw new Error('Erreur lors de l\'envoi du message');
        }
        
        const data = await response.json();
        console.log('Réponse du serveur:', data);
        
        // Mettre à jour currentConversationId avec celui retourné par le serveur
        if (data.conversation_id) {
            currentConversationId = data.conversation_id;
            console.log('Conversation ID mis à jour:', currentConversationId);
        }
        
        // Cacher l'indicateur de frappe
        hideTypingIndicator();
        
        // Si le message a un ID, le stocker
        if (data.message_id) {
            console.log('Attribution de l\'ID au message utilisateur:', data.message_id);
            messageDiv.dataset.messageId = data.message_id.toString();
        }
        
        // Ajouter la réponse de l'assistant
        if (data.response) {
            const assistantDiv = await addMessage(data.response, 'assistant-message');
            if (data.assistant_message_id) {
                console.log('Attribution de l\'ID au message assistant:', data.assistant_message_id);
                assistantDiv.dataset.messageId = data.assistant_message_id.toString();
            }
        }
        
        // Recharger la liste des conversations
        loadConversations();
        
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur lors de l\'envoi du message', true);
    } finally {
        // Réactiver l'input
        userInput.disabled = false;
        userInput.focus();
    }
}

function editMessage(messageDiv) {
    if (!messageDiv) return;
    
    // Si un message est déjà en cours d'édition, annuler
    if (editingMessage) {
        cancelEdit();
    }
    
    // Stocker la référence au message en cours d'édition
    editingMessage = messageDiv;
    
    // Récupérer le texte actuel
    const textDiv = messageDiv.querySelector('.message-text');
    if (!textDiv) return;
    
    const currentText = textDiv.textContent;
    
    // Vérifier que le message a un ID
    const messageId = messageDiv.dataset.messageId;
    if (!messageId) {
        console.error('Message sans ID:', messageDiv);
        showNotification('Impossible d\'éditer ce message : ID manquant', true);
        return;
    }
    console.log('Edition du message avec ID:', messageId);
    
    // Créer la zone de texte
    const textarea = document.createElement('textarea');
    textarea.value = currentText;
    textarea.className = 'edit-textarea';
    autoResizeTextarea(textarea);
    
    // Créer les boutons de sauvegarde et d'annulation
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'edit-buttons';
    
    const saveButton = document.createElement('button');
    saveButton.className = 'save-button';
    saveButton.innerHTML = '<i class="fas fa-check"></i>';
    saveButton.onclick = () => saveEdit(textarea.value);
    
    const cancelButton = document.createElement('button');
    cancelButton.className = 'cancel-button';
    cancelButton.innerHTML = '<i class="fas fa-times"></i>';
    cancelButton.onclick = cancelEdit;
    
    buttonContainer.appendChild(saveButton);
    buttonContainer.appendChild(cancelButton);
    
    // Remplacer le texte par la zone de texte et les boutons
    const contentDiv = messageDiv.querySelector('.message-content');
    if (contentDiv) {
        // Sauvegarder les boutons existants
        const existingButtons = contentDiv.querySelector('.message-buttons');
        
        // Vider le contenu
        contentDiv.innerHTML = '';
        
        // Ajouter la zone de texte et les nouveaux boutons
        contentDiv.appendChild(textarea);
        contentDiv.appendChild(buttonContainer);
        
        // Restaurer les boutons existants
        if (existingButtons) {
            contentDiv.appendChild(existingButtons);
        }
        
        // Mettre le focus sur la zone de texte
        textarea.focus();
    }
}

function cancelEdit() {
    if (!editingMessage) return;
    
    const messageText = editingMessage.querySelector('.edit-textarea');
    if (!messageText) return;
    
    // Restaurer le texte original depuis l'attribut data
    const originalText = editingMessage.dataset.originalText || '';
    
    // Restaurer le texte original
    const messageContent = editingMessage.querySelector('.message-content');
    messageContent.innerHTML = '<div class="message-text">' + originalText + '</div>';
    
    // Réinitialiser la référence
    editingMessage = null;
}

async function saveEdit(newText) {
    if (!editingMessage) return;
    
    // Sauvegarder une référence locale au message en cours d'édition
    const messageDiv = editingMessage;
    
    try {
        // Récupérer l'ID du message depuis l'attribut data
        const messageId = messageDiv.dataset.messageId;
        console.log('Message ID à éditer:', messageId);
        
        if (!messageId) {
            throw new Error('ID du message non trouvé');
        }
        
        // Envoyer le message édité au serveur avec l'ID
        console.log('Envoi de la requête avec:', {
            message: newText,
            conversation_id: currentConversationId,
            is_edit: true,
            message_id: messageId
        });
        
        const response = await fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: newText,
                conversation_id: currentConversationId,
                is_edit: true,
                message_id: messageId
            })
        });
        
        const data = await response.json();
        console.log('Réponse du serveur:', data);
        
        if (!response.ok) {
            throw new Error(data.error || 'Erreur lors de la sauvegarde');
        }
        
        // Réinitialiser la référence avant de recharger
        editingMessage = null;
        
        // Recharger toute la conversation
        await loadConversation(currentConversationId);
        
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        showNotification(error.message || 'Erreur lors de la sauvegarde', true);
        
        // En cas d'erreur, restaurer l'affichage original
        cancelEdit();
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
    // Mettre à jour currentConversationId
    currentConversationId = conversationId;
    
    const messages = document.getElementById('messages');
    messages.innerHTML = '';
    
    // Mettre à jour la sélection visuelle
    document.querySelectorAll('.conversation-item').forEach(item => {
        if (item.dataset.id === (conversationId ? conversationId.toString() : '')) {
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
        .then(async data => {
            console.log('Messages reçus du serveur:', data.messages);
            if (data.messages && Array.isArray(data.messages)) {
                for (const msg of data.messages) {
                    const messageDiv = await addMessage(
                        msg.content,
                        msg.role === 'user' ? 'user-message' : 'assistant-message'
                    );
                    
                    // Stocker l'ID de la base de données
                    if (msg.id) {
                        console.log(`Attribution de l'ID ${msg.id} au message:`, msg.content);
                        messageDiv.dataset.messageId = msg.id.toString();
                    } else {
                        console.warn('Message sans ID:', msg);
                    }
                }
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
        showNotification("Erreur lors du chargement des notes");
    }
}

async function openNotesModal() {
    const modal = document.getElementById('notes-modal');
    modal.classList.add('show');
    loadNotes();
}

function closeNotesModal() {
    const modal = document.getElementById('notes-modal');
    modal.classList.remove('show');
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
