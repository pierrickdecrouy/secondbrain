# Extnd. Second Brain 🧠
**Le Second Cerveau optimisé pour l'Internat de Pharmacie.**

[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen)]()
[![License](https://img.shields.io/badge/License-MIT-blue.svg)]()
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=white)]()
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite&logoColor=white)]()

Extnd. (PharmaBrain) est une application open-source conçue spécifiquement pour la mémorisation et l'organisation des connaissances médicales, avec un accent particulier sur la pharmacie.

## 🚀 Fonctionnalités
- **Répétition Espacée (FSRS)** : Algorithme de pointe pour optimiser vos révisions.
- **Graphe de Connaissances** : Visualisez les liens (Physiopathologie -> Traitements -> Médicaments) grâce à une carte mentale 2D/3D dynamique.
- **Éditeur Rich Text Intégré** : Support du Markdown, des équations mathématiques (KaTeX) et des tags médicaux (TipTap).
- **Recherche Sémantique Hors-Ligne** : Le moteur FlexSearch et une IA d'embedding (Transformers.js) tournent directement dans le navigateur. Vos données ne quittent **jamais** votre appareil.
- **Application PWA / Desktop** : Installable sur Mac/Windows via Electron, ou accessible hors-ligne sur le web.

## 📸 Captures d'écran
*(À venir)*
- Mode Révision
- Graphe Mental
- Éditeur de Cours

## 🛠️ Installation

### Prérequis
- Node.js (v20+)
- npm (v10+)

### Démarrage local
```bash
# 1. Cloner le repo
git clone https://github.com/pierrickdcc/secondbrain.git
cd secondbrain

# 2. Installer les dépendances
npm install

# 3. Lancer le serveur de développement
npm run dev
```

### Compiler l'application de bureau (Electron)
```bash
npm run electron:build
```

## 🗺️ Roadmap
- [x] Implémentation du mode "Cluster" pour les révisions liées.
- [x] Nettoyage et optimisation des imports (Zustand).
- [ ] Application mobile native.
- [ ] Outil d'import de base de connaissances (Anki, Notion).
- [ ] Synchronisation cloud chiffrée de bout en bout (optionnelle).

## 🛡️ Sécurité & Données
- Aucune donnée personnelle ou médicale n'est envoyée sur un serveur tiers. L'application est fully-local par défaut.
- IndexedDB (Dexie.js) gère le stockage structuré.

## 🤝 Contribuer
Les Pull Requests sont les bienvenues ! Pensez à vérifier l'accessibilité (`npm run lint`) avant toute soumission.
