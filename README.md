# Laura - Assistant IA Personnel

Une application de chat élégante utilisant l'API d'Anthropic pour créer un assistant virtuel nommé Laura.

## Fonctionnalités

- 💬 Interface de chat intuitive et responsive
- 📝 Édition des messages avec prévisualisation Markdown
- 🗂️ Gestion des conversations multiples
- 📌 Système de notes pour sauvegarder les informations importantes
- 🎨 Design inspiré du papier ancien avec une touche moderne
- ⌨️ Saisie de texte auto-redimensionnable
- 🔄 Indicateur de chargement pendant la génération des réponses

## Installation

1. Clonez le repository :
```bash
git clone https://github.com/votre-username/laura-assistant.git
cd laura-assistant
```

2. Installez les dépendances :
```bash
pip install -r requirements.txt
```

3. Configurez votre clé API Anthropic :
```bash
export ANTHROPIC_API_KEY='votre-clé-api'
```

4. Lancez l'application :
```bash
python app.py
```

5. Ouvrez votre navigateur à l'adresse : `http://localhost:5001`

## Technologies Utilisées

- Backend : Flask, SQLite
- Frontend : JavaScript vanilla, HTML5, CSS3
- API : Anthropic Claude
- Bibliothèques : 
  - Marked.js pour le rendu Markdown
  - DOMPurify pour la sécurité XSS
  - Highlight.js pour la coloration syntaxique
  - Font Awesome pour les icônes

## Dernières Mises à Jour

- ✨ Amélioration de l'interface d'édition des messages
- 🎯 Correction des bugs d'affichage du textarea
- 🎨 Harmonisation des styles avec la charte graphique
- 📱 Meilleure gestion du responsive design
- 🔄 Optimisation des animations et transitions

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou soumettre une pull request.

## Licence

MIT License - voir le fichier [LICENSE](LICENSE) pour plus de détails.
