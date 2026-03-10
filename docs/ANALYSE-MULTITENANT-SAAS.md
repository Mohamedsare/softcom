# Analyse architecture multi-tenant SaaS — FasoStock (React + Supabase)

## 1. Ce qui est correctement implémenté

### 1.1 Isolation des entreprises (multi-tenant)

- **Tables métier et `company_id`**  
  Toutes les tables métier sont bien rattachées à une entreprise ou à une boutique (elle-même liée à une entreprise) :
  - **company_id direct** : `companies`, `company_settings`, `user_company_roles`, `stores`, `store_increase_requests`, `categories`, `brands`, `products`, `suppliers`, `customers`, `sales`, `purchases`, `stock_transfers`, `audit_logs`, `notifications`, `ai_requests`, `ai_insights_cache`, `forecast_snapshots`.
  - **store_id uniquement** (store → company) : `store_inventory`, `stock_movements`, `stock_adjustments`, `inventory_sessions`, `cash_register_sessions` ; les tables enfants (sale_items, purchase_items, etc.) passent par la table parente qui a `company_id` et/ou `store_id`.

- **RLS activé partout**  
  Toutes les tables concernées ont `ENABLE ROW LEVEL SECURITY` (migrations 00001, 00002).

- **Policies cohérentes avec company/store**  
  - Accès basé sur `current_user_company_ids()` (membre actif de l’entreprise, avec `is_active = true` depuis la migration 00008).
  - Pour les données par boutique : `current_user_store_ids(company_id)` (assignation aux boutiques ou rôles owner/manager/super_admin).
  - Super admin : contournement explicite via `is_super_admin()` pour les tables métier et admin.

- **Hiérarchie company → stores**  
  - `stores.company_id` NOT NULL, FK vers `companies`, UNIQUE(company_id, code).
  - `user_store_assignments` lie user / store / company ; `current_user_store_ids(p_company_id)` restreint l’accès aux boutiques autorisées.

- **Contraintes et intégrité**  
  - FK systématiques (companies, stores, products, etc.) avec `ON DELETE CASCADE` ou `SET NULL` selon le cas.
  - NOT NULL sur les champs critiques (company_id, store_id où pertinent, statuts, montants).
  - CHECK sur prix ≥ 0, quantités ≥ 0, `from_store_id != to_store_id` pour les transferts.
  - UNIQUE utiles : (company_id, sale_number), (company_id, sku), (store_id, product_id) pour inventory, etc.

- **Soft delete sur les produits**  
  - `products.deleted_at` + `is_active` ; les listes filtrent avec `deleted_at IS NULL` ; suppression “logique” via UPDATE (migration 00001 + usage dans `productsApi.ts`).

- **Index pour la performance**  
  - Index sur `company_id` et/ou `store_id` sur les tables principales (companies, stores, products, sales, purchases, store_inventory, stock_movements, audit_logs, etc.).
  - Index sur `created_at` (sales, stock_movements, audit_logs), `status` où pertinent.
  - Index partiel sur `products(deleted_at) WHERE deleted_at IS NULL`.

- **Rôles et permissions en base**  
  - Tables `roles`, `permissions`, `role_permissions`, `user_company_roles` ; seed avec rôles (owner, manager, store_manager, cashier, etc.) et permissions (sales.create, products.delete, etc.).
  - Fonctions `has_permission(p_company_id, p_permission_key)` et `has_store_access(p_store_id, p_company_id)` présentes (SECURITY DEFINER).

- **Validation côté client et RLS**  
  - Les opérations critiques (ventes, stock, etc.) passent par Supabase avec le JWT utilisateur : RLS applique company_id / store_id sur SELECT, INSERT, UPDATE. Pas d’accès possible aux données d’une autre entreprise via les policies actuelles.

- **Admin et isolation**  
  - Fonctions admin (admin_list_users, admin_update_profile, admin_set_user_active, etc.) en SECURITY DEFINER avec vérification `is_super_admin()` ; pas d’accès admin sans ce rôle.

---

## 2. Ce qui manque

### 2.1 Permissions non appliquées côté backend

