# Transferts de stock entre boutiques — Spécification pour implémentation

Document de référence pour implémenter plus tard le module **Transferts** (stock entre boutiques). À consulter avant de coder.

---

## 1. État actuel (déjà en place)

### Schéma base de données

- **Type** `transfer_status` :  
  `'draft' | 'pending' | 'approved' | 'shipped' | 'received' | 'rejected' | 'cancelled'`

- **Table** `stock_transfers`  
  - `id`, `company_id`, `from_store_id`, `to_store_id`  
  - `status` (transfer_status, défaut `'draft'`)  
  - `requested_by`, `approved_by`, `shipped_at`, `received_at`, `received_by`  
  - `created_at`, `updated_at`  
  - Contrainte : `from_store_id != to_store_id`

- **Table** `stock_transfer_items`  
  - `transfer_id`, `product_id`  
  - `quantity_requested` (> 0)  
  - `quantity_shipped` (défaut 0, >= 0)  
  - `quantity_received` (défaut 0, >= 0)

### RLS

- `stock_transfers` : accès si `company_id IN current_user_company_ids()` (ou super admin).
- `stock_transfer_items` : accès via le transfert (même condition sur `company_id`).

### App

- **Route** : `/transfers` → `TransfersPage`.
- **Menu** : lien « Transferts » (icône ArrowLeftRight).
- **Permission** : `stock.transfer` (constante `permissions.stock_transfer`). Rôles seed : manager, store_manager, stock_manager.
- **Page** : `src/pages/TransfersPage.tsx` affiche uniquement « Module transferts — à venir. »

### Mouvements de stock

- Les types `transfer_out` et `transfer_in` existent déjà dans `stock_movement_type` et sont affichés dans l’historique Stock (InventoryPage) sous les libellés « Transfert sortie » / « Transfert entrée ».

---

## 2. Workflow cible (à implémenter)

1. **draft** — Création du transfert : boutique d’origine, boutique de destination, lignes (produit + quantité demandée). Pas encore de mouvement de stock.
2. **pending** — Envoi pour validation (optionnel selon règles métier : soit passage direct draft → approved, soit approbation par un rôle).
3. **approved** — Validé. Toujours pas de mouvement de stock.
4. **shipped** — Expédition :  
   - Décrementer le stock de la boutique d’origine pour chaque ligne (atomique).  
   - Enregistrer les mouvements `transfer_out`.  
   - Renseigner `quantity_shipped` (et `shipped_at`, `approved_by` si besoin).
5. **received** — Réception :  
   - Incrémenter le stock de la boutique de destination (atomique).  
   - Enregistrer les mouvements `transfer_in`.  
   - Renseigner `quantity_received`, `received_at`, `received_by`.

Variantes possibles :  
- Réception partielle : autoriser `quantity_received` < `quantity_shipped` et gérer les écarts.  
- Annulation : `rejected` ou `cancelled` à différentes étapes, sans toucher au stock (sauf si déjà `shipped` → à définir : annulation après expédition = retour stock origine ou non).

---

## 3. Points critiques (comme ventes / achats)

### Atomicité stock

- **À l’expédition (shipped)** : pour chaque ligne, décrémenter `store_inventory` de `from_store_id` avec une condition du type `quantity >= quantity_shipped` (et gérer « stock insuffisant »).
- **À la réception (received)** : pour chaque ligne, incrémenter `store_inventory` de `to_store_id` (INSERT ou UPDATE type achats).

Recommandation : **RPC PostgreSQL** (comme `create_sale_with_stock`, `confirm_purchase_with_stock`) pour :

- `ship_transfer(p_transfer_id uuid, p_user_id uuid)`  
  - Vérifier statut = approved (ou draft si pas d’étape approbation).  
  - Pour chaque ligne : `UPDATE store_inventory SET quantity = quantity - quantity_requested WHERE store_id = from_store AND product_id = ... AND quantity >= quantity_requested`.  
  - Si une ligne échoue → rollback + erreur « Stock insuffisant pour produit X ».  
  - Insérer `stock_movements` (type `transfer_out`), mettre à jour `quantity_shipped`, `shipped_at`, `status = 'shipped'`.

