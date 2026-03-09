import { useQuery } from '@tanstack/react-query'
import { Card, PageHeader } from '@/components/ui'
import { adminGetStats, adminGetSalesByCompany } from '@/features/admin/api/adminApi'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp } from 'lucide-react'

export function AdminRapportsPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminGetStats,
  })

  const { data: salesByCompany = [], isLoading: salesLoading } = useQuery({
    queryKey: ['admin-sales-by-company'],
    queryFn: adminGetSalesByCompany,
  })

  return (
    <div className="space-y-8">
      <PageHeader
        title="Rapports"
        description="Vue d’ensemble des ventes et du CA par entreprise"
      />

      {statsLoading ? (
        <p className="text-sm text-[var(--text-muted)]">Chargement…</p>
      ) : stats ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/20 text-violet-500">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.salesCount}</p>
                <p className="text-xs text-[var(--text-muted)]">Ventes totales (complétées)</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20 text-amber-500">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-[var(--text-primary)]">
                  {formatCurrency(stats.salesTotalAmount)}
                </p>
                <p className="text-xs text-[var(--text-muted)]">CA total plateforme</p>
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      <section>
        <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">CA par entreprise</h2>
        {salesLoading ? (
          <p className="text-sm text-[var(--text-muted)]">Chargement…</p>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-solid)] bg-slate-50 dark:bg-slate-800/50">
                    <th className="p-3 text-left font-medium text-[var(--text-muted)]">Entreprise</th>
                    <th className="p-3 text-right font-medium text-[var(--text-muted)]">Nombre de ventes</th>
                    <th className="p-3 text-right font-medium text-[var(--text-muted)]">CA</th>
                  </tr>
                </thead>
                <tbody>
                  {salesByCompany.map((row) => (
                    <tr
                      key={row.companyId}
                      className="border-b border-[var(--border-solid)] hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                    >
                      <td className="p-3 font-medium text-[var(--text-primary)]">{row.companyName}</td>
                      <td className="p-3 text-right text-[var(--text-secondary)]">{row.salesCount}</td>
                      <td className="p-3 text-right font-medium text-[var(--text-primary)]">
                        {formatCurrency(row.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {salesByCompany.length === 0 && (
              <p className="p-6 text-center text-sm text-[var(--text-muted)]">Aucune vente.</p>
            )}
          </Card>
        )}
      </section>
    </div>
  )
}
