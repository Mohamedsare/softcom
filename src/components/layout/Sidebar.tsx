import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useCompany } from '@/context/CompanyContext'
import { ROUTES } from '@/routes'
import {
  LayoutDashboard,
  Store,
  Users,
  UserCircle,
  Package,
  ShoppingCart,
  Truck,
  ArrowLeftRight,
  BarChart3,
  Sparkles,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react'

const navItems = [
  { to: ROUTES.dashboard, label: 'Tableau de bord', icon: LayoutDashboard },
  { to: ROUTES.users, label: 'Utilisateurs', icon: Users },
  { to: ROUTES.products, label: 'Produits', icon: Package },
  { to: ROUTES.sales, label: 'Ventes', icon: ShoppingCart },
  { to: ROUTES.customers, label: 'Clients', icon: UserCircle },
  { to: ROUTES.purchases, label: 'Achats', icon: Truck },
  { to: ROUTES.transfers, label: 'Transferts', icon: ArrowLeftRight },
  { to: ROUTES.reports, label: 'Rapports', icon: BarChart3 },
  { to: ROUTES.ai, label: 'Insights IA', icon: Sparkles },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const { profile, signOut, isSuperAdmin } = useAuth()
  const { companies, stores, currentCompanyId, currentStoreId, setCurrentCompanyId, setCurrentStoreId } = useCompany()
  const currentCompany = companies.find((c) => c.id === currentCompanyId)
  const currentStore = stores.find((s) => s.id === currentStoreId)
  const companyOptions = companies
  const storeOptions = stores

  return (
    <aside
      className={`flex flex-col border-r border-[var(--border-solid)] bg-[var(--bg-secondary)] transition-[width] duration-300 ${
        collapsed ? 'w-[72px]' : 'w-[240px]'
      }`}
    >
      <div className="flex h-14 items-center justify-between border-b border-slate-700/50 px-3">
        {!collapsed && <span className="font-semibold text-[var(--text-primary)]">FasoStock</span>}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-slate-700/50"
          aria-label={collapsed ? 'Ouvrir' : 'Replier'}
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>
      {!collapsed && (companyOptions.length > 1 || storeOptions.length > 1) && (
        <div className="border-b border-slate-700/50 p-2">
          {companyOptions.length > 1 && (
            <select
              value={currentCompany?.id ?? ''}
              onChange={(e) => setCurrentCompanyId(e.target.value || null)}
              className="w-full rounded-lg border border-[var(--border)] bg-slate-50 px-2 py-1.5 text-sm dark:bg-slate-900"
            >
              {companyOptions.map((c: { id: string; name: string }) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
          {storeOptions.length > 1 && (
            <select
              value={currentStore?.id ?? ''}
              onChange={(e) => setCurrentStoreId(e.target.value || null)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-slate-50 px-2 py-1.5 text-sm dark:bg-slate-900"
            >
              {storeOptions.map((s: { id: string; name: string; code: string | null }) => (
                <option key={s.id} value={s.id}>{s.name} {s.code ? `(${s.code})` : ''}</option>
              ))}
            </select>
          )}
        </div>
      )}
      <nav className="flex-1 space-y-0.5 p-2">
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to || (to !== ROUTES.dashboard && location.pathname.startsWith(to + '/'))
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-orange-500/10 text-orange-500 dark:bg-orange-500/10 dark:text-orange-500'
                  : 'text-[var(--text-secondary)] hover:bg-slate-700/50 hover:text-[var(--text-primary)]'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}
        {isSuperAdmin && (
          <Link
            to={ROUTES.admin}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
              location.pathname.startsWith(ROUTES.admin)
                ? 'bg-orange-500/10 text-orange-500'
                : 'text-orange-500/90 hover:bg-orange-500/10'
            }`}
          >
            <Shield className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Admin plateforme</span>}
          </Link>
        )}
      </nav>
      <div className="border-t border-slate-700/50 p-2">
        {!collapsed && profile && (
          <p className="truncate px-3 py-1 text-xs text-[var(--text-muted)]">{profile.full_name ?? 'Utilisateur'}</p>
        )}
        <Link
          to={ROUTES.stores}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
            location.pathname.startsWith(ROUTES.stores)
              ? 'bg-orange-500/10 text-orange-500'
              : 'text-[var(--text-secondary)] hover:bg-slate-700/50 hover:text-[var(--text-primary)]'
          }`}
        >
          <Store className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Boutiques</span>}
        </Link>
        <Link
          to={ROUTES.settings}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
            location.pathname.startsWith(ROUTES.settings)
              ? 'bg-orange-500/10 text-orange-500'
              : 'text-[var(--text-secondary)] hover:bg-slate-700/50 hover:text-[var(--text-primary)]'
          }`}
        >
          <Settings className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Paramètres</span>}
        </Link>
        <button
          type="button"
          onClick={() => signOut()}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-slate-700/50 hover:text-[var(--danger)]"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </aside>
  )
}
