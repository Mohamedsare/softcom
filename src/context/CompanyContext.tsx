import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

export interface Company {
  id: string
  name: string
  slug: string | null
  is_active: boolean
  store_quota: number
  ai_predictions_enabled?: boolean
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
}

interface CompanyState {
  companies: Company[]
  currentCompanyId: string | null
  stores: Store[]
  currentStoreId: string | null
  loading: boolean
}

const initialState: CompanyState = {
  companies: [],
  currentCompanyId: null,
  stores: [],
  currentStoreId: null,
  loading: true,
}

const CompanyContext = createContext<CompanyState & {
  setCurrentCompanyId: (id: string | null) => void
  setCurrentStoreId: (id: string | null) => void
  refreshCompanies: () => Promise<void>
  refreshStores: () => Promise<void>
} | null>(null)

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [state, setState] = useState<CompanyState>(initialState)

  const refreshCompanies = useCallback(async () => {
    if (!user) {
      setState((s) => ({ ...s, companies: [], currentCompanyId: null, stores: [], currentStoreId: null, loading: false }))
      return
    }
    const { data: roles, error: rolesError } = await supabase
      .from('user_company_roles')
      .select('company_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
    if (rolesError || !roles?.length) {
      setState((s) => ({ ...s, companies: [], currentCompanyId: null, stores: [], currentStoreId: null, loading: false }))
      return
    }
    const companyIds = [...new Set((roles as { company_id: string }[]).map((r) => r.company_id))]
    const { data: companiesData } = await supabase
      .from('companies')
      .select('id, name, slug, is_active, store_quota, ai_predictions_enabled')
      .in('id', companyIds)
    const companies = (companiesData ?? []) as Company[]
    setState((s) => ({
      ...s,
      companies,
      currentCompanyId: s.currentCompanyId && companies.some((c) => c.id === s.currentCompanyId) ? s.currentCompanyId : (companies[0]?.id ?? null),
      loading: false,
    }))
  }, [user?.id])

  const refreshStores = useCallback(async () => {
    if (!state.currentCompanyId) {
      setState((s) => ({ ...s, stores: [], currentStoreId: null }))
      return
    }
    const { data } = await supabase
      .from('stores')
      .select('id, company_id, name, code, address, logo_url, phone, email, description, is_active, is_primary')
      .eq('company_id', state.currentCompanyId)
      .eq('is_active', true)
    const stores = (data ?? []) as Store[]
    setState((s) => ({
      ...s,
      stores,
      currentStoreId:
        s.currentStoreId && stores.some((st) => st.id === s.currentStoreId)
          ? s.currentStoreId
          : (stores.find((st) => st.is_primary)?.id ?? stores[0]?.id ?? null),
    }))
  }, [state.currentCompanyId])

  const setCurrentCompanyId = useCallback((id: string | null) => {
    setState((s) => ({ ...s, currentCompanyId: id, currentStoreId: null }))
  }, [])

  const setCurrentStoreId = useCallback((id: string | null) => {
    setState((s) => ({ ...s, currentStoreId: id }))
  }, [])

  useEffect(() => {
    if (user) refreshCompanies()
    else setState((s) => ({ ...s, companies: [], currentCompanyId: null, stores: [], currentStoreId: null, loading: false }))
  }, [user?.id, refreshCompanies])

  useEffect(() => {
    if (state.currentCompanyId) refreshStores()
    else setState((s) => ({ ...s, stores: [], currentStoreId: null }))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refreshStores is stable enough; we only want to run when currentCompanyId changes
  }, [state.currentCompanyId])

  const value = useMemo(
    () => ({
      ...state,
      setCurrentCompanyId,
      setCurrentStoreId,
      refreshCompanies,
      refreshStores,
    }),
    [state, setCurrentCompanyId, setCurrentStoreId, refreshCompanies, refreshStores]
  )

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>
}

export function useCompany() {
  const ctx = useContext(CompanyContext)
  if (!ctx) throw new Error('useCompany must be used within CompanyProvider')
  return ctx
}
