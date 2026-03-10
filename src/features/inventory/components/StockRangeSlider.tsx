import { getStockRange } from '../utils/stockRanges'

/** Couleurs de la barre selon le niveau de stock (remplissage + bordure) */
const STYLE_BY_VARIANT = {
  danger: {
    fill: 'bg-red-500',
    track: 'bg-red-500/20',
    glow: 'shadow-[0_0_8px_rgba(239,68,68,0.4)]',
  },
  warning: {
    fill: 'bg-amber-500',
    track: 'bg-amber-500/20',
    glow: 'shadow-[0_0_8px_rgba(245,158,11,0.4)]',
  },
  default: {
    fill: 'bg-slate-400 dark:bg-slate-500',
    track: 'bg-slate-300/30 dark:bg-slate-600/30',
    glow: 'shadow-[0_0_6px_rgba(100,116,139,0.35)]',
  },
  success: {
    fill: 'bg-emerald-500',
    track: 'bg-emerald-500/20',
    glow: 'shadow-[0_0_8px_rgba(34,197,94,0.4)]',
  },
} as const

interface StockRangeSliderProps {
  quantity: number
  alertThreshold: number
  className?: string
}

/**
 * Affiche le niveau de stock avec une barre de progression colorée :
 * rouge (rupture), orange (faible), gris (moyen), vert (bon).
 */
export function StockRangeSlider({
  quantity,
  alertThreshold,
  className = '',
}: StockRangeSliderProps) {
  const threshold = Math.max(0, Number(alertThreshold) || 5)
  const qty = Math.max(0, Number(quantity))
  const max = Math.max(qty, 2 * threshold, 10)
  const percent = max > 0 ? Math.min(100, (qty / max) * 100) : 0
  const range = getStockRange(qty, threshold)
  const style = STYLE_BY_VARIANT[range.variant] ?? STYLE_BY_VARIANT.default

  return (
    <div className={`flex items-center gap-3 min-w-0 ${className}`}>
      <span
        className="font-semibold tabular-nums shrink-0 w-8 text-right text-[var(--text-primary)]"
        title={`${qty} en stock`}
      >
        {qty}
      </span>
      <div className="w-[120px] min-w-[120px] shrink-0">
        <div
          className={`h-[10px] rounded-full overflow-hidden ${style.track}`}
          role="progressbar"
          aria-valuenow={qty}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={`Stock : ${qty}`}
        >
          <div
            className={`h-full rounded-full transition-all duration-300 ${style.fill} ${percent > 0 ? style.glow : ''}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  )
}
