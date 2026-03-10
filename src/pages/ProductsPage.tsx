import { useState } from 'react'
import { useCompany } from '@/context/CompanyContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Card, PageHeader, Badge } from '@/components/ui'
import { Plus, Search, Pencil, Trash2, Package, Tag, Layers, Download, Upload } from 'lucide-react'
import { productsApi } from '@/features/products/api/productsApi'
import { ProductFormDialog } from '@/features/products/components/ProductFormDialog'
import { CategoriesSection } from '@/features/products/components/CategoriesSection'
import { BrandsSection } from '@/features/products/components/BrandsSection'
import { ImportProductsCSVDialog } from '@/features/products/components/ImportProductsCSVDialog'
import { productsToCsv, downloadCsv } from '@/features/products/utils/productsCsv'
import { inventoryApi } from '@/features/inventory/api/inventoryApi'
import { companySettingsApi } from '@/features/settings/api/companySettingsApi'
import { StockRangeSlider } from '@/features/inventory/components/StockRangeSlider'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

type Tab = 'products' | 'categories' | 'brands'

export function ProductsPage() {
  const { currentCompanyId, currentStoreId } = useCompany()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<Tab>('products')
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [filterBrand, setFilterBrand] = useState<string>('')
  const [showImportCsv, setShowImportCsv] = useState(false)

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', currentCompanyId],
    queryFn: () => productsApi.list(currentCompanyId!),
    enabled: !!currentCompanyId && activeTab === 'products',
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', currentCompanyId],
    queryFn: () => productsApi.categories(currentCompanyId!),
    enabled: !!currentCompanyId,
  })

  const { data: brands = [] } = useQuery({
    queryKey: ['brands', currentCompanyId],
    queryFn: () => productsApi.brands(currentCompanyId!),
    enabled: !!currentCompanyId,
  })

  const { data: stockByStore = {} } = useQuery({
    queryKey: ['inventory', currentStoreId],
    queryFn: () => inventoryApi.getStockByStore(currentStoreId!),
    enabled: !!currentStoreId && activeTab === 'products',
  })

  const { data: defaultStockThreshold = 5 } = useQuery({
    queryKey: ['company-settings', 'default_stock_alert', currentCompanyId],
    queryFn: () => companySettingsApi.getDefaultStockAlertThreshold(currentCompanyId!),
    enabled: !!currentCompanyId && activeTab === 'products' && !!currentStoreId,
  })

  const setActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      productsApi.setActive(id, is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', currentCompanyId] })
      toast.success('Statut mis à jour')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erreur'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.softDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', currentCompanyId] })
      toast.success('Produit supprimé')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erreur'),
  })

  const filtered = products.filter((p) => {
    if (search) {
      const s = search.toLowerCase()
      if (
        !p.name.toLowerCase().includes(s) &&
        !(p.sku?.toLowerCase().includes(s)) &&
        !(p.barcode?.includes(search))
      ) return false
    }
    if (filterCategory && p.category_id !== filterCategory) return false
    if (filterBrand && p.brand_id !== filterBrand) return false
    return true
  })

  const handleSuccess = () => {
    setShowCreate(false)
    setEditingId(null)
  }

  const handleExportCsv = () => {
    const csv = productsToCsv(filtered)
    const filename = `produits-${new Date().toISOString().slice(0, 10)}.csv`
    downloadCsv(csv, filename)
    toast.success('Export CSV téléchargé')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Produits"
        description="Catalogue, catégories et marques"
        actions={
          currentCompanyId && activeTab === 'products' && (
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleExportCsv} size="sm" variant="secondary" disabled={filtered.length === 0}>
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Exporter CSV</span>
              </Button>
              <Button onClick={() => setShowImportCsv(true)} size="sm" variant="secondary">
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Importer CSV</span>
              </Button>
              <Button onClick={() => setShowCreate(true)} size="sm" className="min-w-[44px] min-h-[44px]">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nouveau produit</span>
              </Button>
            </div>
          )
        }
      />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--border-solid)]">
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-4 py-3 min-h-[44px] border-b-2 font-medium transition-colors touch-manipulation ${
            activeTab === 'products'
              ? 'border-[var(--accent)] text-[var(--accent)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Package className="h-4 w-4" />
          Produits
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-4 py-3 min-h-[44px] border-b-2 font-medium transition-colors touch-manipulation ${
            activeTab === 'categories'
              ? 'border-[var(--accent)] text-[var(--accent)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Layers className="h-4 w-4" />
          Catégories
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('brands')}
          className={`flex items-center gap-2 px-4 py-3 min-h-[44px] border-b-2 font-medium transition-colors touch-manipulation ${
            activeTab === 'brands'
              ? 'border-[var(--accent)] text-[var(--accent)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Tag className="h-4 w-4" />
          Marques
        </button>
      </div>

      {activeTab === 'products' && (
        <Card>
          <div className="p-4 space-y-4">
            {/* Filtres */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="search"
                  placeholder="Rechercher nom, SKU, code-barres..."
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
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
                className="min-h-[44px] rounded-lg border border-[var(--border-solid)] bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800"
              >
                <option value="">Toutes marques</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            {isLoading ? (
              <p className="py-8 text-center text-[var(--text-muted)]">Chargement...</p>
            ) : filtered.length === 0 ? (
              <p className="py-8 text-center text-[var(--text-muted)]">
                {products.length === 0 ? 'Aucun produit. Créez-en un.' : 'Aucun résultat.'}
              </p>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-solid)] bg-slate-50 dark:bg-slate-800/50">
                      <th className="p-4 font-medium text-[var(--text-primary)]">Produit</th>
                      <th className="hidden p-4 font-medium text-[var(--text-primary)] sm:table-cell">SKU</th>
                      <th className="p-4 font-medium text-[var(--text-primary)]">Prix</th>
                      {currentStoreId && (
                        <th className="p-4 font-medium text-[var(--text-primary)]">Stock</th>
                      )}
                      <th className="hidden p-4 font-medium text-[var(--text-primary)] md:table-cell">Catégorie</th>
                      <th className="hidden p-4 font-medium text-[var(--text-primary)] lg:table-cell">Marque</th>
                      <th className="p-4 font-medium text-[var(--text-primary)]">État</th>
                      <th className="p-4 font-medium text-[var(--text-primary)]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => (
                      <tr key={p.id} className="border-b border-[var(--border-solid)]">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                              {p.product_images?.[0] ? (
                                <img
                                  src={p.product_images[0].url}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <Package className="h-5 w-5 text-[var(--text-muted)]" />
                                </div>
                              )}
                            </div>
                            <span className="font-medium">{p.name}</span>
                          </div>
                        </td>
                        <td className="hidden p-4 sm:table-cell">{p.sku ?? '—'}</td>
                        <td className="p-4">{formatCurrency(p.sale_price)}</td>
                        {currentStoreId && (
                          <td className="p-4">
                            <StockRangeSlider
                              quantity={stockByStore[p.id] ?? 0}
                              alertThreshold={(p.stock_min ?? 0) > 0 ? p.stock_min! : defaultStockThreshold}
                            />
                          </td>
                        )}
                        <td className="hidden p-4 md:table-cell">{p.category?.name ?? '—'}</td>
                        <td className="hidden p-4 lg:table-cell">{p.brand?.name ?? '—'}</td>
                        <td className="p-4">
                          <Badge variant={p.is_active ? 'success' : 'default'}>
                            {p.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingId(p.id)}
                              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-slate-100 dark:hover:bg-slate-800 touch-manipulation"
                              aria-label="Modifier"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setActiveMutation.mutate({ id: p.id, is_active: !p.is_active })
                              }
                              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-slate-100 dark:hover:bg-slate-800 touch-manipulation"
                              aria-label={p.is_active ? 'Désactiver' : 'Activer'}
                            >
                              {p.is_active ? 'Désactiver' : 'Activer'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm('Supprimer ce produit ?')) deleteMutation.mutate(p.id)
                              }}
                              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[var(--danger)] hover:bg-red-50 dark:hover:bg-red-900/20 touch-manipulation"
                              aria-label="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      )}

      {activeTab === 'categories' && currentCompanyId && (
        <CategoriesSection companyId={currentCompanyId} />
      )}

      {activeTab === 'brands' && currentCompanyId && (
        <BrandsSection companyId={currentCompanyId} />
      )}

      {currentCompanyId && showImportCsv && (
        <ImportProductsCSVDialog
          companyId={currentCompanyId}
          open={showImportCsv}
          onClose={() => setShowImportCsv(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['products', currentCompanyId] })}
        />
      )}
      {currentCompanyId && (
        <ProductFormDialog
          companyId={currentCompanyId}
          open={showCreate || !!editingId}
          onClose={() => { setShowCreate(false); setEditingId(null) }}
          onSuccess={handleSuccess}
          productId={editingId ?? undefined}
        />
      )}
    </div>
  )
}
