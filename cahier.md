

Tu es un **architecte logiciel senior**, **développeur full-stack expert**, spécialisé en **React.js**, **Supabase**, **PostgreSQL**, **multi-tenant SaaS**, **RBAC**, **gestion de stock**, **POS/vente**, **reporting**, **prévisions IA**, **sécurité**, **RLS**, **audit**, **offline-ready**, et **applications métier concrètes**.

Je veux que tu développes **de A à Z** une application SaaS professionnelle, robuste, évolutive et prête pour la production, appelée provisoirement :

# **FasoStock**

Un **SaaS multi-tenant de gestion de stock, ventes, achats, clients, fournisseurs, caisse, transferts, reporting et prédictions IA**.

## Contexte produit

Cette application est destinée à de vraies entreprises. Ce n’est pas un projet académique. C’est une solution concrète de gestion commerciale et de stock.
Chaque **entreprise** utilise la plateforme comme un **tenant indépendant**.
Chaque entreprise peut avoir **plusieurs boutiques**.
Par défaut, une entreprise peut créer **jusqu’à 3 boutiques**.
Si elle veut dépasser cette limite, elle doit **soumettre une demande**, et un **super admin** doit pouvoir **approuver ou rejeter** cette demande.

Chaque boutique est **opérationnellement indépendante**, mais une entreprise doit aussi avoir une **vue globale consolidée** de toutes ses boutiques.

L’application doit supporter plusieurs niveaux d’utilisateurs, avec permissions claires et sécurité forte.

Je ne veux **aucune discussion sur le design**.
Le design existe déjà.
Concentre-toi sur :

* l’architecture,
* les fonctionnalités,
* la base de données,
* la logique métier,
* la sécurité,
* l’intégration Supabase,
* l’intégration IA,
* les dashboards,
* les rôles,
* les workflows,
* les validations,
* les APIs,
* l’organisation du code,
* les pages,
* les composants,
* les hooks,
* les services,
* les tests,
* les migrations,
* le seed,
* et la production-ready app.

---

# 1. STACK TECHNIQUE IMPOSÉE

Utilise exactement cette stack, sauf si une amélioration technique est vraiment nécessaire et justifiée :

## Frontend

* React.js
* Vite
* React Router
* TanStack Query
* Zustand ou Context API bien structuré pour l’état global
* React Hook Form + Zod pour les formulaires et validation
* TypeScript de préférence. Si tu choisis JavaScript, structure extrêmement stricte obligatoire.
* Support PWA si pertinent
* Gestion fine des erreurs, loaders, états vides, permissions, guards

## Backend / BaaS

* Supabase

  * Auth
  * PostgreSQL
  * Row Level Security (RLS)
  * Storage
  * Realtime si utile
  * Edge Functions si nécessaire
  * RPC PostgreSQL si nécessaire
  * Cron / Scheduled jobs si nécessaire

## Intelligence artificielle

* API DeepSeek pour :

  * prévision de ventes,
  * suggestion de réapprovisionnement,
  * analyse des tendances,
  * interprétation textuelle des performances,
  * détection d’anomalies simples,
  * éventuellement assistant métier interne.

## Export / impression / reporting

* PDF
* CSV
* impression de reçus tickets
* génération de rapports

---

# 2. OBJECTIF GLOBAL DU SAAS

Créer une solution SaaS complète permettant à une entreprise de :

* gérer ses boutiques,
* gérer les utilisateurs et leurs rôles,
* gérer son catalogue produits,
* suivre les stocks par boutique,
* effectuer des ventes,
* gérer les achats / approvisionnements,
* gérer les mouvements de stock,
* gérer les clients et fournisseurs,
* suivre la caisse,
* suivre les paiements,
* consulter des dashboards détaillés,
* voir des rapports globaux entreprise + détaillés par boutique,
* recevoir des alertes de rupture ou stock faible,
* faire des transferts inter-boutiques,
* demander l’augmentation du nombre de boutiques,
* bénéficier d’analyses IA.

