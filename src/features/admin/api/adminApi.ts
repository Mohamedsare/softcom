import { supabase } from '@/lib/supabase'

export interface AdminCompany {
  id: string
  name: string
  slug: string | null
  is_active: boolean
  store_quota: number
  ai_predictions_enabled: boolean
  created_at: string
}

export interface AdminStore {
  id: string
  company_id: string
  name: string
  code: string | null
  is_active: boolean
  is_primary: boolean
  created_at: string
}

export interface AdminStats {
  companiesCount: number
  storesCount: number
  usersCount: number
  salesCount: number
  salesTotalAmount: number
}

export interface AdminUser {
  id: string
  email: string | null
  full_name: string | null
  is_super_admin: boolean
  is_active: boolean
  company_names: string[]
}

export interface AdminSalesByCompany {
  companyId: string
  companyName: string
  salesCount: number
  totalAmount: number
}

export async function adminListCompanies(): Promise<AdminCompany[]> {
  const { data, error } = await supabase
    .from('companies')
    .select('id, name, slug, is_active, store_quota, ai_predictions_enabled, created_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as AdminCompany[]
}

export async function adminListStores(companyId?: string): Promise<AdminStore[]> {
  let q = supabase
    .from('stores')
    .select('id, company_id, name, code, is_active, is_primary, created_at')
    .order('created_at', { ascending: false })
  if (companyId) q = q.eq('company_id', companyId)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as AdminStore[]
}

export async function adminUpdateCompany(
  id: string,
  patch: { is_active?: boolean; ai_predictions_enabled?: boolean }
): Promise<void> {
  const { error } = await supabase.from('companies').update(patch).eq('id', id)
  if (error) throw error
}

export async function adminUpdateStore(
  id: string,
  patch: { is_active?: boolean }
): Promise<void> {
  const { error } = await supabase.from('stores').update(patch).eq('id', id)
  if (error) throw error
}

export async function adminDeleteCompany(id: string): Promise<void> {
  const { error } = await supabase.from('companies').delete().eq('id', id)
  if (error) throw error
}

export async function adminDeleteStore(id: string): Promise<void> {
  const { error } = await supabase.from('stores').delete().eq('id', id)
  if (error) throw error
}

export async function adminGetStats(): Promise<AdminStats> {
  const [
    { count: companiesCount },
    { count: storesCount },
    { count: usersCount },
    { data: salesData },
  ] = await Promise.all([
    supabase.from('companies').select('*', { count: 'exact', head: true }),
    supabase.from('stores').select('*', { count: 'exact', head: true }),
    supabase.from('user_company_roles').select('*', { count: 'exact', head: true }),
    supabase.from('sales').select('id, total').eq('status', 'completed'),
  ])

  const salesTotalAmount = (salesData ?? []).reduce((s, r) => s + (Number((r as { total: number }).total) || 0), 0)

  return {
    companiesCount: companiesCount ?? 0,
    storesCount: storesCount ?? 0,
    usersCount: usersCount ?? 0,
    salesCount: (salesData ?? []).length,
    salesTotalAmount,
  }
}

export async function adminListUsers(): Promise<AdminUser[]> {
  const { data, error } = await supabase.rpc('admin_list_users')
  if (error) throw error
  return (data ?? []) as AdminUser[]
}

export async function adminGetSalesByCompany(): Promise<AdminSalesByCompany[]> {
  const [salesRes, companiesRes] = await Promise.all([
    supabase.from('sales').select('company_id, total').eq('status', 'completed'),
    supabase.from('companies').select('id, name'),
  ])
  if (salesRes.error) throw salesRes.error
  if (companiesRes.error) throw companiesRes.error
  const sales = (salesRes.data ?? []) as { company_id: string; total: number }[]
  const companies = (companiesRes.data ?? []) as { id: string; name: string }[]
  const byCompany = new Map<string, { count: number; total: number }>()
  for (const s of sales) {
    const cur = byCompany.get(s.company_id) ?? { count: 0, total: 0 }
    cur.count += 1
    cur.total += Number(s.total) || 0
    byCompany.set(s.company_id, cur)
  }
  return companies.map((c) => {
    const agg = byCompany.get(c.id) ?? { count: 0, total: 0 }
    return { companyId: c.id, companyName: c.name, salesCount: agg.count, totalAmount: agg.total }
  }).sort((a, b) => b.totalAmount - a.totalAmount)
}

/** CA et nombre de ventes par jour (30 derniers jours) pour les graphiques */
export interface AdminSalesOverTimeItem {
  date: string
  count: number
  total: number
}

export async function adminGetSalesOverTime(days = 30): Promise<AdminSalesOverTimeItem[]> {
  const fromDate = new Date()
  fromDate.setDate(fromDate.getDate() - days)
  const fromStr = fromDate.toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('sales')
    .select('created_at, total')
    .eq('status', 'completed')
    .gte('created_at', fromStr)
  if (error) throw error
  const sales = (data ?? []) as { created_at: string; total: number }[]
  const byDay = new Map<string, { count: number; total: number }>()
  for (const s of sales) {
    const day = s.created_at.slice(0, 10)
    const cur = byDay.get(day) ?? { count: 0, total: 0 }
    cur.count += 1
    cur.total += Number(s.total) || 0
    byDay.set(day, cur)
  }
  const result: AdminSalesOverTimeItem[] = []
  for (let d = 0; d < days; d++) {
    const date = new Date(fromDate)
    date.setDate(date.getDate() + d)
    const dayStr = date.toISOString().slice(0, 10)
    const agg = byDay.get(dayStr) ?? { count: 0, total: 0 }
    result.push({ date: dayStr, count: agg.count, total: agg.total })
  }
  return result
}

export async function adminUpdateProfile(
  userId: string,
  patch: { full_name?: string | null; is_super_admin?: boolean }
): Promise<void> {
  const { error } = await supabase.rpc('admin_update_profile', {
    p_user_id: userId,
    p_full_name: patch.full_name ?? undefined,
    p_is_super_admin: patch.is_super_admin ?? undefined,
  })
  if (error) throw error
}

export async function adminGetUserCompanyIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase.rpc('admin_get_user_company_ids', { p_user_id: userId })
  if (error) throw error
  return (data ?? []) as string[]
}

