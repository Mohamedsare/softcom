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
    const { data: saleId, error } = await supabase.rpc('create_sale_with_stock', {
      p_company_id: input.company_id,
      p_store_id: input.store_id,
      p_customer_id: input.customer_id || null,
      p_created_by: userId,
      p_items: input.items.map((i) => ({
        product_id: i.product_id,
        quantity: i.quantity,
        unit_price: i.unit_price,
        discount: i.discount ?? 0,
      })),
      p_payments: input.payments.map((p) => ({
        method: p.method,
        amount: p.amount,
        reference: p.reference ?? null,
      })),
      p_discount: input.discount ?? 0,
    })
    if (error) {
      const msg = error.message || ''
      if (msg.includes('Stock insuffisant') || msg.includes('insufficient')) {
        throw new Error(msg.replace(/^[^"]*"/, '').replace(/"\s*\(.*$/, '').trim() || 'Stock insuffisant pour un ou plusieurs produits.')
      }
      throw new Error(error.message)
    }
    const sale = await this.get(saleId as string)
    if (!sale) throw new Error('Vente créée mais introuvable')
    return sale
  },

  async cancel(id: string): Promise<void> {
    const { error } = await supabase.rpc('cancel_sale_restore_stock', { p_sale_id: id })
    if (error) {
      if (error.message?.includes('déjà annulée') || error.message?.includes('non trouvée')) {
        throw new Error('Vente non trouvée ou déjà annulée')
      }
      throw new Error(error.message)
    }
  },
}
