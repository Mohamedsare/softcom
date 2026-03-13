import { useState, useMemo } from 'react'
import { useCompany } from '@/context/CompanyContext'
import { useQuery } from '@tanstack/react-query'
import { RequirePermission } from '@/components/guards/RequirePermission'
import { PERMISSIONS } from '@/constants/permissions'
import { Card, PageHeader, Button, Badge } from '@/components/ui'
import {
  TrendingUp,
  ShoppingCart,
  Package,
  Percent,
  Truck,
  Warehouse,
  Calendar,
  BarChart3,
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
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { reportsApi, getDefaultDateRange } from '@/features/reports/api/reportsApi'
import { formatCurrency } from '@/lib/utils'

type Period = 'today' | 'week' | 'month'

export function ReportsPage() {
  return (
    <RequirePermission
      permission={[PERMISSIONS.reports_view_store, PERMISSIONS.reports_view_global]}
      fallback={<p className="p-4 text-[var(--text-muted)]">Vous n'avez pas accès aux rapports.</p>}
    >
      <ReportsPageContent />
    </RequirePermission>
  )
}

function ReportsPageContent() {
  const { currentCompanyId, currentStoreId, stores, setCurrentStoreId, companies } = useCompany()
  const [period, setPeriod] = useState<Period>('week')

  const range = useMemo(() => {
    return getDefaultDateRange(period)
  }, [period])

  const filters = useMemo(
    () => ({
      companyId: currentCompanyId!,
      storeId: currentStoreId || undefined,
      fromDate: range.from,
      toDate: range.to,
    }),
    [currentCompanyId, currentStoreId, range]
  )

  const { data: salesSummary, isLoading: loadingSales } = useQuery({
    queryKey: ['reports-sales', filters],
    queryFn: () => reportsApi.getSalesSummary(filters),
    enabled: !!currentCompanyId,
  })

  const { data: salesByDay = [] } = useQuery({
    queryKey: ['reports-sales-by-day', filters],
    queryFn: () => reportsApi.getSalesByDay(filters),
    enabled: !!currentCompanyId,
  })

  const { data: topProducts = [] } = useQuery({
    queryKey: ['reports-top-products', filters],
    queryFn: () => reportsApi.getTopProducts(filters, 10),
    enabled: !!currentCompanyId,
  })

  const { data: purchasesSummary } = useQuery({
    queryKey: ['reports-purchases', filters],
    queryFn: () => reportsApi.getPurchasesSummary(filters),
    enabled: !!currentCompanyId,
  })

  const { data: stockValue } = useQuery({
    queryKey: ['reports-stock', currentCompanyId, currentStoreId],
    queryFn: () => reportsApi.getStockValue(currentCompanyId!, currentStoreId ?? undefined),
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
      : '—'

  const company = companies.find((c) => c.id === currentCompanyId)
  const currentStore = stores.find((s) => s.id === currentStoreId)

  if (!currentCompanyId) {
    return (
      <div className="space-y-6">
        <PageHeader title="Rapports" description="Sélectionnez une entreprise" />
        <Card>
          <p className="py-12 text-center text-[var(--text-muted)]">
            Sélectionnez une entreprise pour afficher les rapports.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rapports"
        description={
          company
            ? `Tableau de bord — ${company.name}${currentStore ? ` · ${currentStore.name}` : ''}`
            : 'Rapports'
        }
      />

      {/* Filtres période et boutique */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={period === 'today' ? 'primary' : 'secondary'}
              onClick={() => setPeriod('today')}
            >
              Aujourd'hui
            </Button>
            <Button
              size="sm"
              variant={period === 'week' ? 'primary' : 'secondary'}
              onClick={() => setPeriod('week')}
            >
              Cette semaine
            </Button>
            <Button
              size="sm"
              variant={period === 'month' ? 'primary' : 'secondary'}
              onClick={() => setPeriod('month')}
            >
              Ce mois
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {stores.length > 1 && (
              <select
                value={currentStoreId ?? ''}
                onChange={(e) => setCurrentStoreId(e.target.value || null)}
                className="min-h-[40px] rounded-lg border border-[var(--border-solid)] bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800"
              >
                <option value="">Toutes les boutiques</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}
            <div className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
              <Calendar className="h-4 w-4 shrink-0" />
              {format(parseISO(range.from), 'dd MMM yyyy', { locale: fr })} —{' '}
              {format(parseISO(range.to), 'dd MMM yyyy', { locale: fr })}
            </div>
          </div>
        </div>
      </Card>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card className="min-w-0 overflow-hidden border-l-4 border-l-[var(--accent)] p-5">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-[var(--text-muted)]">Chiffre d'affaires</p>
              <p className="mt-1 break-words text-sm font-bold text-[var(--text-primary)] sm:text-base xl:text-lg">
                {loadingSales ? '…' : formatCurrency(salesSummary?.totalAmount ?? 0)}
              </p>
            </div>
            <div className="shrink-0 rounded-full bg-orange-500/10 p-2">
              <TrendingUp className="h-5 w-5 text-[var(--accent)]" />
            </div>
          </div>
        </Card>

        <Card className="min-w-0 overflow-hidden p-5">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-[var(--text-muted)]">Ventes</p>
              <p className="mt-1 break-words text-sm font-bold text-[var(--text-primary)] sm:text-base xl:text-lg">
                {loadingSales ? '…' : salesSummary?.count ?? 0}
              </p>
            </div>
            <div className="shrink-0 rounded-full bg-emerald-500/10 p-2">
              <ShoppingCart className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </Card>

        <Card className="min-w-0 overflow-hidden p-5">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-[var(--text-muted)]">Produits vendus</p>
              <p className="mt-1 break-words text-sm font-bold text-[var(--text-primary)] sm:text-base xl:text-lg">
                {loadingSales ? '…' : salesSummary?.itemsSold ?? 0}
              </p>
            </div>
            <div className="shrink-0 rounded-full bg-blue-500/10 p-2">
              <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="min-w-0 overflow-hidden p-5">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-[var(--text-muted)]">Marge</p>
              <p className="mt-1 break-words text-sm font-bold text-emerald-600 dark:text-emerald-400 sm:text-base xl:text-lg">
                {loadingSales ? '…' : formatCurrency(salesSummary?.margin ?? 0)}
              </p>
              <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">Taux: {marginRate}%</p>
            </div>
            <div className="shrink-0 rounded-full bg-emerald-500/10 p-2">
              <Percent className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </Card>

        <Card className="min-w-0 overflow-hidden p-5">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-[var(--text-muted)]">Achats</p>
              <p className="mt-1 break-words text-sm font-bold text-[var(--text-primary)] sm:text-base xl:text-lg">
                {formatCurrency(purchasesSummary?.totalAmount ?? 0)}
              </p>
              <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">{purchasesSummary?.count ?? 0} commandes</p>
            </div>
            <div className="shrink-0 rounded-full bg-amber-500/10 p-2">
              <Truck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </Card>

        <Card className="min-w-0 overflow-hidden p-5">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-[var(--text-muted)]">Valeur stock</p>
              <p className="mt-1 break-words text-sm font-bold text-[var(--text-primary)] sm:text-base xl:text-lg">
                {formatCurrency(stockValue?.totalValue ?? 0)}
              </p>
              <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">
                {currentStore ? stockValue?.productCount ?? 0 : '—'} produits
              </p>
            </div>
            <div className="shrink-0 rounded-full bg-violet-500/10 p-2">
              <Warehouse className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Graphique ventes par jour */}
      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-[var(--accent)]" />
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Chiffre d'affaires par jour
          </h2>
        </div>
        <div className="h-[280px] w-full">
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
                  tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
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

      {/* Top produits vendus */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--border-solid)] p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Top 10 produits vendus</h2>
          <Badge variant="accent">{topProducts.length} produits</Badge>
        </div>
        <div className="overflow-x-auto">
          {topProducts.length === 0 ? (
            <p className="py-12 text-center text-[var(--text-muted)]">Aucune vente sur la période</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border-solid)] bg-slate-50 dark:bg-slate-800/50">
                  <th className="p-4 font-medium text-[var(--text-primary)]">Produit</th>
                  <th className="p-4 font-medium text-[var(--text-primary)] text-right">Qté vendue</th>
                  <th className="p-4 font-medium text-[var(--text-primary)] text-right">CA</th>
                  <th className="p-4 font-medium text-[var(--text-primary)] text-right">Marge</th>
                  <th className="p-4 font-medium text-[var(--text-primary)]">Rang</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <tr key={p.product_id} className="border-b border-[var(--border-solid)]">
                    <td className="p-4 font-medium">{p.product_name}</td>
                    <td className="p-4 text-right">{p.quantity_sold}</td>
                    <td className="p-4 text-right font-medium">{formatCurrency(p.revenue)}</td>
                    <td className="p-4 text-right text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(p.margin)}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          i < 3 ? 'bg-orange-500/20 text-[var(--accent)]' : 'bg-slate-100 dark:bg-slate-800 text-[var(--text-muted)]'
                        }`}
                      >
                        {i + 1}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  )
}
