/**
 * Permission keys — aligned with backend role_permissions.
 */
export const PERMISSIONS = {
  company_manage: 'company.manage',
  stores_create: 'stores.create',
  stores_request_extra: 'stores.request_extra',
  stores_approve_extra: 'stores.approve_extra',
  products_create: 'products.create',
  products_update: 'products.update',
  products_delete: 'products.delete',
  sales_create: 'sales.create',
  sales_cancel: 'sales.cancel',
  sales_refund: 'sales.refund',
  purchases_create: 'purchases.create',
  stock_adjust: 'stock.adjust',
  stock_transfer: 'stock.transfer',
  reports_view_global: 'reports.view_global',
  reports_view_store: 'reports.view_store',
  users_manage: 'users.manage',
  settings_manage: 'settings.manage',
  ai_insights_view: 'ai.insights.view',
  cash_open_close: 'cash.open_close',
  audit_view: 'audit.view',
} as const

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

/** Libellés pour l’affichage (gestion des droits par l’owner). */
export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  [PERMISSIONS.company_manage]: 'Gérer l’entreprise',
  [PERMISSIONS.stores_create]: 'Créer des boutiques',
  [PERMISSIONS.stores_request_extra]: 'Demander des boutiques supplémentaires',
  [PERMISSIONS.stores_approve_extra]: 'Approuver les demandes de boutiques',
  [PERMISSIONS.products_create]: 'Créer des produits',
  [PERMISSIONS.products_update]: 'Modifier des produits',
  [PERMISSIONS.products_delete]: 'Supprimer des produits',
  [PERMISSIONS.sales_create]: 'Enregistrer des ventes',
  [PERMISSIONS.sales_cancel]: 'Annuler des ventes',
  [PERMISSIONS.sales_refund]: 'Rembourser des ventes',
  [PERMISSIONS.purchases_create]: 'Créer des achats',
  [PERMISSIONS.stock_adjust]: 'Ajuster le stock',
  [PERMISSIONS.stock_transfer]: 'Transferts entre boutiques',
  [PERMISSIONS.reports_view_global]: 'Rapports (toutes boutiques)',
  [PERMISSIONS.reports_view_store]: 'Rapports (boutique)',
  [PERMISSIONS.users_manage]: 'Gérer les utilisateurs',
  [PERMISSIONS.settings_manage]: 'Paramètres entreprise',
  [PERMISSIONS.ai_insights_view]: 'Prédictions IA',
  [PERMISSIONS.cash_open_close]: 'Ouverture / fermeture caisse',
  [PERMISSIONS.audit_view]: 'Consulter l’audit',
}
