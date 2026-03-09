import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useCompany } from '@/context/CompanyContext'
import { useQuery } from '@tanstack/react-query'
import { Card, PageHeader, Button } from '@/components/ui'
import {
  TrendingUp,
  ShoppingCart,
  Package,
  Percent,
  Truck,
  Warehouse,
  AlertTriangle,
  Store,
  BarChart3,
  ArrowRight,
  CreditCard,
  Shield,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format, parseISO, startOfDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Calendar } from 'lucide-react'
import {
  reportsApi,
  getDefaultDateRange,
} from '@/features/reports/api/reportsApi'
import { formatCurrency } from '@/lib/utils'
import { ROUTES } from '@/routes'

type Period = 'today' | 'week' | 'month'

export function DashboardPage() {
  const { isSuperAdmin } = useAuth()
  const {
    currentCompanyId,
    currentStoreId,
    stores,
    setCurrentStoreId,
    companies,
    refreshCompanies,
    refreshStores,
  } = useCompany()
  const [period, setPeriod] = useState<Period>('week')
  const [scope, setScope] = useState<'company' | 'store'>('company')
  const [selectedDay, setSelectedDay] = useState(() => format(startOfDay(new Date()), 'yyyy-MM-dd'))

  const range = useMemo(() => getDefaultDateRange(period), [period])
  const storeId = scope === 'store' ? currentStoreId ?? stores[0]?.id : undefined

  const filtersDay = useMemo(
    () => ({
      companyId: currentCompanyId!,
      storeId,
      fromDate: selectedDay,
      toDate: selectedDay,
    }),
    [currentCompanyId, storeId, selectedDay]
  )

  const filters = useMemo(
    () => ({
      companyId: currentCompanyId!,
      storeId,
      fromDate: range.from,
      toDate: range.to,
    }),
    [currentCompanyId, storeId, range]
  )

  useEffect(() => {
    refreshCompanies()
  }, [refreshCompanies])

  useEffect(() => {
    refreshStores()
  }, [refreshStores, currentCompanyId])

  const { data: salesSummary, isLoading: loadingSales } = useQuery({
    queryKey: ['dashboard-sales', filters],
    queryFn: () => reportsApi.getSalesSummary(filters),
    enabled: !!currentCompanyId,
  })

  const { data: salesByDay = [] } = useQuery({
    queryKey: ['dashboard-sales-by-day', filters],
    queryFn: () => reportsApi.getSalesByDay(filters),
    enabled: !!currentCompanyId,
  })

  const { data: topProducts = [] } = useQuery({
    queryKey: ['dashboard-top-products', filters],
    queryFn: () => reportsApi.getTopProducts(filters, 5),
    enabled: !!currentCompanyId,
  })

  const { data: purchasesSummary } = useQuery({
    queryKey: ['dashboard-purchases', filters],
    queryFn: () => reportsApi.getPurchasesSummary(filters),
    enabled: !!currentCompanyId,
  })

  const { data: stockValue } = useQuery({
    queryKey: ['dashboard-stock', currentCompanyId, storeId],
    queryFn: () =>
      storeId
        ? reportsApi.getStockValue(currentCompanyId!, storeId)
        : reportsApi.getCompanyStockValue(currentCompanyId!),
    enabled: !!currentCompanyId,
  })

  const { data: lowStockCount = 0 } = useQuery({
    queryKey: ['dashboard-low-stock', currentCompanyId, storeId],
    queryFn: () => reportsApi.getLowStockCount(currentCompanyId!, storeId),
    enabled: !!currentCompanyId,
  })

  const { data: daySalesSummary, isLoading: loadingDaySales } = useQuery({
    queryKey: ['dashboard-day-sales', filtersDay],
    queryFn: () => reportsApi.getSalesSummary(filtersDay),
    enabled: !!currentCompanyId,
  })

  const { data: dayPurchasesSummary } = useQuery({
    queryKey: ['dashboard-day-purchases', filtersDay],
    queryFn: () => reportsApi.getPurchasesSummary(filtersDay),
    enabled: !!currentCompanyId,
  })

  const chartData = salesByDay.map((d) => ({
    ...d,
    dateLabel: format(parseISO(d.date), 'dd MMM', { locale: fr }),
    total: Math.round(d.total),
  }))

  const marginRate =
    salesSummary && salesSummary.totalAmount > 0
      ? ((salesSummary.margin / salesSummary.totalAmount) * 100).toFixed(1)
      : '0'

  const company = companies.find((c) => c.id === currentCompanyId)
  const currentStore = stores.find((s) => s.id === storeId)

  if (!currentCompanyId) {
    return (
      <div className="space-y-6">
        <PageHeader title="Tableau de bord" description="Vue d'ensemble" />
        <Card>
          <p className="py-16 text-center text-[var(--text-muted)]">
            Sélectionnez une entreprise pour afficher le tableau de bord.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Tableau de bord"
        description={
          scope === 'company'
            ? `Vue Entreprise — ${company?.name ?? ''}`
            : `Vue Boutique — ${currentStore?.name ?? ''}`
        }
      />

      {isSuperAdmin && (
        <Link
          to={ROUTES.admin}
          className="flex items-center gap-3 rounded-xl border-2 border-orange-500 bg-orange-500/10 px-4 py-3 text-left transition-colors hover:bg-orange-500/20"
        >
          <Shield className="h-8 w-8 shrink-0 text-orange-500" />
          <div>
            <p className="font-semibold text-orange-600 dark:text-orange-400">Vous êtes super admin</p>
            <p className="text-sm text-[var(--text-muted)]">Cliquez pour accéder à l’administration plateforme</p>
          </div>
          <ArrowRight className="ml-auto h-5 w-5 text-orange-500" />
        </Link>
      )}

      {/* Sélecteur Vue Entreprise / Boutique + Période */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-[var(--text-secondary)]">Vue :</span>
            <Button
              size="sm"
              variant={scope === 'company' ? 'primary' : 'secondary'}
              onClick={() => setScope('company')}
              className="gap-2"
            >
              <Store className="h-4 w-4" />
              Entreprise
            </Button>
            {stores.length > 0 && (
              <Button
                size="sm"
                variant={scope === 'store' ? 'primary' : 'secondary'}
                onClick={() => {
                  setScope('store')
                  if (!currentStoreId && stores[0]) setCurrentStoreId(stores[0].id)
                }}
                className="gap-2"
              >
                <Package className="h-4 w-4" />
                Boutique
              </Button>
            )}
            {scope === 'store' && stores.length > 1 && (
              <select
                value={storeId ?? ''}
                onChange={(e) => setCurrentStoreId(e.target.value || null)}
                className="min-h-[40px] rounded-lg border border-[var(--border-solid)] bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800"
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="flex gap-2">
            {(['today', 'week', 'month'] as const).map((p) => (
              <Button
                key={p}
                size="sm"
                variant={period === p ? 'primary' : 'secondary'}
                onClick={() => setPeriod(p)}
              >
                {p === 'today' ? "Aujourd'hui" : p === 'week' ? 'Semaine' : 'Mois'}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Statistiques du jour (date au choix) */}
      <Card className="overflow-hidden border-[var(--accent)]/30 border-l-4">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[var(--accent)]" />
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Statistiques du jour
              </h2>
            </div>
            <input
              type="date"
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="min-h-[44px] rounded-lg border border-[var(--border-solid)] bg-slate-50 px-3 py-2 text-sm text-[var(--text-primary)] dark:bg-slate-800"
            />
            <Button
              size="sm"
              variant={selectedDay === format(startOfDay(new Date()), 'yyyy-MM-dd') ? 'primary' : 'secondary'}
              onClick={() => setSelectedDay(format(startOfDay(new Date()), 'yyyy-MM-dd'))}
            >
              Aujourd&apos;hui
            </Button>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            {format(parseISO(selectedDay), "EEEE d MMMM yyyy", { locale: fr })}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-[var(--border-solid)] p-4 sm:grid-cols-3 lg:grid-cols-5">
          <div className="rounded-xl bg-slate-50/80 p-3 dark:bg-slate-800/50">
            <p className="text-xs font-medium text-[var(--text-muted)]">CA du jour</p>
            <p className="mt-0.5 text-base font-bold text-[var(--text-primary)] sm:text-lg">
              {loadingDaySales ? '…' : formatCurrency(daySalesSummary?.totalAmount ?? 0)}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50/80 p-3 dark:bg-slate-800/50">
            <p className="text-xs font-medium text-[var(--text-muted)]">Ventes</p>
            <p className="mt-0.5 text-base font-bold text-[var(--text-primary)] sm:text-lg">
              {loadingDaySales ? '…' : daySalesSummary?.count ?? 0}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50/80 p-3 dark:bg-slate-800/50">
            <p className="text-xs font-medium text-[var(--text-muted)]">Articles vendus</p>
            <p className="mt-0.5 text-base font-bold text-[var(--text-primary)] sm:text-lg">
              {loadingDaySales ? '…' : daySalesSummary?.itemsSold ?? 0}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50/80 p-3 dark:bg-slate-800/50">
            <p className="text-xs font-medium text-[var(--text-muted)]">Marge du jour</p>
            <p className="mt-0.5 text-base font-bold text-emerald-600 dark:text-emerald-400 sm:text-lg">
              {loadingDaySales ? '…' : formatCurrency(daySalesSummary?.margin ?? 0)}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50/80 p-3 dark:bg-slate-800/50">
            <p className="text-xs font-medium text-[var(--text-muted)]">Achats du jour</p>
            <p className="mt-0.5 text-base font-bold text-[var(--text-primary)] sm:text-lg">
              {formatCurrency(dayPurchasesSummary?.totalAmount ?? 0)}
            </p>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              {dayPurchasesSummary?.count ?? 0} commande(s)
            </p>
          </div>
        </div>
      </Card>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Card className="min-w-0 overflow-hidden border-l-4 border-l-[var(--accent)] p-4 sm:p-5">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="truncate text-xs font-medium text-[var(--text-muted)] sm:text-sm">
                Chiffre d'affaires
              </p>
              <p className="mt-1 break-words text-base font-bold text-[var(--text-primary)] sm:text-lg">
                {loadingSales ? '…' : formatCurrency(salesSummary?.totalAmount ?? 0)}
              </p>
            </div>
            <div className="shrink-0 rounded-full bg-orange-500/10 p-2">
              <TrendingUp className="h-5 w-5 text-[var(--accent)]" />
            </div>
          </div>
        </Card>

        <Card className="min-w-0 overflow-hidden p-4 sm:p-5">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="truncate text-xs font-medium text-[var(--text-muted)] sm:text-sm">
                Ventes
              </p>
              <p className="mt-1 break-words text-base font-bold text-[var(--text-primary)] sm:text-lg">
                {loadingSales ? '…' : salesSummary?.count ?? 0}
              </p>
            </div>
            <div className="shrink-0 rounded-full bg-emerald-500/10 p-2">
              <ShoppingCart className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </Card>

        <Card className="min-w-0 overflow-hidden p-4 sm:p-5">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="truncate text-xs font-medium text-[var(--text-muted)] sm:text-sm">
                Produits vendus
              </p>
              <p className="mt-1 break-words text-base font-bold text-[var(--text-primary)] sm:text-lg">
                {loadingSales ? '…' : salesSummary?.itemsSold ?? 0}
              </p>
            </div>
            <div className="shrink-0 rounded-full bg-blue-500/10 p-2">
              <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="min-w-0 overflow-hidden p-4 sm:p-5">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="truncate text-xs font-medium text-[var(--text-muted)] sm:text-sm">
                Marge
              </p>
              <p className="mt-1 break-words text-base font-bold text-emerald-600 dark:text-emerald-400 sm:text-lg">
                {loadingSales ? '…' : formatCurrency(salesSummary?.margin ?? 0)}
              </p>
              <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">
                {marginRate}%
              </p>
            </div>
            <div className="shrink-0 rounded-full bg-emerald-500/10 p-2">
              <Percent className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </Card>

        <Card className="min-w-0 overflow-hidden p-4 sm:p-5">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="truncate text-xs font-medium text-[var(--text-muted)] sm:text-sm">
                Achats
              </p>
              <p className="mt-1 break-words text-base font-bold text-[var(--text-primary)] sm:text-lg">
                {formatCurrency(purchasesSummary?.totalAmount ?? 0)}
              </p>
              <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">
                {purchasesSummary?.count ?? 0} commandes
              </p>
            </div>
            <div className="shrink-0 rounded-full bg-amber-500/10 p-2">
              <Truck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </Card>

        <Card className="min-w-0 overflow-hidden p-4 sm:p-5">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="truncate text-xs font-medium text-[var(--text-muted)] sm:text-sm">
                Valeur stock
              </p>
              <p className="mt-1 break-words text-base font-bold text-[var(--text-primary)] sm:text-lg">
                {formatCurrency(stockValue?.totalValue ?? 0)}
              </p>
              <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">
                {stockValue?.productCount ?? 0} produits
              </p>
            </div>
            <div className="shrink-0 rounded-full bg-violet-500/10 p-2">
              <Warehouse className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
          </div>
        </Card>

        <Card className="min-w-0 overflow-hidden p-4 sm:p-5">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="truncate text-xs font-medium text-[var(--text-muted)] sm:text-sm">
                Alertes stock
              </p>
              <p className="mt-1 break-words text-base font-bold text-[var(--text-primary)] sm:text-lg">
                {lowStockCount}
              </p>
              {lowStockCount > 0 && (
                <Link
                  to={ROUTES.inventory}
                  className="mt-0.5 inline-flex items-center gap-1 text-xs text-[var(--danger)] hover:underline"
                >
                  Voir inventaire
                  <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
            <div className="shrink-0 rounded-full bg-amber-500/10 p-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Graphique ventes par jour */}
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Chiffre d'affaires par jour
            </h2>
          </div>
          <div className="h-[240px] w-full sm:h-[280px]">
            {chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-[var(--text-muted)]">
                Aucune vente sur la période
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                  <XAxis
                    dataKey="dateLabel"
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    tickLine={false}
                    tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card-bg)',
                      border: '1px solid var(--border-solid)',
                      borderRadius: '0.75rem',
                    }}
                    formatter={(value: number) => [formatCurrency(value), 'CA']}
                    labelFormatter={(label) => label}
                  />
                  <Bar
                    dataKey="total"
                    fill="var(--accent)"
                    radius={[4, 4, 0, 0]}
                    name="Chiffre d'affaires"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Top 5 produits + Raccourcis */}
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="border-b border-[var(--border-solid)] p-4">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Top 5 produits
              </h2>
            </div>
            <div className="divide-y divide-[var(--border-solid)]">
              {topProducts.length === 0 ? (
                <p className="py-8 text-center text-sm text-[var(--text-muted)]">
                  Aucune vente sur la période
                </p>
              ) : (
                topProducts.map((p, i) => (
                  <div
                    key={p.product_id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          i < 3 ? 'bg-orange-500/20 text-[var(--accent)]' : 'bg-slate-100 dark:bg-slate-800'
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span className="truncate text-sm font-medium">{p.product_name}</span>
                    </div>
                    <span className="shrink-0 text-sm font-medium">
                      {formatCurrency(p.revenue)}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-[var(--border-solid)] p-3">
              <Link
                to={ROUTES.reports}
                className="flex items-center justify-center gap-2 text-sm font-medium text-[var(--accent)] hover:underline"
              >
                Voir les rapports
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Card>

          {/* Raccourcis utiles */}
          <Card className="p-4">
            <h2 className="mb-3 text-base font-semibold text-[var(--text-primary)]">
              Raccourcis
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <Link
                to={currentStoreId ? ROUTES.pos(currentStoreId) : ROUTES.stores}
                className="flex items-center gap-2 rounded-xl border border-[var(--border-solid)] p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
                  <CreditCard className="h-5 w-5 text-[var(--accent)]" />
                </div>
                <span className="truncate text-sm font-medium">Caisse (POS)</span>
              </Link>
              <Link
                to={ROUTES.sales}
                className="flex items-center gap-2 rounded-xl border border-[var(--border-solid)] p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                  <ShoppingCart className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="truncate text-sm font-medium">Ventes</span>
              </Link>
              <Link
                to={ROUTES.inventory}
                className="flex items-center gap-2 rounded-xl border border-[var(--border-solid)] p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                  <Warehouse className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="truncate text-sm font-medium">Inventaire</span>
              </Link>
              <Link
                to={ROUTES.purchases}
                className="flex items-center gap-2 rounded-xl border border-[var(--border-solid)] p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                  <Truck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="truncate text-sm font-medium">Achats</span>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Période affichée */}
      <p className="text-center text-xs text-[var(--text-muted)]">
        Période : {format(parseISO(range.from), 'dd MMM yyyy', { locale: fr })} —{' '}
        {format(parseISO(range.to), 'dd MMM yyyy', { locale: fr })}
      </p>
    </div>
  )
}
