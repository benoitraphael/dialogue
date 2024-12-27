// Fonction pour charger et afficher les notes
async function loadNotes() {
    try {
        const response = await fetch('/get_notes');
        const data = await response.json();
        
        const notesDisplay = document.querySelector('.notes-display');
        if (!notesDisplay) {
            console.error('Element .notes-display not found');
            return;
        }
        
        notesDisplay.innerHTML = ''; // Nettoie l'affichage existant
        
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
                deleteButton.dataset.noteId = note.id;
                deleteButton.onclick = () => deleteNote(note.id);
                
                noteElement.appendChild(headerElement);
                noteElement.appendChild(contentElement);
                noteElement.appendChild(deleteButton);
                notesDisplay.appendChild(noteElement);
            });
        } else {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-notes';
            emptyMessage.textContent = 'Aucune note pour le moment';
            notesDisplay.appendChild(emptyMessage);
        }
    } catch (error) {
        console.error('Erreur lors du chargement des notes:', error);
        const notesDisplay = document.querySelector('.notes-display');
        if (notesDisplay) {
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            errorMessage.textContent = 'Une erreur est survenue lors du chargement des notes';
            notesDisplay.innerHTML = '';
            notesDisplay.appendChild(errorMessage);
        }
    }
}

// Fonction pour supprimer une note
async function deleteNote(noteId) {
    try {
        const response = await fetch(`/delete_note/${noteId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            // Recharger les notes après la suppression
            loadNotes();
        } else {
            throw new Error('Erreur lors de la suppression de la note');
        }
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Une erreur est survenue lors de la suppression de la note');
    }
}

// Charge les notes au chargement de la page
document.addEventListener('DOMContentLoaded', loadNotes);
