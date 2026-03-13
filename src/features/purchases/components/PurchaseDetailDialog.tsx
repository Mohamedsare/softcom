import * as Dialog from '@radix-ui/react-dialog'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui'
import { purchasesApi } from '../api/purchasesApi'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Package } from 'lucide-react'

interface PurchaseDetailDialogProps {
  purchaseId: string | null
  open: boolean
  onClose: () => void
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Brouillon',
  confirmed: 'Confirmé',
  partially_received: 'Partiellement reçu',
  received: 'Reçu',
  cancelled: 'Annulé',
}

const PAYMENT_LABEL: Record<string, string> = {
  cash: 'Espèces',
  mobile_money: 'Mobile money',
  card: 'Carte',
  transfer: 'Virement',
  other: 'Autre',
}

export function PurchaseDetailDialog({ purchaseId, open, onClose }: PurchaseDetailDialogProps) {
  const { data: purchase, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['purchase', purchaseId],
    queryFn: () => purchasesApi.get(purchaseId!),
    enabled: open && !!purchaseId,
  })

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--border-solid)] bg-[var(--card-bg)] p-6 shadow-xl">
          <Dialog.Title className="text-lg font-semibold text-[var(--text-primary)]">
            Détail achat {purchase?.reference ?? ''}
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
          ) : purchase ? (
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100 dark:bg-slate-800">
                  {STATUS_LABEL[purchase.status] ?? purchase.status}
                </span>
                {purchase.store && <span className="text-[var(--text-muted)]">{purchase.store.name}</span>}
                {purchase.supplier && (
                  <span className="text-[var(--text-muted)]">{purchase.supplier.name}</span>
                )}
              </div>
              <p className="text-sm text-[var(--text-muted)]">{formatDateTime(purchase.created_at)}</p>

              {purchase.purchase_items && purchase.purchase_items.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-[var(--text-primary)] mb-2">Articles</h3>
                  <ul className="space-y-2 rounded-lg border border-[var(--border-solid)] p-4">
                    {purchase.purchase_items.map((item) => (
                      <li key={item.id} className="flex items-center justify-between gap-2 text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-8 w-8 shrink-0 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <Package className="h-4 w-4 text-[var(--text-muted)]" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{item.product?.name ?? '—'}</p>
                            <p className="text-xs text-[var(--text-muted)]">
                              {item.quantity} × {formatCurrency(item.unit_price)}
                            </p>
                          </div>
                        </div>
                        <span className="font-medium shrink-0">{formatCurrency(item.total)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {purchase.purchase_payments && purchase.purchase_payments.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-[var(--text-primary)] mb-2">Paiements</h3>
                  <ul className="space-y-1 text-sm">
                    {purchase.purchase_payments.map((p) => (
                      <li key={p.id} className="flex justify-between">
                        <span className="text-[var(--text-muted)]">
                          {PAYMENT_LABEL[p.method] ?? p.method}
                        </span>
                        <span>{formatCurrency(p.amount)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="border-t border-[var(--border-solid)] pt-4 flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>{formatCurrency(purchase.total)}</span>
              </div>

              <div className="pt-2">
                <Button variant="secondary" onClick={onClose}>
                  Fermer
                </Button>
              </div>
            </div>
          ) : (
            <p className="py-8 text-center text-[var(--text-muted)]">Achat introuvable</p>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
