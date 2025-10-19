# Sudbois — Gestion des Chargements

Application web de gestion des chargements.

## 📋 Fonctionnalités principales

- Gestion des chargements : création, modification (avant départ), annulation
- Suivi des statuts : "En préparation", "Acheminement en cours", "Livré" (calcul automatique)
- Gestion des produits, des clients et des transporteurs
- Recherche et filtrage des chargements
- Interface responsive

## 🛠️ Technologies utilisées

- **Next.js** : Framework React avec App Router pour une application performante et facile à maintenir
- **Supabase** : Plateforme backend pour la base de données PostgreSQL et l'authentification
- **TypeScript** : Pour un développement plus robuste avec vérification de types
- **shadcn/ui** : Composants React accessibles et personnalisables
- **Tailwind CSS** : Framework CSS utilitaire pour un design responsive et cohérent
- **date-fns** : Bibliothèque de manipulation de dates pour la gestion des dates de chargement

## 📦 Structure de la base de données

La base de données utilise PostgreSQL et est hébergée sur la plateforme [Supabase](https://supabase.com/).

Modèle conceptuel (MCD) :

![MCD de la base de donnée](https://i.imgur.com/H0oxjXX.png)

## ⚙️ Architecture technique

- **Frontend** : Application Next.js utilisant l'App Router pour une architecture orientée serveur avec des composants React interactifs
- **Backend** : API Supabase pour les opérations CRUD avec politiques de sécurité
- **Interface utilisateur** : Composants shadcn/ui pour une UX cohérente et accessible

## 🚀 Installation et démarrage

1. Clonez le dépôt :
```bash
git clone https://github.com/spitzerl/sudbois-chargements.git
cd sudbois-chargements
```

2. Installez les dépendances :
```bash
npm install
```

3. Dupliquer .env.example en .env.local et compléter avec les informations demandés

4. Lancez le serveur de développement avec Turbopack pour des performances optimales :
```bash
npm run dev
```

5. Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 💾 Configuration Supabase

1. Créez un projet sur [Supabase](https://supabase.com/)
2. Exécutez le script SQL disponible dans `base.sql` pour créer les tables nécessaires
3. Récupérez les clés d'API dans les paramètres du projet Supabase
4. Ajoutez ces clés dans votre fichier `.env.local`

## Déploiement (Vercel)

1. Pusher le projet sur GitHub.
2. Importer le repo dans Vercel.
3. Dans les settings du projet Vercel, ajouter les variables d'environnement (mêmes que `.env.local`).
4. Déployer — Vercel détecte automatiquement Next.js.

## 🔮 Évolutions futures

- Ajout d'un système de compte pour protéger l'accès aux informations
- Amélioration de la gestion des transporteurs avec l'ajout d'une table de gestion des camions
- Ajout d'un tableau de statistiques
- Ajout d'un système d'export des données (format JSON)
- Intégration avec d'autres systèmes de l'entreprise

## Ressources

- Documentation Next.js : https://nextjs.org/docs
- Documentation Supabase : https://supabase.io/docs
- shadcn/ui : https://ui.shadcn.com/
- Tailwind CSS : https://tailwindcss.com/docs
