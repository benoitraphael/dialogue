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

### Étape 1 : Télécharger et décompresser le projet

1. Cliquez sur le bouton vert "Code" en haut de cette page
2. Cliquez sur "Download ZIP"
3. Trouvez le fichier ZIP téléchargé :
   - Sur Windows : Généralement dans le dossier "Téléchargements"
   - Sur Mac : Dans le dossier "Downloads"

4. Décompressez le fichier :
   - Sur Windows : Faites un clic droit sur le fichier ZIP et choisissez "Extraire tout..."
     - Choisissez un emplacement facile à retrouver (par exemple : `C:\Users\VotreNom\Documents\dialogue`)
     - Cliquez sur "Extraire"
   
   - Sur Mac : Double-cliquez sur le fichier ZIP
     - Le dossier sera décompressé au même endroit que le ZIP
     - Vous pouvez le déplacer dans un endroit plus pratique (par exemple : dans votre dossier "Documents")

> 💡 **Important** : 
> - Notez bien où vous décompressez le dossier, vous en aurez besoin plus tard
> - Le dossier décompressé devrait contenir un sous-dossier `app` - c'est là que se trouve l'application
> - Évitez les emplacements avec des caractères spéciaux ou des espaces dans le chemin

### Étape 2 : Installer Python

1. Allez sur [python.org](https://www.python.org/downloads/)
2. Téléchargez la dernière version de Python pour votre système
3. Lancez l'installation en cochant "Add Python to PATH"

### Étape 3 : Préparer votre espace de travail

1. Créez un nouveau dossier pour le projet :
   - Sur Windows :
     - Ouvrez "Ce PC" ou l'explorateur de fichiers
     - Allez dans le dossier "Documents"
     - Clic droit → Nouveau → Dossier
     - Nommez-le "dialogue"

   - Sur Mac :
     - Ouvrez le Finder
     - Allez dans votre dossier "Documents"
     - Cmd + Shift + N pour créer un nouveau dossier
     - Nommez-le "dialogue"

2. Déplacez les fichiers :
   - Ouvrez le dossier ZIP que vous avez téléchargé
   - Copiez tout son contenu
   - Collez-le dans le dossier "dialogue" que vous venez de créer

3. Ouvrez un terminal :
   - Sur Windows : 
     - Appuyez sur la touche Windows + R
     - Tapez "cmd" et appuyez sur Entrée

   - Sur Mac : 
     - Appuyez sur Cmd + Espace
     - Tapez "terminal" et appuyez sur Entrée

4. Dans le terminal, naviguez vers votre dossier :
   ```bash
   # Sur Windows
   cd C:\Users\VotreNom\Documents\dialogue\app

   # Sur Mac
   cd ~/Documents/dialogue/app
   ```

   > 💡 **Astuce** : 
   > - Sur Mac : Tapez `cd ` (avec un espace), puis glissez le dossier "app" depuis le Finder dans le terminal
   > - Sur Windows : Dans l'explorateur, allez dans le dossier "app", puis Shift + Clic droit → "Ouvrir PowerShell ici"

5. Vérifiez que vous êtes au bon endroit :
   ```bash
   # Tapez cette commande :
   ls

   # Vous devriez voir app.py dans la liste
   ```

### Étape 4 : Installer les dépendances

1. (Recommandé) Créez un environnement virtuel :
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

2. Installez les dépendances :
```bash
# Si vous utilisez un environnement virtuel
pip install -r requirements.txt

# Si vous n'utilisee pas d'environnement virtuel
# Windows
python -m pip install -r requirements.txt

# Mac/Linux
python3 -m pip install -r requirements.txt
```

### Étape 5 : Configurer votre clé API Anthropic

1. Créez un compte sur [Anthropic Console](https://console.anthropic.com/)
2. Générez une clé API dans les paramètres de votre compte
3. Lancez l'application (voir étape suivante)
4. Cliquez sur "Configuration API Anthropic" dans la barre latérale
5. Collez votre clé API et sauvegardez

## 🎯 Lancer l'application

1. Ouvrez un terminal :
   - Sur Windows : appuyez sur `Windows + R`, tapez `cmd` et appuyez sur Entrée
   - Sur Mac : appuyez sur `Cmd + Espace`, tapez `terminal` et appuyez sur Entrée

2. Dans le terminal, naviguez jusqu'au dossier où vous avez décompressé le projet :
```bash
# Par exemple, si votre dossier est dans "Documents/dialogue" :

# Sur Windows
cd C:\Users\VotreNom\Documents\dialogue\app

# Sur Mac/Linux
cd ~/Documents/dialogue/app
```

> 💡 **Astuce pour les débutants** : 
> - Sur Mac, vous pouvez aussi ouvrir le terminal et taper `cd `, puis faire glisser le dossier `app` depuis le Finder dans le terminal
> - Sur Windows, vous pouvez ouvrir le dossier `app` dans l'explorateur, faire Shift + Clic droit et choisir "Ouvrir PowerShell ici" ou "Ouvrir dans le terminal"

3. Vérifiez que vous êtes dans le bon dossier :
```bash
# Tapez cette commande
ls

# Vous devriez voir app.py dans la liste des fichiers
```

4. Lancez l'application :
```bash
# Windows
python app.py

# Mac/Linux
python3 app.py
```

5. Ouvrez votre navigateur et allez sur : `http://localhost:5001`

> 💡 **En cas de problème** :
> - Vérifiez que vous voyez bien le fichier `app.py` quand vous tapez `ls`
> - Vérifiez que l'URL dans votre navigateur est exactement `http://localhost:5001`
> - Si vous voyez des erreurs dans le terminal, n'hésitez pas à ouvrir une "Issue" sur GitHub

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
