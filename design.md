# Design — FasoStock

Document de référence du design visuel et des technologies utilisées (sans décrire les fonctionnalités métier).

---

## 1. Typographie

- **Police principale** : `Inter`, avec repli sur `system-ui`, `-apple-system`, `sans-serif`.
- Définie dans `globals.css` sur `body`.
- Hiérarchie : titres en gras, texte secondaire et muted pour les labels / métadonnées.

---

## 2. Couleurs

### 2.1 Thème clair (light)

| Rôle | Variable CSS | Valeur / usage |
|------|--------------|----------------|
| Fond principal | `--bg-primary` | `#F8FAFC` (slate très clair) |
| Fond secondaire | `--bg-secondary` | `#FFFFFF` |
| Cartes | `--card-bg` | `rgba(255,255,255,0.9)` |
| Accent (CTA, liens actifs) | `--accent` | `#F97316` (orange) |
| Accent au survol | `--accent-hover` | `#EA580C` |
| Texte principal | `--text-primary` | `#0F172A` (slate foncé) |
| Texte secondaire | `--text-secondary` | `#475569` |
| Texte atténué | `--text-muted` | `#64748B` |
| Succès | `--success` | `#22C55E` |
| Danger / erreur | `--danger` | `#EF4444` |
| Avertissement | `--warning` | `#EAB308` |
| Bordures | `--border`, `--border-solid` | `#E2E8F0`, `#CBD5E1` |

### 2.2 Thème sombre (dark)

| Rôle | Variable CSS | Valeur / usage |
|------|--------------|----------------|
| Fond principal | `--bg-primary` | `#0F172A` |
| Fond secondaire | `--bg-secondary` | `#1E293B` |
| Cartes | `--card-bg` | `rgba(30,41,59,0.6)` |
| Texte principal | `--text-primary` | `#F8FAFC` |
| Texte secondaire | `--text-secondary` | `#94A3B8` |
| Bordures | `--border-solid` | `#334155` |

La sidebar utilise en plus des tons slate (`#1E293B`, `#0F172A`) et des bordures `slate-700/50`.

### 2.3 Accent global

- **Couleur d’accent** : orange (`orange-500` / `#F97316`, hover `orange-600` / `#EA580C`).
- Utilisée pour : boutons principaux, liens actifs, indicateurs de sélection (nav), badges d’action.
- En dark : `bg-orange-500/10 text-orange-500` pour l’élément actif.

### 2.4 Variables shadcn/Radix (`index.css`)

- Variables HSL pour `background`, `foreground`, `card`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`, `radius`, `sidebar-*`, `chart-1` à `chart-5`.
- Deux jeux : `:root` (light) et `.dark` (dark), utilisés par les composants UI (boutons, selects, toasts, etc.).

---

## 3. Espacements et rayons

- **Rayon de base** : `--radius: 0.5rem` ; variantes `md` et `sm` dérivées dans Tailwind.
- Cartes / panneaux : souvent `rounded-2xl` (1rem) ou `rounded-xl`.
- Boutons : `rounded-lg`, `rounded-xl` selon le contexte.
- Padding de contenu : `p-4`, `p-5` ; gaps : `gap-2`, `gap-3`, `gap-4`, `gap-6`.

---

## 4. Composants et patterns

- **Cartes** : fond `bg-white` / `bg-slate-800/50`, bordure `border-slate-200` / `border-slate-700/50`, `rounded-2xl`, ombre légère en light.
- **Boutons principaux** : `bg-orange-500 hover:bg-orange-600`, texte blanc.
- **Boutons secondaires** : `variant="outline"`, bordures slate.
- **Inputs** : `bg-slate-50` / `bg-slate-900` en dark, bordures slate.
- **Sidebar** : largeur `240px` (étendue) ou `72px` (replié), transition `duration-300`.
- **Breakpoint principal** : `lg` (1024px) pour passage layout desktop / mobile.

---

## 5. Animations

- **Transitions** : `transition-colors`, `transition-all`, `duration-300` sur thème et sidebar.
- **Keyframes** :
  - `slideUp` : opacité 0→1, `translateY(10px)` → `0`.
  - `fadeIn` : opacité 0→1.
  - `pulse-dot` : opacité pulsée.
- **Classes** : `animate-slide-up` (0.4s ease-out), `animate-fade-in` (0.3s ease-out).
- **Plugin** : `tailwindcss-animate` pour accordion et autres animations Radix.

---

## 6. Scrollbar et impression

- Scrollbar personnalisée : 6px, track `--bg-primary`, thumb `--border`, `border-radius: 3px`.
- Print : zone `.print-receipt` en 80mm, police 12px, reste de la page masqué.

---

## 7. Thème (mode clair / sombre)

- **Stockage** : `localStorage` clé `fasostock_theme` (`'light'` | `'dark'`).
- **Application** : classe `.dark` sur `document.documentElement` quand thème = `dark`.
- **Tailwind** : `darkMode: ["class"]` pour les variantes `dark:`.
- Transition globale sur `body` : `background-color` et `color` 0.25s.

---

## 8. Technologies utilisées

### 8.1 Core

- **React** 18
- **Vite** 6 (build et dev)
- **React Router** 6
- **JavaScript** (ES modules)

### 8.2 Styles

- **Tailwind CSS** 3
- **tailwindcss-animate**
- **PostCSS** / **Autoprefixer**
- **class-variance-authority** (CVA)
- **tailwind-merge** / **clsx**

### 8.3 Backend et données

- **Supabase** (JS client) : auth, base de données, storage

### 8.4 UI et composants

- **Radix UI** : Alert Dialog, Select, Dialog, Dropdown, Tabs, Toast, Tooltip, etc.
- **Lucide React** (icônes)
- **Recharts** (graphiques)
- **date-fns** (dates)
- **React Hook Form** + **Zod** (formulaires et validation)

### 8.5 État et outillage

- **TanStack React Query** (requêtes et cache)
- **Framer Motion** (animations avancées)
- **Vaul** (drawer)
- **cmdk** (command palette)
- **@hello-pangea/dnd** (drag and drop)

### 8.6 Export et édition

- **jsPDF** / **html2canvas**
- **React Quill** (éditeur riche)
- **React Leaflet** (cartes)
- **input-otp**

### 8.7 Autres

- **Stripe** (paiements)
- **canvas-confetti**
- **React Markdown**
- **sonner** / **react-hot-toast** (notifications)
- **next-themes** (gestion thème, présent en dépendance)

---

*Ce document ne décrit pas les fonctionnalités de l’application, uniquement le design visuel et la stack technique.*
