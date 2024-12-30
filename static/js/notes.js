// Fonction pour charger et afficher les notes
async function loadNotes() {
    try {
        const response = await fetch('/get_notes');
        const data = await response.json();
        
        const notesContainer = document.querySelector('.messages-container');
        if (!notesContainer) {
            console.error('Element .messages-container not found');
            return;
        }
        
        notesContainer.innerHTML = ''; // Nettoie l'affichage existant
        
        if (data.notes && data.notes.length > 0) {
            data.notes.forEach(note => {
                const noteElement = document.createElement('div');
                noteElement.className = 'note-item';
                
                // En-tête de la note avec le rôle et la date
                const headerElement = document.createElement('div');
                headerElement.className = 'note-header';
                headerElement.textContent = `Note de ${note.role} - ${note.date}`;
                
                // Contenu de la note
                const contentElement = document.createElement('div');
                contentElement.className = 'note-content';
                contentElement.textContent = note.content;
                
                // Bouton de suppression
                const deleteButton = document.createElement('button');
                deleteButton.className = 'delete-note';
                deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
                deleteButton.onclick = () => deleteNote(note.id, deleteButton);
                
                noteElement.appendChild(headerElement);
                noteElement.appendChild(contentElement);
                noteElement.appendChild(deleteButton);
                notesContainer.appendChild(noteElement);
            });
        } else {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-notes';
            emptyMessage.textContent = 'Aucune note pour le moment';
            notesContainer.appendChild(emptyMessage);
        }
        
        // Mettre à jour le compteur après avoir ajouté les notes
        updateWordCount();
        
    } catch (error) {
        console.error('Erreur lors du chargement des notes:', error);
        const notesContainer = document.querySelector('.messages-container');
        if (notesContainer) {
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            errorMessage.textContent = 'Une erreur est survenue lors du chargement des notes';
            notesContainer.innerHTML = '';
            notesContainer.appendChild(errorMessage);
        }
    }
}

// Fonction pour compter les mots dans un texte
function countWords(str) {
    // Nettoyer le texte des caractères spéciaux et espaces multiples
    str = str.replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    
    // Retourner le nombre de mots
    return str ? str.split(' ').length : 0;
}

// Fonction pour mettre à jour le compteur de mots
function updateWordCount() {
    const noteContents = document.querySelectorAll('.messages-container .note-content');
    let totalWords = 0;
    
    noteContents.forEach(note => {
        if (note.textContent) {
            totalWords += countWords(note.textContent);
        }
    });
    
    // Mettre à jour l'affichage
    const wordCountElement = document.getElementById('word-count');
    const memoryAlert = document.getElementById('memory-alert');
    
    if (wordCountElement) {
        wordCountElement.textContent = `${totalWords.toLocaleString()} mots`;
    }
    
    if (memoryAlert) {
        memoryAlert.style.display = totalWords > 150000 ? 'block' : 'none';
    }
}

// Fonction pour supprimer une note
async function deleteNote(noteId, button) {
    try {
        const response = await fetch(`/delete_note/${noteId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la suppression');
        }

        // Supprimer l'élément du DOM
        const noteElement = button.closest('.note-item');
        noteElement.remove();
        
        // Mettre à jour le compteur après la suppression
        updateWordCount();

    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la suppression de la note');
    }
}

// Initialiser au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    loadNotes();  // Charger les notes
});
