import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Button, Input, Label } from '@/components/ui'
import { Package } from 'lucide-react'

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
  const [delta, setDelta] = useState<number | ''>(0)
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (typeof delta !== 'number' || delta === 0) {
      setError('Indiquez une quantité (positive ou négative)')
      return
    }
    setIsSubmitting(true)
    setError(null)
    try {
      const { inventoryApi } = await import('../api/inventoryApi')
      await inventoryApi.adjust(storeId, product.id, delta, reason.trim() || 'Ajustement manuel', userId)
      onSuccess()
      onClose()
      setDelta(0)
      setReason('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setDelta(0)
    setReason('')
    setError(null)
    onClose()
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--border-solid)] bg-[var(--card-bg)] p-6 shadow-xl">
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
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
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
            <div>
              <Label htmlFor="reason">Raison</Label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Inventaire, correction, perte"
                className="mt-1"
              />
            </div>
            {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={isSubmitting || delta === 0 || delta === ''}>
                {isSubmitting ? 'Enregistrement...' : 'Valider'}
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
