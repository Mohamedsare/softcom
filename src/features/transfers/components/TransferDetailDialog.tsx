import * as Dialog from '@radix-ui/react-dialog'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui'
import { transfersApi } from '../api/transfersApi'
import { formatDateTime } from '@/lib/utils'
import { Package, Truck, CheckCircle, XCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'

interface TransferDetailDialogProps {
  transferId: string | null
  companyId: string | null
  open: boolean
  onClose: () => void
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Brouillon',
  pending: 'En attente',
  approved: 'Approuvé',
  shipped: 'Expédié',
  received: 'Réceptionné',
  rejected: 'Rejeté',
  cancelled: 'Annulé',
}

export function TransferDetailDialog({
  transferId,
  companyId,
  open,
  onClose,
}: TransferDetailDialogProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: transfer, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['transfer', transferId],
    queryFn: () => transfersApi.get(transferId!),
    enabled: open && !!transferId,
  })

  const shipMutation = useMutation({
    mutationFn: () => transfersApi.ship(transferId!, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers', companyId] })
      queryClient.invalidateQueries({ queryKey: ['transfer', transferId] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      toast.success('Transfert expédié')
      onClose()
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erreur'),
  })

  const receiveMutation = useMutation({
    mutationFn: () => transfersApi.receive(transferId!, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers', companyId] })
      queryClient.invalidateQueries({ queryKey: ['transfer', transferId] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      toast.success('Transfert réceptionné')
      onClose()
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erreur'),
  })

  const cancelMutation = useMutation({
    mutationFn: () => transfersApi.cancel(transferId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers', companyId] })
      queryClient.invalidateQueries({ queryKey: ['transfer', transferId] })
      toast.success('Transfert annulé')
      onClose()
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erreur'),
  })

  const canShip =
    transfer &&
    (transfer.status === 'draft' || transfer.status === 'approved') &&
    user
  const canReceive = transfer && transfer.status === 'shipped' && user
  const canCancel =
    transfer && (transfer.status === 'draft' || transfer.status === 'pending')

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--border-solid)] bg-[var(--card-bg)] p-6 shadow-xl">
          <Dialog.Title className="text-lg font-semibold text-[var(--text-primary)]">
            Détail transfert
          </Dialog.Title>
          {isError ? (
            <div className="py-6 flex flex-col items-center gap-3 text-center">
              <p className="text-sm text-[var(--danger)]">
                {error instanceof Error ? error.message : 'Erreur lors du chargement.'}
              </p>
              <Button variant="secondary" size="sm" onClick={() => refetch()}>
                Réessayer
              </Button>
            </div>
          ) : isLoading ? (
            <p className="py-8 text-center text-[var(--text-muted)]">Chargement...</p>
          ) : transfer ? (
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100 dark:bg-slate-800">
                  {STATUS_LABEL[transfer.status] ?? transfer.status}
                </span>
                {transfer.from_store && (
                  <span className="text-[var(--text-muted)]">
                    {transfer.from_store.name} → {transfer.to_store?.name ?? ''}
                  </span>
                )}
              </div>
              <p className="text-sm text-[var(--text-muted)]">
                Créé le {formatDateTime(transfer.created_at)}
                {transfer.shipped_at && (
                  <> · Expédié le {formatDateTime(transfer.shipped_at)}</>
                )}
                {transfer.received_at && (
                  <> · Réceptionné le {formatDateTime(transfer.received_at)}</>
                )}
              </p>

              {transfer.stock_transfer_items && transfer.stock_transfer_items.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-[var(--text-primary)] mb-2">
                    Lignes
                  </h3>
                  <ul className="space-y-2 rounded-lg border border-[var(--border-solid)] p-4">
                    {transfer.stock_transfer_items.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between gap-2 text-sm"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-8 w-8 shrink-0 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <Package className="h-4 w-4 text-[var(--text-muted)]" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">
                              {item.product?.name ?? '—'}
                            </p>
                            <p className="text-xs text-[var(--text-muted)]">
                              Demandé: {item.quantity_requested}
                              {item.quantity_shipped > 0 &&
                                ` · Expédié: ${item.quantity_shipped}`}
                              {item.quantity_received > 0 &&
                                ` · Reçu: ${item.quantity_received}`}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--border-solid)]">
                {canShip && (
                  <Button
                    size="sm"
                    onClick={() => {
                      if (
                        confirm(
                          'Expédier ce transfert ? Le stock de la boutique d\'origine sera décrémenté.'
                        )
                      ) {
                        shipMutation.mutate()
                      }
                    }}
                    disabled={shipMutation.isPending}
                  >
                    <Truck className="h-4 w-4" />
                    Expédier
                  </Button>
                )}
                {canReceive && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      if (
                        confirm(
                          'Réceptionner ce transfert ? Le stock de la boutique de destination sera incrémenté.'
                        )
                      ) {
                        receiveMutation.mutate()
                      }
                    }}
                    disabled={receiveMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Réceptionner
                  </Button>
                )}
                {canCancel && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      if (confirm('Annuler ce transfert ?')) cancelMutation.mutate()
                    }}
                    disabled={cancelMutation.isPending}
                    className="text-[var(--danger)]"
                  >
                    <XCircle className="h-4 w-4" />
                    Annuler le transfert
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <p className="py-8 text-center text-[var(--text-muted)]">
              Transfert introuvable.
            </p>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
