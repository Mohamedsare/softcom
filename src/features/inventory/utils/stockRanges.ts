/**
 * Plages de stock : affichage par quantité (ex. "0", "1-5", "6-10", "11+")
 * pour que le commerçant voie la quantité en stock d'un coup d'œil.
 */
export type StockRangeLevel = 'rupture' | 'low' | 'mid' | 'high'

export interface StockRangeInfo {
  level: StockRangeLevel
  /** Plage de quantité affichée (ex. "0", "1-5", "6-10", "11+") */
  label: string
  variant: 'danger' | 'warning' | 'default' | 'success'
}

/** Seuil utilisé pour les plages quand le seuil produit est 0 (éviter division par 0). */
const FALLBACK_THRESHOLD = 5

/**
 * Calcule la plage de quantité à afficher à partir du stock et du seuil.
 * @param quantity Quantité en stock
 * @param alertThreshold Seuil d'alerte (min du produit ou défaut société)
 */
export function getStockRange(
  quantity: number,
  alertThreshold: number
): StockRangeInfo {
  const threshold = Math.max(0, alertThreshold) || FALLBACK_THRESHOLD
  const q = Math.max(0, quantity)
  let level: StockRangeLevel
  let label: string
  if (q <= 0) {
    level = 'rupture'
    label = '0'
  } else if (q <= threshold) {
    level = 'low'
    label = threshold === 1 ? '1' : `1-${threshold}`
  } else if (q <= 2 * threshold) {
    level = 'mid'
    const from = threshold + 1
    const to = 2 * threshold
    label = from === to ? String(to) : `${from}-${to}`
  } else {
    level = 'high'
    label = `${2 * threshold + 1}+`
  }
  const variant: StockRangeInfo['variant'] =
    level === 'rupture' ? 'danger' : level === 'low' ? 'warning' : level === 'mid' ? 'default' : 'success'
  return { level, label, variant }
}

export function getStockRangeLabel(quantity: number, alertThreshold: number): string {
  return getStockRange(quantity, alertThreshold).label
}

export function getStockRangeVariant(
  quantity: number,
  alertThreshold: number
): 'danger' | 'warning' | 'default' | 'success' {
  return getStockRange(quantity, alertThreshold).variant
}
