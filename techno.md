# Technologies utilisées — FasoStock

Liste des technologies de l’application et de leur rôle.

---

## Application web (frontend)

| Technologie | Rôle |
|-------------|------|
| **React** | Interface utilisateur (composants, rendu). |
| **TypeScript** | Typage statique du code JavaScript. |
| **Vite** | Build, dev server et optimisation des assets. |
| **React Router** | Routage et navigation (pages, liens). |
| **Tailwind CSS** | Styles (utility-first), responsive, thème. |
| **Radix UI** | Composants accessibles (dialogs, selects, toasts, etc.). |
| **TanStack React Query** | Données serveur (cache, requêtes, mutations). |
| **Zustand** | État global léger (si utilisé). |
| **React Hook Form** | Formulaires et validation. |
| **Zod** | Schémas et validation des données. |
| **date-fns** | Formatage et manipulation des dates. |
| **Recharts** | Graphiques (rapports, dashboard). |
| **Lucide React** | Icônes. |
| **Framer Motion** | Animations. |
| **Sonner** | Notifications toast. |
| **Vite PWA** | Progressive Web App (installable, offline). |

---

## Application mobile & bureau (Flutter)

| Technologie | Rôle |
|-------------|------|
| **Flutter / Dart** | Framework et langage de l’app mobile (Android) et bureau (Windows). |
| **go_router** | Navigation et routage. |
| **Provider** | État global (auth, entreprise, permissions). |
| **supabase_flutter** | Client Supabase (auth, base de données, storage). |
| **intl** | Formatage dates et devises. |
| **file_picker** | Sélection de fichiers (logo, images, import CSV). |
| **share_plus** | Partage / export (ex. CSV). |
| **fl_chart** | Graphiques (tableau admin). |
| **http** | Appels API (ex. prédictions IA). |
| **shared_preferences** | Stockage local (config Supabase, etc.). |
| **connectivity_plus** | Détection de la connexion réseau. |
| **sqflite** | Base SQLite locale (mode offline / cache). |
| **url_launcher** | Ouvrir liens, WhatsApp, téléphone. |
| **flutter_svg** | Affichage d’icônes SVG. |
| **Sentry** | Remontée d’erreurs en production. |

---

## Backend & données

| Technologie | Rôle |
|-------------|------|
| **Supabase** | Backend as a Service (auth, base, storage, functions). |
| **PostgreSQL** | Base de données (tables, vues, RLS). |
| **Supabase Auth** | Authentification (email/mot de passe, sessions). |
| **Supabase Storage** | Fichiers (logos boutiques, images produits). |
| **PostgREST** | API REST auto-générée sur la base. |
| **Edge Functions** | Fonctions serveur (Deno) : création d’utilisateurs, reset mot de passe, admin, etc. |
| **Row Level Security (RLS)** | Droits d’accès aux données par utilisateur/entreprise/boutique. |

---

## Outils & divers

| Technologie | Rôle |
|-------------|------|
| **ESLint** | Qualité et conventions du code (web). |
| **Vitest** | Tests unitaires (web). |
| **DeepSeek** | API externe pour les prédictions IA (optionnel). |
