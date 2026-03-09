import { supabase } from '@/lib/supabase'

export interface Supplier {
  id: string
  company_id: string
  name: string
  contact: string | null
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
}

export const suppliersApi = {
  async list(companyId: string): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('id, company_id, name, contact, phone, email, address, notes')
      .eq('company_id', companyId)
      .order('name')
    if (error) throw new Error(error.message)
    return (data ?? []) as Supplier[]
  },
}