L’application doit être pensée pour un contexte business réel, notamment pour des PME/commerces en Afrique de l’Ouest, donc :

* simplicité métier,
* robustesse,
* rapidité,
* clarté des droits d’accès,
* support potentiel du mode offline partiel plus tard,
* gestion d’imprimantes tickets,
* multi-boutique réel,
* audit complet.

---

# 3. MULTI-TENANCY — RÈGLES ABSOLUES

Le système doit être **strictement multi-tenant**.

## Définition du tenant

Le tenant principal est **l’entreprise**.

Chaque entreprise possède :

* ses boutiques,
* ses utilisateurs,
* ses produits,
* ses stocks,
* ses ventes,
* ses achats,
* ses rapports,
* ses paramètres,
* ses abonnements éventuels,
* ses demandes administratives.

## Isolation stricte

Les données d’une entreprise ne doivent **jamais** être visibles par une autre entreprise.

Mettre en place une architecture de données propre avec :

* `company_id` sur toutes les tables métier nécessaires,
* éventuellement `store_id` selon le niveau d’isolation,
* RLS Supabase très stricte,
* policies sécurisées,
* accès par rôle.

## Hiérarchie

* **Super Admin plateforme** : voit tout, administre toute la plateforme
* **Entreprise / tenant**

  * peut avoir plusieurs boutiques
  * vue globale entreprise
* **Boutique**

  * entité opérationnelle propre
  * stock, ventes, caisse, opérations locales

---

# 4. NIVEAUX D’UTILISATEURS ET RBAC

Je veux un système de rôles très clair.

## 4.1 Super Admin Plateforme

C’est l’administrateur global du SaaS.
Il peut :

* voir toutes les entreprises,
* voir toutes les boutiques,
* voir toutes les demandes d’augmentation de boutiques,
* approuver/rejeter ces demandes,
* activer/suspendre une entreprise,
* activer/suspendre un utilisateur,
* gérer les quotas,
* voir les statistiques globales de la plateforme,
* consulter l’audit global,
* gérer les paramètres globaux,
* gérer les plans ou limitations,
* gérer les logs critiques,
* intervenir en support.

## 4.2 Owner / Admin Entreprise

C’est le responsable principal de l’entreprise.
Il peut :

* gérer son entreprise,
* voir dashboard global consolidé,
* créer jusqu’à 3 boutiques,
* soumettre une demande pour plus de boutiques,
* gérer les utilisateurs de l’entreprise,
* affecter les utilisateurs à une ou plusieurs boutiques,
* gérer les produits,
* voir rapports globaux,
* voir stocks globaux,
* autoriser certains transferts,
* gérer fournisseurs / clients / achats / ventes,
* consulter les prédictions IA de son entreprise.

## 4.3 Manager Entreprise

Peut avoir accès à plusieurs boutiques de l’entreprise selon permissions.
Il peut :

* consulter dashboard global ou partiel selon attribution,
* gérer ventes,
* gérer achats,
* gérer transferts,
* voir rapports,
* gérer certains utilisateurs opérationnels si autorisé,
* valider certaines opérations.

## 4.4 Responsable Boutique / Store Manager

Il gère une boutique précise.
Il peut :

* voir dashboard de sa boutique,
* gérer ventes de sa boutique,
* gérer stock de sa boutique,
* enregistrer achats locaux si autorisé,
* gérer transferts entrants/sortants selon règles,
* consulter clients de sa boutique,
* consulter fournisseurs liés,
* gérer caisse de la boutique,
* voir rapports de sa boutique.

## 4.5 Caissier / Vendeur

Il peut :

* créer des ventes,
* enregistrer paiements,
* imprimer ticket,
* voir les produits disponibles dans sa boutique,
* ouvrir/fermer caisse si autorisé,
* consulter son historique,
* ne pas modifier les paramètres critiques.

## 4.6 Gestionnaire Stock / Magasinier

Il peut :

