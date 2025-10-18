# Sudbois — Gestion des Chargements

Application web pour la gestion des chargements de marchandises destinée à faciliter le suivi logistique pour l'entreprise Sudbois. Elle permet de créer, modifier, et suivre des chargements en temps réel, avec un système de statut automatique basé sur les dates de départ et d'arrivée.

## 📋 Fonctionnalités principales et leur justification

### 1. Gestion des chargements
- **Création de chargements** : Interface simple pour créer rapidement des expéditions avec tous les paramètres nécessaires
  - *Pourquoi* : Simplifie le processus administratif de préparation des livraisons
- **Modification des chargements non expédiés** : Modification possible tant que le chargement n'est pas parti
  - *Pourquoi* : Permet de corriger les erreurs ou d'adapter les informations jusqu'au moment du départ
- **Annulation des chargements** : Possibilité de supprimer un chargement qui n'a pas été expédié
  - *Pourquoi* : Offre une flexibilité opérationnelle en cas de commande annulée ou reportée

### 2. Suivi des statuts
- **Système de statut automatisé** : Trois statuts principaux calculés automatiquement selon les dates
  - "En préparation" (rouge) : Pas encore parti ou date de départ future
  - "Acheminement en cours" (jaune) : Date de départ passée mais pas encore arrivé
  - "Livré" (vert) : Date d'arrivée passée
  - *Pourquoi* : Permet un suivi visuel immédiat de l'état des livraisons sans intervention manuelle

### 3. Gestion des produits par chargement
- **Ajout de produits multiples** : Association de plusieurs produits à un chargement avec quantités
  - *Pourquoi* : Reflète la réalité des expéditions qui contiennent souvent plusieurs articles
- **Modification des produits** : Possibilité de modifier la liste des produits d'un chargement
  - *Pourquoi* : Adaptation aux changements de commande jusqu'au départ du chargement

### 4. Recherche et filtrage
- **Recherche par nom ou ID** : Recherche textuelle dans les chargements
  - *Pourquoi* : Permet de retrouver rapidement un chargement spécifique dans une grande liste
- **Filtrage par statut** : Filtrage rapide selon l'état du chargement
  - *Pourquoi* : Facilite la concentration sur les chargements d'un certain statut (par ex. tous les "en cours")
- **Tri par date ou statut** : Organisation des résultats selon plusieurs critères
  - *Pourquoi* : Adapte la visualisation aux besoins de l'utilisateur (chronologique ou par priorité)

### 5. Interface adaptative
- **Responsive design** : Interface fonctionnelle sur tous les appareils (mobile, tablette, desktop)
  - *Pourquoi* : Permet l'utilisation sur le terrain par les équipes logistiques avec des appareils mobiles
- **Indication visuelle des statuts** : Utilisation de codes couleur cohérents
  - *Pourquoi* : Améliore la compréhension rapide de l'état des chargements

### 6. Architecture de données
- **Relation clients-transporteurs-produits** : Structure relationnelle robuste
  - *Pourquoi* : Garantit l'intégrité des données et facilite les analyses futures
- **Transactions sécurisées** : Opérations de création/modification en transaction
  - *Pourquoi* : Évite les incohérences de données en cas d'erreur ou d'interruption

## 🛠️ Technologies utilisées

- **Next.js** : Framework React avec App Router pour une application performante et facile à maintenir
- **Supabase** : Plateforme backend pour la base de données PostgreSQL et l'authentification
- **TypeScript** : Pour un développement plus robuste avec vérification de types
- **shadcn/ui** : Composants React accessibles et personnalisables
- **Tailwind CSS** : Framework CSS utilitaire pour un design responsive et cohérent
- **date-fns** : Bibliothèque de manipulation de dates pour la gestion des dates de chargement

## 🔄 Flux de travail typique

1. Consultation du tableau de bord avec filtres pour voir les chargements actifs
2. Création d'un nouveau chargement avec client, transporteur et produits
3. Suivi du statut automatique basé sur les dates planifiées
4. Modification éventuelle des chargements non encore expédiés
5. Consultation des chargements livrés pour archivage ou facturation

## 📦 Structure de la base de données

La base de données utilise PostgreSQL et est hébergée sur la plateforme [Supabase](https://supabase.com/).

Modèle conceptuel (MCD) :

![MCD de la base de donnée](https://i.imgur.com/H0oxjXX.png)

Tables définies dans la base :

- **clients** : Informations sur les clients (id UUID, nom TEXT, adresse TEXT)
- **transporteurs** : Entreprises de transport (id UUID, nom TEXT, contact TEXT)
- **produits** : Catalogue de produits disponibles (id UUID, reference TEXT, nom TEXT, description TEXT)
- **chargements** : Entêtes de chargement (id UUID, date_creation TIMESTAMP, date_depart TIMESTAMP, date_arrivee TIMESTAMP, client_id UUID, transporteur_id UUID)
- **chargement_produits** : Détails des produits par chargement (id UUID, chargement_id UUID, produit_id UUID, quantite NUMERIC)

## ⚙️ Architecture technique

- **Frontend** : Application Next.js utilisant l'App Router pour une architecture orientée serveur avec des composants React interactifs
- **Backend** : API Supabase pour les opérations CRUD avec politiques de sécurité
- **Interface utilisateur** : Composants shadcn/ui pour une UX cohérente et accessible
- **Logique métier** : Calcul automatique des statuts basé sur les dates, filtrage et tri côté client pour des interactions rapides

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

3. Créez un fichier `.env.local` avec vos identifiants Supabase :
```
NEXT_PUBLIC_SUPABASE_URL=votre-url-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon
```

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

## 🔐 Sécurité et accès

- L'application est conçue pour un usage interne uniquement
- L'authentification n'est pas encore implémentée mais peut être ajoutée facilement via Supabase Auth
- Les politiques RLS (Row Level Security) peuvent être configurées sur Supabase pour un contrôle d'accès plus fin

## 🔮 Évolutions futures

- Intégration d'un système de notifications pour les changements de statut
- Ajout de statistiques et de tableaux de bord analytiques
- Fonctionnalité d'impression des documents de transport
- Module de facturation automatique basé sur les livraisons effectuées
- Intégration avec d'autres systèmes de l'entreprise

## 📄 Licence

Ce projet est destiné à un usage interne pour Sudbois uniquement.

## Déploiement (Vercel)

1. Pusher le projet sur GitHub.
2. Importer le repo dans Vercel.
3. Dans les settings du projet Vercel, ajouter les variables d'environnement (mêmes que `.env.local`).
4. Déployer — Vercel détecte automatiquement Next.js.

## Améliorations futures

Le projet est conçu pour évoluer

### Distinction Transporteurs/Camions

La table `transports` à été rennomé en `transporteurs` pour clarifier sont rôle et permettre d'ajouter une table `camions` pour gérer en détails le transport de marchandise.

## Ressources

- Documentation Next.js : https://nextjs.org/docs
- Documentation Supabase : https://supabase.io/docs
- shadcn/ui : https://ui.shadcn.com/
- Tailwind CSS : https://tailwindcss.com/docs
