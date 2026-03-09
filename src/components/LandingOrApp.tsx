import { useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { RequireAuth } from '@/components/guards/RequireAuth'
import { AppShell } from '@/components/layout/AppShell'
import { LandingPage } from '@/pages/LandingPage'
import { ROUTES } from '@/routes'

/**
 * At "/": show Landing if not authenticated, else redirect to dashboard.
 * At app routes: require auth and show AppShell (Outlet is inside AppShell).
 */
export function LandingOrApp() {
  const { user, loading, isSuperAdmin } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)]">
        <p className="text-[var(--text-secondary)]">Chargement...</p>
      </div>
    )
  }

  if (!user) {
    if (location.pathname === '/') return <LandingPage />
    return <Navigate to="/" replace />
  }

  // Super admin : uniquement l’admin plateforme, jamais l’espace entreprise
  if (isSuperAdmin) {
    if (location.pathname === '/') return <Navigate to={ROUTES.admin} replace />
    if (!location.pathname.startsWith(ROUTES.admin)) return <Navigate to={ROUTES.admin} replace />
  } else if (location.pathname === '/') {
    return <Navigate to={ROUTES.dashboard} replace />
  }

  return (
    <RequireAuth>
      <AppShell />
    </RequireAuth>
  )
}
