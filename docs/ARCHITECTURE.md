# FasoStock — Architecture globale

## 1. Vue d'ensemble

Application SaaS multi-tenant (entreprise = tenant) : gestion stock, ventes, achats, clients, fournisseurs, caisse, transferts, reporting, prédictions IA.

- **Frontend** : React 18, Vite 6, TypeScript, React Router 6, TanStack Query, Zustand, React Hook Form + Zod.
- **Backend** : Supabase (Auth, PostgreSQL, RLS, Storage, Edge Functions/RPC si besoin).
- **IA** : API DeepSeek (prévisions, réappro, insights, anomalies, assistant).

---

## 2. Modules et périmètre

| Module | Périmètre |
|--------|-----------|
| **auth** | Inscription entreprise, login, reset password, profil, session, onboarding |
| **companies** | CRUD entreprise, paramètres, quota boutiques, demande augmentation |
| **stores** | CRUD boutiques, affectation users, boutique principale |
| **users** | Invitation, rôles, permissions, affectation boutiques, suspension |
| **products** | Catalogue, catégories, marques, SKU, code-barres, prix, images |
| **inventory** | Stock par boutique, mouvements, ajustements, inventaires |
| **sales** | POS, panier, paiements, reçus, annulations, retours |
| **purchases** | Commandes fournisseur, réception, statuts |
| **customers** | CRUD clients, historique, créances |
| **suppliers** | CRUD fournisseurs, historique achats |
| **transfers** | Transferts inter-boutiques (draft → approved → shipped → received) |
| **cash** | Sessions caisse, ouvertures/fermetures, mouvements |
| **reports** | Dashboards boutique + global, exports CSV/PDF |
| **ai** | DeepSeek : prévisions, réappro, insights texte, anomalies, assistant |
| **settings** | Paramètres entreprise, préférences |
| **super-admin** | Plateforme : entreprises, demandes quota, audit, suspensions |

---

## 3. Conventions

### 3.1 Code

- **Langage** : TypeScript strict.
- **Nommage** : camelCase (variables, fonctions), PascalCase (composants, types), UPPER_SNAKE pour constantes.
- **Fichiers** : kebab-case pour fichiers (e.g. `use-auth.ts`), PascalCase pour composants React (e.g. `LoginForm.tsx`).
- **Imports** : alias `@/` → `src/`. Pas d’imports relatifs profonds (éviter `../../../`).
- **Hooks** : préfixe `use` ; un hook par fichier.
- **Services** : un service par domaine (e.g. `authService`, `salesService`), dans `src/services/`.
- **Validation** : Zod pour schémas, React Hook Form pour formulaires.

### 3.2 Structure par feature

Chaque feature sous `src/features/<feature>/` peut contenir :

- `api/` — appels Supabase / hooks React Query
- `components/` — composants spécifiques à la feature
- `hooks/` — hooks métier
- `types.ts` — types locaux
- `constants.ts` — constantes
- `utils.ts` — helpers
- Pages dans `src/pages/` qui importent depuis la feature.

### 3.3 État global

- **Auth / tenant / permissions** : contexte + hooks dédiés (ex. `useAuth`, `useCurrentCompany`, `usePermissions`).
- **Données serveur** : TanStack Query (cache, invalidation).
- **UI légère** (sidebar ouverte/fermée, thème) : Zustand si besoin, ou contexte.

---

## 4. Flux d’authentification

1. **Non connecté** : accès uniquement à `/login`, `/register`, `/forgot-password`, `/reset-password`.
2. **Connexion** : Supabase Auth (email/password) → session.
3. **Post-login** : chargement du **profil** (`profiles`) et des **rattachements** (companies, rôles, boutiques) via RPC ou tables protégées RLS.
4. **Détermination du contexte** :
   - `user` (Supabase Auth)
   - `profile` (profiles)
   - `companies` + `currentCompanyId` (entreprise choisie)
   - `stores` accessibles pour cette entreprise (selon `user_store_assignments` et rôle)
   - `permissions` dérivées des rôles + éventuelles permissions utilisateur
5. **Super admin** : si `profile.role` ou table dédiée indique super_admin, accès aux routes `/admin/*` et bypass tenant (côté backend via RLS).
6. **Onboarding** : si entreprise sans boutique ou sans configuration minimale → redirection vers `/onboarding`.
7. **Déconnexion** : Supabase `signOut`, purge du contexte, redirection `/login`.

---

## 5. Flux multi-tenant

- **Tenant** = une **company** (entreprise).
- Chaque requête métier est scopée par `company_id` (et `store_id` quand applicable).
- **Côté frontend** :
  - Sélecteur d’entreprise (si plusieurs companies pour l’utilisateur) → `currentCompanyId` en état/context.
  - Sélecteur de boutique (si plusieurs stores) → `currentStoreId` pour les écrans boutique.
- **Côté backend** : RLS impose que les lignes lues/modifiées appartiennent à la company (et store) autorisée.
- **Isolation** : aucune API ni requête ne doit exposer des données d’une autre company ; les policies RLS sont la seule source de vérité.

