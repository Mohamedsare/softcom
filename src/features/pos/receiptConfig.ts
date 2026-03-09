const STORAGE_KEY = 'fasostock_receipt_width_mm'
export type ReceiptWidthMm = 58 | 80

export function getReceiptWidth(): ReceiptWidthMm {
  const v = localStorage.getItem(STORAGE_KEY)
  if (v === '58' || v === '80') return Number(v) as ReceiptWidthMm
  return 80
}

export function setReceiptWidth(mm: ReceiptWidthMm): void {
  localStorage.setItem(STORAGE_KEY, String(mm))
}
