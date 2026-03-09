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
