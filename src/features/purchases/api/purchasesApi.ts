import { supabase } from '@/lib/supabase'

export type PurchaseStatus = 'draft' | 'confirmed' | 'partially_received' | 'received' | 'cancelled'
export type PaymentMethod = 'cash' | 'mobile_money' | 'card' | 'transfer' | 'other'

export interface Purchase {
  id: string
  company_id: string
  store_id: string
  supplier_id: string
  reference: string | null
  status: PurchaseStatus
  total: number
  created_by: string
  created_at: string
  updated_at: string
  store?: { id: string; name: string }
  supplier?: { id: string; name: string; phone: string | null }
  purchase_items?: PurchaseItem[]
  purchase_payments?: PurchasePayment[]
}

export interface PurchaseItem {
  id: string
  purchase_id: string
  product_id: string
  quantity: number
  unit_price: number
  total: number
  product?: { id: string; name: string; sku: string | null; unit: string }
}

export interface PurchasePayment {
  id: string
  purchase_id: string
  amount: number
  method: PaymentMethod
  paid_at: string
}

export interface CreatePurchaseInput {
  company_id: string
  store_id: string
  supplier_id: string
  reference?: string | null
  items: Array<{ product_id: string; quantity: number; unit_price: number }>
  payments?: Array<{ method: PaymentMethod; amount: number }>
}

function generatePurchaseNumber(): string {
  return `A-${Date.now()}`
}

export const purchasesApi = {
  async list(
    companyId: string,
    options?: {
      storeId?: string
      supplierId?: string
      status?: PurchaseStatus
      fromDate?: string
      toDate?: string
    }
  ): Promise<Purchase[]> {
    let q = supabase
      .from('purchases')
      .select(
        `
        id, company_id, store_id, supplier_id, reference, status, total, created_by, created_at, updated_at,
        store:stores(id, name),
        supplier:suppliers(id, name, phone)
      `
      )
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
    if (options?.storeId) q = q.eq('store_id', options.storeId)
    if (options?.supplierId) q = q.eq('supplier_id', options.supplierId)
    if (options?.status) q = q.eq('status', options.status)
    if (options?.fromDate) q = q.gte('created_at', options.fromDate)
    if (options?.toDate) q = q.lte('created_at', options.toDate + 'T23:59:59.999Z')
    const { data, error } = await q
    if (error) throw new Error(error.message)
    return (data ?? []) as unknown as Purchase[]
  },

  async get(id: string): Promise<Purchase | null> {
    const { data, error } = await supabase
      .from('purchases')
      .select(
        `
        id, company_id, store_id, supplier_id, reference, status, total, created_by, created_at, updated_at,
        store:stores(id, name),
        supplier:suppliers(id, name, phone)
      `
      )
      .eq('id', id)
      .single()
    if (error) return null
    const purchase = data as unknown as Purchase
    purchase.purchase_items = await this.getItems(id)
    purchase.purchase_payments = await this.getPayments(id)
    return purchase
  },

  async getItems(purchaseId: string): Promise<PurchaseItem[]> {
    const { data, error } = await supabase
      .from('purchase_items')
      .select(
        `
        id, purchase_id, product_id, quantity, unit_price, total,
        product:products(id, name, sku, unit)
      `
      )
      .eq('purchase_id', purchaseId)
    if (error) throw new Error(error.message)
    return (data ?? []) as unknown as PurchaseItem[]
  },

  async getPayments(purchaseId: string): Promise<PurchasePayment[]> {
    const { data, error } = await supabase
      .from('purchase_payments')
      .select('id, purchase_id, amount, method, paid_at')
      .eq('purchase_id', purchaseId)
    if (error) throw new Error(error.message)
    return (data ?? []) as PurchasePayment[]
  },

  async create(input: CreatePurchaseInput, userId: string): Promise<Purchase> {
    const total = input.items.reduce(
      (sum, i) => sum + i.quantity * i.unit_price,
      0
    )
    const reference = input.reference?.trim() || generatePurchaseNumber()

    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        company_id: input.company_id,
        store_id: input.store_id,
        supplier_id: input.supplier_id,
        reference,
        status: 'draft',
        total,
        created_by: userId,
      })
      .select()
      .single()
    if (purchaseError) throw new Error(purchaseError.message)

    const items = input.items.map((i) => ({
      purchase_id: purchase.id,
      product_id: i.product_id,
      quantity: i.quantity,
      unit_price: i.unit_price,
      total: i.quantity * i.unit_price,
    }))
    const { error: itemsError } = await supabase.from('purchase_items').insert(items)
    if (itemsError) throw new Error(itemsError.message)

    if (input.payments && input.payments.length > 0) {
      const { error: paymentsError } = await supabase.from('purchase_payments').insert(
        input.payments.map((p) => ({
          purchase_id: purchase.id,
          amount: p.amount,
          method: p.method,
        }))
      )
      if (paymentsError) throw new Error(paymentsError.message)
    }

    return purchase as Purchase
  },

  async confirm(id: string, userId: string): Promise<void> {
    const purchase = await this.get(id)
    if (!purchase || purchase.status !== 'draft')
      throw new Error('Achat non trouvé ou déjà confirmé/annulé')

    const { error: updateError } = await supabase
      .from('purchases')
      .update({ status: 'received' })
      .eq('id', id)
    if (updateError) throw new Error(updateError.message)

    const items = await this.getItems(id)
    for (const item of items) {
      const { data: inv } = await supabase
        .from('store_inventory')
        .select('id, quantity')
        .eq('store_id', purchase.store_id)
        .eq('product_id', item.product_id)
        .single()

      if (inv) {
        await supabase
          .from('store_inventory')
          .update({ quantity: inv.quantity + item.quantity })
          .eq('id', inv.id)
      } else {
        await supabase.from('store_inventory').insert({
          store_id: purchase.store_id,
          product_id: item.product_id,
          quantity: item.quantity,
          reserved_quantity: 0,
        })
      }

      await supabase.from('stock_movements').insert({
        store_id: purchase.store_id,
        product_id: item.product_id,
        type: 'purchase_in',
        quantity: item.quantity,
        reference_type: 'purchase',
        reference_id: id,
        created_by: userId,
      })
    }
  },

  async cancel(id: string): Promise<void> {
    const purchase = await this.get(id)
    if (!purchase || purchase.status !== 'draft')
      throw new Error('Seuls les brouillons peuvent être annulés')

    const { error } = await supabase
      .from('purchases')
      .update({ status: 'cancelled' })
      .eq('id', id)
    if (error) throw new Error(error.message)
  },
}
