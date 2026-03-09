import { supabase } from '@/lib/supabase'

export interface RoleOption {
  id: string
  name: string
  slug: string
}

export async function listRoles(): Promise<RoleOption[]> {
  const { data, error } = await supabase.from('roles').select('id, name, slug').order('name')
  if (error) throw error
  return (data ?? []) as RoleOption[]
}

export interface CompanyMember {
  id: string
  user_id: string
  role_id: string
  is_active: boolean
  created_at: string
  role: { name: string; slug: string }
  profile: { full_name: string | null } | null
  email?: string
}

/**
 * List members of a company (user_company_roles + profiles + roles).
 * Email is not in profiles; we don't have it in DB for other users unless we add it or use auth.admin.
 */
export async function listCompanyMembers(companyId: string): Promise<CompanyMember[]> {
  const { data: rows, error } = await supabase
    .from('user_company_roles')
    .select('id, user_id, role_id, is_active, created_at, roles(name, slug)')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (error) throw error
  if (!rows?.length) return []

  const userIds = [...new Set((rows as { user_id: string }[]).map((r) => r.user_id))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', userIds)

  const byId = new Map((profiles ?? []).map((p) => [p.id, p]))

  return (rows as unknown as Array<{
    id: string
    user_id: string
    role_id: string
    is_active: boolean
    created_at: string
    roles: { name: string; slug: string } | null
  }>).map((r) => ({
    id: r.id,
    user_id: r.user_id,
    role_id: r.role_id,
    is_active: r.is_active,
    created_at: r.created_at,
    role: r.roles ?? { name: '—', slug: '' },
    profile: byId.get(r.user_id) ? { full_name: byId.get(r.user_id)!.full_name } : null,
  }))
}

export async function setCompanyMemberActive(
  userCompanyRoleId: string,
  isActive: boolean
): Promise<void> {
  const { error } = await supabase
    .from('user_company_roles')
    .update({ is_active: isActive })
    .eq('id', userCompanyRoleId)
  if (error) throw error
}