- **Problème** : `has_permission()` et `has_store_access()` ne sont **jamais utilisées** dans les policies RLS ni dans des RPC. Les policies se basent uniquement sur “appartenance à l’entreprise” et “accès aux boutiques” (current_user_company_ids / current_user_store_ids), pas sur la clé de permission (ex. `sales.create`, `products.delete`).
- **Conséquence** : Un utilisateur avec un rôle “lecture seule” (viewer) peut, en théorie, modifier/supprimer des données s’il devine les appels API, car RLS n’utilise pas les permissions.

### 2.2 Audit / logs non utilisés

- **Problème** : La table `audit_logs` existe (company_id, store_id, user_id, action, entity_type, entity_id, old_data, new_data) avec une policy INSERT permissive et SELECT par company, mais **aucun trigger ni code applicatif** n’écrit dedans.
- **Conséquence** : Aucune traçabilité des actions sensibles (création de vente, modification de stock, suppression logique de produit, etc.).

### 2.3 Validation métier côté serveur limitée

- **Ventes** : Création de vente en plusieurs appels (insert sale, insert items, insert payments, puis mises à jour `store_inventory` et `stock_movements`). Pas de RPC ou trigger unique qui :
  - vérifie le stock disponible avant de valider la vente,
  - garantisse l’atomicité (rollback si stock insuffisant),
  - génère un `sale_number` unique côté serveur (éviter les races).
- **Stock** : La décrémentation du stock est faite côté client (salesApi) ; pas de contrainte CHECK ou trigger empêchant un stock négatif de manière atomique avec la vente.
- **Suppression / édition** : Pas de vérification serveur basée sur les permissions (ex. seul un rôle avec `products.delete` peut soft-delete un produit) ; seule la RLS “company/store” s’applique.

### 2.4 Soft delete absent ailleurs

- **Produits** : Soft delete présent (`deleted_at`).
- **Autres entités** : Pas de `deleted_at` (ou équivalent) sur companies, stores, customers, suppliers, sales, etc. La suppression est définitive (ou non exposée). Pas d’archivage cohérent.

### 2.5 Contrôle d’accès sur les transferts de stock

- **Problème** : La policy sur `stock_transfers` ne vérifie que `company_id IN (SELECT * FROM current_user_company_ids())`. Elle ne vérifie pas que l’utilisateur a accès à `from_store_id` et `to_store_id` via `current_user_store_ids(company_id)`.
- **Conséquence** : Un utilisateur avec accès à une seule boutique peut, en théorie, créer ou modifier des transferts entre deux autres boutiques de la même entreprise.

### 2.6 Policy INSERT sur companies

- **Actuel** : `companies_insert` avec `WITH CHECK (true)` : tout utilisateur authentifié peut créer une entreprise.
- **Risque** : Abus possible (création en masse de companies) si pas de limite côté signup ou Edge Function. Souvent acceptable pour un self-signup, mais à garder en tête.

### 2.7 current_user_store_ids et is_active

- **Détail** : `current_user_company_ids()` filtre bien par `is_active = true` (migration 00008). La fonction `current_user_store_ids(p_company_id)` s’appuie sur `user_company_roles` sans filtrer explicitement par `is_active`. En pratique, un utilisateur désactivé n’a plus de company_id (donc plus de stores), mais pour une cohérence explicite, ajouter `AND ucr.is_active = true` dans la sous-requête sur `user_company_roles` dans `current_user_store_ids` est recommandé.

---

## 3. Risques potentiels

| Risque | Gravité | Description |
|--------|---------|-------------|
| Permissions non appliquées en RLS | Moyen | Un “viewer” ou un rôle restreint peut effectuer des mutations si le frontend est contourné. |
| Pas d’audit | Moyen | En cas d’erreur ou de litige, pas de preuve des actions (qui a créé/modifié/supprimé quoi). |
| Race condition sur vente + stock | Moyen | Deux ventes simultanées pour le même produit/boutique peuvent conduire à un stock incohérent ou négatif si pas de contrainte/trigger. |
| Transferts entre boutiques non contrôlés par store | Moyen | Création de transferts entre boutiques auxquelles l’utilisateur n’a pas accès. |
| Pas de validation serveur du stock à la vente | Moyen | Le client peut envoyer une quantité > stock ; la mise à jour du stock se fait après coup, sans rejet atomique. |
| Companies INSERT ouvert | Faible | Création illimitée de companies par tout utilisateur authentifié (DoS / abus). |

