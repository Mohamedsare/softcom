import { useState, useCallback, useRef, type MutableRefObject } from 'react'
import { useParams } from 'react-router-dom'
import { useCompany } from '@/context/CompanyContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, Button, Input, Label } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import { Trash2, Minus, Plus, User, Package, Printer, X } from 'lucide-react'
import { productsApi } from '@/features/products/api/productsApi'
import { customersApi } from '@/features/customers/api/customersApi'
import { inventoryApi } from '@/features/inventory/api/inventoryApi'
import { salesApi } from '@/features/sales/api/salesApi'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import { ReceiptTicket } from '@/features/pos/ReceiptTicket'
import { getReceiptWidth } from '@/features/pos/receiptConfig'

interface CartItem {
  productId: string
  name: string
  sku: string | null
  unit: string
  quantity: number
  unitPrice: number
  total: number
}

interface ReceiptDialogData {
  storeName: string
  saleNumber: string
  items: { name: string; quantity: number; unitPrice: number; total: number }[]
  subtotal: number
  discount: number
  total: number
}

export function PosPage() {
  const { storeId } = useParams<{ storeId: string }>()
  const { currentCompanyId, stores } = useCompany()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [customerId, setCustomerId] = useState<string>('')
  const [discount, setDiscount] = useState(0)
  const [receiptDialog, setReceiptDialog] = useState<ReceiptDialogData | null>(null)
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false)
  const receiptSnapshotRef = useRef<Omit<ReceiptDialogData, 'saleNumber'> | null>(null) as MutableRefObject<Omit<ReceiptDialogData, 'saleNumber'> | null>

  const currentStore = stores.find((s) => s.id === storeId)

  const { data: products = [] } = useQuery({
    queryKey: ['products', currentCompanyId],
    queryFn: () => productsApi.list(currentCompanyId!),
    enabled: !!currentCompanyId,
  })

  const { data: customers = [] } = useQuery({
    queryKey: ['customers', currentCompanyId],
    queryFn: () => customersApi.list(currentCompanyId!),
    enabled: !!currentCompanyId,
  })

  const { data: stockMap = {} } = useQuery({
    queryKey: ['inventory', storeId],
    queryFn: () => inventoryApi.getStockByStore(storeId!),
    enabled: !!storeId,
  })

  const createMutation = useMutation({
    mutationFn: (input: Parameters<typeof salesApi.create>[0]) =>
      salesApi.create(input, user!.id),
    onSuccess: (sale) => {
      queryClient.invalidateQueries({ queryKey: ['sales', currentCompanyId] })
      queryClient.invalidateQueries({ queryKey: ['inventory', storeId] })
      const snap = receiptSnapshotRef.current
      if (snap) {
        setReceiptDialog({
          ...snap,
          saleNumber: sale.sale_number,
        })
      }
      setCart([])
      setDiscount(0)
      setCustomerId('')
      toast.success(`Vente #${sale.sale_number} enregistrée. Total: ${formatCurrency(sale.total)}`)
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erreur lors de l\'enregistrement'),
  })

  const addToCart = useCallback(
    (product: { id: string; name: string; sku: string | null; unit: string; sale_price: number }) => {
      const stock = stockMap[product.id] ?? 0
      setCart((prev) => {
        const existing = prev.find((c) => c.productId === product.id)
        const newQty = existing ? existing.quantity + 1 : 1
        if (stock > 0 && newQty > stock) {
          toast.warning(`Stock insuffisant. Disponible: ${stock}`)
          return prev
        }
        if (existing) {
          return prev.map((c) =>
            c.productId === product.id
              ? { ...c, quantity: newQty, total: newQty * c.unitPrice }
              : c
          )
        }
        return [
          ...prev,
          {
            productId: product.id,
            name: product.name,
            sku: product.sku,
            unit: product.unit,
            quantity: 1,
            unitPrice: product.sale_price,
            total: product.sale_price,
          },
        ]
      })
    },
    [stockMap]
  )

  const updateQty = useCallback((productId: string, delta: number) => {
    const stock = stockMap[productId] ?? 0
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.productId !== productId) return c
          const newQty = Math.max(0, c.quantity + delta)
          if (stock > 0 && newQty > stock) {
            toast.warning(`Stock insuffisant. Disponible: ${stock}`)
            return c
          }
          return { ...c, quantity: newQty, total: newQty * c.unitPrice }
        })
        .filter((c) => c.quantity > 0)
    )
  }, [stockMap])

  const subtotal = cart.reduce((s, c) => s + c.total, 0)
  const total = Math.max(0, subtotal - discount)

  const filteredProducts = products.filter(
    (p) =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) ||
      (p.barcode && p.barcode.includes(search))
  )

  const canPay = cart.length > 0 && total >= 0
  const stockWarnings = cart.filter((c) => (stockMap[c.productId] ?? 0) < c.quantity)

  const handlePayment = () => {
    if (!storeId || !currentCompanyId || !user || !canPay) return
    if (stockWarnings.length > 0) {
      toast.error('Stock insuffisant pour certains articles')
      return
    }
    receiptSnapshotRef.current = {
      storeName: currentStore?.name ?? 'Boutique',
      items: cart.map((c) => ({ name: c.name, quantity: c.quantity, unitPrice: c.unitPrice, total: c.total })),
      subtotal,
      discount,
      total,
    }
    createMutation.mutate({
      company_id: currentCompanyId,
      store_id: storeId,
      customer_id: customerId || null,
      items: cart.map((c) => ({
        product_id: c.productId,
        quantity: c.quantity,
        unit_price: c.unitPrice,
        discount: 0,
      })),
      discount,
      payments: [{ method: 'cash' as const, amount: total }],
    })
  }

  const cartItemCount = cart.reduce((n, c) => n + c.quantity, 0)

  const cartPanelContent = (
    <>
      <div className="max-h-64 flex-1 overflow-y-auto p-4 min-h-0">
        {cart.length === 0 ? (
          <p className="py-4 text-center text-sm text-[var(--text-muted)]">Panier vide</p>
        ) : (
          <ul className="space-y-2">
            {cart.map((c) => {
              const stock = stockMap[c.productId] ?? 0
              const lowStock = stock >= 0 && c.quantity > stock
              return (
                <li
                  key={c.productId}
                  className={`flex items-center justify-between gap-2 rounded-lg p-2 ${lowStock ? 'bg-red-50 dark:bg-red-900/20' : 'bg-slate-50 dark:bg-slate-800/50'}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQty(c.productId, -1)}
                        className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded border border-[var(--border-solid)] touch-manipulation"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-sm">{c.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQty(c.productId, 1)}
                        className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded border border-[var(--border-solid)] touch-manipulation"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      {lowStock && (
                        <span className="text-xs text-[var(--danger)]">Stock: {stock}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(c.total)}</p>
                    <button
                      type="button"
                      onClick={() => updateQty(c.productId, -c.quantity)}
                      className="mt-1 text-[var(--danger)]"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
      <div className="border-t border-[var(--border-solid)] p-4 space-y-3 shrink-0">
        {cart.length > 0 && (
          <div>
            <Label htmlFor="discount-pos" className="text-sm">Remise (XOF)</Label>
            <Input
              id="discount-pos"
              type="number"
              min={0}
              step={1}
              value={discount || ''}
              onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
              placeholder="0"
              className="mt-1"
            />
          </div>
        )}
        <div className="flex justify-between text-lg font-semibold">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
        <Button
          onClick={handlePayment}
          disabled={!canPay || stockWarnings.length > 0 || createMutation.isPending}
          className="w-full"
        >
          {createMutation.isPending ? 'Enregistrement...' : 'Payer (espèces)'}
        </Button>
      </div>
    </>
  )

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4 lg:flex-row pb-20 lg:pb-0">
      <div className="flex-1 min-h-0 overflow-hidden rounded-2xl border border-[var(--border-solid)] bg-[var(--card-bg)]">
        <div className="border-b border-[var(--border-solid)] p-4 space-y-3">
          <input
            type="search"
            placeholder="Rechercher produit (nom, SKU, code-barres)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full min-h-[44px] rounded-lg border border-[var(--border-solid)] bg-slate-50 px-4 dark:bg-slate-800"
            autoFocus
          />
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="flex-1 min-h-[40px] rounded-lg border border-[var(--border-solid)] bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800"
            >
              <option value="">Client non identifié</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="h-[calc(100%-7rem)] overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {filteredProducts
              .filter((p) => p.is_active)
              .map((p) => {
                const stock = stockMap[p.id] ?? 0
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addToCart(p)}
                    disabled={stock <= 0}
                    className="flex min-h-[80px] sm:min-h-[100px] flex-col items-center justify-center gap-2 rounded-xl border border-[var(--border-solid)] p-3 text-left transition-colors hover:border-[var(--accent)] hover:bg-orange-500/5 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                      {p.product_images?.[0] ? (
                        <img
                          src={p.product_images[0].url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Package className="h-6 w-6 text-[var(--text-muted)]" />
                        </div>
                      )}
                    </div>
                    <span className="truncate w-full text-center text-sm font-medium text-[var(--text-primary)]">
                      {p.name}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {formatCurrency(p.sale_price)}
                      {stock >= 0 && <span className="text-slate-500"> · Stock: {stock}</span>}
                    </span>
                  </button>
                )
              })}
          </div>
        </div>
      </div>

      {/* Panier desktop (sidebar) */}
      <div className="hidden w-full lg:flex lg:w-96">
        <Card className="flex flex-col overflow-hidden w-full">
          <div className="border-b border-[var(--border-solid)] p-4 shrink-0">
            <h2 className="font-semibold text-[var(--text-primary)]">Panier</h2>
          </div>
          {cartPanelContent}
        </Card>
      </div>

      {/* Mobile: barre fixe panier en bas */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between gap-3 border-t border-[var(--border-solid)] bg-[var(--card-bg)] p-3 safe-area-pb lg:hidden">
        <button
          type="button"
          onClick={() => setCartDrawerOpen(true)}
          className="flex flex-1 min-w-0 items-center gap-2 text-left"
        >
          <span className="font-medium text-[var(--text-primary)]">Panier</span>
          <span className="text-sm text-[var(--text-muted)]">
            {cartItemCount} article{cartItemCount !== 1 ? 's' : ''} · {formatCurrency(total)}
          </span>
        </button>
        <Button
          onClick={() => setCartDrawerOpen(true)}
          disabled={createMutation.isPending}
          className="shrink-0"
        >
          Voir / Payer
        </Button>
      </div>

      {/* Mobile: drawer panier (bottom sheet) */}
      {cartDrawerOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setCartDrawerOpen(false)}
            aria-hidden
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl border border-b-0 border-[var(--border-solid)] bg-[var(--card-bg)] animate-sheet-up lg:hidden">
            <div className="flex items-center justify-between border-b border-[var(--border-solid)] p-4 shrink-0">
              <h2 className="font-semibold text-[var(--text-primary)]">Panier</h2>
              <button
                type="button"
                onClick={() => setCartDrawerOpen(false)}
                className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
              {cartPanelContent}
            </div>
          </div>
        </>
      )}

      {/* Modal ticket après vente */}
      {receiptDialog && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-12 overflow-auto print:bg-transparent print:p-0">
          <div className="bg-[var(--card-bg)] rounded-xl shadow-xl max-w-[90vw] flex flex-col items-center gap-4 print:bg-white print:shadow-none">
            <ReceiptTicket
              storeName={receiptDialog.storeName}
              saleNumber={receiptDialog.saleNumber}
              items={receiptDialog.items}
              subtotal={receiptDialog.subtotal}
              discount={receiptDialog.discount}
              total={receiptDialog.total}
              widthMm={getReceiptWidth()}
            />
            <div className="flex gap-2 no-print">
              <Button
                variant="primary"
                onClick={() => window.print()}
                className="flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Imprimer
              </Button>
              <Button
                variant="secondary"
                onClick={() => setReceiptDialog(null)}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
