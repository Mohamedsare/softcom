import { supabase } from '@/lib/supabase'
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
} from 'date-fns'

export interface ReportsFilters {
  companyId: string
  storeId?: string
  fromDate: string
  toDate: string
}

export interface SalesSummary {
  totalAmount: number
  count: number
  itemsSold: number
  margin: number
}

export interface SalesByDay {
  date: string
  total: number
  count: number
}

export interface TopProduct {
  product_id: string
  product_name: string
  quantity_sold: number
  revenue: number
  margin: number
}

export interface PurchasesSummary {
  totalAmount: number
  count: number
}

export interface StockValue {
  totalValue: number
  productCount: number
}

export const reportsApi = {
  async getSalesSummary(filters: ReportsFilters): Promise<SalesSummary> {
    let q = supabase
      .from('sales')
      .select('id, total, subtotal, discount')
      .eq('company_id', filters.companyId)
      .eq('status', 'completed')
      .gte('created_at', filters.fromDate)
      .lte('created_at', filters.toDate + 'T23:59:59.999Z')
    if (filters.storeId) q = q.eq('store_id', filters.storeId)
    const { data: sales, error } = await q
    if (error) throw new Error(error.message)

    const saleIds = (sales ?? []).map((s) => s.id)
    if (saleIds.length === 0) {
      return { totalAmount: 0, count: 0, itemsSold: 0, margin: 0 }
    }

    const { data: items } = await supabase
      .from('sale_items')
      .select(`
        sale_id,
        quantity,
        unit_price,
        total,
        product:products(id, purchase_price)
      `)
      .in('sale_id', saleIds)
    const itemsList = (items ?? []) as unknown as Array<{
      quantity: number
      unit_price: number
      total: number
      product: { purchase_price: number } | null
    }>

    const totalAmount = (sales ?? []).reduce((s, x) => s + Number(x.total), 0)
    const itemsSold = itemsList.reduce((s, x) => s + x.quantity, 0)
    const margin = itemsList.reduce((s, x) => {
      const cost = (x.product?.purchase_price ?? 0) * x.quantity
      return s + (Number(x.total) - cost)
    }, 0)

    return {
      totalAmount,
      count: (sales ?? []).length,
      itemsSold,
      margin,
    }
  },

  async getSalesByDay(filters: ReportsFilters): Promise<SalesByDay[]> {
    let q = supabase
      .from('sales')
      .select('id, total, created_at')
      .eq('company_id', filters.companyId)
      .eq('status', 'completed')
      .gte('created_at', filters.fromDate)
      .lte('created_at', filters.toDate + 'T23:59:59.999Z')
    if (filters.storeId) q = q.eq('store_id', filters.storeId)
    const { data: sales, error } = await q
    if (error) throw new Error(error.message)

    const byDay = new Map<string, { total: number; count: number }>()
    for (const s of sales ?? []) {
      const date = format(new Date(s.created_at), 'yyyy-MM-dd')
      const current = byDay.get(date) ?? { total: 0, count: 0 }
      current.total += Number(s.total)
      current.count += 1
      byDay.set(date, current)
    }

    return Array.from(byDay.entries())
      .map(([date, v]) => ({ date, total: v.total, count: v.count }))
      .sort((a, b) => a.date.localeCompare(b.date))
  },

  async getTopProducts(filters: ReportsFilters, limit = 10): Promise<TopProduct[]> {
    let q = supabase
      .from('sales')
      .select('id')
      .eq('company_id', filters.companyId)
      .eq('status', 'completed')
      .gte('created_at', filters.fromDate)
      .lte('created_at', filters.toDate + 'T23:59:59.999Z')
    if (filters.storeId) q = q.eq('store_id', filters.storeId)
    const { data: sales } = await q
    const saleIds = (sales ?? []).map((s) => s.id)
    if (saleIds.length === 0) return []

    const { data: items } = await supabase
      .from('sale_items')
      .select(`
        product_id,
        quantity,
        unit_price,
        total,
        product:products(id, name, purchase_price)
      `)
      .in('sale_id', saleIds)

    const itemsList = (items ?? []) as unknown as Array<{
      product_id: string
      quantity: number
      unit_price: number
      total: number
      product: { id: string; name: string; purchase_price: number } | null
    }>

    const agg = new Map<
      string,
      { name: string; qty: number; revenue: number; cost: number }
    >()
    for (const x of itemsList) {
      const current = agg.get(x.product_id) ?? {
        name: x.product?.name ?? '—',
        qty: 0,
        revenue: 0,
        cost: 0,
      }
      current.qty += x.quantity
      current.revenue += Number(x.total)
      current.cost += (x.product?.purchase_price ?? 0) * x.quantity
      agg.set(x.product_id, current)
    }

    return Array.from(agg.entries())
      .map(([product_id, v]) => ({
        product_id,
        product_name: v.name,
        quantity_sold: v.qty,
        revenue: v.revenue,
        margin: v.revenue - v.cost,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit)
  },

  async getPurchasesSummary(filters: ReportsFilters): Promise<PurchasesSummary> {
    let q = supabase
      .from('purchases')
      .select('id, total')
      .eq('company_id', filters.companyId)
      .in('status', ['confirmed', 'received', 'partially_received'])
      .gte('created_at', filters.fromDate)
      .lte('created_at', filters.toDate + 'T23:59:59.999Z')
    if (filters.storeId) q = q.eq('store_id', filters.storeId)
    const { data: purchases, error } = await q
    if (error) throw new Error(error.message)

    const totalAmount = (purchases ?? []).reduce((s, p) => s + Number(p.total), 0)
    return {
      totalAmount,
      count: (purchases ?? []).length,
    }
  },

  async getStockValue(_companyId: string, storeId?: string): Promise<StockValue> {
    if (!storeId) return { totalValue: 0, productCount: 0 }

    const { data: inv } = await supabase
      .from('store_inventory')
      .select(`
        product_id,
        quantity,
        product:products(id, sale_price, purchase_price)
      `)
      .eq('store_id', storeId)

    let totalValue = 0
    const invList = (inv ?? []) as unknown as Array<{ quantity: number; product: { sale_price: number } | null }>
    for (const row of invList) {
      const r = row
      totalValue += r.quantity * (r.product?.sale_price ?? 0)
    }
    return {
      totalValue,
      productCount: (inv ?? []).length,
    }
  },

  async getCompanyStockValue(companyId: string): Promise<StockValue> {
    const { data: stores } = await supabase
      .from('stores')
      .select('id')
      .eq('company_id', companyId)
      .eq('is_active', true)
    const storeIds = (stores ?? []).map((s) => s.id)
    if (storeIds.length === 0) return { totalValue: 0, productCount: 0 }

    const { data: inv } = await supabase
      .from('store_inventory')
      .select(`
        store_id,
        product_id,
        quantity,
        product:products(id, sale_price)
      `)
      .in('store_id', storeIds)

    let totalValue = 0
    const seen = new Set<string>()
    const invList = (inv ?? []) as unknown as Array<{
      store_id: string
      product_id: string
      quantity: number
      product: { sale_price: number } | null
    }>
    for (const row of invList) {
      totalValue += row.quantity * (row.product?.sale_price ?? 0)
      seen.add(`${row.store_id}-${row.product_id}`)
    }
    return { totalValue, productCount: seen.size }
  },

  async getLowStockCount(companyId: string, storeId?: string): Promise<number> {
    const ids = storeId ? [storeId] : (await supabase.from('stores').select('id').eq('company_id', companyId).eq('is_active', true)).data?.map((s) => s.id) ?? []
    if (ids.length === 0) return 0

    const { data: inv } = await supabase
      .from('store_inventory')
      .select('store_id, product_id, quantity, product:products(id, stock_min)')
      .in('store_id', ids)
    const invList = (inv ?? []) as unknown as Array<{
      store_id: string
      product_id: string
      quantity: number
      product: { stock_min: number } | null
    }>
    if (invList.length === 0) return 0

    const { data: overrides } = await supabase
      .from('product_store_settings')
      .select('store_id, product_id, stock_min_override')
      .in('store_id', ids)
    const overrideMap = new Map<string, number | null>()
    for (const o of overrides ?? []) {
      overrideMap.set(`${o.store_id}-${o.product_id}`, o.stock_min_override ?? null)
    }

    const alertKeys = new Set<string>()
    for (const row of invList) {
      const override = overrideMap.get(`${row.store_id}-${row.product_id}`)
      const min = override ?? row.product?.stock_min ?? 0
      if (row.quantity <= min) alertKeys.add(`${row.store_id}-${row.product_id}`)
    }
    return alertKeys.size
  },
}

export function getDefaultDateRange(period: 'today' | 'week' | 'month'): { from: string; to: string } {
  const now = new Date()
  let from: Date
  let to: Date
  if (period === 'today') {
    from = startOfDay(now)
    to = endOfDay(now)
  } else if (period === 'week') {
    from = startOfWeek(now, { weekStartsOn: 1 })
    to = endOfWeek(now, { weekStartsOn: 1 })
  } else {
    from = startOfMonth(now)
    to = endOfMonth(now)
  }
  return {
    from: format(from, 'yyyy-MM-dd'),
    to: format(to, 'yyyy-MM-dd'),
  }
}
