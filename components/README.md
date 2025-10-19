# Refactorisation du code

## Objectif
Ce dossier contient les composants refactorisés pour améliorer la maintenabilité et la lisibilité du code.

## Structure
```
components/
├── chargements/
│   └── ChargementCard.tsx     - Carte d'affichage d'un chargement
├── forms/
│   └── NewChargementForm.tsx  - Formulaire de création/édition de chargement
├── manager/
│   ├── ClientManager.tsx       - Gestion des clients
│   ├── TransporteurManager.tsx - Gestion des transporteurs
│   └── ProduitManager.tsx      - Gestion des produits (à créer)
└── ui/
    └── (composants UI existants)
```

## Avantages de cette structure
1. **Séparation des responsabilités** : Chaque composant a une responsabilité unique
2. **Réutilisabilité** : Les composants peuvent être importés et utilisés ailleurs
3. **Maintenabilité** : Plus facile de localiser et modifier du code spécifique
4. **Testabilité** : Chaque composant peut être testé indépendamment

## Fichiers principaux avant/après
- `app/page.tsx` : ~1118 lignes → ~580 lignes
- `app/manager/page.tsx` : ~983 lignes → ~80 lignes

## Composants extract és

### ChargementCard
Affiche une carte de chargement avec les informations essentielles et un bouton pour voir les détails.

### NewChargementForm
Formulaire complet pour créer ou modifier un chargement, avec gestion des produits associés.

### ClientManager / TransporteurManager / ProduitManager
Gestion CRUD complète (Create, Read, Update, Delete) pour chaque type d'entité avec :
- Gestion des erreurs de contraintes FK
- Notifications utilisateur
- Dialogues de confirmation
