import { useQuery } from '@tanstack/react-query'
import { Card, PageHeader } from '@/components/ui'
import {
  adminGetStats,
  adminGetSalesByCompany,
  adminGetSalesOverTime,
} from '@/features/admin/api/adminApi'
import { formatCurrency } from '@/lib/utils'
import { Building2, Store, Users, ShoppingCart, TrendingUp } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

const CHART_COLORS = {
  primary: 'var(--accent)',
  bar: '#f97316',
  line: '#0ea5e9',
}

export function AdminTableauPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminGetStats,
  })

  const { data: salesByCompany = [] } = useQuery({
    queryKey: ['admin-sales-by-company'],
    queryFn: adminGetSalesByCompany,
  })

  const { data: salesOverTime = [] } = useQuery({
    queryKey: ['admin-sales-over-time'],
    queryFn: () => adminGetSalesOverTime(30),
  })

  const chartTimeData = salesOverTime.map((d) => ({
    ...d,
    dateLabel: format(parseISO(d.date), 'dd MMM', { locale: fr }),
    totalRounded: Math.round(d.total),
  }))

  const topCompaniesByCA = salesByCompany.slice(0, 10)
  const topCompaniesBySales = [...salesByCompany].sort((a, b) => b.salesCount - a.salesCount).slice(0, 10)

  return (
    <div className="space-y-8 pb-8">
      <PageHeader
        title="Tableau"
        description="Vue d’ensemble et statistiques avancées de la plateforme"
      />

      <div className="rounded-xl border-2 border-[var(--accent)] bg-[var(--accent)]/10 px-4 py-3 text-center">
        <p className="text-lg font-semibold text-[var(--accent)]">Bienvenue super admin</p>
        <p className="mt-0.5 text-sm text-[var(--text-muted)]">Tableau de bord plateforme.</p>
      </div>

      {/* Statistiques globales */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Statistiques globales</h2>
        {isLoading ? (
          <p className="text-sm text-[var(--text-muted)]">Chargement…</p>
        ) : stats ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Card className="p-4 min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-500/20 text-orange-500">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold text-[var(--text-primary)]">{stats.companiesCount}</p>
                  <p className="text-xs text-[var(--text-muted)]">Entreprises</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 text-blue-500">
                  <Store className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold text-[var(--text-primary)]">{stats.storesCount}</p>
                  <p className="text-xs text-[var(--text-muted)]">Boutiques</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-500">
                  <Users className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold text-[var(--text-primary)]">{stats.usersCount}</p>
                  <p className="text-xs text-[var(--text-muted)]">Utilisateurs</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/20 text-violet-500">
                  <ShoppingCart className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold text-[var(--text-primary)]">{stats.salesCount}</p>
                  <p className="text-xs text-[var(--text-muted)]">Ventes</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-500">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-bold text-[var(--text-primary)]">
                    {formatCurrency(stats.salesTotalAmount)}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">CA total</p>
                </div>
              </div>
            </Card>
          </div>
        ) : null}
      </section>

      {/* Courbe du CA sur 30 jours */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Évolution du CA (30 derniers jours)</h2>
        <Card className="p-4">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartTimeData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-[var(--border-solid)]" />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} stroke="var(--text-muted)" />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} stroke="var(--text-muted)" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-solid)', borderRadius: 8 }}
                  labelStyle={{ color: 'var(--text-primary)' }}
                  formatter={(value: number) => [formatCurrency(value), 'CA']}
                  labelFormatter={(label) => label}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="totalRounded"
                  name="CA (XOF)"
                  stroke={CHART_COLORS.line}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Nb ventes"
                  stroke="var(--text-muted)"
                  strokeWidth={1}
                  dot={false}
                  strokeDasharray="4 4"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      {/* Top entreprises par CA et par nombre de ventes */}
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Top 10 entreprises par CA</h2>
          <Card className="p-4">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topCompaniesByCA.map((c) => ({ ...c, name: c.companyName.length > 15 ? c.companyName.slice(0, 14) + '…' : c.companyName }))}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-[var(--border-solid)]" />
                  <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} stroke="var(--text-muted)" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="var(--text-muted)" width={75} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-solid)', borderRadius: 8 }}
                    formatter={(value: number) => [formatCurrency(value), 'CA (XOF)']}
                    labelFormatter={(_, payload) => (payload?.[0]?.payload as { companyName?: string })?.companyName ?? ''}
                  />
                  <Bar dataKey="totalAmount" name="CA (XOF)" fill={CHART_COLORS.bar} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </section>
        <section>
          <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Top 10 entreprises par nombre de ventes</h2>
          <Card className="p-4">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topCompaniesBySales.map((c) => ({ ...c, name: c.companyName.length > 15 ? c.companyName.slice(0, 14) + '…' : c.companyName }))}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-[var(--border-solid)]" />
                  <XAxis type="number" tick={{ fontSize: 10 }} stroke="var(--text-muted)" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="var(--text-muted)" width={75} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-solid)', borderRadius: 8 }}
                    formatter={(value: number) => [value, 'Ventes']}
                    labelFormatter={(_, payload) => (payload?.[0]?.payload as { companyName?: string })?.companyName ?? ''}
                  />
                  <Bar dataKey="salesCount" name="Ventes" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </section>
      </div>

      {/* Histogramme CA par jour (barres verticales) */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Répartition du CA par jour (30 jours)</h2>
        <Card className="p-4">
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartTimeData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-[var(--border-solid)]" />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 9 }} stroke="var(--text-muted)" />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} stroke="var(--text-muted)" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-solid)', borderRadius: 8 }}
                  formatter={(value: number) => [formatCurrency(value), 'CA']}
                  labelFormatter={(label) => label}
                />
                <Bar dataKey="totalRounded" name="CA (XOF)" fill={CHART_COLORS.bar} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>
    </div>
  )
}