- `receive_transfer(p_transfer_id uuid, p_user_id uuid)`  
  - Vérifier statut = shipped.  
  - Pour chaque ligne : entrée stock sur `to_store_id` (INSERT / ON CONFLICT DO UPDATE).  
  - Insérer `stock_movements` (type `transfer_in`), mettre à jour `quantity_received`, `received_at`, `received_by`, `status = 'received'`.

Créer ces RPC dans une migration dédiée (ex. `00025_transfer_ship_receive_atomic.sql` ou similaire).

### Droits par boutique

- Expédition : utilisateur avec accès à `from_store_id` (ou droit global transfert).  
- Réception : utilisateur avec accès à `to_store_id` (ou droit global).  
- Vérifier dans l’app avec `current_user_store_ids(company_id)` et permission `stock.transfer`.

---

## 4. API / Front à prévoir

### API (ex. `src/features/transfers/api/transfersApi.ts`)

- `list(companyId, filters?)` — liste des transferts (avec from_store, to_store, statut, dates).
- `get(id)` — détail + `stock_transfer_items` (avec noms produits).
- `create(input, userId)` — création en draft (from_store_id, to_store_id, items[] { product_id, quantity_requested }).
- `submit(id)` ou `updateStatus(id, 'pending' | 'approved')` — selon workflow choisi.
- `approve(id, userId)` — draft/pending → approved (optionnel).
- `ship(id, userId)` — appeler RPC `ship_transfer` (approved → shipped + sortie stock).
- `receive(id, userId)` — appeler RPC `receive_transfer` (shipped → received + entrée stock).
- `cancel(id)` — passage en `cancelled` (ou `rejected`) si pas encore shipped (ou gérer cas « déjà shipped »).

### UI (TransfersPage + composants)

- **Liste** : tableau/filtres (statut, boutique origine/destination, période). Colonnes : référence, origine, destination, statut, date, actions.
- **Création** : formulaire (sélection from_store, to_store, lignes produit + quantité). Bouton « Enregistrer (brouillon) » puis éventuellement « Envoyer ».
- **Détail** : lecture + actions selon statut :  
  - draft : Modifier, Envoyer, Annuler  
  - pending : Approuver, Rejeter (si workflow avec approbation)  
  - approved : Expédier (si droit sur boutique origine)  
  - shipped : Réceptionner (si droit sur boutique destination)  
- Vérifier la permission `stock.transfer` pour afficher le menu et les actions (comme pour les autres modules).

---

## 5. Fichiers existants à réutiliser / modifier

- **Page** : `src/pages/TransfersPage.tsx` — remplacer le placeholder par la liste + filtres + lien vers détail/création.
- **Routes** : déjà en place (`/transfers`).
- **Menu** : déjà « Transferts » ; ajouter un filtre par permission `stock.transfer` si ce n’est pas déjà fait ailleurs.
- **Mouvements** : `src/features/inventory/utils/` ou libellés déjà dans InventoryPage pour `transfer_out` / `transfer_in` — rien à changer si les RPC insèrent correctement les `stock_movements`.

---

## 6. Checklist implémentation (pour plus tard)

- [ ] Migration : RPC `ship_transfer`, RPC `receive_transfer` (atomiques + stock_movements).
- [ ] Migration (optionnel) : RPC `create_transfer` si création + validation en une fois.
- [ ] API : `transfersApi` (list, get, create, ship, receive, cancel ; appels RPC pour ship/receive).
- [ ] TransfersPage : liste, filtres, bouton « Nouveau transfert ».
- [ ] Formulaire création : choix from_store, to_store, lignes (produit, quantité).
- [ ] Page ou drawer détail : affichage + boutons Expédier / Réceptionner / Annuler selon statut et droits.
- [ ] Gestion d’erreurs : « Stock insuffisant » à l’expédition (message clair avec nom produit si possible).
- [ ] Permission `stock.transfer` : affichage du lien Transferts et des actions selon le rôle.
- [ ] Realtime (optionnel) : invalider les requêtes inventory/transfers quand un transfert est expédié ou réceptionné (comme pour ventes/achats).

---

*Document à consulter avant d’implémenter le module Transferts.*
