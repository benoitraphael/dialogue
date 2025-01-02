# Dialogue - Assistant IA avec Claude

Une application web élégante et intuitive pour dialoguer avec Claude, l'assistant IA d'Anthropic.

## 🚀 Installation

### Étape 1 : Télécharger le projet

1. Cliquez sur le bouton vert "Code" en haut de cette page
2. Cliquez sur "Download ZIP"
3. Décompressez le fichier ZIP dans un dossier sur votre ordinateur

### Étape 2 : Installer Python

1. Allez sur [python.org](https://www.python.org/downloads/)
2. Téléchargez la dernière version de Python pour votre système
3. Lancez l'installation en cochant "Add Python to PATH"

### Étape 3 : Installer les dépendances

Ouvrez un terminal (Command Prompt sous Windows, Terminal sous Mac) :

1. Naviguez vers le dossier du projet :
```bash
cd chemin/vers/le/dossier/dialogue
```

2. Créez un environnement virtuel :
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Mac/Linux
python3 -m venv venv
source venv/bin/activate
```

3. Installez les dépendances :
```bash
pip install -r requirements.txt
```

### Étape 4 : Configurer votre clé API Anthropic

1. Créez un compte sur [Anthropic Console](https://console.anthropic.com/)
2. Générez une clé API dans les paramètres de votre compte
3. Lancez l'application (voir étape suivante)
4. Cliquez sur "Configuration API Anthropic" dans la barre latérale
5. Collez votre clé API et sauvegardez

## 🎯 Lancer l'application

1. Dans le terminal (avec l'environnement virtuel activé) :
```bash
# Windows
python app.py

# Mac/Linux
python3 app.py
```

2. Ouvrez votre navigateur et allez sur : `http://localhost:5000`

## 🌟 Fonctionnalités

- 💬 Interface de chat intuitive
- 📝 Sauvegarde des conversations
- 📌 Système de notes pour garder les informations importantes
- 🎨 Design moderne et responsive
- 🌙 Mode sombre par défaut

## 🔧 Résolution des problèmes courants

### "Python n'est pas reconnu..."
➡️ Réinstallez Python en cochant "Add Python to PATH"

### "Le module X n'est pas trouvé..."
➡️ Vérifiez que vous avez bien :
1. Activé l'environnement virtuel
2. Installé les dépendances avec pip

### "Erreur de connexion à l'API..."
➡️ Vérifiez que :
1. Votre clé API est correctement configurée
2. Vous êtes connecté à Internet

## 🤝 Besoin d'aide ?

Ouvrez une "Issue" sur GitHub si vous rencontrez des problèmes ou avez des suggestions d'amélioration !

## 📜 Licence

Ce projet est sous licence MIT. Vous êtes libre de l'utiliser et de le modifier comme bon vous semble.
