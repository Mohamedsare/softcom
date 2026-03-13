import { supabase } from '@/lib/supabase'

export type TransferStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'shipped'
  | 'received'
  | 'rejected'
  | 'cancelled'

export interface StockTransfer {
  id: string
  company_id: string
  from_store_id: string
  to_store_id: string
  status: TransferStatus
  requested_by: string
  approved_by: string | null
  shipped_at: string | null
  received_at: string | null
  received_by: string | null
  created_at: string
  updated_at: string
  from_store?: { id: string; name: string }
  to_store?: { id: string; name: string }
  stock_transfer_items?: StockTransferItem[]
}

export interface StockTransferItem {
  id: string
  transfer_id: string
  product_id: string
  quantity_requested: number
  quantity_shipped: number
  quantity_received: number
  created_at: string
  product?: { id: string; name: string; sku: string | null; unit: string }
}

export interface CreateTransferInput {
  company_id: string
  from_store_id: string
  to_store_id: string
  items: Array<{ product_id: string; quantity_requested: number }>
}

export const transfersApi = {
  async list(
    companyId: string,
    options?: {
      fromStoreId?: string
      toStoreId?: string
      status?: TransferStatus
      fromDate?: string
      toDate?: string
    }
  ): Promise<StockTransfer[]> {
    let q = supabase
      .from('stock_transfers')
      .select(
        `
        id, company_id, from_store_id, to_store_id, status, requested_by, approved_by, shipped_at, received_at, received_by, created_at, updated_at,
        from_store:stores!stock_transfers_from_store_id_fkey(id, name),
        to_store:stores!stock_transfers_to_store_id_fkey(id, name)
      `
      )
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (options?.fromStoreId) q = q.eq('from_store_id', options.fromStoreId)
    if (options?.toStoreId) q = q.eq('to_store_id', options.toStoreId)
    if (options?.status) q = q.eq('status', options.status)
    if (options?.fromDate) q = q.gte('created_at', options.fromDate)
    if (options?.toDate) q = q.lte('created_at', options.toDate + 'T23:59:59.999Z')

    const { data, error } = await q
    if (error) throw new Error(error.message)
    return (data ?? []) as unknown as StockTransfer[]
  },

  async get(id: string): Promise<StockTransfer | null> {
    const { data, error } = await supabase
      .from('stock_transfers')
      .select(
        `
        id, company_id, from_store_id, to_store_id, status, requested_by, approved_by, shipped_at, received_at, received_by, created_at, updated_at,
        from_store:stores!stock_transfers_from_store_id_fkey(id, name),
        to_store:stores!stock_transfers_to_store_id_fkey(id, name)
      `
      )
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(error.message)
    }
    if (!data) return null

    const transfer = data as unknown as StockTransfer
    const items = await this.getItems(id)
    transfer.stock_transfer_items = items
    return transfer
  },

  async getItems(transferId: string): Promise<StockTransferItem[]> {
    const { data, error } = await supabase
      .from('stock_transfer_items')
      .select(
        `
        id, transfer_id, product_id, quantity_requested, quantity_shipped, quantity_received, created_at,
        product:products(id, name, sku, unit)
      `
      )
      .eq('transfer_id', transferId)
    if (error) throw new Error(error.message)
    return (data ?? []) as unknown as StockTransferItem[]
  },

  async create(input: CreateTransferInput, userId: string): Promise<StockTransfer> {
    if (input.from_store_id === input.to_store_id) {
      throw new Error('La boutique d\'origine et la destination doivent être différentes')
    }
    if (!input.items?.length || input.items.every((i) => i.quantity_requested <= 0)) {
      throw new Error('Ajoutez au moins une ligne avec une quantité > 0')
    }

    const { data: transfer, error: transferError } = await supabase
      .from('stock_transfers')
      .insert({
        company_id: input.company_id,
        from_store_id: input.from_store_id,
        to_store_id: input.to_store_id,
        status: 'draft',
        requested_by: userId,
      })
      .select()
      .single()

    if (transferError) throw new Error(transferError.message)

    const items = input.items
      .filter((i) => i.product_id && i.quantity_requested > 0)
      .map((i) => ({
        transfer_id: transfer.id,
        product_id: i.product_id,
        quantity_requested: i.quantity_requested,
      }))

    if (items.length === 0) {
      await supabase.from('stock_transfers').delete().eq('id', transfer.id)
      throw new Error('Ajoutez au moins une ligne avec produit et quantité > 0')
    }

    const { error: itemsError } = await supabase.from('stock_transfer_items').insert(items)
    if (itemsError) {
      await supabase.from('stock_transfers').delete().eq('id', transfer.id)
      throw new Error(itemsError.message)
    }

    return transfer as StockTransfer
  },

  async ship(id: string, userId: string): Promise<void> {
    const { error } = await supabase.rpc('ship_transfer', {
      p_transfer_id: id,
      p_user_id: userId,
    })
    if (error) {
      if (error.message?.includes('Stock insuffisant')) throw new Error(error.message)
      if (error.message?.includes('non trouvé')) throw new Error('Transfert non trouvé')
      throw new Error(error.message)
    }
  },

  async receive(id: string, userId: string): Promise<void> {
    const { error } = await supabase.rpc('receive_transfer', {
      p_transfer_id: id,
      p_user_id: userId,
    })
    if (error) {
      if (error.message?.includes('non trouvé')) throw new Error('Transfert non trouvé')
      if (error.message?.includes('réceptionnés')) throw new Error(error.message)
      throw new Error(error.message)
    }
  },

  async cancel(id: string): Promise<void> {
    const t = await this.get(id)
    if (!t) throw new Error('Transfert non trouvé')
    if (t.status !== 'draft' && t.status !== 'pending') {
      throw new Error('Seuls les brouillons ou en attente peuvent être annulés')
    }
    const { error } = await supabase
      .from('stock_transfers')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw new Error(error.message)
  },
}
