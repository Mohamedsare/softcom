import { useState } from 'react'
import { useCompany } from '@/context/CompanyContext'
import { useQuery } from '@tanstack/react-query'
import { Card, PageHeader, Button, Badge } from '@/components/ui'
import { Plus, Eye } from 'lucide-react'
import { transfersApi, type TransferStatus } from '@/features/transfers/api/transfersApi'
import { CreateTransferDialog } from '@/features/transfers/components/CreateTransferDialog'
import { TransferDetailDialog } from '@/features/transfers/components/TransferDetailDialog'
import { formatDateTime } from '@/lib/utils'

const STATUS_LABEL: Record<string, string> = {
  draft: 'Brouillon',
  pending: 'En attente',
  approved: 'Approuvé',
  shipped: 'Expédié',
  received: 'Réceptionné',
  rejected: 'Rejeté',
  cancelled: 'Annulé',
}

export function TransfersPage() {
  const { currentCompanyId, stores } = useCompany()
  const [showCreate, setShowCreate] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [filterFrom, setFilterFrom] = useState<string>('')
  const [filterTo, setFilterTo] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterFromDate, setFilterFromDate] = useState('')
  const [filterToDate, setFilterToDate] = useState('')

  const { data: transfers = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: [
      'transfers',
      currentCompanyId,
      filterFrom || undefined,
      filterTo || undefined,
      filterStatus || undefined,
      filterFromDate || undefined,
      filterToDate || undefined,
    ],
    queryFn: () =>
      transfersApi.list(currentCompanyId!, {
        fromStoreId: filterFrom || undefined,
        toStoreId: filterTo || undefined,
        status: (filterStatus as TransferStatus) || undefined,
        fromDate: filterFromDate || undefined,
        toDate: filterToDate || undefined,
      }),
    enabled: !!currentCompanyId,
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transferts"
        description="Transferts de stock entre boutiques"
        actions={
          currentCompanyId && (
            <Button onClick={() => setShowCreate(true)} size="sm" className="min-w-[44px] min-h-[44px]">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nouveau transfert</span>
            </Button>
          )
        }
      />

      <Card>
        <div className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            <select
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              className="min-h-[44px] rounded-lg border border-[var(--border-solid)] bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800"
            >
              <option value="">Toutes origines</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <select
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
              className="min-h-[44px] rounded-lg border border-[var(--border-solid)] bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800"
            >
              <option value="">Toutes destinations</option>
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
              <option value="draft">Brouillon</option>
              <option value="pending">En attente</option>
              <option value="approved">Approuvé</option>
              <option value="shipped">Expédié</option>
              <option value="received">Réceptionné</option>
              <option value="cancelled">Annulé</option>
            </select>
            <input
              type="date"
              value={filterFromDate}
              onChange={(e) => setFilterFromDate(e.target.value)}
              className="min-h-[44px] rounded-lg border border-[var(--border-solid)] bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800"
            />
            <input
              type="date"
              value={filterToDate}
              onChange={(e) => setFilterToDate(e.target.value)}
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
          ) : transfers.length === 0 ? (
            <p className="py-8 text-center text-[var(--text-muted)]">
              Aucun transfert. Créez-en un (boutique d’origine → boutique de destination).
            </p>
          ) : (
            <div className="table-responsive -mx-4 sm:mx-0">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-solid)] bg-slate-50 dark:bg-slate-800/50">
                    <th className="p-4 font-medium text-[var(--text-primary)]">Date</th>
                    <th className="p-4 font-medium text-[var(--text-primary)]">Origine</th>
                    <th className="p-4 font-medium text-[var(--text-primary)]">Destination</th>
                    <th className="p-4 font-medium text-[var(--text-primary)]">Statut</th>
                    <th className="p-4 font-medium text-[var(--text-primary)]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.map((t) => (
                    <tr key={t.id} className="border-b border-[var(--border-solid)]">
                      <td className="p-4">{formatDateTime(t.created_at)}</td>
                      <td className="p-4">{t.from_store?.name ?? '—'}</td>
                      <td className="p-4">{t.to_store?.name ?? '—'}</td>
                      <td className="p-4">
                        <Badge
                          variant={
                            t.status === 'received'
                              ? 'success'
                              : t.status === 'shipped'
                                ? 'default'
                                : t.status === 'draft' || t.status === 'cancelled'
                                  ? 'outline'
                                  : 'default'
                          }
                        >
                          {STATUS_LABEL[t.status] ?? t.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setDetailId(t.id)}
                            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-slate-100 dark:hover:bg-slate-800 touch-manipulation"
                            aria-label="Voir"
                          >
                            <Eye className="h-4 w-4" />
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

      {currentCompanyId && showCreate && (
        <CreateTransferDialog
          companyId={currentCompanyId}
          stores={stores}
          open={showCreate}
          onClose={() => setShowCreate(false)}
          onSuccess={() => {}}
        />
      )}

      <TransferDetailDialog
        transferId={detailId}
        companyId={currentCompanyId ?? null}
        open={!!detailId}
        onClose={() => setDetailId(null)}
      />
    </div>
  )
}
