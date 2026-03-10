import { supabase } from '@/lib/supabase'

export interface CreateStoreInput {
  company_id: string
  name: string
  /** Code ignoré : généré automatiquement par le serveur (B1, B2, …) */
  code?: string
  address?: string
  logo_url?: string
  phone?: string
  email?: string
  description?: string
  is_primary?: boolean
  pos_discount_enabled?: boolean
}

export interface Store {
  id: string
  company_id: string
  name: string
  code: string | null
  address: string | null
  logo_url: string | null
  phone: string | null
  email: string | null
  description: string | null
  is_active: boolean
  is_primary: boolean
  pos_discount_enabled?: boolean
  created_at: string
}

export async function getStoresByCompany(companyId: string): Promise<Store[]> {
  const { data, error } = await supabase
    .from('stores')
    .select('id, company_id, name, code, address, logo_url, phone, email, description, is_active, is_primary, pos_discount_enabled, created_at')
    .eq('company_id', companyId)
  if (error) throw new Error(error.message)
  return (data ?? []) as Store[]
}

export async function getCompanyWithQuota(companyId: string): Promise<{ store_quota: number } | null> {
  const { data, error } = await supabase.from('companies').select('store_quota').eq('id', companyId).single()
  if (error || !data) return null
  return data as { store_quota: number }
}

export async function createStore(input: CreateStoreInput): Promise<Store> {
  const { data, error } = await supabase.rpc('create_store', {
    p_company_id: input.company_id,
    p_name: input.name,
    p_address: input.address || null,
    p_phone: input.phone || null,
    p_email: input.email || null,
    p_description: input.description || null,
    p_is_primary: input.is_primary ?? false,
  })
  if (error) throw new Error(error.message)
  const store = data as Store
  if (input.logo_url) {
    await supabase
      .from('stores')
      .update({ logo_url: input.logo_url })
      .eq('id', store.id)
    return { ...store, logo_url: input.logo_url }
  }
  return store
}

export async function updateStore(
  id: string,
  input: Partial<Omit<CreateStoreInput, 'company_id'>>
): Promise<Store> {
  const { data, error } = await supabase
    .from('stores')
    .update({
      name: input.name,
      address: input.address ?? undefined,
      logo_url: input.logo_url ?? undefined,
      phone: input.phone ?? undefined,
      email: input.email ?? undefined,
      description: input.description ?? undefined,
      is_primary: input.is_primary,
      pos_discount_enabled: input.pos_discount_enabled,
    })
    .eq('id', id)
    .select('id, company_id, name, code, address, logo_url, phone, email, description, is_active, is_primary, pos_discount_enabled, created_at')
    .single()
  if (error) throw new Error(error.message)
  return data as Store
}

const BUCKET = 'store-logos'

export async function uploadStoreLogo(storeId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${storeId}/${Date.now()}.${ext}`
  const { data, error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type,
  })
  if (error) throw new Error(error.message)
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path)
  return urlData.publicUrl
}