* consulter les stocks,
* enregistrer entrées/sorties,
* faire inventaires,
* signaler pertes/casses,
* préparer transferts,
* gérer réceptions de commandes.

## 4.7 Comptable / Financier

Il peut :

* voir ventes,
* paiements,
* caisse,
* achats,
* rapports financiers,
* exports,
* pas forcément gérer le catalogue ou les stocks.

## 4.8 Utilisateur Lecture seule

Peut consulter certains dashboards/rapports sans modifier les données.

---

# 5. PERMISSIONS GRANULAIRES

Ne fais pas un simple système de rôles statique.
Ajoute aussi un système de permissions granulaires.

Exemples :

* `company.manage`
* `stores.create`
* `stores.request_extra`
* `stores.approve_extra`
* `products.create`
* `products.update`
* `products.delete`
* `sales.create`
* `sales.cancel`
* `sales.refund`
* `purchases.create`
* `stock.adjust`
* `stock.transfer`
* `reports.view_global`
* `reports.view_store`
* `users.manage`
* `settings.manage`
* `ai.insights.view`
* `cash.open_close`
* `audit.view`

Le rôle donne un ensemble par défaut, mais on peut affiner par utilisateur si nécessaire.

---

# 6. FONCTIONNALITÉS MÉTIER COMPLÈTES

## 6.1 Authentification

* inscription entreprise
* connexion
* mot de passe oublié
* vérification email si utile
* gestion profil utilisateur
* session sécurisée
* gestion des comptes suspendus
* onboarding entreprise

## 6.2 Création d’une entreprise

Lorsqu’une entreprise s’inscrit :

* création du tenant,
* création automatique du owner,
* création du quota initial de boutiques = 3,
* paramètres initiaux,
* éventuelle boutique principale par défaut.

## 6.3 Gestion des boutiques

* créer une boutique
* modifier une boutique
* activer / désactiver une boutique
* voir les boutiques de l’entreprise
* définir une boutique principale
* affecter des utilisateurs à une boutique
* limitation stricte à 3 boutiques par défaut

## 6.4 Demande d’augmentation du nombre de boutiques

Workflow obligatoire :

* l’entreprise soumet une demande :

  * nombre souhaité
  * justification
  * commentaire éventuel
* statut de la demande :

  * pending
  * approved
  * rejected
* le super admin reçoit / voit la demande
* le super admin peut approuver ou rejeter
* si approuvée :

  * quota augmenté
* historique complet des demandes

## 6.5 Gestion utilisateurs

* inviter un utilisateur
* créer un utilisateur
* affecter un rôle
* affecter des permissions
* lier à une ou plusieurs boutiques
* suspendre / réactiver
* voir activité récente
* journal d’actions

## 6.6 Catalogue produits

Chaque entreprise doit pouvoir gérer son catalogue.

Fonctionnalités :

* créer produit
* modifier produit
* activer/désactiver produit
* supprimer logiquement si nécessaire
* produit simple
* variantes si possible plus tard
* SKU / code interne
* code-barres
* catégorie
* marque
* unité
* prix d’achat
* prix de vente
* prix minimum éventuel
* stock minimum
* description
* image produit
* statut
* tags
* taxe éventuelle

Prévoir architecture extensible pour :

* variantes
* lots
* dates d’expiration
* serial numbers
* multi-unités

## 6.7 Catégories

* CRUD catégories
* hiérarchie simple si utile
* rattachement par entreprise

## 6.8 Fournisseurs

* CRUD fournisseurs
* coordonnées
* historique achats
* solde éventuel
* notes internes

## 6.9 Clients

* CRUD clients
* clients particuliers ou entreprises
* téléphone
* email
* adresse
* historique achats
* total dépensé
* créances éventuelles
* fidélité plus tard si besoin

## 6.10 Gestion du stock par boutique

Le stock doit être géré **par boutique**.
Le même produit peut avoir des quantités différentes selon les boutiques.

Fonctionnalités :

