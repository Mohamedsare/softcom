import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { ROUTES } from '@/routes'

interface RequireSuperAdminProps {
  children: React.ReactNode
}

export function RequireSuperAdmin({ children }: RequireSuperAdminProps) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-[var(--text-secondary)]">Chargement...</p>
      </div>
    )
  }

  if (!user || !profile?.is_super_admin) {
    return <Navigate to={ROUTES.dashboard} replace />
  }

  return <>{children}</>
}
