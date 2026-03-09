import { useState } from 'react'
import { useCompany } from '@/context/CompanyContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, PageHeader, Button, Badge } from '@/components/ui'
import { Plus, Eye, Check, XCircle, Download } from 'lucide-react'
import { purchasesApi } from '@/features/purchases/api/purchasesApi'
import { suppliersApi } from '@/features/suppliers/api/suppliersApi'
import { CreatePurchaseDialog } from '@/features/purchases/components/CreatePurchaseDialog'
import { PurchaseDetailDialog } from '@/features/purchases/components/PurchaseDetailDialog'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'

function purchasesToCsv(purchases: Array<{ reference: string | null; created_at: string; total: number; status: string; store?: { name: string }; supplier?: { name: string } }>): string {
  const escape = (v: string | number) => {
    const s = String(v ?? '')
    return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s
  }
  const headers = ['reference', 'date', 'boutique', 'fournisseur', 'statut', 'total']
  const rows = purchases.map((p) =>
    [
      escape(p.reference ?? ''),
      escape(p.created_at.slice(0, 19)),
      escape(p.store?.name ?? ''),
      escape(p.supplier?.name ?? ''),
      escape(p.status),
      String(p.total),
    ].join(',')
  )
  return [headers.join(','), ...rows].join('\n')
}

function downloadCsv(content: string, filename: string) {
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function PurchasesPage() {
  const { currentCompanyId, currentStoreId, stores } = useCompany()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [filterStore, setFilterStore] = useState<string>(currentStoreId ?? '')
  const [filterSupplier, setFilterSupplier] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')

  const { data: purchases = [], isLoading } = useQuery({
    queryKey: [
      'purchases',
      currentCompanyId,
      filterStore || undefined,
      filterSupplier || undefined,
      filterStatus || undefined,
      filterFrom || undefined,
      filterTo || undefined,
    ],
    queryFn: () =>
      purchasesApi.list(currentCompanyId!, {
        storeId: filterStore || undefined,
        supplierId: filterSupplier || undefined,
        status: (filterStatus as 'draft' | 'confirmed' | 'received' | 'cancelled') || undefined,
        fromDate: filterFrom || undefined,
        toDate: filterTo || undefined,
      }),
    enabled: !!currentCompanyId,
  })

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers', currentCompanyId],
    queryFn: () => suppliersApi.list(currentCompanyId!),
    enabled: !!currentCompanyId,
  })

  const confirmMutation = useMutation({
    mutationFn: (id: string) => purchasesApi.confirm(id, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases', currentCompanyId] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      setDetailId(null)
      toast.success('Achat confirmé, stock mis à jour')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erreur'),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => purchasesApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases', currentCompanyId] })
      setDetailId(null)
      toast.success('Achat annulé')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erreur'),
  })

  const handleExportCsv = () => {
    const csv = purchasesToCsv(purchases)
    downloadCsv(csv, `achats-${new Date().toISOString().slice(0, 10)}.csv`)
    toast.success('Export CSV téléchargé')
  }

  const STATUS_LABEL: Record<string, string> = {
    draft: 'Brouillon',
    confirmed: 'Confirmé',
    partially_received: 'Part. reçu',
    received: 'Reçu',
    cancelled: 'Annulé',
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Achats"
        description="Gérer les achats fournisseurs"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleExportCsv} size="sm" variant="secondary" disabled={purchases.length === 0}>
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exporter CSV</span>
            </Button>
            {currentCompanyId && (
              <Button onClick={() => setShowCreate(true)} size="sm" className="min-w-[44px] min-h-[44px]">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nouvel achat</span>
              </Button>
            )}
          </div>
        }
      />

      <Card>
        <div className="p-4 space-y-4">
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
              value={filterSupplier}
              onChange={(e) => setFilterSupplier(e.target.value)}
              className="min-h-[44px] rounded-lg border border-[var(--border-solid)] bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800"
            >
              <option value="">Tous fournisseurs</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="min-h-[44px] rounded-lg border border-[var(--border-solid)] bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800"
            >
              <option value="">Tous statuts</option>
              <option value="draft">Brouillon</option>
              <option value="confirmed">Confirmé</option>
              <option value="received">Reçu</option>
              <option value="cancelled">Annulé</option>
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

          {isLoading ? (
            <p className="py-8 text-center text-[var(--text-muted)]">Chargement...</p>
          ) : purchases.length === 0 ? (
            <p className="py-8 text-center text-[var(--text-muted)]">
              Aucun achat. Créez-en un.
            </p>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-solid)] bg-slate-50 dark:bg-slate-800/50">
                    <th className="p-4 font-medium text-[var(--text-primary)]">Réf.</th>
                    <th className="p-4 font-medium text-[var(--text-primary)]">Date</th>
                    <th className="hidden p-4 font-medium text-[var(--text-primary)] sm:table-cell">Boutique</th>
                    <th className="hidden p-4 font-medium text-[var(--text-primary)] md:table-cell">Fournisseur</th>
                    <th className="p-4 font-medium text-[var(--text-primary)]">Total</th>
                    <th className="p-4 font-medium text-[var(--text-primary)]">Statut</th>
                    <th className="p-4 font-medium text-[var(--text-primary)]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((p) => (
                    <tr key={p.id} className="border-b border-[var(--border-solid)]">
                      <td className="p-4 font-medium">{p.reference ?? '—'}</td>
                      <td className="p-4">{formatDateTime(p.created_at)}</td>
                      <td className="hidden p-4 sm:table-cell">{p.store?.name ?? '—'}</td>
                      <td className="hidden p-4 md:table-cell">{p.supplier?.name ?? '—'}</td>
                      <td className="p-4">{formatCurrency(p.total)}</td>
                      <td className="p-4">
                        <Badge
                          variant={
                            p.status === 'received'
                              ? 'success'
                              : p.status === 'cancelled'
                                ? 'default'
                                : p.status === 'draft'
                                  ? 'outline'
                                  : 'default'
                          }
                        >
                          {STATUS_LABEL[p.status] ?? p.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setDetailId(p.id)}
                            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-slate-100 dark:hover:bg-slate-800 touch-manipulation"
                            aria-label="Voir"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {p.status === 'draft' && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm('Confirmer cet achat ? Le stock sera mis à jour.')) {
                                    confirmMutation.mutate(p.id)
                                  }
                                }}
                                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 touch-manipulation"
                                aria-label="Confirmer"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm('Annuler cet achat ?')) cancelMutation.mutate(p.id)
                                }}
                                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[var(--danger)] hover:bg-red-50 dark:hover:bg-red-900/20 touch-manipulation"
                                aria-label="Annuler"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
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

      {currentCompanyId && showCreate && (
        <CreatePurchaseDialog
          companyId={currentCompanyId}
          storeId={currentStoreId}
          stores={stores}
          open={showCreate}
          onClose={() => setShowCreate(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['purchases', currentCompanyId] })}
        />
      )}

      <PurchaseDetailDialog purchaseId={detailId} open={!!detailId} onClose={() => setDetailId(null)} />
    </div>
  )
}
