import { useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { RequireAuth } from '@/components/guards/RequireAuth'
import { AppShell } from '@/components/layout/AppShell'
import { ROUTES } from '@/routes'

/**
 * Non authentifié → toujours vers la page de connexion (la landing n’est pas dans l’app).
 * Authentifié → dashboard ou admin selon le rôle.
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
    return <Navigate to={ROUTES.login} replace state={{ from: location }} />
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