export async function adminSetUserCompanies(
  userId: string,
  companyIds: string[],
  roleSlug = 'store_manager'
): Promise<void> {
  const { error } = await supabase.rpc('admin_set_user_companies', {
    p_user_id: userId,
    p_company_ids: companyIds,
    p_role_slug: roleSlug,
  })
  if (error) throw error
}

export async function adminSetUserActive(userId: string, active: boolean): Promise<void> {
  const { error } = await supabase.rpc('admin_set_user_active', {
    p_user_id: userId,
    p_active: active,
  })
  if (error) throw error
}

export async function adminDeleteUser(userId: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('admin-delete-user', {
    body: { user_id: userId },
  })
  if (error) throw error
  const err = (data as { error?: string })?.error
  if (err) throw new Error(err)
}

export interface LandingChatMessage {
  id: string
  session_id: string
  role: string
  content: string
  created_at: string
}

export async function adminListLandingChatMessages(limit = 500): Promise<LandingChatMessage[]> {
  const { data, error } = await supabase
    .from('landing_chat_messages')
    .select('id, session_id, role, content, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as LandingChatMessage[]
}

export async function adminGetPlatformSettings(): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('platform_settings')
    .select('key, value')
  if (error) throw error
  const out: Record<string, string> = {}
  for (const row of data ?? []) {
    out[(row as { key: string; value: string }).key] = (row as { key: string; value: string }).value
  }
  return out
}

export async function adminSetPlatformSetting(key: string, value: string): Promise<void> {
  const { error } = await supabase
    .from('platform_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
  if (error) throw error
}

export async function adminSetPlatformSettings(settings: Record<string, string>): Promise<void> {
  for (const [key, value] of Object.entries(settings)) {
    await adminSetPlatformSetting(key, value)
  }
}
