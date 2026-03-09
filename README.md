# FasoStock

SaaS multi-tenant de gestion de stock, ventes, achats, clients, fournisseurs, caisse, transferts, reporting et prédictions IA.

## Stack

- **Frontend** : React 18, Vite 6, TypeScript, React Router 6, TanStack Query, Zustand, React Hook Form + Zod
- **Backend** : Supabase (Auth, PostgreSQL, RLS, Storage)
- **IA** : API DeepSeek (prévisions, insights)

## Prérequis

- Node.js 18+
- Compte Supabase

## Installation

```bash
npm install
cp .env.example .env
# Renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env
```

## Lancer en dev

```bash
npm run dev
```

Ouvre [http://localhost:5173](http://localhost:5173).

## Base de données (Supabase)

1. Créer un projet Supabase et récupérer l’URL et la clé anon.
2. Exécuter les migrations dans l’ordre :
   - 00001_initial_schema.sql
   - 00002_rls_and_functions.sql
   - 00003_fix_companies_rls.sql
   - 00004_rpc_create_company_with_owner.sql
   - 00005_store_extra_fields.sql
   - 00006_store_logos_bucket.sql (bucket Storage pour logos)
3. Optionnel : exécuter le seed `supabase/seed.sql` (après avoir créé au moins un utilisateur dans Auth et l’avoir rattaché à une company via `user_company_roles`).

## Build

```bash
npm run build
npm run preview  # prévisualisation du build
```

## Tests

```bash
npm run test       # une fois
npm run test:watch # mode watch
```

## Structure

- `docs/` — Architecture et schéma
- `supabase/migrations/` — Schéma SQL et RLS
- `src/features/` — Modules métier (auth, companies, stores, products, sales, …)
- `src/context/` — Auth, Company
- `src/components/guards/` — RequireAuth, RequirePermission

Voir `docs/ARCHITECTURE.md` pour l’architecture détaillée.
