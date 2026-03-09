import { supabase } from '@/lib/supabase'

export type SaleStatus = 'draft' | 'completed' | 'cancelled' | 'refunded'
export type PaymentMethod = 'cash' | 'mobile_money' | 'card' | 'transfer' | 'other'

export interface Sale {
  id: string
  company_id: string
  store_id: string
  customer_id: string | null
  sale_number: string
  status: SaleStatus
  subtotal: number
  discount: number
  tax: number
  total: number
  created_by: string
  created_at: string
  updated_at: string
  store?: { id: string; name: string }
  customer?: { id: string; name: string; phone: string | null }
  sale_items?: SaleItem[]
  sale_payments?: SalePayment[]
}

export interface SaleItem {
  id: string
  sale_id: string
  product_id: string
  quantity: number
  unit_price: number
  discount: number
  total: number
  product?: { id: string; name: string; sku: string | null; unit: string }
}

export interface SalePayment {
  id: string
  sale_id: string
  method: PaymentMethod
  amount: number
  reference: string | null
}

export interface CreateSaleInput {
  company_id: string
  store_id: string
  customer_id?: string | null
  items: Array<{ product_id: string; quantity: number; unit_price: number; discount?: number }>
  discount?: number
  payments: Array<{ method: PaymentMethod; amount: number; reference?: string | null }>
}

function generateSaleNumber(): string {
  return `S-${Date.now()}`
}

export const salesApi = {
  async list(
    companyId: string,
    options?: {
      storeId?: string
      status?: SaleStatus
      fromDate?: string
      toDate?: string
    }
  ): Promise<Sale[]> {
    let q = supabase
      .from('sales')
      .select(
        `
        id, company_id, store_id, customer_id, sale_number, status, subtotal, discount, tax, total, created_by, created_at, updated_at,
        store:stores(id, name),
        customer:customers(id, name, phone)
      `
      )
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
    if (options?.storeId) q = q.eq('store_id', options.storeId)
    if (options?.status) q = q.eq('status', options.status)
    if (options?.fromDate) q = q.gte('created_at', options.fromDate)
    if (options?.toDate) q = q.lte('created_at', options.toDate + 'T23:59:59.999Z')
    const { data, error } = await q
    if (error) throw new Error(error.message)
    return (data ?? []) as unknown as Sale[]
  },

  async get(id: string): Promise<Sale | null> {
    const { data, error } = await supabase
      .from('sales')
      .select(
        `
        id, company_id, store_id, customer_id, sale_number, status, subtotal, discount, tax, total, created_by, created_at, updated_at,
        store:stores(id, name),
        customer:customers(id, name, phone)
      `
      )
      .eq('id', id)
      .single()
    if (error) return null
    const sale = data as unknown as Sale
    sale.sale_items = await this.getItems(id)
    sale.sale_payments = await this.getPayments(id)
    return sale
  },

  async getItems(saleId: string): Promise<SaleItem[]> {
    const { data, error } = await supabase
      .from('sale_items')
      .select(
        `
        id, sale_id, product_id, quantity, unit_price, discount, total,
        product:products(id, name, sku, unit)
      `
      )
      .eq('sale_id', saleId)
      .order('created_at')
    if (error) throw new Error(error.message)
    return (data ?? []) as unknown as SaleItem[]
  },

  async getPayments(saleId: string): Promise<SalePayment[]> {
    const { data, error } = await supabase
      .from('sale_payments')
      .select('id, sale_id, method, amount, reference')
      .eq('sale_id', saleId)
    if (error) throw new Error(error.message)
    return (data ?? []) as SalePayment[]
  },

  async create(input: CreateSaleInput, userId: string): Promise<Sale> {
    const subtotal = input.items.reduce(
      (sum, i) => sum + i.quantity * i.unit_price - (i.discount ?? 0),
      0
    )
    const discount = input.discount ?? 0
    const tax = 0
    const total = Math.max(0, subtotal - discount + tax)

    const saleNumber = generateSaleNumber()
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        company_id: input.company_id,
        store_id: input.store_id,
        customer_id: input.customer_id || null,
        sale_number: saleNumber,
        status: 'completed',
        subtotal,
        discount,
        tax,
        total,
        created_by: userId,
      })
      .select()
      .single()
    if (saleError) throw new Error(saleError.message)

    const items = input.items.map((i) => ({
      sale_id: sale.id,
      product_id: i.product_id,
      quantity: i.quantity,
      unit_price: i.unit_price,
      discount: i.discount ?? 0,
      total: i.quantity * i.unit_price - (i.discount ?? 0),
    }))
    const { error: itemsError } = await supabase.from('sale_items').insert(items)
    if (itemsError) throw new Error(itemsError.message)

    const { error: paymentsError } = await supabase.from('sale_payments').insert(
      input.payments.map((p) => ({
        sale_id: sale.id,
        method: p.method,
        amount: p.amount,
        reference: p.reference ?? null,
      }))
    )
    if (paymentsError) throw new Error(paymentsError.message)

    for (const item of input.items) {
      const { data: inv } = await supabase
        .from('store_inventory')
        .select('id, quantity')
        .eq('store_id', input.store_id)
        .eq('product_id', item.product_id)
        .single()
      if (inv) {
        await supabase
          .from('store_inventory')
          .update({ quantity: Math.max(0, inv.quantity - item.quantity) })
          .eq('id', inv.id)
        await supabase.from('stock_movements').insert({
          store_id: input.store_id,
          product_id: item.product_id,
          type: 'sale_out',
          quantity: -item.quantity,
          reference_type: 'sale',
          reference_id: sale.id,
          created_by: userId,
        })
      }
    }

    return sale as Sale
  },

  async cancel(id: string): Promise<void> {
    const sale = await this.get(id)
    if (!sale || sale.status !== 'completed') throw new Error('Vente non trouvée ou déjà annulée')
    const { error: updateError } = await supabase
      .from('sales')
      .update({ status: 'cancelled' })
      .eq('id', id)
    if (updateError) throw new Error(updateError.message)
    const items = await this.getItems(id)
    for (const item of items) {
      const { data: inv } = await supabase
        .from('store_inventory')
        .select('id, quantity')
        .eq('store_id', sale.store_id)
        .eq('product_id', item.product_id)
        .single()
      if (inv) {
        await supabase
          .from('store_inventory')
          .update({ quantity: inv.quantity + item.quantity })
          .eq('id', inv.id)
        await supabase.from('stock_movements').insert({
          store_id: sale.store_id,
          product_id: item.product_id,
          type: 'return_in',
          quantity: item.quantity,
          reference_type: 'sale',
          reference_id: id,
          notes: 'Annulation vente',
        })
      }
    }
  },
}
