# 🧠 PharmaBrain (SecondBrain)

> **L'outil ultime de gestion des connaissances et d'apprentissage actif conçu pour exceller dans les études longues et exigeantes (Médecine, Pharmacie, Droit, etc.).**

PharmaBrain est une application hybride (Web, PWA, Desktop) qui fusionne la puissance d'un éditeur de notes riche (façon Obsidian/Notion) avec l'efficacité d'un système de répétition espacée (façon Anki). Dotée de fonctions avancées comme la recherche sémantique locale, la visualisation de la connaissance en graphes 3D, et un fonctionnement *local-first*, l'application est pensée pour ingérer, relier et mémoriser l'immense quantité de données inhérente aux cursus universitaires intenses.

---

## ✨ Fonctionnalités Clés

### 📝 Édition et Gestion des Cours
- **Éditeur Riche et Markdown** : Propulsé par `Tiptap` et `react-markdown`, l'éditeur permet de formater facilement le texte, d'insérer des tableaux, des images, et des formules mathématiques (`KaTeX`).
- **Concepts & Hiérarchie** : Organisation des connaissances par "Cours" et "Concepts Clés". Les concepts s'affichent de façon fluide dans la continuité de la lecture.
- **Thème Adaptatif** : Mode clair et sombre géré dynamiquement.

### 🃏 Mémorisation & Spaced Repetition (SRS)
- **Algorithme FSRS Intégré** : Utilisation de `ts-fsrs` (Free Spaced Repetition Scheduler), l'un des algorithmes d'apprentissage les plus performants du marché (supérieur à SM-2).
- **Création de Flashcards** : Formats multiples (Questions/Réponses, Textes à trous / Cloze).
- **Ajout en masse** : Import de flashcards en lot via des fichiers Texte ou JSON avec validation intelligente.
- **Interopérabilité Anki** : Exportation des paquets au format `.apkg` grâce à `genanki-js`.

### 🕸️ Visualisation en Graphes
- **Vue Réseau** : Représentation visuelle des liens entre vos cours, concepts et flashcards (2D et 3D) grâce à `react-force-graph` et `d3-force`.
- **Worker d'Indexation** : Algorithme de liaison optimisé (via Web Workers et structures `UnionFind`) pour déduire et afficher intelligemment les relations sémantiques entre les fiches sans ralentir l'interface.

### 🔎 Recherche Avancée & Sémantique
- **Moteur de Recherche Local** : Utilisation de `flexsearch` pour une recherche textuelle ultra-rapide.
- **IA Sémantique Embarquée** : Intégration de `@huggingface/transformers` en local pour générer des embeddings et `voy-search` (moteur vectoriel WebAssembly) pour retrouver des concepts similaires par le sens, sans dépendre du cloud.

### 💾 Architecture Local-First & Cloud
- **Offline By Default** : Les données vivent d'abord sur votre machine grâce à `dexie` (IndexedDB) pour le web et `better-sqlite3` pour l'application de bureau.
- **Synchronisation** : Sauvegarde et synchronisation Cloud optionnelle propulsée par `Firebase`.

### 🍅 Productivité
- **Compteur Pomodoro** : Minuteur intégré au design épuré, pensé pour vous garder concentré avec des sessions de travail paramétrables.

---

## 🛠️ Architecture Technique & Stack

Le projet est un monorepo basé sur **React 19** et **Vite**, packagé pour le bureau avec **Electron**.

### Frontend
- **Framework** : React 19 + TypeScript
- **Bundler** : Vite
- **Styling** : TailwindCSS + PostCSS (Variables CSS natives pour le design system)
- **Icônes** : Phosphor Icons (`@phosphor-icons/react`), Lucide React
- **Routage** : React Router DOM (`react-router-dom` v7)
- **State Management** : Zustand (`zustand`)
- **Virtualisation** : React Virtuoso (pour les longues listes fluides)

### Traitement & IA (Client-Side)
- **NLP & Embeddings** : `@huggingface/transformers`
- **Recherche Vectorielle** : `voy-search`
- **Graphes** : `react-force-graph-2d/3d`, `d3-force`
- **Rendu Markdown** : `remark-gfm`, `remark-math`, `rehype-katex`, `rehype-sanitize`, `dompurify`

### Backend & Persistance
- **Base de données Web** : IndexedDB (via `dexie`)
- **Base de données Desktop** : SQLite (via `sql.js` / `better-sqlite3`)
- **Cloud Sync** : Firebase SDK
- **PWA** : `vite-plugin-pwa` pour l'installation web et le cache offline.
- **Desktop Wrapper** : `electron`, `electron-builder`

---

## 📂 Arborescence Principale

```text
secondbrain/
├── electron/                 # Code spécifique à l'application bureau (Main process)
├── src/                      # Code source principal (React)
│   ├── components/           # Composants UI (Modales, Éditeur, CourseViewer, etc.)
│   ├── context/              # Contextes React (ThemeContext, etc.)
│   ├── hooks/                # Custom hooks
│   ├── store/                # Stores Zustand (useCardStore, etc.)
│   ├── types/                # Définitions TypeScript globales
│   ├── utils/                # Utilitaires (Parsing, Export Anki, Markdown)
│   └── workers/              # Web Workers (graph.worker.ts, etc.)
├── index.html                # Point d'entrée web
├── package.json              # Dépendances et scripts
├── tailwind.config.js        # Configuration Tailwind
└── vite.config.ts            # Configuration Vite & PWA
```

---

## 🚀 Installation & Développement

Assurez-vous de disposer de **Node.js** (v18 ou supérieur).

### 1. Cloner le projet
```bash
git clone https://github.com/pierrickdcc/secondbrain.git
cd secondbrain
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Lancer en mode Développement (Web)
```bash
npm run dev
```
L'application sera accessible sur `http://localhost:5173`.

### 4. Lancer en mode Développement (Electron / Desktop)
```bash
npm run electron:dev
```
Compile le code source et lance l'application native de bureau avec rechargement à chaud.

### 5. Build & Distribution
- **Version Web / PWA** : `npm run build`
- **Version Desktop (Mac/Win)** : `npm run dist`

---

## 🛡️ Règles de Contribution & Design (DA)

Lors du développement de nouvelles fonctionnalités, gardez à l'esprit la **Direction Artistique (DA)** de l'application :
1. **Épuré et Aéré** : Les espaces (paddings, margins) doivent permettre au contenu de respirer. Évitez de surcharger l'interface.
2. **Continuité de Lecture** : Les éléments textuels et de cours doivent s'enchaîner fluidement (ex: affichage des concepts clés en inline plutôt que cachés).
3. **Thème Adaptatif** : Tout nouveau composant doit supporter nativement le mode clair et le mode sombre via les classes `.dark` ou les variables CSS (`var(--color-bg)`, `var(--color-surface)`, `var(--color-text)`).
4. **Pas d'Émojis superflus** : Le design se veut professionnel, premium et orienté productivité pour donner "envie de travailler".

---

*Développé avec passion pour les étudiants confrontés aux cursus les plus exigeants.* 📚⚖️⚕️
