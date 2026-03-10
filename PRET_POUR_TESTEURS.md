# Prêt pour faire tester l’app

Checklist pour que des testeurs puissent utiliser FasoStock (web + app installable).

---

## 1. Déployer le frontend (obligatoire)

- **Où** : Vercel (ou autre hébergeur avec HTTPS).
- **Build** : `npm run build` (déjà configuré dans `vercel.json`).
- **Variables d’environnement** à définir dans le projet Vercel (Settings → Environment Variables) :

  | Variable | Description |
  |----------|-------------|
  | `VITE_SUPABASE_URL` | URL du projet Supabase (ex. `https://xxxxx.supabase.co`) |
  | `VITE_SUPABASE_ANON_KEY` | Clé **anon** du même projet (Dashboard Supabase → Project Settings → API) |
  | `VITE_APP_URL` | URL de l’app déployée (ex. `https://votre-app.vercel.app`) — utile pour les emails / redirections |

- **Optionnel** (prédictions IA) : `VITE_DEEPSEEK_API_KEY` avec votre clé DeepSeek.

Après avoir ajouté ou modifié les variables, **redéployer** (Deployments → … → Redeploy).

---

## 2. Supabase (projet hébergé)

- **Même projet** que celui dont vous avez mis l’URL et la clé anon dans Vercel.
- **Migrations** : toutes les migrations du dossier `supabase/migrations/` doivent être appliquées sur ce projet (Dashboard → SQL Editor ou `supabase db push`).
- **Auth – URLs de redirection** :  
  Dashboard Supabase → **Authentication** → **URL Configuration** :
  - **Site URL** : l’URL de votre app (ex. `https://votre-app.vercel.app`).
  - **Redirect URLs** : ajouter la même URL (et éventuellement `http://localhost:5173` pour le dev).

Sans ça, la connexion / réinitialisation de mot de passe peut échouer après le redirect.

---

## 3. Edge Functions (si vous les utilisez)

- **Fonctions** : `create-company-user`, `reset-user-password` (ou autres que vous appelez).
- **Déploiement** : `supabase functions deploy` (avec le projet lié).
- **Secrets** : si vos fonctions utilisent des secrets (ex. `CREATE_SUPER_ADMIN_SECRET`), les définir dans Dashboard → Edge Functions → Secrets (ou `supabase secrets set ...`).
- **Config** : dans `supabase/config.toml`, `verify_jwt` est à `false` pour ces deux fonctions ; après toute modification de la config, redéployer les fonctions.

Voir aussi `DEPLOY_FUNCTIONS.md` s’il existe dans le repo.

---

## 4. Premier compte et super admin (optionnel)

- **Créer une entreprise** : un testeur peut s’inscrire via l’app (page d’inscription) ; la première entreprise et la première boutique (code B1) sont créées automatiquement.
- **Super admin** : si vous utilisez la page `/create-super-admin`, il faut que le secret (côté script / Edge Function) soit cohérent et que l’URL soit autorisée.

---

## 5. Test rapide avant de donner l’accès aux testeurs

1. Ouvrir l’URL de production (ex. `https://votre-app.vercel.app`) — vous devez arriver sur la **page de connexion**.
2. Créer un compte (ou se connecter) et vérifier que le **dashboard** et au moins une **boutique** s’affichent.
3. Tester l’**installation** (PWA) : sur Chrome/Edge, menu ou bandeau « Installer » ; sur mobile, « Ajouter à l’écran d’accueil ». Rouvrir l’app via l’icône → vous devez revenir sur la **connexion** puis le dashboard.

---

## 6. Donner l’accès aux testeurs

- **URL** : `https://votre-app.vercel.app` (à remplacer par votre URL réelle).
- **Installation** : leur indiquer qu’ils peuvent installer l’app (voir `INSTALL_APP.md`).
- En cas de **données vides** (pas d’entreprise, pas de boutique) : utiliser le guide `supabase/TROUBLESHOOTING_DATA.md` (URL/clé, projet, RLS, migrations).

---

## Résumé

| Étape | À faire |
|-------|--------|
| 1 | Déployer sur Vercel avec `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_URL` |
| 2 | Appliquer les migrations Supabase et configurer Site URL + Redirect URLs dans Auth |
| 3 | Déployer les Edge Functions et configurer les secrets si besoin |
| 4 | Tester vous-même : connexion, dashboard, installation PWA |
| 5 | Partager l’URL (+ `INSTALL_APP.md` si vous voulez qu’ils installent l’app) |

Une fois ces points ok, l’app est prête à être testée.
