import { useState } from 'react'
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useCompany } from '@/context/CompanyContext'
import { ROUTES } from '@/routes'
import { AdminSidebar } from '@/components/layout/AdminSidebar'
import {
  LayoutDashboard,
  Store,
  LogOut,
  Menu,
  ChevronLeft,
  Package,
  ShoppingCart,
  Settings,
  BarChart3,
  TrendingUp,
  Truck,
  UserCircle,
  MoreHorizontal,
  Sparkles,
} from 'lucide-react'

const sidebarWidth = 240
const sidebarCollapsedWidth = 72

const mobilePrimaryItems = [
  { to: ROUTES.dashboard, label: 'Dashboard', icon: LayoutDashboard },
  { to: ROUTES.products, label: 'Produits', icon: Package },
  { to: ROUTES.sales, label: 'Ventes', icon: ShoppingCart },
]

const mobileMoreItems = [
  { to: ROUTES.reports, label: 'Rapports', icon: TrendingUp },
  { to: ROUTES.ai, label: 'Prédictions IA', icon: Sparkles },
  { to: ROUTES.inventory, label: 'Stock', icon: BarChart3 },
  { to: ROUTES.customers, label: 'Clients', icon: UserCircle },
  { to: ROUTES.purchases, label: 'Achats', icon: Truck },
  { to: ROUTES.stores, label: 'Boutiques', icon: Store },
  { to: ROUTES.settings, label: 'Paramètres', icon: Settings },
]

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [plusMenuOpen, setPlusMenuOpen] = useState(false)
  const { user, profile, signOut } = useAuth()
  const { currentCompanyId, companies, currentStoreId, stores, setCurrentCompanyId, setCurrentStoreId } = useCompany()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSignOut = async () => {
    await signOut()
    navigate(ROUTES.login)
  }

  const isActive = (path: string) => {
    if (path === ROUTES.dashboard) return location.pathname === path
    return location.pathname.startsWith(path)
  }

  const navLinkClass = (path: string) =>
    `flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-3 px-2 min-h-[44px] min-w-[44px] transition-colors touch-manipulation active:scale-[0.98] ${
      isActive(path)
        ? 'bg-orange-500/10 text-[var(--accent)]'
        : 'text-[var(--text-secondary)] hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-800'
    }`

  const navItems = [
    { to: ROUTES.dashboard, label: 'Tableau de bord', icon: LayoutDashboard },
    { to: ROUTES.products, label: 'Produits', icon: Package },
    { to: ROUTES.sales, label: 'Ventes', icon: ShoppingCart },
  ]

  const isAdminRoute = location.pathname.startsWith(ROUTES.admin)

  const adminSidebarContent = (
    <AdminSidebar
      collapsed={collapsed}
      onToggleCollapse={() => setCollapsed((c) => !c)}
      onSignOut={handleSignOut}
      onNavigate={() => setMobileMenuOpen(false)}
    />
  )

  const sidebarContent = isAdminRoute ? adminSidebarContent : (
    <>
      <div className="flex h-14 min-h-[44px] items-center justify-between border-b border-slate-700/50 px-3">
        {!collapsed && <span className="font-semibold text-[var(--text-primary)]">FasoStock</span>}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="rounded-lg p-2 min-h-[44px] min-w-[44px] text-[var(--text-secondary)] hover:bg-slate-700/50 touch-manipulation"
          aria-label={collapsed ? 'Ouvrir menu' : 'Replier menu'}
        >
          {collapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        {!collapsed && (
          <>
            <div className="mb-2 px-2 py-1 text-xs font-medium text-[var(--text-muted)]">Entreprise</div>
            <select
              value={currentCompanyId ?? ''}
              onChange={(e) => setCurrentCompanyId(e.target.value || null)}
              className="mb-3 w-full min-h-[44px] rounded-lg border border-[var(--border-solid)] bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800"
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {stores.length > 0 && (
              <>
                <div className="mb-2 px-2 py-1 text-xs font-medium text-[var(--text-muted)]">Boutique</div>
                <select
                  value={currentStoreId ?? ''}
                  onChange={(e) => setCurrentStoreId(e.target.value || null)}
                  className="mb-3 w-full min-h-[44px] rounded-lg border border-[var(--border-solid)] bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800"
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </>
            )}
          </>
        )}
        {navItems.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 min-h-[44px] transition-colors touch-manipulation ${
              isActive(to) ? 'bg-orange-500/10 text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:bg-orange-500/10 hover:text-[var(--accent)]'
            }`}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}
        <Link
          to={ROUTES.inventory}
          className={`flex items-center gap-3 rounded-xl px-3 py-2 min-h-[44px] transition-colors touch-manipulation ${
            isActive(ROUTES.inventory) ? 'bg-orange-500/10 text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:bg-orange-500/10 hover:text-[var(--accent)]'
          }`}
        >
          <BarChart3 className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Stock</span>}
        </Link>
        <Link
          to={ROUTES.reports}
          className={`flex items-center gap-3 rounded-xl px-3 py-2 min-h-[44px] transition-colors touch-manipulation ${
            isActive(ROUTES.reports) ? 'bg-orange-500/10 text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:bg-orange-500/10 hover:text-[var(--accent)]'
          }`}
        >
          <TrendingUp className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Rapports</span>}
        </Link>
        <Link
          to={ROUTES.ai}
          className={`flex items-center gap-3 rounded-xl px-3 py-2 min-h-[44px] transition-colors touch-manipulation ${
            isActive(ROUTES.ai) ? 'bg-orange-500/10 text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:bg-orange-500/10 hover:text-[var(--accent)]'
          }`}
        >
          <Sparkles className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Prédictions IA</span>}
        </Link>
        <Link
          to={ROUTES.purchases}
          className={`flex items-center gap-3 rounded-xl px-3 py-2 min-h-[44px] transition-colors touch-manipulation ${
            isActive(ROUTES.purchases) ? 'bg-orange-500/10 text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:bg-orange-500/10 hover:text-[var(--accent)]'
          }`}
        >
          <Truck className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Achats</span>}
        </Link>
        <Link
          to={ROUTES.stores}
          className={`flex items-center gap-3 rounded-xl px-3 py-2 min-h-[44px] transition-colors touch-manipulation ${
            isActive(ROUTES.stores) ? 'bg-orange-500/10 text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:bg-orange-500/10 hover:text-[var(--accent)]'
          }`}
        >
          <Store className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Boutiques</span>}
        </Link>
        <Link
          to={ROUTES.settings}
          className={`mt-auto flex items-center gap-3 rounded-xl px-3 py-2 min-h-[44px] transition-colors touch-manipulation ${
            isActive(ROUTES.settings) ? 'bg-orange-500/10 text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:bg-orange-500/10 hover:text-[var(--accent)]'
          }`}
        >
          <Settings className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Paramètres</span>}
        </Link>
      </nav>
      <div className="border-t border-slate-700/50 p-2">
        {!collapsed && user && (
          <div className="mb-2 px-2 text-xs text-[var(--text-muted)] truncate">
            {profile?.full_name ?? user.email}
          </div>
        )}
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 min-h-[44px] text-[var(--text-secondary)] transition-colors hover:bg-slate-700/50 hover:text-[var(--danger)] touch-manipulation"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </>
  )

  const sidebarW = collapsed ? sidebarCollapsedWidth : sidebarWidth

  const showBottomNav = !isAdminRoute

  return (
    <div
      className="flex h-screen min-h-0 min-w-0 flex-col overflow-hidden bg-[var(--bg-primary)] lg:flex-row"
      style={{ '--sidebar-width': `${sidebarW}px` } as React.CSSProperties}
    >
      {/* Sidebar: hidden on mobile, visible on lg+ */}
      <aside
        className="fixed left-0 top-0 z-30 hidden h-full flex-col border-r border-[var(--border-solid)] bg-[var(--bg-secondary)] transition-all duration-300 dark:bg-slate-900/80 lg:flex"
        style={{ width: 'var(--sidebar-width)' }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile menu overlay (when hamburger opened) */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-[280px] flex-col border-r border-[var(--border-solid)] bg-[var(--bg-secondary)] transition-transform duration-300 dark:bg-slate-900/80 lg:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Main content */}
      <main
        className="main-content-mobile flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden transition-all duration-300 lg:ml-[var(--sidebar-width)]"
      >
        {/* Mobile top bar (safe-area for notch) */}
        <header
          className="shrink-0 flex min-h-[56px] items-center justify-between border-b border-[var(--border-solid)] bg-[var(--bg-secondary)] px-4 lg:hidden"
          style={{ paddingTop: 'max(12px, env(safe-area-inset-top, 0px))' }}
        >
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[var(--text-primary)] hover:bg-slate-100 dark:hover:bg-slate-800 touch-manipulation"
            aria-label="Menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-semibold text-[var(--text-primary)]">
            {isAdminRoute ? 'Admin plateforme' : 'FasoStock'}
          </span>
          <div className="w-11" />
        </header>

        <div
          className="main-content-scroll min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 lg:p-6"
          style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        >
          <Outlet />
        </div>
      </main>

      {/* Bottom navigation mobile: masquée sur les routes admin */}
      {showBottomNav && (
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-[var(--border-solid)] bg-[var(--card-bg)] shadow-[0_-2px_10px_rgba(0,0,0,0.05)] bottom-nav-area lg:hidden"
        aria-label="Navigation principale"
      >
        {mobilePrimaryItems.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className={navLinkClass(to)}>
            <Icon className="h-[18px] w-[18px]" />
            <span className="text-[10px] leading-tight">{label}</span>
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setPlusMenuOpen(true)}
          className={`flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-2 px-2 min-h-[44px] min-w-[44px] transition-colors touch-manipulation active:scale-[0.98] ${
            mobileMoreItems.some((i) => isActive(i.to))
              ? 'bg-orange-500/10 text-[var(--accent)]'
              : 'text-[var(--text-secondary)] active:bg-slate-100 dark:active:bg-slate-800'
          }`}
          aria-label="Plus"
        >
          <MoreHorizontal className="h-[18px] w-[18px]" />
          <span className="text-[10px] leading-tight">Plus</span>
        </button>
      </nav>
      )}

      {/* Bottom sheet "Plus" menu mobile */}
      {plusMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setPlusMenuOpen(false)}
            aria-hidden="true"
          />
          <div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border-t border-[var(--border-solid)] bg-[var(--card-bg)] pb-[env(safe-area-inset-bottom,0)] shadow-[0_-4px_20px_rgba(0,0,0,0.15)] lg:hidden animate-sheet-up"
            role="dialog"
            aria-label="Menu Plus"
          >
            <div className="flex justify-center py-2">
              <div className="h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-600" />
            </div>
            <div className="px-4 pb-4">
              <p className="mb-3 text-xs font-medium text-[var(--text-muted)]">Plus d&apos;options</p>
              <div className="space-y-0.5">
                {mobileMoreItems.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setPlusMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 min-h-[44px] text-sm transition-colors touch-manipulation ${
                      isActive(to)
                        ? 'bg-orange-500/10 text-[var(--accent)] font-medium'
                        : 'text-[var(--text-primary)] active:bg-slate-100 dark:active:bg-slate-800'
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0 text-[var(--text-muted)]" />
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
