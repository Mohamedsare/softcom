import { useMemo } from 'react'
import { useCompany } from '@/context/CompanyContext'
import { useQuery } from '@tanstack/react-query'
import { Card, PageHeader } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import { Package, AlertTriangle, XCircle } from 'lucide-react'
import { inventoryApi } from '@/features/inventory/api/inventoryApi'
import { StockRangeSlider } from '@/features/inventory/components/StockRangeSlider'
import { companySettingsApi } from '@/features/settings/api/companySettingsApi'

/**
 * Stock C (caissier) : produits en rupture et alertes (sous le minimum). Lecture seule.
 * Route : /stock-c
 */
export function StockCashierPage() {
  const { currentCompanyId, currentStoreId, stores } = useCompany()
  const currentStore = stores.find((s) => s.id === currentStoreId)

  const { data: rawItems = [], isLoading } = useQuery({
    queryKey: ['inventory', currentCompanyId, currentStoreId, 'stock-c'],
    queryFn: () =>
      inventoryApi.list(currentCompanyId!, currentStoreId!, { status: 'all' }),
    enabled: !!currentCompanyId && !!currentStoreId,
  })

  const { data: defaultThreshold = 5 } = useQuery({
    queryKey: ['company-settings', 'default_stock_alert', currentCompanyId],
    queryFn: () =>
      companySettingsApi.getDefaultStockAlertThreshold(currentCompanyId!),
    enabled: !!currentCompanyId,
  })

  const { data: overrides = {} } = useQuery({
    queryKey: ['product-store-overrides', currentStoreId],
    queryFn: () => inventoryApi.getStoreStockMinOverrides(currentStoreId!),
    enabled: !!currentStoreId,
  })

  const effectiveMin = useMemo(() => {
    const map = new Map<string, number>()
    for (const i of rawItems) {
      const override = overrides[i.product_id]
      const productMin = i.product?.stock_min ?? 0
      const min =
        override !== undefined && override !== null ? override : productMin
      map.set(i.product_id, min > 0 ? min : defaultThreshold)
    }
    return map
  }, [rawItems, overrides, defaultThreshold])

  const rupture = useMemo(
    () => rawItems.filter((i) => i.quantity === 0),
    [rawItems]
  )
  const alertes = useMemo(
    () =>
      rawItems.filter((i) => {
        const min = effectiveMin.get(i.product_id) ?? 0
        return i.quantity > 0 && min > 0 && i.quantity <= min
      }),
    [rawItems, effectiveMin]
  )

  if (!currentStoreId) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Stock"
          description="Sélectionnez une boutique pour voir les ruptures et alertes"
        />
        <Card>
          <p className="py-12 text-center text-[var(--text-muted)]">
            Choisissez une boutique dans le menu.
          </p>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Stock"
          description={currentStore ? `Ruptures et alertes — ${currentStore.name}` : 'Ruptures et alertes'}
        />
        <p className="py-8 text-center text-[var(--text-muted)]">
          Chargement...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock"
        description={
          currentStore
            ? `Ruptures et alertes — ${currentStore.name}`
            : 'Ruptures et alertes'
        }
      />

      {/* Chips récap */}
      <div className="flex flex-wrap gap-3">
        <Card className="flex items-center gap-2 border-l-4 border-l-red-500 px-4 py-2">
          <XCircle className="h-5 w-5 text-red-500" />
          <span className="text-sm text-[var(--text-muted)]">Rupture :</span>
          <span className="font-semibold text-red-600 dark:text-red-400">
            {rupture.length}
          </span>
        </Card>
        <Card className="flex items-center gap-2 border-l-4 border-l-amber-500 px-4 py-2">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <span className="text-sm text-[var(--text-muted)]">
            Sous le min. :
          </span>
          <span className="font-semibold text-amber-600 dark:text-amber-400">
            {alertes.length}
          </span>
        </Card>
      </div>

      {/* Rupture de stock */}
      <section>
        <h2 className="text-base font-semibold text-red-600 dark:text-red-400 mb-2">
          Rupture de stock
        </h2>
        {rupture.length === 0 ? (
          <Card>
            <p className="py-6 text-center text-[var(--text-muted)]">
              Aucun produit en rupture
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {rupture.map((i) => {
              const min = effectiveMin.get(i.product_id) ?? defaultThreshold
              return (
                <Card key={i.id} className="p-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
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
                      <div className="min-w-0">
                        <p className="font-medium text-[var(--text-primary)] truncate">
                          {i.product?.name ?? '—'}
                        </p>
                        <p className="text-sm text-[var(--text-muted)]">
                          {i.product?.sku ?? '—'} ·{' '}
                          {formatCurrency(i.product?.sale_price ?? 0)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <StockRangeSlider
                        quantity={i.quantity}
                        alertThreshold={min}
                      />
                      <span className="font-semibold text-red-600 dark:text-red-400 tabular-nums">
                        {i.quantity}
                      </span>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      {/* Sous le minimum (alertes) */}
      <section>
        <h2 className="text-base font-semibold text-amber-700 dark:text-amber-400 mb-2">
          Sous le minimum (alertes)
        </h2>
        {alertes.length === 0 ? (
          <Card>
            <p className="py-6 text-center text-[var(--text-muted)]">
              Aucune alerte
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {alertes.map((i) => {
              const min = effectiveMin.get(i.product_id) ?? defaultThreshold
              return (
                <Card key={i.id} className="p-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
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
                      <div className="min-w-0">
                        <p className="font-medium text-[var(--text-primary)] truncate">
                          {i.product?.name ?? '—'}
                        </p>
                        <p className="text-sm text-[var(--text-muted)]">
                          {i.product?.sku ?? '—'} ·{' '}
                          {formatCurrency(i.product?.sale_price ?? 0)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <StockRangeSlider
                        quantity={i.quantity}
                        alertThreshold={min}
                      />
                      <span className="font-semibold text-[var(--accent)] tabular-nums">
                        {i.quantity}
                      </span>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
