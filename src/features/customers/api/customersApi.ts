import { supabase } from '@/lib/supabase'

export type CustomerType = 'individual' | 'company'

export interface Customer {
  id: string
  company_id: string
  name: string
  type: CustomerType
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  created_at?: string
  updated_at?: string
}

export interface CreateCustomerInput {
  company_id: string
  name: string
  type?: CustomerType
  phone?: string | null
  email?: string | null
  address?: string | null
  notes?: string | null
}

export interface UpdateCustomerInput {
  name?: string
  type?: CustomerType
  phone?: string | null
  email?: string | null
  address?: string | null
  notes?: string | null
}

const FIELDS = 'id, company_id, name, type, phone, email, address, notes, created_at, updated_at'

export const customersApi = {
  async list(companyId: string): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select(FIELDS)
      .eq('company_id', companyId)
      .order('name')
    if (error) throw new Error(error.message)
    return (data ?? []) as Customer[]
  },

  async get(id: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from('customers')
      .select(FIELDS)
      .eq('id', id)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data as Customer | null
  },

  async create(input: CreateCustomerInput): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .insert({
        company_id: input.company_id,
        name: input.name,
        type: input.type ?? 'individual',
        phone: input.phone ?? null,
        email: input.email ?? null,
        address: input.address ?? null,
        notes: input.notes ?? null,
      })
      .select(FIELDS)
      .single()
    if (error) throw new Error(error.message)
    return data as Customer
  },

  async update(id: string, input: UpdateCustomerInput): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .update({
        ...(input.name !== undefined && { name: input.name }),
        ...(input.type !== undefined && { type: input.type }),
        ...(input.phone !== undefined && { phone: input.phone }),
        ...(input.email !== undefined && { email: input.email }),
        ...(input.address !== undefined && { address: input.address }),
        ...(input.notes !== undefined && { notes: input.notes }),
      })
      .eq('id', id)
      .select(FIELDS)
      .single()
    if (error) throw new Error(error.message)
    return data as Customer
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('customers').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}
