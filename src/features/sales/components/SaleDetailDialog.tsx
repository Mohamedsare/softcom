import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useQuery } from '@tanstack/react-query'
import { salesApi } from '../api/salesApi'
import type { Sale } from '../api/salesApi'
import { Button } from '@/components/ui'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Package, Printer } from 'lucide-react'
import { ReceiptTicket } from '@/features/pos/ReceiptTicket'
import { getReceiptWidth } from '@/features/pos/receiptConfig'

interface SaleDetailDialogProps {
  saleId: string | null
  open: boolean
  onClose: () => void
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Brouillon',
  completed: 'Complétée',
  cancelled: 'Annulée',
  refunded: 'Remboursée',
}

const PAYMENT_LABEL: Record<string, string> = {
  cash: 'Espèces',
  mobile_money: 'Mobile money',
  card: 'Carte',
  transfer: 'Virement',
  other: 'Autre',
}

function saleToReceiptData(sale: Sale) {
  return {
    storeName: sale.store?.name ?? 'Boutique',
    saleNumber: sale.sale_number,
    items: (sale.sale_items ?? []).map((item) => ({
      name: item.product?.name ?? 'Article',
      quantity: item.quantity,
      unitPrice: item.unit_price,
      total: item.total,
    })),
    subtotal: sale.subtotal,
    discount: sale.discount,
    total: sale.total,
    date: new Date(sale.created_at),
    widthMm: getReceiptWidth(),
  }
}

export function SaleDetailDialog({ saleId, open, onClose }: SaleDetailDialogProps) {
  const [reprintOpen, setReprintOpen] = useState(false)
  const { data: sale, isLoading } = useQuery({
    queryKey: ['sale', saleId],
    queryFn: () => salesApi.get(saleId!),
    enabled: open && !!saleId,
  })

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--border-solid)] bg-[var(--card-bg)] p-6 shadow-xl">
          <Dialog.Title className="text-lg font-semibold text-[var(--text-primary)]">
            Détail vente {sale?.sale_number}
          </Dialog.Title>
          {isLoading ? (
            <p className="py-8 text-center text-[var(--text-muted)]">Chargement...</p>
          ) : sale ? (
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100 dark:bg-slate-800">
                  {STATUS_LABEL[sale.status] ?? sale.status}
                </span>
                {sale.store && (
                  <span className="text-[var(--text-muted)]">{sale.store.name}</span>
                )}
                {sale.customer && (
                  <span className="text-[var(--text-muted)]">{sale.customer.name}</span>
                )}
              </div>
              <p className="text-sm text-[var(--text-muted)]">
                {formatDateTime(sale.created_at)}
              </p>

              {sale.sale_items && sale.sale_items.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-[var(--text-primary)] mb-2">Articles</h3>
                  <ul className="space-y-2 rounded-lg border border-[var(--border-solid)] p-4">
                    {sale.sale_items.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between gap-2 text-sm"
                      >
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

              {sale.sale_payments && sale.sale_payments.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-[var(--text-primary)] mb-2">Paiements</h3>
                  <ul className="space-y-1 text-sm">
                    {sale.sale_payments.map((p) => (
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

              <div className="border-t border-[var(--border-solid)] pt-4 space-y-1 text-sm">
                {sale.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Remise</span>
                    <span>-{formatCurrency(sale.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(sale.total)}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {sale.status === 'completed' && sale.sale_items && sale.sale_items.length > 0 && (
                  <Button
                    variant="secondary"
                    onClick={() => setReprintOpen(true)}
                    className="inline-flex items-center gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    Réimprimer le ticket
                  </Button>
                )}
                <Button variant="secondary" onClick={onClose}>
                  Fermer
                </Button>
              </div>
            </div>
          ) : (
            <p className="py-8 text-center text-[var(--text-muted)]">Vente introuvable</p>
          )}
        </Dialog.Content>
      </Dialog.Portal>

      {/* Modal réimpression ticket */}
      {reprintOpen && sale && (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-start bg-black/50 p-4 pt-16 overflow-auto print:bg-transparent print:p-0 print:pt-0"
          aria-modal="true"
          aria-label="Réimpression du ticket"
        >
          <div className="bg-[var(--card-bg)] rounded-xl shadow-xl flex flex-col items-center gap-4 print:bg-transparent print:shadow-none print:block">
            <ReceiptTicket {...saleToReceiptData(sale)} />
            <div className="flex gap-2 no-print">
              <Button onClick={() => window.print()} className="inline-flex items-center gap-2">
                <Printer className="h-4 w-4" />
                Imprimer
              </Button>
              <Button variant="secondary" onClick={() => setReprintOpen(false)}>
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </Dialog.Root>
  )
}
