import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Input, Label } from '@/components/ui'
import { Plus, Trash2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { productsApi } from '@/features/products/api/productsApi'
import { suppliersApi } from '@/features/suppliers/api/suppliersApi'
import { purchasesApi, type PaymentMethod } from '../api/purchasesApi'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

interface CreatePurchaseDialogProps {
  companyId: string
  storeId: string | null
  stores: Array<{ id: string; name: string }>
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

interface LineItem {
  product_id: string
  productName: string
  productUnit: string
  quantity: number
  unit_price: number
}

export function CreatePurchaseDialog({
  companyId,
  storeId,
  stores,
  open,
  onClose,
  onSuccess,
}: CreatePurchaseDialogProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [selectedStoreId, setSelectedStoreId] = useState(storeId ?? stores[0]?.id ?? '')
  const [supplierId, setSupplierId] = useState('')
  const [reference, setReference] = useState('')
  const [lines, setLines] = useState<LineItem[]>([
    { product_id: '', productName: '', productUnit: 'pce', quantity: 0, unit_price: 0 },
  ])
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('transfer')
  const [paymentAmount, setPaymentAmount] = useState<number | ''>(0)

  const { data: products = [] } = useQuery({
    queryKey: ['products', companyId],
    queryFn: () => productsApi.list(companyId!),
    enabled: open && !!companyId,
  })

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers', companyId],
    queryFn: () => suppliersApi.list(companyId),
    enabled: open && !!companyId,
  })

  const createMutation = useMutation({
    mutationFn: () => {
      const items = lines
        .filter((l) => l.product_id && l.quantity > 0 && l.unit_price >= 0)
        .map((l) => ({
          product_id: l.product_id,
          quantity: l.quantity,
          unit_price: l.unit_price,
        }))
      if (items.length === 0) throw new Error('Ajoutez au moins un article')
      if (!supplierId) throw new Error('Sélectionnez un fournisseur')
      if (!selectedStoreId) throw new Error('Sélectionnez une boutique')

      const payments =
        paymentAmount && Number(paymentAmount) > 0
          ? [{ method: paymentMethod as PaymentMethod, amount: Number(paymentAmount) }]
          : undefined

      return purchasesApi.create(
        {
          company_id: companyId,
          store_id: selectedStoreId,
          supplier_id: supplierId,
          reference: reference.trim() || undefined,
          items,
          payments,
        },
        user!.id
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases', companyId] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      toast.success('Achat créé')
      onSuccess()
      onClose()
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erreur'),
  })

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      { product_id: '', productName: '', productUnit: 'pce', quantity: 0, unit_price: 0 },
    ])
  }

  const removeLine = (i: number) => {
    setLines((prev) => prev.filter((_, idx) => idx !== i))
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
          productUnit: p?.unit ?? 'pce',
          unit_price: p?.purchase_price ?? next[i].unit_price,
        }
      } else {
        next[i] = { ...next[i], [field]: value }
      }
      return next
    })
  }

  const total = lines.reduce((s, l) => s + l.quantity * l.unit_price, 0)
  const canSubmit =
    supplierId &&
    selectedStoreId &&
    lines.some((l) => l.product_id && l.quantity > 0 && l.unit_price >= 0)

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--border-solid)] bg-[var(--card-bg)] p-6 shadow-xl">
          <Dialog.Title className="text-lg font-semibold text-[var(--text-primary)]">
            Nouvel achat
          </Dialog.Title>

          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-1 block">Boutique *</Label>
                <select
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  className="w-full min-h-[44px] rounded-lg border border-[var(--border-solid)] bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800"
                >
                  <option value="">—</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="mb-1 block">Fournisseur *</Label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full min-h-[44px] rounded-lg border border-[var(--border-solid)] bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800"
                >
                  <option value="">—</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label className="mb-1 block">Référence</Label>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Optionnel"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Articles</Label>
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
                      value={line.quantity || ''}
                      onChange={(e) => updateLine(i, 'quantity', parseInt(e.target.value, 10) || 0)}
                      placeholder="Qté"
                      className="w-20 min-h-[40px]"
                    />
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={line.unit_price || ''}
                      onChange={(e) =>
                        updateLine(i, 'unit_price', parseFloat(e.target.value) || 0)
                      }
                      placeholder="Prix unit."
                      className="w-24 min-h-[40px]"
                    />
                    <span className="text-sm font-medium w-20 shrink-0">
                      {formatCurrency(line.quantity * line.unit_price)}
                    </span>
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

            <div className="flex flex-col sm:flex-row gap-4">
              <div>
                <Label className="mb-1 block">Paiement (optionnel)</Label>
                <div className="flex gap-2">
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="min-h-[44px] rounded-lg border border-[var(--border-solid)] bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800"
                  >
                    <option value="cash">Espèces</option>
                    <option value="transfer">Virement</option>
                    <option value="mobile_money">Mobile money</option>
                    <option value="card">Carte</option>
                    <option value="other">Autre</option>
                  </select>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={paymentAmount}
                    onChange={(e) =>
                      setPaymentAmount(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)
                    }
                    placeholder="Montant"
                    className="min-w-[100px]"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-[var(--border-solid)] pt-4">
              <span className="font-semibold">Total</span>
              <span className="text-lg font-semibold">{formatCurrency(total)}</span>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!canSubmit || createMutation.isPending}
              >
                {createMutation.isPending ? 'Création...' : 'Créer (brouillon)'}
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
