import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCompany } from '@/context/CompanyContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Card, PageHeader, Badge } from '@/components/ui'
import { ROUTES } from '@/routes'
import { ShoppingCart, Plus, Eye, XCircle, Download } from 'lucide-react'
import { salesApi } from '@/features/sales/api/salesApi'
import { SaleDetailDialog } from '@/features/sales/components/SaleDetailDialog'
import { salesToCsv, downloadSalesCsv } from '@/features/sales/utils/salesCsv'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { toast } from 'sonner'

export function SalesPage() {
  const { currentCompanyId, currentStoreId, stores } = useCompany()
  const queryClient = useQueryClient()
  const [detailId, setDetailId] = useState<string | null>(null)
  const [filterStore, setFilterStore] = useState<string>(currentStoreId ?? '')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')

  useEffect(() => {
    setFilterStore(currentStoreId ?? '')
  }, [currentStoreId])

  const { data: sales = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: [
      'sales',
      currentCompanyId,
      filterStore || undefined,
      filterStatus || undefined,
      filterFrom || undefined,
      filterTo || undefined,
    ],
    queryFn: () =>
      salesApi.list(currentCompanyId!, {
        storeId: filterStore || undefined,
        status: (filterStatus as 'draft' | 'completed' | 'cancelled' | 'refunded') || undefined,
        fromDate: filterFrom || undefined,
        toDate: filterTo || undefined,
      }),
    enabled: !!currentCompanyId,
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => salesApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales', currentCompanyId] })
      queryClient.invalidateQueries({ queryKey: ['inventory', currentStoreId] })
      setDetailId(null)
      toast.success('Vente annulée')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erreur'),
  })

  const handleExportCsv = () => {
    const csv = salesToCsv(sales)
    const filename = `ventes-${new Date().toISOString().slice(0, 10)}.csv`
    downloadSalesCsv(csv, filename)
    toast.success('Export CSV téléchargé')
  }

  const STATUS_LABEL: Record<string, string> = {
    draft: 'Brouillon',
    completed: 'Complétée',
    cancelled: 'Annulée',
    refunded: 'Remboursée',
  }

  const currentStore = stores.find((s) => s.id === currentStoreId)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ventes"
        description={currentStore ? `Ventes — ${currentStore.name}` : 'Sélectionnez une boutique'}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleExportCsv}
              size="sm"
              variant="secondary"
              disabled={sales.length === 0}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exporter CSV</span>
            </Button>
            {currentStoreId && (
              <Link to={ROUTES.pos(currentStoreId)}>
                <Button size="sm" className="min-w-[44px] min-h-[44px]">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Nouvelle vente</span>
                </Button>
              </Link>
            )}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {currentStoreId ? (
          <Link to={ROUTES.pos(currentStoreId)}>
            <Card className="flex min-h-[100px] cursor-pointer flex-col items-center justify-center gap-2 p-6 transition-colors hover:border-[var(--accent)] hover:bg-orange-500/5 touch-manipulation">
              <div className="rounded-full bg-orange-500/10 p-3">
                <Plus className="h-6 w-6 text-[var(--accent)]" />
              </div>
              <span className="font-medium text-[var(--text-primary)]">Nouvelle vente (POS)</span>
              <span className="text-xs text-[var(--text-muted)]">Ouvrir la caisse</span>
            </Card>
          </Link>
        ) : (
          <Card className="flex min-h-[100px] flex-col items-center justify-center gap-2 p-6 opacity-75">
            <Plus className="h-6 w-6 text-[var(--text-muted)]" />
            <span className="text-sm text-[var(--text-muted)]">Sélectionnez une boutique pour vendre</span>
          </Card>
        )}
        <Card className="flex min-h-[100px] flex-col items-center justify-center gap-2 p-6 opacity-90">
          <ShoppingCart className="h-6 w-6 text-[var(--text-muted)]" />
          <span className="font-medium text-[var(--text-secondary)]">Historique des ventes</span>
          <span className="text-xs text-[var(--text-muted)]">{sales.length} vente(s)</span>
        </Card>
      </div>

      <Card>
        <div className="p-4 space-y-4">
          <h3 className="text-sm font-medium text-[var(--text-primary)]">Historique</h3>
          {/* Filtres */}
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={filterStore}
              onChange={(e) => setFilterStore(e.target.value)}
              className="min-h-[44px] rounded-lg border border-[var(--border-solid)] bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800"
            >
              <option value="">Toutes boutiques</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="min-h-[44px] rounded-lg border border-[var(--border-solid)] bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800"
            >
              <option value="">Tous statuts</option>
              <option value="completed">Complétée</option>
              <option value="draft">Brouillon</option>
              <option value="cancelled">Annulée</option>
              <option value="refunded">Remboursée</option>
            </select>
            <input
              type="date"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              className="min-h-[44px] rounded-lg border border-[var(--border-solid)] bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800"
            />
            <input
              type="date"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
              className="min-h-[44px] rounded-lg border border-[var(--border-solid)] bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800"
            />
          </div>

          {isError ? (
            <div className="py-8 flex flex-col items-center gap-3 text-center">
              <p className="text-[var(--danger)]">
                {error instanceof Error ? error.message : 'Erreur lors du chargement.'}
              </p>
              <Button variant="secondary" size="sm" onClick={() => refetch()}>
                Réessayer
              </Button>
            </div>
          ) : isLoading ? (
            <p className="py-8 text-center text-[var(--text-muted)]">Chargement...</p>
          ) : sales.length === 0 ? (
            <p className="py-8 text-center text-[var(--text-muted)]">
              Aucune vente. Créez-en une depuis le POS.
            </p>
          ) : (
            <div className="table-responsive -mx-4 sm:mx-0">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-solid)] bg-slate-50 dark:bg-slate-800/50">
                    <th className="p-4 font-medium text-[var(--text-primary)]">Numéro</th>
                    <th className="p-4 font-medium text-[var(--text-primary)]">Date</th>
                    <th className="hidden p-4 font-medium text-[var(--text-primary)] sm:table-cell">Boutique</th>
                    <th className="hidden p-4 font-medium text-[var(--text-primary)] md:table-cell">Client</th>
                    <th className="p-4 font-medium text-[var(--text-primary)]">Total</th>
                    <th className="p-4 font-medium text-[var(--text-primary)]">Statut</th>
                    <th className="p-4 font-medium text-[var(--text-primary)]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((s) => (
                    <tr key={s.id} className="border-b border-[var(--border-solid)]">
                      <td className="p-4 font-medium">{s.sale_number}</td>
                      <td className="p-4">{formatDateTime(s.created_at)}</td>
                      <td className="hidden p-4 sm:table-cell">{s.store?.name ?? '—'}</td>
                      <td className="hidden p-4 md:table-cell">{s.customer?.name ?? '—'}</td>
                      <td className="p-4">{formatCurrency(s.total)}</td>
                      <td className="p-4">
                        <Badge
                          variant={
                            s.status === 'completed'
                              ? 'success'
                              : s.status === 'cancelled'
                                ? 'default'
                                : 'default'
                          }
                        >
                          {STATUS_LABEL[s.status] ?? s.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setDetailId(s.id)}
                            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-slate-100 dark:hover:bg-slate-800 touch-manipulation"
                            aria-label="Voir"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {s.status === 'completed' && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm('Annuler cette vente ? Le stock sera rétabli.')) {
                                  cancelMutation.mutate(s.id)
                                }
                              }}
                              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[var(--danger)] hover:bg-red-50 dark:hover:bg-red-900/20 touch-manipulation"
                              aria-label="Annuler"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}
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

      <SaleDetailDialog
        saleId={detailId}
        open={!!detailId}
        onClose={() => setDetailId(null)}
      />
    </div>
  )
}
