# Assistant Personnel avec Claude

Une application web qui utilise l'API Claude d'Anthropic pour créer un assistant virtuel intelligent, spécialisé en développement personnel et en psychologie transpersonnelle.

## Fonctionnalités

- Interface de chat élégante et intuitive
- Support du Markdown pour une meilleure mise en forme des messages
- Historique des conversations
- Possibilité d'éditer les messages
- Coloration syntaxique pour le code
- Système de conversation contextuelle

## Installation

1. Clonez le dépôt :
```bash
git clone [URL_DU_REPO]
cd claude-clone
```

2. Créez un environnement virtuel et activez-le :
```bash
python -m venv venv
source venv/bin/activate  # Sur Unix/macOS
# ou
venv\Scripts\activate  # Sur Windows
```

3. Installez les dépendances :
```bash
pip install -r requirements.txt
```

4. Créez un fichier `.env` à la racine du projet et ajoutez votre clé API Anthropic :
```
ANTHROPIC_API_KEY=votre_clé_api
```

5. Lancez l'application :
```bash
python app.py
```

L'application sera accessible à l'adresse : http://localhost:5001

## Technologies utilisées

- Backend : Flask (Python)
- Frontend : JavaScript vanilla
- Base de données : SQLite
- API : Anthropic Claude
- Markdown : marked.js
- Coloration syntaxique : highlight.js
- Sécurité : DOMPurify

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou à soumettre une pull request.
