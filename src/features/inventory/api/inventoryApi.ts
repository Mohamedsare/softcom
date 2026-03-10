import { supabase } from '@/lib/supabase'
import { productsApi } from '@/features/products/api/productsApi'

export interface InventoryItem {
  id: string
  store_id: string
  product_id: string
  quantity: number
  reserved_quantity: number
  updated_at: string
  product?: {
    id: string
    name: string
    sku: string | null
    barcode: string | null
    unit: string
    sale_price: number
    stock_min: number
    product_images?: { url: string }[]
  }
}

export interface StockMovement {
  id: string
  store_id: string
  product_id: string
  type: string
  quantity: number
  reference_type: string | null
  reference_id: string | null
  created_by: string | null
  created_at: string
  notes: string | null
  product?: { id: string; name: string; sku: string | null; unit: string }
}

/** Override du seuil d'alerte par (store, produit). null = utiliser product.stock_min */
export async function getStoreStockMinOverrides(
  storeId: string
): Promise<Record<string, number | null>> {
  const { data, error } = await supabase
    .from('product_store_settings')
    .select('product_id, stock_min_override')
    .eq('store_id', storeId)
  if (error) throw new Error(error.message)
  const out: Record<string, number | null> = {}
  for (const row of data ?? []) {
    const r = row as { product_id: string; stock_min_override: number | null }
    out[r.product_id] = r.stock_min_override ?? null
  }
  return out
}

export const inventoryApi = {
  getStoreStockMinOverrides,

  async getStockByStore(storeId: string): Promise<Record<string, number>> {
    const { data, error } = await supabase
      .from('store_inventory')
      .select('product_id, quantity')
      .eq('store_id', storeId)
    if (error) throw new Error(error.message)
    const map: Record<string, number> = {}
    for (const row of data ?? []) {
      map[(row as { product_id: string }).product_id] = (row as { quantity: number }).quantity
    }
    return map
  },

  async list(
    companyId: string,
    storeId: string,
    options?: {
      search?: string
      categoryId?: string
      status?: 'all' | 'low' | 'out'
    }
  ): Promise<InventoryItem[]> {
    const products = await productsApi.list(companyId)
    const { data: invData, error } = await supabase
      .from('store_inventory')
      .select('id, store_id, product_id, quantity, reserved_quantity, updated_at')
      .eq('store_id', storeId)
    if (error) throw new Error(error.message)
    const invMap = new Map(
      (invData ?? []).map((r) => [
        (r as { product_id: string }).product_id,
        r as { id: string; quantity: number; reserved_quantity: number; updated_at: string },
      ])
    )
    const items: InventoryItem[] = []
    for (const p of products) {
      const inv = invMap.get(p.id)
      const quantity = inv?.quantity ?? 0
      const reserved = inv?.reserved_quantity ?? 0
      let item: InventoryItem = {
        id: inv?.id ?? `temp-${p.id}`,
        store_id: storeId,
        product_id: p.id,
        quantity,
        reserved_quantity: reserved,
        updated_at: inv?.updated_at ?? new Date().toISOString(),
        product: {
          id: p.id,
          name: p.name,
          sku: p.sku,
          barcode: p.barcode,
          unit: p.unit,
          sale_price: p.sale_price,
          stock_min: p.stock_min,
          product_images: p.product_images,
        },
      }
      if (options?.search) {
        const s = options.search.toLowerCase()
        if (
          !p.name.toLowerCase().includes(s) &&
          !(p.sku?.toLowerCase().includes(s)) &&
          !(p.barcode?.includes(options.search))
        )
          continue
      }
      if (options?.categoryId && p.category_id !== options.categoryId) continue
      if (options?.status === 'low') {
        if (p.stock_min <= 0 || quantity > p.stock_min) continue
      } else if (options?.status === 'out') {
        if (quantity > 0) continue
      }
      items.push(item)
    }
    return items.sort((a, b) => a.product!.name.localeCompare(b.product!.name))
  },

  async getMovements(
    storeId: string,
    options?: { productId?: string; limit?: number }
  ): Promise<StockMovement[]> {
    let q = supabase
      .from('stock_movements')
      .select(
        `
        id, store_id, product_id, type, quantity, reference_type, reference_id, created_by, created_at, notes,
        product:products(id, name, sku, unit)
      `
      )
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .limit(options?.limit ?? 50)
    if (options?.productId) q = q.eq('product_id', options.productId)
    const { data, error } = await q
    if (error) throw new Error(error.message)
    return (data ?? []) as unknown as StockMovement[]
  },

  async adjust(
    storeId: string,
    productId: string,
    delta: number,
    reason: string,
    userId: string
  ): Promise<void> {
    const { error } = await supabase.rpc('inventory_adjust_atomic', {
      p_store_id: storeId,
      p_product_id: productId,
      p_delta: delta,
      p_reason: reason || 'Ajustement manuel',
      p_created_by: userId,
    })
    if (error) {
      if (error.message?.includes('Stock insuffisant')) {
        throw new Error('Stock insuffisant pour cet ajustement.')
      }
      throw new Error(error.message)
    }
  },
}
