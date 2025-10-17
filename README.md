# Sudbois — Gestion des chargements

Outil interne pour créer et suivre des chargements de marchandises : clients, transporteurs et produits sont liés aux chargements stockés dans une base PostgreSQL (hébergée sur Supabase).

## Cahier des charges

Technologies imposées :

- Next.js
- Supabase (base de données)
- shadcn/ui
- TypeScript
- Tailwind CSS

Fonctionnalités principales :

1. Page « Chargements »
	- Liste les chargements existants depuis Supabase
	- Bouton « ➕ Nouveau chargement » pour en créer un nouveau

2. Formulaire « Nouveau chargement »
	- Sélectionner un client (liste alimentée depuis la table `clients`)
- Sélectionner un transporteur (liste alimentée depuis la table `transporteurs`)
- Ajouter une ou plusieurs lignes de produits (liste alimentée depuis la table `produits`)
	- Enregistrer : créer l'entrée dans `chargements` et les lignes dans `chargement_produits`

3. Sauvegarde en base
	- Table `chargements` pour l'entête du chargement
	- Table `chargement_produits` pour les produits associés

## Démarche de développement

### Base de données
La base de donnée doit utiliser PostgreSQL et être hébergée sur la plateforme [Supabase](https://supabase.com/).

Modèle conceptuel (MCD) :

![MCD de la base de donnée](https://i.imgur.com/PGtkQfN.png)

Tables définies dans la base :

- `clients` (id UUID, nom TEXT, adresse TEXT)
- `transporteurs` (id UUID, nom TEXT, contact TEXT)
- `produits` (id UUID, reference TEXT, nom TEXT, description TEXT)
- `chargements` (id UUID, date_creation TIMESTAMP, client_id UUID, transporteur_id UUID)
- `chargement_produits` (id UUID, chargement_id UUID, produit_id UUID, quantite NUMERIC)

### Flux et contraintes

- Lors de la création d'un chargement, vérifier la présence du client et du transporteur sélectionnés.
- Permettre l'ajout dynamique de lignes produits (quantité obligatoire > 0).
- Tout l'enregistrement du chargement et des lignes doit être fait en une transaction côté serveur pour garantir la cohérence.

### Choix d'implémentation (proposition)

- Pages/Routes : utiliser la structure `app/` de Next.js (app router) avec une page principale `/chargements`.
- UI : composants `shadcn/ui` + Tailwind pour la mise en forme.
- Accès données : clients, transports et produits lus en lecture pour remplir les selects. Enregistrement via une API route (server action ou API route) qui appelle Supabase (ou RPC) pour insérer la transaction.

## Installation et exécution locale

1. Cloner le dépôt :

```bash
git clone https://github.com/votre-compte/sudbois-chargements.git
cd sudbois-chargements
```

2. Installer les dépendances :

```bash
npm install
# ou
pnpm install
```

3. Créer un fichier `.env.local` à la racine et y ajouter :

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # optionnel pour actions server-side
```

4. Lancer le serveur de développement :

```bash
npm run dev
# ou
pnpm dev
```

5. Ouvrir http://localhost:3000

## Configuration Supabase (schéma rapide)

1. Créer un projet PostgreSQL sur Supabase.
2. Créer les tables listées plus haut (`clients`, `transporteurs`, `produits`, `chargements`, `chargement_produits`).
3. Ajouter éventuellement des politiques RLS selon le besoin. Pour le développement local, vous pouvez désactiver RLS temporairement.
4. Récupérer l'URL et la clé anonyme dans Settings → API et les placer dans `.env.local`.

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