* stock courant
* stock réservé si pertinent
* stock disponible
* stock minimum
* alertes stock faible
* ajustement manuel
* motif d’ajustement
* historique de mouvement
* inventaire physique
* pertes/casses/vols/écarts

## 6.11 Mouvements de stock

Traçabilité obligatoire.
Chaque mouvement doit être historisé :

* entrée achat
* sortie vente
* ajustement
* transfert sortant
* transfert entrant
* retour vente
* annulation
* casse/perte
* inventaire correction

Créer une table de mouvements de stock très claire.

## 6.12 Achats / approvisionnements

* création commande fournisseur
* réception achat
* ajout au stock
* statut :

  * brouillon
  * validé
  * reçu partiellement
  * reçu
  * annulé
* prix d’achat
* quantité
* coût total
* paiements fournisseur
* reste à payer si nécessaire

## 6.13 Ventes / POS

Module central.

Fonctionnalités :

* vente rapide
* ajout produits au panier
* recherche par nom / SKU / code-barres
* calcul automatique du total
* remises
* taxes si configurées
* client optionnel
* enregistrement paiement
* plusieurs modes de paiement
* impression reçu
* statut de vente
* annulation vente selon permissions
* retour / remboursement selon permissions
* historique des ventes

## 6.14 Paiements

Gérer les paiements de vente :

* espèces
* mobile money
* carte
* virement
* mixte si nécessaire plus tard

Chaque paiement doit être historisé proprement.

## 6.15 Caisse

Par boutique :

* ouverture caisse
* fermeture caisse
* solde initial
* encaissements
* décaissements
* écart de caisse
* historique des sessions de caisse
* rapport de caisse journalier

## 6.16 Transferts inter-boutiques

Fonctionnalité essentielle.

Une entreprise doit pouvoir transférer du stock d’une boutique à une autre.

Workflow :

* création demande transfert
* boutique source
* boutique destination
* produits + quantités
* statut :

  * draft
  * pending
  * approved
  * shipped
  * received
  * rejected
  * cancelled
* impact stock source et destination au bon moment
* audit complet
* permissions selon rôle

## 6.17 Inventaires

* lancer un inventaire pour une boutique
* compter physiquement
* comparer stock théorique / réel
* appliquer ajustement
* générer rapport d’écarts
* historiser le résultat

## 6.18 Alertes et notifications

* stock faible
* rupture
* demande de boutiques en attente
* transferts en attente
* ventes anormales
* écarts d’inventaire
* activité suspecte
* erreurs critiques

Prévoir système de notifications internes.

## 6.19 Reporting et dashboards

Deux niveaux absolument distincts :

### Niveau Boutique

* chiffre d’affaires boutique
* ventes du jour / semaine / mois
* top produits
* produits faibles
* évolution stock
* caisse
* achats récents
* mouvements récents

### Niveau Entreprise global consolidé

* chiffre d’affaires total entreprise
* comparaison entre boutiques
* stock global
* ventes consolidées
* meilleures boutiques
* produits les plus vendus globalement
* achats consolidés
* alertes globales
* tendance globale

## 6.20 Audit log

Très important.
Journaliser les actions critiques :

* connexion
* création boutique
* demande augmentation quota
* approbation / rejet
* création utilisateur
* changement rôle
* vente annulée
* ajustement stock
* transfert
* suppression logique
* modification paramètres
* usage IA
* export de données critiques

---

# 7. IA DEEPSEEK — CAS D’USAGE CONCRETS

Intègre DeepSeek API intelligemment, pas comme gadget.

## 7.1 Prévision des ventes

Pour chaque produit, boutique ou entreprise :

* prédire ventes futures à court terme
* tendance 7 jours / 30 jours / 90 jours
* utiliser historique ventes

## 7.2 Suggestion de réapprovisionnement

L’IA doit pouvoir dire :

* quels produits risquent de manquer
* dans quelle boutique
* estimation de date de rupture
* quantité suggérée à recommander

## 7.3 Analyse textuelle métier

Générer des insights rédigés automatiquement, par exemple :

