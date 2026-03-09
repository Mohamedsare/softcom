import { supabase } from '@/lib/supabase'

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  is_super_admin: boolean
}

export const profilesApi = {
  async updateProfile(userId: string, data: { full_name?: string }): Promise<Profile> {
    const { data: profile, error } = await supabase
      .from('profiles')
      .update({ full_name: data.full_name ?? undefined })
      .eq('id', userId)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return profile as Profile
  },
}
