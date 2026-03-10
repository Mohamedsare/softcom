import { getReceiptWidth, type ReceiptWidthMm } from './receiptConfig'

export interface ReceiptItem {
  name: string
  quantity: number
  unitPrice: number
  total: number
}

export interface ReceiptTicketProps {
  storeName: string
  storeAddress?: string | null
  storePhone?: string | null
  saleNumber: string
  items: ReceiptItem[]
  subtotal: number
  discount: number
  total: number
  paymentMethod?: string
  amountReceived?: number
  change?: number
  date?: Date
  widthMm?: ReceiptWidthMm
}

const formatXof = (n: number) => `${n.toLocaleString('fr-FR')} XOF`

/** Ligne de séparation type ticket thermique */
function Separator() {
  return (
    <div className="border-t border-dashed border-black/50 my-1.5" aria-hidden />
  )
}

/** Tronque le nom du produit pour tenir sur une ligne ticket (env. 20–24 car selon largeur) */
function truncateName(name: string, maxLen: number): string {
  if (name.length <= maxLen) return name
  return name.slice(0, maxLen - 1) + '…'
}

export function ReceiptTicket({
  storeName,
  storeAddress,
  storePhone,
  saleNumber,
  items,
  subtotal,
  discount,
  total,
  paymentMethod = 'Espèces',
  amountReceived,
  change,
  date = new Date(),
  widthMm,
}: ReceiptTicketProps) {
  const mm = widthMm ?? getReceiptWidth()
  const widthClass = mm === 58 ? 'print-receipt-58' : 'print-receipt-80'
  const maxNameLen = mm === 58 ? 18 : 26
  const dateObj = date instanceof Date ? date : new Date(date)
  const dateStr = dateObj.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const timeStr = dateObj.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  return (
    <div
      className={`print-receipt receipt-ticket font-mono text-black bg-white ${widthClass} mx-auto no-print:w-full no-print:max-w-[320px] no-print:border no-print:border-[var(--border-solid)] no-print:rounded-lg no-print:shadow-lg`}
      aria-label="Ticket de caisse"
      style={{ fontSize: mm === 58 ? '11px' : '12px' }}
    >
      <div className="receipt-ticket-inner p-4">
        {/* En-tête boutique */}
        <div className="text-center">
          <h1 className="text-base font-bold uppercase tracking-tight leading-tight">
            {storeName}
          </h1>
          {storeAddress && (
            <p className="text-[10px] text-black/80 mt-1 leading-tight break-words px-0.5">
              {storeAddress}
            </p>
          )}
          {storePhone && (
            <p className="text-[10px] text-black/80">Tél. {storePhone}</p>
          )}
        </div>
        <Separator />

        {/* Référence et date */}
        <div className="flex justify-between text-[10px] text-black/80">
          <span>N° {saleNumber}</span>
          <span>{dateStr}</span>
        </div>
        <div className="text-[10px] text-black/80 text-right">{timeStr}</div>
        <Separator />

        {/* En-tête colonnes articles */}
        <div className="grid grid-cols-[1fr_auto_auto] gap-2 text-[10px] text-black/70 uppercase tracking-tight mb-1">
          <span>Désignation</span>
          <span className="text-right tabular-nums">Qté</span>
          <span className="text-right tabular-nums w-20">Total</span>
        </div>

        {/* Lignes articles */}
        <div className="space-y-1.5 text-[11px]">
          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto_auto] gap-2 leading-tight">
              <span className="min-w-0">
                {truncateName(item.name, maxNameLen)}
                {item.quantity > 1 && (
                  <span className="text-black/60"> @ {formatXof(item.unitPrice)}</span>
                )}
              </span>
              <span className="text-right tabular-nums">{item.quantity}</span>
              <span className="text-right tabular-nums w-20">{formatXof(item.total)}</span>
            </div>
          ))}
        </div>
        <Separator />

        {/* Totaux */}
        <div className="space-y-0.5 text-[11px]">
          <div className="flex justify-between">
            <span>Sous-total</span>
            <span className="tabular-nums">{formatXof(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-black/80">
              <span>Remise</span>
              <span className="tabular-nums">-{formatXof(discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-sm mt-2 pt-1.5 border-t-2 border-black">
            <span>TOTAL TTC</span>
            <span className="tabular-nums">{formatXof(total)}</span>
          </div>
        </div>

        {/* Paiement */}
        <div className="mt-2 text-[10px] text-black/80">
          <div className="flex justify-between">
            <span>Mode de paiement</span>
            <span>{paymentMethod}</span>
          </div>
          {amountReceived != null && amountReceived > 0 && (
            <>
              <div className="flex justify-between">
                <span>Montant reçu</span>
                <span className="tabular-nums">{formatXof(amountReceived)}</span>
              </div>
              {change != null && change >= 0 && (
                <div className="flex justify-between font-medium">
                  <span>Monnaie rendue</span>
                  <span className="tabular-nums">{formatXof(change)}</span>
                </div>
              )}
            </>
          )}
        </div>
        <Separator />

        {/* Pied de page */}
        <p className="text-center text-[11px] font-medium py-1">
          Merci pour votre confiance
        </p>
        <p className="text-center text-[9px] text-black/50">
          — FasoStock —
        </p>
      </div>
    </div>
  )
}
