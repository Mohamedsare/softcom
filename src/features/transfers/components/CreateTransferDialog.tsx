import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Input, Label } from '@/components/ui'
import { Plus, Trash2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { productsApi } from '@/features/products/api/productsApi'
import { transfersApi, type CreateTransferInput } from '../api/transfersApi'
import { toast } from 'sonner'

interface CreateTransferDialogProps {
  companyId: string
  stores: Array<{ id: string; name: string }>
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

interface LineItem {
  product_id: string
  productName: string
  quantity_requested: number
}

export function CreateTransferDialog({
  companyId,
  stores,
  open,
  onClose,
  onSuccess,
}: CreateTransferDialogProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [fromStoreId, setFromStoreId] = useState(stores[0]?.id ?? '')
  const [toStoreId, setToStoreId] = useState(stores[1]?.id ?? stores[0]?.id ?? '')
  const [lines, setLines] = useState<LineItem[]>([
    { product_id: '', productName: '', quantity_requested: 0 },
  ])

  const { data: products = [] } = useQuery({
    queryKey: ['products', companyId],
    queryFn: () => productsApi.list(companyId),
    enabled: open && !!companyId,
  })

  const createMutation = useMutation({
    mutationFn: () => {
      const items = lines
        .filter((l) => l.product_id && l.quantity_requested > 0)
        .map((l) => ({ product_id: l.product_id, quantity_requested: l.quantity_requested }))
      if (items.length === 0) throw new Error('Ajoutez au moins une ligne avec produit et quantité > 0')
      if (!fromStoreId) throw new Error('Sélectionnez la boutique d\'origine')
      if (!toStoreId) throw new Error('Sélectionnez la boutique de destination')
      if (fromStoreId === toStoreId) throw new Error('Origine et destination doivent être différentes')

      const input: CreateTransferInput = {
        company_id: companyId,
        from_store_id: fromStoreId,
        to_store_id: toStoreId,
        items,
      }
      return transfersApi.create(input, user!.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers', companyId] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      toast.success('Transfert créé (brouillon)')
      onSuccess()
      onClose()
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erreur'),
  })

  const addLine = () => {
    setLines((prev) => [...prev, { product_id: '', productName: '', quantity_requested: 0 }])
  }

  const removeLine = (i: number) => {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== i)))
  }

  const updateLine = (i: number, field: keyof LineItem, value: string | number) => {
    setLines((prev) => {
      const next = [...prev]
      if (field === 'product_id') {
        const p = products.find((x) => x.id === value)
        next[i] = {
          ...next[i],
          product_id: String(value),
          productName: p?.name ?? '',
          quantity_requested: next[i].quantity_requested,
        }
      } else {
        next[i] = { ...next[i], [field]: value }
      }
      return next
    })
  }

  const canSubmit =
    fromStoreId &&
    toStoreId &&
    fromStoreId !== toStoreId &&
    lines.some((l) => l.product_id && l.quantity_requested > 0)

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--border-solid)] bg-[var(--card-bg)] p-6 shadow-xl">
          <Dialog.Title className="text-lg font-semibold text-[var(--text-primary)]">
            Nouveau transfert
          </Dialog.Title>

          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-1 block">Boutique d’origine *</Label>
                <select
                  value={fromStoreId}
                  onChange={(e) => setFromStoreId(e.target.value)}
                  className="w-full min-h-[44px] rounded-lg border border-[var(--border-solid)] bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800"
                >
                  <option value="">—</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="mb-1 block">Boutique de destination *</Label>
                <select
                  value={toStoreId}
                  onChange={(e) => setToStoreId(e.target.value)}
                  className="w-full min-h-[44px] rounded-lg border border-[var(--border-solid)] bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800"
                >
                  <option value="">—</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
            {fromStoreId && toStoreId && fromStoreId === toStoreId && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Choisissez deux boutiques différentes.
              </p>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Lignes (produit + quantité demandée)</Label>
                <Button type="button" size="sm" variant="secondary" onClick={addLine}>
                  <Plus className="h-4 w-4" />
                  Ligne
                </Button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto rounded-lg border border-[var(--border-solid)] p-3">
                {lines.map((line, i) => (
                  <div
                    key={i}
                    className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 p-2"
                  >
                    <select
                      value={line.product_id}
                      onChange={(e) => updateLine(i, 'product_id', e.target.value)}
                      className="flex-1 min-w-[120px] min-h-[40px] rounded border border-[var(--border-solid)] bg-white dark:bg-slate-800 px-2 text-sm"
                    >
                      <option value="">Produit</option>
                      {products
                        .filter((p) => p.is_active)
                        .map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                    <Input
                      type="number"
                      min={1}
                      value={line.quantity_requested || ''}
                      onChange={(e) =>
                        updateLine(i, 'quantity_requested', parseInt(e.target.value, 10) || 0)
                      }
                      placeholder="Qté"
                      className="w-24 min-h-[40px]"
                    />
                    <button
                      type="button"
                      onClick={() => removeLine(i)}
                      className="p-2 text-[var(--danger)] hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!canSubmit || createMutation.isPending}
              >
                {createMutation.isPending ? 'Création...' : 'Enregistrer (brouillon)'}
              </Button>
              <Button type="button" variant="secondary" onClick={onClose}>
                Annuler
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
