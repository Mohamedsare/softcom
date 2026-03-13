import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Button, Input, Label } from '@/components/ui'
import { Package, ClipboardList } from 'lucide-react'

type AdjustMode = 'delta' | 'inventory'

interface AdjustStockDialogProps {
  open: boolean
  onClose: () => void
  product: { id: string; name: string; sku: string | null; unit: string; currentQty: number }
  storeId: string
  userId: string
  onSuccess: () => void
}

export function AdjustStockDialog({
  open,
  onClose,
  product,
  storeId,
  userId,
  onSuccess,
}: AdjustStockDialogProps) {
  const [mode, setMode] = useState<AdjustMode>('delta')
  const [delta, setDelta] = useState<number | ''>(0)
  const [countedQty, setCountedQty] = useState<number | ''>('')
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setCountedQty(product.currentQty)
      if (mode === 'inventory') setReason('Inventaire')
    }
  }, [open, product.currentQty, mode])

  const computedDelta = mode === 'inventory' && typeof countedQty === 'number'
    ? countedQty - product.currentQty
    : typeof delta === 'number' ? delta : 0
  const needsAdjust = computedDelta !== 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!needsAdjust) {
      setError(mode === 'inventory' ? 'Quantité comptée identique au stock actuel.' : 'Indiquez une variation ou une quantité comptée.')
      return
    }
    setIsSubmitting(true)
    setError(null)
    const adjustReason = reason.trim() || (mode === 'inventory' ? 'Inventaire' : 'Ajustement manuel')
    try {
      const { inventoryApi } = await import('../api/inventoryApi')
      await inventoryApi.adjust(storeId, product.id, computedDelta, adjustReason, userId)
      onSuccess()
      onClose()
      setDelta(0)
      setCountedQty('')
      setReason('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setDelta(0)
    setCountedQty('')
    setReason('')
    setError(null)
    onClose()
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-md max-h-[90vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--border-solid)] bg-[var(--card-bg)] p-6 shadow-xl dialog-content-responsive">
          <Dialog.Title className="text-lg font-semibold text-[var(--text-primary)]">
            Ajuster le stock
          </Dialog.Title>
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-[var(--border-solid)] p-3">
            <div className="h-12 w-12 shrink-0 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Package className="h-6 w-6 text-[var(--text-muted)]" />
            </div>
            <div>
              <p className="font-medium text-[var(--text-primary)]">{product.name}</p>
              <p className="text-sm text-[var(--text-muted)]">
                Stock actuel: {product.currentQty} {product.unit}
              </p>
            </div>
          </div>

          <div className="mt-4 flex rounded-lg border border-[var(--border-solid)] p-1 bg-slate-50 dark:bg-slate-800/50">
            <button
              type="button"
              onClick={() => setMode('delta')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm rounded-md transition-colors ${mode === 'delta' ? 'bg-white dark:bg-slate-700 shadow font-medium' : 'text-[var(--text-muted)]'}`}
            >
              Variation (+/-)
            </button>
            <button
              type="button"
              onClick={() => { setMode('inventory'); setReason('Inventaire') }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm rounded-md transition-colors ${mode === 'inventory' ? 'bg-white dark:bg-slate-700 shadow font-medium' : 'text-[var(--text-muted)]'}`}
            >
              <ClipboardList className="h-4 w-4" />
              Inventaire
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {mode === 'delta' ? (
              <div>
                <Label htmlFor="delta">Variation (positif = entrée, négatif = sortie)</Label>
                <Input
                  id="delta"
                  type="number"
                  value={delta}
                  onChange={(e) => {
                    const v = e.target.value
                    if (v === '') setDelta('')
                    else {
                      const n = parseInt(v, 10)
                      if (!Number.isNaN(n)) setDelta(n)
                    }
                  }}
                  placeholder="Ex: 10 ou -5"
                  className="mt-1"
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="counted">Quantité comptée (inventaire physique)</Label>
                <Input
                  id="counted"
                  type="number"
                  min={0}
                  value={countedQty === '' ? '' : countedQty}
                  onChange={(e) => {
                    const v = e.target.value
                    if (v === '') setCountedQty('')
                    else {
                      const n = parseInt(v, 10)
                      if (!Number.isNaN(n) && n >= 0) setCountedQty(n)
                    }
                  }}
                  placeholder={String(product.currentQty)}
                  className="mt-1"
                />
                {typeof countedQty === 'number' && countedQty !== product.currentQty && (
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Correction : {computedDelta > 0 ? '+' : ''}{computedDelta} {product.unit}
                  </p>
                )}
              </div>
            )}
            <div>
              <Label htmlFor="reason">Raison</Label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={mode === 'inventory' ? 'Inventaire' : 'Ex: Correction, perte'}
                className="mt-1"
              />
            </div>
            {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={isSubmitting || !needsAdjust}>
                {isSubmitting ? 'Enregistrement...' : needsAdjust ? 'Valider' : 'Aucune correction'}
              </Button>
              <Button type="button" variant="secondary" onClick={handleClose}>
                Annuler
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
