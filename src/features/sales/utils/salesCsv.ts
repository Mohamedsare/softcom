import type { Sale } from '../api/salesApi'

function escapeCsvValue(val: string | number): string {
  const s = String(val)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

export function salesToCsv(sales: Sale[]): string {
  const headers = [
    'numero',
    'date',
    'boutique',
    'client',
    'statut',
    'sous_total',
    'remise',
    'tva',
    'total',
  ]
  const rows = sales.map((s) => [
    escapeCsvValue(s.sale_number),
    escapeCsvValue(s.created_at.slice(0, 19)),
    escapeCsvValue(s.store?.name ?? ''),
    escapeCsvValue(s.customer?.name ?? ''),
    escapeCsvValue(s.status),
    String(s.subtotal),
    String(s.discount),
    String(s.tax),
    String(s.total),
  ].join(','))
  return [headers.join(','), ...rows].join('\n')
}

export function downloadSalesCsv(content: string, filename: string): void {
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