* “La boutique A a connu une hausse de 18% des ventes cette semaine”
* “Le produit X est en forte rotation”
* “Le stock du produit Y sera probablement épuisé dans 5 jours”
* “La boutique B sous-performe par rapport à la moyenne de l’entreprise”

## 7.4 Détection d’anomalies simples

Exemples :

* chute brutale de ventes
* explosion inhabituelle d’un produit
* trop de corrections de stock
* trop d’annulations de vente
* activité suspecte d’un utilisateur

## 7.5 Assistant métier interne

Créer un assistant IA qui répond à des questions du style :

* “Quels sont mes produits les plus vendus ce mois ?”
* “Quelle boutique performe le mieux ?”
* “Quels articles dois-je réapprovisionner ?”
* “Montre-moi les ventes de la semaine dernière”
* “Pourquoi la boutique X baisse ?”

L’assistant ne doit pas inventer les données.
Il doit s’appuyer uniquement sur les données réelles de l’entreprise connectée.

## 7.6 Architecture IA

Prévoir :

* service dédié `aiService`
* logs d’appel IA
* gestion des erreurs API
* fallback propre
* limitation de coûts
* prompts internes bien structurés
* possibilité future de remplacer DeepSeek par un autre fournisseur

---

# 8. MODÈLE DE DONNÉES — CONCEPTION ATTENDUE

Conçois un schéma PostgreSQL propre, normalisé et évolutif.
Je veux les tables essentielles suivantes au minimum, avec relations claires.

## Tables plateforme / sécurité

* profiles
* companies
* company_settings
* company_store_quota
* store_increase_requests
* roles
* permissions
* role_permissions
* user_company_roles
* user_store_assignments
* audit_logs
* notifications

## Tables boutiques

* stores

## Catalogue

* categories
* brands
* products
* product_images
* product_store_settings si nécessaire
* product_prices si besoin d’évolution

## Stock

* store_inventory
* stock_movements
* stock_adjustments
* inventory_sessions
* inventory_session_items

## Ventes

* sales
* sale_items
* sale_payments
* sale_returns
* sale_return_items

## Caisse

* cash_register_sessions
* cash_movements

## Achats

* suppliers
* purchases
* purchase_items
* purchase_payments

## Clients

* customers

## Transferts

* stock_transfers
* stock_transfer_items

## IA / analytique

* ai_requests
* ai_insights_cache si utile
* forecast_snapshots si utile

Ajoute les colonnes nécessaires :

* `id`
* `company_id`
* `store_id` quand pertinent
* timestamps
* created_by / updated_by si utile
* soft delete si pertinent
* status
* notes

Je veux :

* schéma SQL
* migrations Supabase
* contraintes
* index
* foreign keys
* checks
* enums utiles

---

# 9. RLS SUPABASE — EXIGENCE CRITIQUE

Mets en place des politiques RLS solides.

Objectifs :

* un utilisateur ne voit que les données de son entreprise
* un utilisateur limité à certaines boutiques ne voit que ces boutiques
* le super admin a un accès global sécurisé
* certaines actions ne sont possibles que selon rôle/permission

Je veux une approche propre avec :

* fonctions SQL utilitaires si nécessaire, par exemple :

  * récupérer `current_user_company_ids`
  * vérifier `has_permission`
  * vérifier `is_super_admin`
  * vérifier accès à une boutique
* policies par table bien pensées

Exemples :

* lecture ventes : seulement même entreprise + boutique autorisée
* création vente : seulement utilisateur autorisé sur boutique ciblée
* demande quota boutique : seulement owner/admin entreprise
* approbation quota : super admin seulement

---

# 10. STRUCTURE DU PROJET FRONTEND

Organise le projet de manière professionnelle.

Exemple attendu :

