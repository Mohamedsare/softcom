import type { InventoryItem } from '../api/inventoryApi'

function escapeCsvValue(val: string | number): string {
  const s = String(val)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

export function inventoryToCsv(items: InventoryItem[]): string {
  const headers = [
    'produit',
    'sku',
    'code_barres',
    'quantite',
    'reserve',
    'stock_min',
    'unite',
    'statut',
  ]
  const rows = items.map((i) => {
    const p = i.product
    const min = p?.stock_min ?? 0
    const qty = i.quantity
    let statut = 'OK'
    if (qty === 0) statut = 'Rupture'
    else if (min > 0 && qty <= min) statut = 'Sous le min'
    return [
      escapeCsvValue(p?.name ?? ''),
      escapeCsvValue(p?.sku ?? ''),
      escapeCsvValue(p?.barcode ?? ''),
      String(qty),
      String(i.reserved_quantity),
      String(min),
      escapeCsvValue(p?.unit ?? 'pce'),
      statut,
    ].join(',')
  })
  return [headers.join(','), ...rows].join('\n')
}

export function downloadInventoryCsv(content: string, filename: string): void {
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
