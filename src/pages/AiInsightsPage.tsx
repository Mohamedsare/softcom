import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, PageHeader, Button } from '@/components/ui'
import { RequirePermission } from '@/components/guards/RequirePermission'
import { PERMISSIONS } from '@/constants/permissions'
import { useCompany } from '@/context/CompanyContext'
import { isDeepSeekConfigured } from '@/features/ai/api/deepseekApi'
import {
  fetchPredictionContext,
  getPredictionsStructured,
  getLastPrediction,
  saveLastPrediction,
  type PredictionContext as ContextType,
  type PredictionStructured,
} from '@/features/ai/api/predictionsApi'
import { formatCurrency } from '@/lib/utils'
import { Sparkles, RefreshCw, AlertCircle, TrendingUp, Package, AlertTriangle, Lightbulb } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { toast } from 'sonner'

export function AiInsightsPage() {
  return (
    <RequirePermission
      permission={PERMISSIONS.ai_insights_view}
      fallback={<p className="p-4 text-[var(--text-muted)]">Vous n'avez pas accès aux prédictions IA.</p>}
    >
      <AiInsightsPageContent />
    </RequirePermission>
  )
}

function AiInsightsPageContent() {
  const queryClient = useQueryClient()
  const { currentCompanyId, currentStoreId, companies, stores } = useCompany()
  const [loading, setLoading] = useState(false)
  const [predictions, setPredictions] = useState<string | null>(null)
  const [structured, setStructured] = useState<PredictionStructured | null>(null)
  const [context, setContext] = useState<ContextType | null>(null)
  const [error, setError] = useState<string | null>(null)

  const company = companies.find((c) => c.id === currentCompanyId)
  const currentStore = stores.find((s) => s.id === currentStoreId)

  const { data: lastPayload } = useQuery({
    queryKey: ['ai-last-prediction', currentCompanyId, currentStoreId ?? 'all'],
    queryFn: () => getLastPrediction(currentCompanyId!, currentStoreId ?? null),
    enabled: !!currentCompanyId && isDeepSeekConfigured(),
  })

  useEffect(() => {
    setStructured(null)
    setContext(null)
    setPredictions(null)
  }, [currentCompanyId, currentStoreId])

  useEffect(() => {
    if (!lastPayload) return
    setStructured(lastPayload.structured)
    setPredictions(lastPayload.text)
    setContext({
      period: lastPayload.contextSummary.period,
      salesSummary: { totalAmount: lastPayload.contextSummary.salesSummaryTotalAmount, count: 0, itemsSold: 0, margin: 0 },
    } as ContextType)
  }, [lastPayload])

  const handleGenerate = async () => {
    if (!currentCompanyId || !company) return
    setError(null)
    setLoading(true)
    setStructured(null)
    setContext(null)
    setPredictions(null)
    try {
      const ctx = await fetchPredictionContext(
        currentCompanyId,
        company.name,
        currentStoreId ?? undefined,
        currentStore?.name
      )
      setContext(ctx)
      const { structured: s, text } = await getPredictionsStructured(ctx)
      setStructured(s)
      setPredictions(text)
      await saveLastPrediction(currentCompanyId, currentStoreId ?? null, {
        structured: s,
        text,
        contextSummary: {
          period: ctx.period,
          salesSummaryTotalAmount: ctx.salesSummary.totalAmount,
        },
      })
      queryClient.invalidateQueries({
        queryKey: ['ai-last-prediction', currentCompanyId, currentStoreId ?? 'all'],
      })
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erreur'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const configured = isDeepSeekConfigured()

  if (!currentCompanyId) {
    return (
      <div className="space-y-6">
        <PageHeader title="Prédictions IA" description="Insights et recommandations" />
        <Card>
          <p className="py-12 text-center text-[var(--text-muted)]">
            Sélectionnez une entreprise pour afficher les prédictions.
          </p>
        </Card>
      </div>
    )
  }

  if (company?.ai_predictions_enabled === false) {
    return (
      <div className="space-y-6">
        <PageHeader title="Prédictions IA" description="Insights et recommandations" />
        <Card className="p-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="rounded-full bg-amber-500/10 p-4">
              <AlertCircle className="h-10 w-10 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Prédictions IA désactivées
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              L&apos;accès aux prédictions IA est désactivé pour votre entreprise. Contactez l&apos;administrateur de la plateforme pour plus d&apos;informations.
            </p>
          </div>
        </Card>
      </div>
    )
  }

  if (!configured) {
    return (
      <div className="space-y-6">
        <PageHeader title="Prédictions IA" description="Insights et recommandations" />
        <Card className="p-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="rounded-full bg-amber-500/10 p-4">
              <AlertCircle className="h-10 w-10 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                API DeepSeek non configurée
              </h2>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Ajoutez <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">VITE_DEEPSEEK_API_KEY</code> dans votre fichier <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">.env</code> avec votre clé API DeepSeek pour activer les prédictions.
              </p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prédictions IA"
        description={
          company
            ? `Insights pour ${company.name}${currentStore ? ` · ${currentStore.name}` : ''}`
            : 'Insights et recommandations'
        }
        actions={
          <Button
            variant="primary"
            onClick={handleGenerate}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Analyse…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Générer les prédictions
              </>
            )}
          </Button>
        }
      />

      {error && (
        <Card className="border-[var(--danger)]/30 bg-red-50/50 p-4 dark:bg-red-900/10">
          <p className="text-sm text-[var(--danger)]">{error}</p>
        </Card>
      )}

      {structured && context && (
        <>
          {/* Cartes statistiques prévisions */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Card className="p-4 border-l-4 border-l-[var(--accent)]">
              <p className="text-xs font-medium text-[var(--text-muted)]">CA prévu (semaine)</p>
              <p className="mt-1 text-lg font-bold text-[var(--text-primary)]">
                {formatCurrency(structured.forecast_week_ca)}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-medium text-[var(--text-muted)]">CA prévu (mois)</p>
              <p className="mt-1 text-lg font-bold text-[var(--text-primary)]">
                {formatCurrency(structured.forecast_month_ca)}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-medium text-[var(--text-muted)]">Tendance</p>
              <p className="mt-1 text-lg font-bold capitalize text-[var(--text-primary)]">
                {structured.trend === 'up' && 'Hausse'}
                {structured.trend === 'down' && 'Baisse'}
                {structured.trend === 'stable' && 'Stable'}
              </p>
              {structured.trend_reason && (
                <p className="mt-0.5 text-xs text-[var(--text-muted)] line-clamp-2">{structured.trend_reason}</p>
              )}
            </Card>
            <Card className="p-4">
              <p className="text-xs font-medium text-[var(--text-muted)]">CA mois actuel</p>
              <p className="mt-1 text-lg font-bold text-[var(--text-primary)]">
                {formatCurrency(context.salesSummary.totalAmount)}
              </p>
            </Card>
          </div>

          {/* Graphique CA réel vs prévu */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-[var(--accent)]" />
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                CA réel vs prévision
              </h2>
            </div>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'CA mois actuel', value: context.salesSummary.totalAmount },
                    { name: 'CA prévu (mois)', value: structured.forecast_month_ca },
                    { name: 'CA prévu (sem.)', value: structured.forecast_week_ca },
                  ]}
                  margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="value" name="Montant (XOF)" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Réapprovisionnement prioritaire */}
            <Card className="overflow-hidden">
              <div className="flex items-center gap-2 border-b border-[var(--border-solid)] p-4">
                <Package className="h-5 w-5 text-[var(--accent)]" />
                <h2 className="text-base font-semibold text-[var(--text-primary)]">Réapprovisionnement prioritaire</h2>
              </div>
              <div className="divide-y divide-[var(--border-solid)]">
                {structured.restock_priorities.length === 0 ? (
                  <p className="py-6 text-center text-sm text-[var(--text-muted)]">Aucun produit à réapprovisionner</p>
                ) : (
                  structured.restock_priorities.map((r, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div>
                        <p className="font-medium text-[var(--text-primary)]">{r.product_name}</p>
                        <p className="text-xs text-[var(--text-muted)]">{r.quantity_suggested}</p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          r.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          r.priority === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                          'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {r.priority === 'high' ? 'Priorité haute' : r.priority === 'medium' ? 'Moyenne' : 'Basse'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Alertes */}
            <Card className="overflow-hidden">
              <div className="flex items-center gap-2 border-b border-[var(--border-solid)] p-4">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <h2 className="text-base font-semibold text-[var(--text-primary)]">Alertes et risques</h2>
              </div>
              <div className="divide-y divide-[var(--border-solid)]">
                {structured.alerts.length === 0 ? (
                  <p className="py-6 text-center text-sm text-[var(--text-muted)]">Aucune alerte</p>
                ) : (
                  structured.alerts.map((a, i) => (
                    <div key={i} className="px-4 py-3">
                      <span className="text-xs font-medium text-[var(--text-muted)] uppercase">{a.type}</span>
                      <p className="text-sm text-[var(--text-primary)]">{a.message}</p>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Recommandations */}
          {structured.recommendations.length > 0 && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-5 w-5 text-[var(--accent)]" />
                <h2 className="text-base font-semibold text-[var(--text-primary)]">Recommandations stratégiques</h2>
              </div>
              <ul className="space-y-2">
                {structured.recommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-primary)]">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                    {r.action}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Commentaire / résumé texte */}
          {predictions && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-[var(--accent)]" />
                <h2 className="text-base font-semibold text-[var(--text-primary)]">Résumé et analyse</h2>
              </div>
              <div className="whitespace-pre-wrap text-sm text-[var(--text-primary)] leading-relaxed">
                {predictions}
              </div>
            </Card>
          )}
        </>
      )}

      {!structured && !loading && configured && (
        <Card className="p-8 text-center">
          <p className="text-[var(--text-muted)]">
            Cliquez sur « Générer les prédictions » pour afficher statistiques, graphiques et recommandations.
          </p>
        </Card>
      )}
    </div>
  )
}
