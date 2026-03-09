import { useState } from 'react'
import { useCompany } from '@/context/CompanyContext'
import { useAuth } from '@/context/AuthContext'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, PageHeader, Button, Badge } from '@/components/ui'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Search, Package, TrendingUp, AlertTriangle, XCircle, Edit3, History, Download } from 'lucide-react'
import { inventoryApi } from '@/features/inventory/api/inventoryApi'
import { productsApi } from '@/features/products/api/productsApi'
import { AdjustStockDialog } from '@/features/inventory/components/AdjustStockDialog'
import { inventoryToCsv, downloadInventoryCsv } from '@/features/inventory/utils/inventoryCsv'
import { toast } from 'sonner'

const MOVEMENT_LABEL: Record<string, string> = {
  purchase_in: 'Entrée achat',
  sale_out: 'Sortie vente',
  adjustment: 'Ajustement',
  transfer_out: 'Transfert sortie',
  transfer_in: 'Transfert entrée',
  return_in: 'Retour entrée',
  return_out: 'Retour sortie',
  loss: 'Perte',
  inventory_correction: 'Correction inventaire',
}

export function InventoryPage() {
  const { currentCompanyId, currentStoreId, stores } = useCompany()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'low' | 'out'>('all')
  const [adjustingItem, setAdjustingItem] = useState<{
    id: string
    name: string
    sku: string | null
    unit: string
    currentQty: number
  } | null>(null)
  const [showMovements, setShowMovements] = useState(false)

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['inventory', currentCompanyId, currentStoreId, search, filterCategory, filterStatus],
    queryFn: () =>
      inventoryApi.list(currentCompanyId!, currentStoreId!, {
        search: search || undefined,
        categoryId: filterCategory || undefined,
        status: filterStatus,
      }),
    enabled: !!currentCompanyId && !!currentStoreId,
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', currentCompanyId],
    queryFn: () => productsApi.categories(currentCompanyId!),
    enabled: !!currentCompanyId,
  })

  const { data: movements = [] } = useQuery({
    queryKey: ['stock-movements', currentStoreId],
    queryFn: () => inventoryApi.getMovements(currentStoreId!, { limit: 30 }),
    enabled: !!currentStoreId && showMovements,
  })

  const lowStock = items.filter(
    (i) => (i.product?.stock_min ?? 0) > 0 && i.quantity <= (i.product?.stock_min ?? 0)
  )
  const outOfStock = items.filter((i) => i.quantity === 0)
  const totalValue = items.reduce(
    (sum, i) => sum + (i.product?.sale_price ?? 0) * i.quantity,
    0
  )

  const handleExportCsv = () => {
    const csv = inventoryToCsv(items)
    const filename = `stock-${new Date().toISOString().slice(0, 10)}.csv`
    downloadInventoryCsv(csv, filename)
    toast.success('Export CSV téléchargé')
  }

  const currentStore = stores.find((s) => s.id === currentStoreId)

  if (!currentStoreId) {
    return (
      <div className="space-y-6">
        <PageHeader title="Stock" description="Sélectionnez une boutique dans le menu" />
        <Card>
          <p className="py-12 text-center text-[var(--text-muted)]">
            Choisissez une boutique pour voir le stock et les mouvements.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock"
        description={currentStore ? `Stock — ${currentStore.name}` : 'Sélectionnez une boutique'}
        actions={
          <Button onClick={handleExportCsv} size="sm" variant="secondary" disabled={items.length === 0}>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exporter CSV</span>
          </Button>
        }
      />

      {/* Cartes récapitulatives */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-[var(--accent)] p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-orange-500/10 p-2">
              <Package className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">Produits en stock</p>
              <p className="text-xl font-semibold text-[var(--text-primary)]">{items.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-emerald-500/10 p-2">
              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">Valeur totale</p>
              <p className="text-xl font-semibold text-[var(--text-primary)]">
                {formatCurrency(totalValue)}
              </p>
            </div>
          </div>
        </Card>
        <Card
          className={`p-4 ${lowStock.length > 0 ? 'border-l-4 border-l-amber-500 bg-amber-500/5' : ''}`}
        >
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-amber-500/10 p-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">Sous le minimum</p>
              <p className="text-xl font-semibold text-[var(--text-primary)]">{lowStock.length}</p>
            </div>
          </div>
        </Card>
        <Card
          className={`p-4 ${outOfStock.length > 0 ? 'border-l-4 border-l-red-500 bg-red-500/5' : ''}`}
        >
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-red-500/10 p-2">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">Rupture de stock</p>
              <p className="text-xl font-semibold text-[var(--text-primary)]">{outOfStock.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <div className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="search"
                placeholder="Rechercher produit, SKU, code-barres..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full min-h-[44px] rounded-lg border border-[var(--border-solid)] bg-slate-50 pl-10 pr-4 py-2 dark:bg-slate-800"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="min-h-[44px] rounded-lg border border-[var(--border-solid)] bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800"
            >
              <option value="">Toutes catégories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'low' | 'out')}
              className="min-h-[44px] rounded-lg border border-[var(--border-solid)] bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800"
            >
              <option value="all">Tous les produits</option>
              <option value="low">Sous le minimum</option>
              <option value="out">Rupture de stock</option>
            </select>
          </div>

          {/* Onglets Stock / Historique */}
          <div className="flex gap-2 border-b border-[var(--border-solid)]">
            <button
              type="button"
              onClick={() => setShowMovements(false)}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                !showMovements
                  ? 'border-[var(--accent)] text-[var(--accent)]'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Stock
            </button>
            <button
              type="button"
              onClick={() => setShowMovements(true)}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                showMovements
                  ? 'border-[var(--accent)] text-[var(--accent)]'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <History className="inline h-4 w-4 mr-1" />
              Historique mouvements
            </button>
          </div>

          {!showMovements ? (
            isLoading ? (
              <p className="py-8 text-center text-[var(--text-muted)]">Chargement...</p>
            ) : items.length === 0 ? (
              <p className="py-8 text-center text-[var(--text-muted)]">
                Aucun produit correspondant. Créez des produits ou ajustez les filtres.
              </p>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-solid)] bg-slate-50 dark:bg-slate-800/50">
                      <th className="p-4 font-medium text-[var(--text-primary)]">Produit</th>
                      <th className="hidden p-4 font-medium text-[var(--text-primary)] sm:table-cell">SKU</th>
                      <th className="p-4 font-medium text-[var(--text-primary)]">Qté</th>
                      <th className="hidden p-4 font-medium text-[var(--text-primary)] md:table-cell">Réservé</th>
                      <th className="p-4 font-medium text-[var(--text-primary)]">Min</th>
                      <th className="hidden p-4 font-medium text-[var(--text-primary)] lg:table-cell">Unité</th>
                      <th className="p-4 font-medium text-[var(--text-primary)]">Statut</th>
                      <th className="p-4 font-medium text-[var(--text-primary)]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((i) => {
                      const min = i.product?.stock_min ?? 0
                      const qty = i.quantity
                      let status: 'ok' | 'low' | 'out' = 'ok'
                      if (qty === 0) status = 'out'
                      else if (min > 0 && qty <= min) status = 'low'
                      return (
                        <tr key={i.id} className="border-b border-[var(--border-solid)]">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                                {i.product?.product_images?.[0] ? (
                                  <img
                                    src={i.product.product_images[0].url}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center">
                                    <Package className="h-5 w-5 text-[var(--text-muted)]" />
                                  </div>
                                )}
                              </div>
                              <span className="font-medium text-[var(--text-primary)]">
                                {i.product?.name ?? '—'}
                              </span>
                            </div>
                          </td>
                          <td className="hidden p-4 sm:table-cell">{i.product?.sku ?? '—'}</td>
                          <td className="p-4 font-medium">{qty}</td>
                          <td className="hidden p-4 md:table-cell">{i.reserved_quantity}</td>
                          <td className="p-4">{min}</td>
                          <td className="hidden p-4 lg:table-cell">{i.product?.unit ?? 'pce'}</td>
                          <td className="p-4">
                            <Badge
                              variant={
                                status === 'out' ? 'danger' : status === 'low' ? 'warning' : 'success'
                              }
                            >
                              {status === 'out' ? 'Rupture' : status === 'low' ? 'Sous min' : 'OK'}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <button
                              type="button"
                              onClick={() =>
                                setAdjustingItem({
                                  id: i.product_id,
                                  name: i.product?.name ?? '—',
                                  sku: i.product?.sku ?? null,
                                  unit: i.product?.unit ?? 'pce',
                                  currentQty: qty,
                                })
                              }
                              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-slate-100 dark:hover:bg-slate-800 touch-manipulation"
                              aria-label="Ajuster"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-solid)] bg-slate-50 dark:bg-slate-800/50">
                    <th className="p-4 font-medium text-[var(--text-primary)]">Date</th>
                    <th className="p-4 font-medium text-[var(--text-primary)]">Produit</th>
                    <th className="p-4 font-medium text-[var(--text-primary)]">Type</th>
                    <th className="p-4 font-medium text-[var(--text-primary)]">Quantité</th>
                    <th className="p-4 font-medium text-[var(--text-primary)]">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => (
                    <tr key={m.id} className="border-b border-[var(--border-solid)]">
                      <td className="p-4 text-[var(--text-muted)]">{formatDateTime(m.created_at)}</td>
                      <td className="p-4 font-medium">{m.product?.name ?? '—'}</td>
                      <td className="p-4">{MOVEMENT_LABEL[m.type] ?? m.type}</td>
                      <td
                        className={`p-4 font-medium ${m.quantity > 0 ? 'text-emerald-600' : 'text-red-600'}`}
                      >
                        {m.quantity > 0 ? '+' : ''}{m.quantity}
                      </td>
                      <td className="p-4 text-[var(--text-muted)]">{m.notes ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {movements.length === 0 && (
                <p className="py-8 text-center text-[var(--text-muted)]">Aucun mouvement récent</p>
              )}
            </div>
          )}
        </div>
      </Card>

      {adjustingItem && user && (
        <AdjustStockDialog
          open={!!adjustingItem}
          onClose={() => setAdjustingItem(null)}
          product={adjustingItem}
          storeId={currentStoreId}
          userId={user.id}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['inventory', currentCompanyId, currentStoreId] })
            queryClient.invalidateQueries({ queryKey: ['stock-movements', currentStoreId] })
            toast.success('Stock mis à jour')
          }}
        />
      )}
    </div>
  )
}
