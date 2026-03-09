import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  is_super_admin: boolean
  is_active?: boolean
}

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
}

const initialState: AuthState = {
  user: null,
  session: null,
  profile: null,
  loading: true,
}

const AuthContext = createContext<AuthState & {
  isSuperAdmin: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<Profile | null>
} | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState)

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, is_super_admin, is_active')
      .eq('id', userId)
      .single()
    if (error) {
      console.warn('[Auth] Profile fetch failed:', error.message, error.code)
      return null
    }
    if (!data) return null
    return data as Profile
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setState({ user: null, session: null, profile: null, loading: false })
  }, [])

  const applyProfileAndMaybeSignOut = useCallback((profile: Profile | null) => {
    setState((s) => ({ ...s, profile }))
    if (profile && profile.is_active === false) {
      supabase.auth.signOut()
      setState({ user: null, session: null, profile: null, loading: false })
    }
  }, [])

  const refreshProfile = useCallback(async (): Promise<Profile | null> => {
    const user = state.user ?? (await supabase.auth.getUser()).data.user
    if (!user) {
      setState((s) => ({ ...s, profile: null }))
      return null
    }
    const profile = await fetchProfile(user.id)
    applyProfileAndMaybeSignOut(profile)
    return profile
  }, [state.user, fetchProfile, applyProfileAndMaybeSignOut])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState((s) => ({ ...s, session, user: session?.user ?? null, loading: false }))
      if (session?.user) {
        fetchProfile(session.user.id).then(applyProfileAndMaybeSignOut)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState((s) => ({ ...s, session, user: session?.user ?? null }))
      if (session?.user) {
        fetchProfile(session.user.id).then(applyProfileAndMaybeSignOut)
      } else {
        setState((s) => ({ ...s, profile: null }))
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile, applyProfileAndMaybeSignOut])

  const value = useMemo(
    () => ({
      ...state,
      isSuperAdmin: state.profile?.is_super_admin ?? false,
      signOut,
      refreshProfile,
    }),
    [state, signOut, refreshProfile]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
