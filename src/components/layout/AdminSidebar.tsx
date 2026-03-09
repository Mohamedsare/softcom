import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { ROUTES } from '@/routes'
import {
  LayoutDashboard,
  Building2,
  Store,
  Users,
  Sparkles,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
  Shield,
} from 'lucide-react'

const adminNavItems = [
  { to: ROUTES.admin, label: 'Tableau', icon: LayoutDashboard },
  { to: ROUTES.adminCompanies, label: 'Entreprises', icon: Building2 },
  { to: ROUTES.adminStores, label: 'Boutiques', icon: Store },
  { to: ROUTES.adminUsers, label: 'Users', icon: Users },
  { to: ROUTES.adminAI, label: 'AI', icon: Sparkles },
  { to: ROUTES.adminRapports, label: 'Rapports', icon: BarChart3 },
  { to: ROUTES.adminSettings, label: 'Paramètres', icon: Settings },
]

interface AdminSidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  onSignOut: () => void
  /** Pour mobile: fermer le menu après navigation */
  onNavigate?: () => void
}

export function AdminSidebar({ collapsed, onToggleCollapse, onSignOut, onNavigate }: AdminSidebarProps) {
  const location = useLocation()
  const { user, profile } = useAuth()

  const isActive = (path: string) => {
    if (path === ROUTES.admin) return location.pathname === path || location.pathname === path + '/'
    return location.pathname.startsWith(path)
  }

  return (
    <>
      <div className="flex h-14 min-h-[44px] items-center justify-between border-b border-orange-500/20 bg-orange-500/5 px-3">
        {!collapsed && (
          <span className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
            <Shield className="h-5 w-5 text-orange-500" />
            Admin plateforme
          </span>
        )}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="rounded-lg p-2 min-h-[44px] min-w-[44px] text-[var(--text-secondary)] hover:bg-slate-700/50 touch-manipulation"
          aria-label={collapsed ? 'Ouvrir menu' : 'Replier menu'}
        >
          {collapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        {!collapsed && (
          <div className="mb-2 px-2 py-1 text-xs font-medium text-orange-500/80">Gestion plateforme</div>
        )}
        {adminNavItems.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 min-h-[44px] transition-colors touch-manipulation ${
              isActive(to)
                ? 'bg-orange-500/10 text-orange-500'
                : 'text-[var(--text-secondary)] hover:bg-orange-500/10 hover:text-[var(--text-primary)]'
            }`}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}
      </nav>
      <div className="border-t border-slate-700/50 p-2">
        {!collapsed && user && (
          <div className="mb-2 px-2 text-xs text-[var(--text-muted)] truncate">
            {profile?.full_name ?? user.email}
          </div>
        )}
        <button
          type="button"
          onClick={onSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 min-h-[44px] text-[var(--text-secondary)] transition-colors hover:bg-slate-700/50 hover:text-[var(--danger)] touch-manipulation"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </>
  )
}