---

## 6. Stratégie RLS (Supabase)

### 6.1 Principes

- RLS activé sur toutes les tables métier.
- Pas d’accès par défaut : chaque table a des policies explicites SELECT/INSERT/UPDATE/DELETE.

### 6.2 Fonctions utilitaires (à créer en SQL)

- **`auth.uid()`** : utilisé partout pour l’utilisateur courant.
- **`current_user_company_ids()`** : retourne les `company_id` auxquels l’utilisateur est rattaché (via `user_company_roles` ou équivalent).
- **`current_user_store_ids(company_id)`** : retourne les `store_id` accessibles pour cette company (via `user_store_assignments` ; si rôle company-wide, tous les stores de la company).
- **`is_super_admin()`** : vrai si l’utilisateur a le rôle super_admin (table dédiée ou champ sur profil).
- **`has_permission(permission_key)`** : vrai si le rôle (ou permissions utilisateur) de l’utilisateur inclut cette permission.
- **`has_store_access(store_id, company_id)`** : vrai si l’utilisateur peut accéder à cette boutique dans cette company.

### 6.3 Policies types

- **Lecture** : `company_id IN (SELECT * FROM current_user_company_ids())` et, si table store-scopée, `store_id IN (SELECT * FROM current_user_store_ids(company_id))` ou équivalent. Super admin : lecture globale.
- **Écriture** : même scope + vérification `has_permission(...)` si nécessaire (ex. `sales.create` pour insérer dans `sales`).
- **Tables plateforme** (ex. `store_increase_requests`) : création par owner/admin company ; lecture/update par super_admin pour approbation.
- **Audit** : écriture restreinte (trigger ou service), lecture selon rôle (company ou super admin).

---

## 7. Stratégie rôles et permissions

### 7.1 Modèle

- **roles** : table des rôles (super_admin, owner, manager, store_manager, cashier, stock_manager, accountant, viewer).
- **permissions** : table des permissions (ex. `company.manage`, `stores.create`, `sales.create`, `stock.transfer`).
- **role_permissions** : N–N entre rôle et permission.
- **user_company_roles** : (user_id, company_id, role_id) — rôle d’un utilisateur dans une entreprise.
- **user_store_assignments** : (user_id, store_id, company_id) — boutiques accessibles pour un user dans une company (optionnel si rôle donne accès à toutes les boutiques).

### 7.2 Règles

- Un utilisateur peut avoir un rôle par company. Un même user peut être dans plusieurs companies avec des rôles différents.
- Les permissions par défaut viennent du rôle. Possibilité d’override par utilisateur (table `user_permissions` optionnelle) pour affiner.
- Côté frontend : guard `hasPermission('sales.create')` et `hasStoreAccess(storeId)` pour afficher/masquer ou rediriger.
- Côté backend : RLS + `has_permission()` (ou équivalent en SQL) pour autoriser les mutations.

### 7.3 Hiérarchie rapide

- **Super Admin** : tout (plateforme).
- **Owner / Admin entreprise** : tout dans sa company + demande augmentation boutiques.
- **Manager** : selon permissions, éventuellement plusieurs boutiques.
- **Store Manager** : une ou plusieurs boutiques assignées.
- **Caissier / Magasinier / Comptable / Viewer** : selon permissions et affectation boutique.

---

## 8. Arborescence du projet

```
c:\SOFCOM\
├── docs/
│   └── ARCHITECTURE.md
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── src/
│   ├── app/                 # Bootstrap app, router
│   ├── routes/              # Définitions routes, lazy load
│   ├── pages/               # Pages (une par route/écran)
│   ├── components/          # Composants partagés (ui, layout, guards)
│   ├── features/
│   │   ├── auth/
│   │   ├── companies/
│   │   ├── stores/
│   │   ├── users/
│   │   ├── products/
│   │   ├── inventory/
│   │   ├── sales/
│   │   ├── purchases/
│   │   ├── customers/
│   │   ├── suppliers/
│   │   ├── transfers/
│   │   ├── cash/
│   │   ├── reports/
│   │   ├── ai/
│   │   ├── settings/
│   │   └── super-admin/
│   ├── lib/                 # Supabase client, helpers
│   ├── services/            # Services métier / API
│   ├── hooks/               # Hooks globaux
│   ├── context/             # Auth, Company, Theme, etc.
│   ├── store/               # Zustand stores si besoin
│   ├── utils/
│   ├── types/               # Types globaux
│   ├── constants/
│   └── assets/
├── public/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── .env.example
```

---

## 9. Sécurité (rappel)

- Validation côté client (Zod) + côté serveur (contraintes SQL, RLS, éventuellement Edge Functions).
- Aucune donnée sensible en clair ; mots de passe gérés par Supabase Auth.
- Audit log pour actions critiques (création boutique, demande quota, approbation, ventes annulées, ajustements stock, etc.).
- Limitation des appels IA (quota, logs) pour coûts et abus.

---

*Document de référence pour les étapes 2 à 6. À mettre à jour si décisions d’architecture évoluent.*