* `src/app`
* `src/routes`
* `src/pages`
* `src/components`
* `src/features/auth`
* `src/features/companies`
* `src/features/stores`
* `src/features/users`
* `src/features/products`
* `src/features/inventory`
* `src/features/sales`
* `src/features/purchases`
* `src/features/customers`
* `src/features/suppliers`
* `src/features/transfers`
* `src/features/reports`
* `src/features/ai`
* `src/features/settings`
* `src/lib`
* `src/services`
* `src/hooks`
* `src/context`
* `src/store`
* `src/utils`
* `src/types`
* `src/constants`

Je veux une architecture modulaire par feature.

---

# 11. PAGES À DÉVELOPPER

Crée toutes les pages métier nécessaires.

## Public / Auth

* Login
* Register company
* Forgot password
* Reset password

## Onboarding

* Setup entreprise
* Création première boutique
* Configuration initiale

## Entreprise

* Dashboard global entreprise
* Gestion boutiques
* Détail boutique
* Demandes augmentation boutiques
* Gestion utilisateurs
* Rôles et permissions
* Paramètres entreprise

## Boutique

* Dashboard boutique
* Ventes
* Nouvelle vente / POS
* Historique ventes
* Détail vente
* Achats
* Historique achats
* Stock actuel
* Mouvements stock
* Ajustements stock
* Inventaires
* Transferts
* Clients
* Fournisseurs
* Caisse
* Rapports
* Alertes
* IA Insights

## Super Admin

* Dashboard plateforme
* Liste entreprises
* Détail entreprise
* Liste demandes d’augmentation de boutiques
* Validation/rejet
* Gestion quotas
* Gestion suspensions
* Audit global
* Paramètres globaux

---

# 12. COMPOSANTS MÉTIER À PRÉVOIR

Créer des composants réutilisables métier, sans insister sur le design :

* table générique
* filtres avancés
* formulaire produit
* formulaire boutique
* formulaire utilisateur
* sélecteur boutique
* sélecteur entreprise
* guard permissions
* résumé KPI
* historique mouvements
* module POS
* ticket reçu
* modales validation
* statut badge
* timeline audit
* IA insight card
* stock alert list
* sales summary widget
* purchase summary widget
* transfer workflow component

---

# 13. LOGIQUE MÉTIER IMPORTANTE

## Vente

Quand une vente est validée :

* enregistrer sale
* enregistrer sale_items
* enregistrer paiements
* décrémenter stock de la boutique
* enregistrer stock movement
* journaliser action

## Achat reçu

Quand un achat est réceptionné :

* incrémenter stock de la boutique
* enregistrer stock movement
* mettre à jour statut achat
* audit log

## Transfert

Quand transfert approuvé + reçu :

* décrémenter stock source au bon moment
* incrémenter stock destination au bon moment
* historiser les 2 mouvements

## Ajustement stock

* motif obligatoire
* utilisateur responsable obligatoire
* audit obligatoire

## Limite de 3 boutiques

* empêcher création si quota atteint
* proposer formulaire de demande d’augmentation
* seul super admin peut modifier quota

---

# 14. VALIDATIONS MÉTIER

Ajoute des validations sérieuses :

* impossible de vendre quantité > stock disponible si mode strict
* impossible de transférer stock inexistant
* impossible de créer boutique si quota dépassé
* impossible d’approuver propre demande si pas super admin
* impossible pour un utilisateur d’accéder à une boutique non autorisée
* prix et quantités >= 0
* SKU unique par entreprise si choisi
* code-barres unique si nécessaire
* email utilisateur valide
* statuts contrôlés par enum/check constraints

---

# 15. DASHBOARDS ET KPI

Je veux des dashboards fonctionnels, riches en données métier.

## KPI entreprise

* CA total
* nombre boutiques
* ventes aujourd’hui
* achats aujourd’hui
* stock global
* produits faibles
* top boutiques
* top produits
* marge estimée si possible
* croissance période précédente

## KPI boutique

* CA boutique
* nombre ventes
* panier moyen
* stock faible
* produits vedettes
* achats récents
* caisse du jour
* tendances

## KPI super admin

* nombre entreprises
* entreprises actives/suspendues
* nombre boutiques total
* demandes en attente
* usage IA
* incidents/anomalies
* métriques globales plateforme

