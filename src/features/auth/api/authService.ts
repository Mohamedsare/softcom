import { supabase } from '@/lib/supabase'
import { translateErrorMessage } from '@/lib/errorMessages'

function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'entreprise'
}

export interface RegisterCompanyInput {
  companyName: string
  companySlug: string
  ownerEmail: string
  ownerPassword: string
  ownerFullName: string
  firstStoreName: string
  firstStorePhone: string
}

/**
 * Register a new company with owner user and first store.
 * 1. Sign up user with Supabase Auth
 * 2. Call RPC create_company_with_owner (bypass RLS, needs session)
 * Important: désactiver "Confirm email" dans Supabase Auth pour avoir une session immédiate.
 */
export async function registerCompany(input: RegisterCompanyInput): Promise<{ userId: string; companyId: string; storeId: string }> {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: input.ownerEmail,
    password: input.ownerPassword,
    options: { data: { full_name: input.ownerFullName } },
  })
  if (authError) throw new Error(translateErrorMessage(authError.message, (authError as { code?: string }).code))
  const userId = authData.user?.id
  if (!userId) throw new Error('Inscription échouée.')

  await supabase.from('profiles').upsert({
    id: userId,
    full_name: input.ownerFullName,
    is_super_admin: false,
  })

  const { data: result, error: rpcError } = await supabase.rpc('create_company_with_owner', {
    p_company_name: input.companyName,
    p_company_slug: input.companySlug || slugFromName(input.companyName),
    p_store_name: input.firstStoreName,
    p_store_code: null,
    p_store_phone: input.firstStorePhone || null,
  })
  if (rpcError) {
    throw new Error(rpcError.message ? translateErrorMessage(rpcError.message) : 'Création entreprise échouée. Vérifiez que le seed a été exécuté.')
  }
  const res = result as { company_id: string; store_id: string; user_id: string }
  return { userId: res.user_id, companyId: res.company_id, storeId: res.store_id }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(translateErrorMessage(error.message, (error as { code?: string }).code))
  return data
}

export async function signOut() {
  await supabase.auth.signOut()
}

export async function resetPasswordForEmail(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  if (error) throw new Error(translateErrorMessage(error.message, (error as { code?: string }).code))
}
