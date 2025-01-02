# Dialogue - Assistant IA avec Claude

## 🎯 Présentation

Imaginez une application qui vous permet d'avoir des conversations enrichissantes avec l'une des IA les plus avancées au monde, Claude d'Anthropic, mais dans une interface élégante et simple d'utilisation.

"Dialogue" est comme un salon numérique privé où vous pouvez discuter avec un assistant intelligent qui :
- Comprend vos questions en profondeur
- Répond de manière claire et nuancée
- Se souvient de vos conversations précédentes
- Vous aide à organiser vos idées

Ce qui rend cette application unique, c'est son approche minimaliste et ses fonctionnalités bien pensées :

1. **Une interface épurée** : Pas de distractions, juste vous et l'assistant dans un environnement visuellement apaisant avec un mode sombre élégant.

2. **Un système de mémoire intelligent** : L'application vous permet de prendre des notes pendant vos conversations. Ces notes deviennent comme une "mémoire" que l'assistant peut consulter, permettant des échanges de plus en plus profonds au fil du temps.

3. **Organisation intuitive** : Vos conversations sont naturellement organisées, un peu comme dans une messagerie moderne, mais avec la possibilité de les regrouper par thèmes.

Concrètement, vous pourriez utiliser Dialogue pour :
- Explorer des sujets complexes en profondeur
- Garder une trace structurée de vos réflexions
- Développer des idées sur la durée
- Avoir un véritable compagnon de réflexion disponible 24/7

C'est comme avoir un assistant personnel brillant, patient et organisé, qui s'adapte à votre façon de penser et vous aide à approfondir vos réflexions, le tout dans une interface aussi simple à utiliser qu'une application de messagerie moderne.

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

2. (Recommandé) Créez un environnement virtuel :
> 💡 Un environnement virtuel crée une "bulle" isolée pour votre projet. C'est recommandé car :
> - Évite les conflits entre différents projets Python
> - Garde votre système propre
> - Facilite le partage du projet
> 
> Si vous débutez, vous pouvez sauter cette étape, mais c'est une bonne pratique à prendre !

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
# Si vous utilisez un environnement virtuel
pip install -r requirements.txt

# Si vous n'utilisez pas d'environnement virtuel
# Windows
python -m pip install -r requirements.txt

# Mac/Linux
python3 -m pip install -r requirements.txt
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