---

# 16. REQUÊTES, FILTRES, EXPORTS

Chaque module doit prévoir :

* pagination
* recherche
* filtres
* tri
* export CSV
* export PDF si pertinent

Filtres fréquents :

* par date
* par boutique
* par utilisateur
* par statut
* par catégorie
* par produit
* par fournisseur
* par client

---

# 17. IMPRESSION DE TICKETS

Prévoir module d’impression reçu/ticket pour ventes.
Le système doit être pensé pour :

* ticket de caisse
* format imprimante thermique
* informations vente
* boutique
* opérateur
* produits
* quantités
* total
* mode paiement
* date
* référence vente

Ne te concentre pas sur le design visuel, mais sur la structure logique.

---

# 18. GESTION DES ERREURS ET ROBUSTESSE

Je veux une application sérieuse :

* boundaries erreurs React
* gestion erreurs API
* messages clairs
* retries intelligents
* logs propres
* états loading / empty / forbidden / not found
* validation front + back
* protection contre doubles soumissions
* idempotence si nécessaire sur certaines opérations

---

# 19. SÉCURITÉ

Très important :

* RLS stricte
* validation serveur
* aucun accès direct non autorisé
* sanitation des entrées
* contrôle des permissions partout
* audit des actions critiques
* limitation des appels IA
* protection contre élévation de privilèges
* colonnes sensibles protégées
* séparation claire super admin / tenant admin / store user

---

# 20. PERFORMANCE

Prévoir :

* requêtes optimisées
* index SQL
* pagination serveur
* agrégations efficaces
* cache raisonnable via React Query
* lazy loading des pages lourdes
* architecture extensible

---

# 21. TESTS

Je veux du code testable et propre.

Prévoir :

* tests unitaires des utilitaires critiques
* tests de logique métier
* tests de permissions / guards
* tests d’intégration sur workflows critiques
* tests des fonctions SQL/RPC importantes si possible

Cas à tester :

* création entreprise
* quota 3 boutiques
* demande augmentation
* approbation super admin
* vente + décrément stock
* transfert inter-boutiques
* permissions utilisateur
* accès non autorisé refusé
* génération insight IA

---

# 22. SEED / DEMO DATA

Créer des données de démonstration :

* 1 super admin
* 2 entreprises
* plusieurs boutiques
* plusieurs utilisateurs par rôle
* produits
* catégories
* clients
* fournisseurs
* ventes
* achats
* transferts
* alertes
* données suffisantes pour tester dashboards et IA

---

# 23. LIVRABLES ATTENDUS DE TA PART

Je veux que tu génères le projet de manière structurée et progressive, avec du vrai code.

## Tu dois produire :

1. l’architecture globale du projet
2. le schéma de base de données complet
3. les migrations SQL Supabase
4. les enums et contraintes
5. les RLS policies
6. la structure frontend feature-based
7. les types/interfaces
8. les services Supabase
9. les hooks React Query
10. les guards auth + permissions
11. les pages principales
12. les composants métier réutilisables
13. les workflows vente / achat / transfert / inventaire / demande quota
14. l’intégration DeepSeek
15. les seeds
16. les tests essentiels
17. les instructions pour lancer le projet localement

---

# 24. MÉTHODE DE TRAVAIL IMPOSÉE

Travaille par étapes claires et cohérentes, mais génère du vrai code.

Ordre attendu :

## Étape 1

Proposer l’architecture globale :

* modules
* conventions
* structure dossiers
* flux auth
* flux multi-tenant
* stratégie RLS
* stratégie rôles/permissions

## Étape 2

Créer le schéma PostgreSQL/Supabase complet :

* tables
* relations
* types
* contraintes
* index

## Étape 3

Créer les migrations SQL + seeds

## Étape 4

Créer la base frontend :

* app shell
* routing
* auth
* providers
* supabase client
* guards

## Étape 5

Développer les features principales dans cet ordre :

