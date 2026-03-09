import { getReceiptWidth, type ReceiptWidthMm } from './receiptConfig'

export interface ReceiptItem {
  name: string
  quantity: number
  unitPrice: number
  total: number
}

export interface ReceiptTicketProps {
  storeName: string
  saleNumber: string
  items: ReceiptItem[]
  subtotal: number
  discount: number
  total: number
  date?: Date
  widthMm?: ReceiptWidthMm
}

const formatXof = (n: number) => `${n.toLocaleString('fr-FR')} XOF`

function Line() {
  return <div className="border-b border-dashed border-black/60 my-1" aria-hidden />
}

export function ReceiptTicket({
  storeName,
  saleNumber,
  items,
  subtotal,
  discount,
  total,
  date = new Date(),
  widthMm,
}: ReceiptTicketProps) {
  const mm = widthMm ?? getReceiptWidth()
  const widthClass = mm === 58 ? 'print-receipt-58' : 'print-receipt-80'
  const dateStr = date instanceof Date ? date : new Date(date)
  const dateFormatted = dateStr.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const timeFormatted = dateStr.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  return (
    <div
      className={`print-receipt receipt-ticket font-mono ${widthClass} bg-white text-black mx-auto no-print:w-full no-print:max-w-[320px] no-print:border no-print:border-[var(--border-solid)] no-print:rounded-lg`}
      aria-label="Ticket de caisse"
    >
      <div className="receipt-ticket-inner p-3 sm:p-4">
        {/* En-tête type ticket pro */}
        <div className="text-center mb-2">
          <div className="text-[10px] tracking-widest text-black/70 mb-0.5">
            ─────────────────
          </div>
          <p className="text-[10px] uppercase tracking-widest font-semibold mb-1">
            Ticket de caisse
          </p>
          <div className="text-[10px] tracking-widest text-black/70 mb-1">
            ─────────────────
          </div>
          <p className="font-bold text-sm uppercase tracking-tight">
            {storeName}
          </p>
          <p className="text-[10px] mt-1 text-black/80">
            N° {saleNumber}
          </p>
          <p className="text-[10px] text-black/80">
            {dateFormatted}  {timeFormatted}
          </p>
          <Line />
        </div>

        {/* Articles */}
        <div className="space-y-1 text-xs mb-2">
          {items.map((item, i) => (
            <div key={i} className="flex justify-between gap-2 leading-tight">
              <span className="min-w-0 flex-1">
                {item.quantity} x {item.name}
              </span>
              <span className="shrink-0 tabular-nums">{formatXof(item.total)}</span>
            </div>
          ))}
        </div>
        <Line />

        {/* Totaux */}
        <div className="space-y-0.5 text-xs mb-2">
          <div className="flex justify-between">
            <span>Sous-total</span>
            <span className="tabular-nums">{formatXof(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between">
              <span>Remise</span>
              <span className="tabular-nums">-{formatXof(discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-sm mt-1.5 pt-1 border-t border-black/80">
            <span>TOTAL</span>
            <span className="tabular-nums">{formatXof(total)}</span>
          </div>
        </div>
        <Line />

        {/* Pied */}
        <p className="text-center text-[10px] text-black/70 py-1">
          Merci pour votre achat
        </p>
        <p className="text-center text-[9px] text-black/50">
          FasoStock
        </p>
        <div className="text-[10px] tracking-widest text-black/50 text-center mt-1">
          ─────────────────
        </div>
      </div>
    </div>
  )
}
