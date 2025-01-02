# Dialogue - Assistant IA avec Mémoire

Une interface minimaliste et élégante pour avoir des conversations approfondies avec l'IA Claude d'Anthropic. L'application permet de sauvegarder des notes qui servent de "mémoire" à l'assistant, permettant ainsi d'approfondir progressivement les sujets de discussion.

## Concept

Dialogue est conçu pour faciliter des échanges de plus en plus profonds avec l'IA. Grâce à son système de notes intégré, chaque conversation peut s'enrichir des échanges précédents, permettant de :
- Construire une base de connaissances personnalisée
- Approfondir progressivement les sujets
- Garder une trace des points importants
- Créer une véritable continuité dans les échanges

## Fonctionnalités

- 💬 Interface de chat épurée et intuitive
- 🧠 Système de notes servant de "mémoire" à l'assistant
- 🗂️ Gestion des conversations thématiques
- 📝 Édition et organisation des notes
- 🎨 Design sombre et minimaliste
- ⌨️ Saisie intelligente
- 🔄 Retours visuels élégants

## Installation

1. Clonez le repository :
```bash
git clone https://github.com/benoitraphael/mini-claude.git
cd mini-claude
```

2. Installez les dépendances :
```bash
pip install -r requirements.txt
```

3. Lancez l'application :
```bash
flask run --port 5001
```

4. Ouvrez votre navigateur à l'adresse : `http://localhost:5001`

5. Configurez votre clé API Anthropic :
   - Cliquez sur le bouton "Configuration API" dans l'interface
   - Entrez votre clé API Anthropic (commence par "sk-ant-api03-...")
   - Testez la validité de la clé
   - Sauvegardez la configuration

La clé API est stockée de manière sécurisée et chiffrée localement sur votre machine.

## Technologies Utilisées

- Backend : 
  - Flask pour le serveur web
  - SQLite pour le stockage des conversations et notes
  - API Anthropic Claude (modèle claude-3-5-sonnet-20241022)

- Frontend : 
  - JavaScript vanilla
  - HTML5/CSS3 moderne
  - Design System minimaliste

- Bibliothèques : 
  - Marked.js (rendu Markdown)
  - DOMPurify (sécurité XSS)
  - Highlight.js (coloration syntaxique)
  - Font Awesome (icônes)

## Caractéristiques Clés

- Interface utilisateur minimaliste favorisant la concentration
- Système de notes intégré servant de mémoire contextuelle
- Conversations thématiques pour organiser les échanges
- Design sombre apaisant pour les longues sessions
- Gestion asynchrone des échanges
- Expérience responsive sur tous les appareils

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Ouvrir une issue pour signaler un bug
- Proposer des améliorations
- Soumettre une pull request

## Licence

MIT License - voir le fichier [LICENSE](LICENSE) pour plus de détails.