---

## 4. Améliorations recommandées

### 4.1 Court terme

1. **Renforcer les transferts de stock (RLS)**  
   Ajouter une condition sur les boutiques dans la policy des `stock_transfers` (et éventuellement `stock_transfer_items`) pour exiger que `from_store_id` et `to_store_id` soient dans `current_user_store_ids(company_id)` (sauf super_admin).

2. **Filtrer par is_active dans current_user_store_ids**  
   Dans la définition de `current_user_store_ids(p_company_id)`, dans la sous-requête sur `user_company_roles`, ajouter `AND ucr.is_active = true`.

3. **Documenter l’usage des variables**  
   Indiquer clairement que les permissions (has_permission) ne sont pas encore appliquées en RLS et que le contrôle fin (viewer vs manager) repose sur le frontend tant qu’aucune policy ou RPC ne les utilise.

### 4.2 Moyen terme

4. **RPC de création de vente atomique**  
   - Une RPC du type `create_sale(...)` qui :
     - vérifie company_id / store_id avec `current_user_store_ids(company_id)`,
     - vérifie le stock pour chaque ligne,
     - insère sale, sale_items, sale_payments,
     - met à jour store_inventory et insère stock_movements dans la même transaction,
     - génère le `sale_number` (séquence ou génération côté serveur).
   - Remplacer l’appel actuel (plusieurs inserts + updates depuis le client) par un seul appel à cette RPC.

5. **Utiliser les permissions dans les policies ou RPC**  
   - Soit : des policies RLS qui appellent `has_permission(company_id, 'permission.key')` pour les opérations sensibles (INSERT/UPDATE/DELETE sur sales, products, etc.).
   - Soit : des RPC métier (create_sale, update_product, delete_product_soft) qui vérifient `has_permission()` avant de faire les écritures. Les deux approches peuvent coexister (RLS pour lecture, RPC pour écriture + permission).

6. **Audit automatique**  
   - Triggers AFTER INSERT/UPDATE/DELETE sur les tables sensibles (sales, sale_items, store_inventory, products, stock_movements, etc.) qui insèrent une ligne dans `audit_logs` (company_id, store_id, user_id, action, entity_type, entity_id, old_data, new_data). Ou centraliser dans des RPC si toute écriture passe par elles.

### 4.3 Long terme

7. **Soft delete et archivage**  
   - Étendre le pattern `deleted_at` (ou `archived_at`) aux entités importantes (customers, suppliers, sales en “annulées”, etc.) et filtrer les listes par défaut sur `deleted_at IS NULL`. Prévoir des politiques RLS cohérentes pour les archives.

8. **Limiter la création de companies**  
   - Si le produit n’est plus en “open signup”, restreindre `companies_insert` (par ex. WITH CHECK (false) et créer les companies uniquement via une Edge Function ou RPC réservée au super_admin ou à un processus d’onboarding contrôlé).

9. **Contraintes et triggers anti-stock négatif**  
   - CHECK ou trigger sur `store_inventory` (ou sur une vue/materialized view) pour empêcher `quantity < 0`, ou garantir que toute modification du stock passe par une RPC qui vérifie les quantités avant mise à jour.

---

## 5. Synthèse

- **Points forts** : Modèle de données multi-tenant cohérent (company_id / store_id), RLS activé et policies basées sur company/store, hiérarchie company → stores claire, contraintes et index bien présents, soft delete sur products, rôles et permissions définis en base, isolation admin correcte.
- **Principaux manques** : Permissions non utilisées en backend, pas d’audit en base, pas de validation métier atomique pour les ventes et le stock, policy des transferts de stock trop large, pas de soft delete généralisé.
- **Risques principaux** : Contournement des rôles par les mutations, absence de traçabilité, incohérence ou stock négatif en concurrence, transferts entre boutiques non autorisées.
- **Priorités recommandées** : (1) Renforcer la policy des `stock_transfers` et `current_user_store_ids`, (2) RPC de vente atomique + génération de sale_number côté serveur, (3) mise en œuvre de l’audit par triggers ou RPC, (4) utilisation de `has_permission()` dans des RPC ou policies pour les opérations sensibles.