* auth
* companies/stores
* users/roles/permissions
* products/categories
* inventory/stock movements
* sales/POS
* purchases
* customers/suppliers
* transfers
* dashboards/reports
* super admin
* AI insights

## Étape 6

Ajouter tests, robustesse, documentation

---

# 25. EXIGENCES DE QUALITÉ DE CODE

Je veux un code :

* lisible
* maintenable
* modulaire
* fortement typé si TypeScript
* documenté quand nécessaire
* sans duplication inutile
* avec séparation claire responsabilité
* prêt à évoluer vers production

Utilise :

* noms explicites
* services dédiés
* hooks métier
* validations Zod
* logique métier centralisée
* requêtes propres
* composants réutilisables

---

# 26. POINTS MÉTIER NON NÉGOCIABLES

Tu dois respecter absolument ces contraintes :

* SaaS multi-tenant réel
* entreprise = tenant principal
* plusieurs boutiques par entreprise
* quota initial = 3 boutiques
* demande d’augmentation obligatoire au-delà
* approbation par super admin uniquement
* dashboard global entreprise + dashboard par boutique
* rôles multiples
* permissions granulaires
* stock par boutique
* transferts inter-boutiques
* audit logs
* intégration DeepSeek pour prédictions et insights
* Supabase sécurisé avec RLS

---

# 27. CE QUE TU NE DOIS PAS FAIRE

* ne perds pas de temps à parler design/UI
* ne fais pas un CRUD générique vide
* ne fais pas une architecture superficielle
* ne propose pas un simple mono-store
* ne mélange pas les données des tenants
* ne laisse pas la sécurité pour plus tard
* n’invente pas des fonctionnalités gadgets inutiles
* ne saute pas les migrations SQL
* ne saute pas les RLS
* ne saute pas les rôles/permissions
* ne saute pas les workflows métiers

---

# 28. FORMAT DE TA RÉPONSE DANS CURSOR

Je veux que tu travailles comme un lead engineer.

Commence par :

1. résumer brièvement l’architecture cible,
2. proposer l’arborescence du projet,
3. détailler le schéma de données,
4. générer ensuite les fichiers un par un.

Quand tu génères du code :

* donne des fichiers complets
* indique le chemin exact du fichier
* fais du code cohérent entre les fichiers
* n’utilise pas de placeholders vagues
* si un fichier dépend d’un autre, génère aussi ce qu’il faut

---

# 29. BONUS IMPORTANTS À PRÉVOIR SI POSSIBLE

Si c’est faisable proprement, ajoute aussi :

* support multi-devise futur
* support multi-langue futur
* soft delete intelligent
* activité récente utilisateur
* notes internes sur clients/fournisseurs
* tableau des demandes admin
* tableau de bord des alertes
* journal d’usage de l’IA
* centre de notifications
* export comptable simple
* mode offline-first en base d’évolution future

---

# 30. DÉMARRAGE IMMÉDIAT

Maintenant, commence immédiatement par :

## A. proposer l’architecture complète de l’application

## B. proposer l’arborescence des dossiers

## C. concevoir le schéma de base de données complet

## D. générer les migrations SQL Supabase initiales

## E. mettre en place l’auth, le multi-tenant et les rôles/permissions

## F. générer les premiers modules fonctionnels

Travaille de manière concrète, professionnelle, détaillée, cohérente, sans parler du design.

---




```

Rappels importants :
- Utilise TypeScript.
- Utilise Supabase avec SQL migrations réelles.
- Sécurise tout avec RLS.
- Fais un vrai RBAC + permissions granulaires.
- Ne parle jamais du design.
- Génère du code complet, pas des exemples partiels.
- Respecte strictement le multi-tenant par entreprise.
- Les boutiques sont indépendantes mais consolidées au niveau entreprise.
- Limite initiale de boutiques = 3.
- Dépassement seulement via demande validée par super admin.
- Intègre DeepSeek proprement avec un service dédié.
- Prévois audit logs, notifications, dashboards, transferts et inventaires.
```

