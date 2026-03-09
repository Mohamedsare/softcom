import type { Product } from '../api/productsApi'

const SEP = ','
const QUOTE = '"'

function escapeCsvValue(val: string): string {
  if (val.includes(SEP) || val.includes(QUOTE) || val.includes('\n')) {
    return QUOTE + val.replace(/"/g, '""') + QUOTE
  }
  return val
}

export function productsToCsv(products: Product[]): string {
  const headers = [
    'nom',
    'sku',
    'code_barres',
    'unite',
    'prix_achat',
    'prix_vente',
    'prix_min',
    'stock_min',
    'description',
    'actif',
    'categorie',
    'marque',
  ]
  const rows = products.map((p) => [
    escapeCsvValue(p.name),
    escapeCsvValue(p.sku ?? ''),
    escapeCsvValue(p.barcode ?? ''),
    escapeCsvValue(p.unit),
    String(p.purchase_price),
    String(p.sale_price),
    p.min_price != null ? String(p.min_price) : '',
    String(p.stock_min),
    escapeCsvValue(p.description ?? ''),
    p.is_active ? '1' : '0',
    escapeCsvValue(p.category?.name ?? ''),
    escapeCsvValue(p.brand?.name ?? ''),
  ].join(SEP))
  return [headers.join(SEP), ...rows].join('\n')
}

export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Parse CSV text into rows, handling quoted fields (RFC 4180 basics). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === QUOTE) {
        if (text[i + 1] === QUOTE) {
          cell += QUOTE
          i++
        } else {
          inQuotes = false
        }
      } else {
        cell += c
      }
    } else {
      if (c === QUOTE) {
        inQuotes = true
      } else if (c === SEP) {
        row.push(cell)
        cell = ''
      } else if (c === '\n' || c === '\r') {
        row.push(cell)
        cell = ''
        rows.push(row)
        row = []
        if (c === '\r' && text[i + 1] === '\n') i++
      } else {
        cell += c
      }
    }
  }
  row.push(cell)
  if (row.length > 1 || row[0] !== '') rows.push(row)
  return rows
}

export interface CsvProductRow {
  name: string
  sku: string | null
  barcode: string | null
  unit: string
  purchase_price: number
  sale_price: number
  min_price: number | null
  stock_min: number
  description: string | null
  is_active: boolean
  category: string | null
  brand: string | null
}

const HEADER_MAP: Record<string, keyof CsvProductRow> = {
  nom: 'name',
  name: 'name',
  sku: 'sku',
  code_barres: 'barcode',
  barcode: 'barcode',
  unite: 'unit',
  unit: 'unit',
  prix_achat: 'purchase_price',
  purchase_price: 'purchase_price',
  prix_vente: 'sale_price',
  sale_price: 'sale_price',
  prix_min: 'min_price',
  min_price: 'min_price',
  stock_min: 'stock_min',
  description: 'description',
  actif: 'is_active',
  is_active: 'is_active',
  active: 'is_active',
  categorie: 'category',
  category: 'category',
  marque: 'brand',
  brand: 'brand',
}

export function parseProductsCsv(text: string): CsvProductRow[] {
  const raw = parseCsv(text)
  if (raw.length < 2) return []
  const headerRow = raw[0].map((h) => h.trim().toLowerCase())
  const colIndex: Partial<Record<keyof CsvProductRow, number>> = {}
  for (let i = 0; i < headerRow.length; i++) {
    const key = HEADER_MAP[headerRow[i]]
    if (key !== undefined) colIndex[key] = i
  }
  if (colIndex.name === undefined) return []
  const rows: CsvProductRow[] = []
  for (let r = 1; r < raw.length; r++) {
    const row = raw[r]
    const name = (row[colIndex.name!] ?? '').trim()
    if (!name) continue
    const num = (idx: number | undefined) => {
      const v = row[idx ?? -1]?.trim()
      if (v === '' || v == null) return null
      const n = parseFloat(v.replace(',', '.'))
      return Number.isNaN(n) ? null : n
    }
    const boolVal = (idx: number | undefined) => {
      const v = (row[idx ?? -1] ?? '').trim().toLowerCase()
      return v === '1' || v === 'true' || v === 'oui' || v === 'yes'
    }
    rows.push({
      name,
      sku: (row[colIndex.sku ?? -1] ?? '').trim() || null,
      barcode: (row[colIndex.barcode ?? -1] ?? '').trim() || null,
      unit: (row[colIndex.unit ?? -1] ?? 'pce').trim() || 'pce',
      purchase_price: num(colIndex.purchase_price) ?? 0,
      sale_price: num(colIndex.sale_price) ?? 0,
      min_price: num(colIndex.min_price),
      stock_min: num(colIndex.stock_min) ?? 0,
      description: (row[colIndex.description ?? -1] ?? '').trim() || null,
      is_active: boolVal(colIndex.is_active),
      category: (row[colIndex.category ?? -1] ?? '').trim() || null,
      brand: (row[colIndex.brand ?? -1] ?? '').trim() || null,
    })
  }
  return rows
}
