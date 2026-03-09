import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { fr } from 'date-fns/locale'
import { chatCompletion } from './deepseekApi'
import { reportsApi, getDefaultDateRange } from '@/features/reports/api/reportsApi'
import type { SalesByDay } from '@/features/reports/api/reportsApi'
import { formatCurrency } from '@/lib/utils'

export interface PredictionContext {
  companyName: string
  storeName?: string
  period: string
  salesSummary: { totalAmount: number; count: number; itemsSold: number; margin: number }
  previousMonthSummary: { totalAmount: number; count: number; margin: number } | null
  salesByDay: SalesByDay[]
  topProducts: Array<{ product_name: string; quantity_sold: number; revenue: number; margin: number }>
  purchasesSummary: { totalAmount: number; count: number }
  stockValue: number
  lowStockCount: number
  marginRatePercent: number
}

function getPreviousMonthRange(): { from: string; to: string } {
  const now = new Date()
  const from = startOfMonth(subMonths(now, 1))
  const to = endOfMonth(subMonths(now, 1))
  return {
    from: format(from, 'yyyy-MM-dd'),
    to: format(to, 'yyyy-MM-dd'),
  }
}

export async function fetchPredictionContext(
  companyId: string,
  companyName: string,
  storeId?: string,
  storeName?: string
): Promise<PredictionContext> {
  const range = getDefaultDateRange('month')
  const prevRange = getPreviousMonthRange()
  const filters = {
    companyId,
    storeId,
    fromDate: range.from,
    toDate: range.to,
  }
  const prevFilters = {
    companyId,
    storeId,
    fromDate: prevRange.from,
    toDate: prevRange.to,
  }

  const [
    salesSummary,
    topProducts,
    stockResult,
    purchasesSummary,
    lowStockCount,
    salesByDay,
    prevSalesSummary,
  ] = await Promise.all([
    reportsApi.getSalesSummary(filters),
    reportsApi.getTopProducts(filters, 15),
    storeId
      ? reportsApi.getStockValue(companyId, storeId)
      : reportsApi.getCompanyStockValue(companyId),
    reportsApi.getPurchasesSummary(filters),
    reportsApi.getLowStockCount(companyId, storeId),
    reportsApi.getSalesByDay(filters),
    reportsApi.getSalesSummary(prevFilters),
  ])

  const marginRatePercent =
    salesSummary.totalAmount > 0
      ? (salesSummary.margin / salesSummary.totalAmount) * 100
      : 0

  return {
    companyName,
    storeName,
    period: `${format(range.from, 'dd MMM yyyy', { locale: fr })} → ${format(range.to, 'dd MMM yyyy', { locale: fr })}`,
    salesSummary,
    previousMonthSummary:
      prevSalesSummary.totalAmount > 0 || prevSalesSummary.count > 0
        ? {
            totalAmount: prevSalesSummary.totalAmount,
            count: prevSalesSummary.count,
            margin: prevSalesSummary.margin,
          }
        : null,
    salesByDay,
    topProducts: topProducts.map((p) => ({
      product_name: p.product_name,
      quantity_sold: p.quantity_sold,
      revenue: p.revenue,
      margin: p.margin,
    })),
    purchasesSummary,
    stockValue: stockResult.totalValue,
    lowStockCount,
    marginRatePercent,
  }
}

function buildContextText(ctx: PredictionContext): string {
  const scope = ctx.storeName ? `Boutique: ${ctx.storeName}` : `Entreprise: ${ctx.companyName} (toutes boutiques)`

  let trend = ''
  if (ctx.salesByDay.length >= 2) {
    const first = ctx.salesByDay.slice(0, Math.ceil(ctx.salesByDay.length / 2))
    const second = ctx.salesByDay.slice(Math.ceil(ctx.salesByDay.length / 2))
    const sumFirst = first.reduce((s, d) => s + d.total, 0)
    const sumSecond = second.reduce((s, d) => s + d.total, 0)
    const trendPct = sumFirst > 0 ? ((sumSecond - sumFirst) / sumFirst) * 100 : 0
    trend = `Tendance CA en cours de mois: ${trendPct >= 0 ? '+' : ''}${trendPct.toFixed(1)}% (2e moitié vs 1re moitié).`
  }

  let comparison = ''
  if (ctx.previousMonthSummary) {
    const deltaCa = ctx.salesSummary.totalAmount - ctx.previousMonthSummary.totalAmount
    const deltaPct = ctx.previousMonthSummary.totalAmount > 0
      ? (deltaCa / ctx.previousMonthSummary.totalAmount) * 100
      : 0
    comparison = `
Mois précédent (comparaison):
  CA: ${formatCurrency(ctx.previousMonthSummary.totalAmount)} (${ctx.previousMonthSummary.count} ventes)
  Évolution ce mois: ${deltaCa >= 0 ? '+' : ''}${formatCurrency(deltaCa)} (${deltaPct >= 0 ? '+' : ''}${deltaPct.toFixed(1)}%)
  Marge mois précédent: ${formatCurrency(ctx.previousMonthSummary.margin)}`
  }

  const dailyLine =
    ctx.salesByDay.length > 0
      ? `\nCA par jour (${ctx.salesByDay.length} jours avec ventes):\n${ctx.salesByDay.map((d) => `  ${d.date}: ${formatCurrency(d.total)} (${d.count} ventes)`).join('\n')}`
      : '\nAucune vente détaillée par jour ce mois.'

  return `
Période: ${ctx.period}
Contexte: ${scope}
${trend ? `\n${trend}` : ''}

--- CE MOIS ---
Chiffre d'affaires: ${formatCurrency(ctx.salesSummary.totalAmount)} (${ctx.salesSummary.count} ventes, ${ctx.salesSummary.itemsSold} articles vendus)
Marge: ${formatCurrency(ctx.salesSummary.margin)} (taux: ${ctx.marginRatePercent.toFixed(1)}%)
Achats: ${formatCurrency(ctx.purchasesSummary.totalAmount)} (${ctx.purchasesSummary.count} commandes)
Valeur stock: ${formatCurrency(ctx.stockValue)}
Alertes stock (produits sous seuil minimum): ${ctx.lowStockCount}
${comparison}
${dailyLine}

--- TOP 15 PRODUITS VENDUS (ce mois) ---
${ctx.topProducts.map((p, i) => `${i + 1}. ${p.product_name}: ${p.quantity_sold} vendus, CA ${formatCurrency(p.revenue)}, marge ${formatCurrency(p.margin)}`).join('\n')}
`.trim()
}

const SYSTEM_PROMPT = `Tu es un expert IA pour la gestion de stock et ventes (FasoStock). Tu analyses les données fournies et produis des prédictions AVANCÉES et des recommandations TRÈS IMPORTANTES pour l'entreprise. Réponds UNIQUEMENT en français, de façon structurée et actionnable.

Tu DOIS fournir les sections suivantes, avec des titres clairs (exactement comme ci-dessous) et du contenu concret :

## 1. Prévision du chiffre d'affaires
- Estime le CA probable pour la semaine à venir et pour le mois à venir (en te basant sur la tendance, l'évolution vs mois précédent, et les ventes par jour).
- Indique si tu prévois une hausse, une baisse ou une stabilité, et pourquoi.

## 2. Réapprovisionnement prioritaire
- Liste les produits à réapprovisionner en priorité (en priorisant : rupture / alerte stock, puis top ventes).
- Pour chaque priorité, donne une quantité indicative ou un conseil (ex: "commander au moins X unités", "surveiller le stock").
- Si alertes stock > 0, insiste sur l'urgence.

## 3. Alertes et risques
- Produits à risque de rupture (si données disponibles ou déduits des top ventes et du stock).
- Produits lents ou à promouvoir si pertinent.
- Tout risque trésorerie ou stock si pertinent.

## 4. Recommandations stratégiques
- 2 à 4 actions concrètes : prix, promotions, achats, gestion du stock, ou organisation.
- Sois précis et opérationnel (pas de généralités).

Règles : utilise des listes à puces quand c'est pertinent, reste factuel, donne des chiffres ou fourchettes quand tu peux. Pas d'introduction longue : va droit au but.`

export async function getPredictions(context: PredictionContext): Promise<string> {
  const userContent = `Voici les données détaillées (mois en cours + comparaison mois précédent + ventes par jour + top produits):\n\n${buildContextText(context)}\n\nGénère les 4 sections demandées (Prévision CA, Réapprovisionnement prioritaire, Alertes et risques, Recommandations stratégiques).`
  return chatCompletion(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ],
    { max_tokens: 1800, temperature: 0.35 }
  )
}

// --- Structured output for stats + charts ---
export interface PredictionStructured {
  forecast_week_ca: number
  forecast_month_ca: number
  trend: 'up' | 'down' | 'stable'
  trend_reason: string
  restock_priorities: Array<{
    product_name: string
    quantity_suggested: string
    priority: 'high' | 'medium' | 'low'
  }>
  alerts: Array<{ type: string; message: string }>
  recommendations: Array<{ action: string }>
  commentary: string
}

const STRUCTURED_SYSTEM = `Tu es un expert IA pour la gestion de stock et ventes (FasoStock). Tu dois répondre UNIQUEMENT avec un objet JSON valide, sans texte avant ou après. Pas de markdown, pas de \`\`\`json.
Schéma strict de l'objet à renvoyer (tous les champs obligatoires) :
{
  "forecast_week_ca": number (estimation CA en XOF pour la semaine à venir, 0 si impossible),
  "forecast_month_ca": number (estimation CA en XOF pour le mois à venir, 0 si impossible),
  "trend": "up" | "down" | "stable",
  "trend_reason": "string (une phrase)",
  "restock_priorities": [ { "product_name": "string", "quantity_suggested": "string (ex: 20 unités)", "priority": "high"|"medium"|"low" } ],
  "alerts": [ { "type": "string (ex: rupture, promo, trésorerie)", "message": "string" } ],
  "recommendations": [ { "action": "string" } ],
  "commentary": "string (résumé en 2 à 4 paragraphes en français: prévision CA, réappro, alertes, recommandations)"
}
Utilise les noms de produits des données fournies pour restock_priorities. Garde des tableaux vides [] si rien à signaler.`

function extractJson(text: string): string {
  const trimmed = text.trim()
  const codeBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlock) return codeBlock[1].trim()
  if (trimmed.startsWith('{')) return trimmed
  return trimmed
}

export async function getPredictionsStructured(context: PredictionContext): Promise<{
  structured: PredictionStructured
  text: string
}> {
  const userContent = `Données:\n${buildContextText(context)}\n\nRéponds UNIQUEMENT avec l'objet JSON demandé (forecast en XOF, tableaux restock_priorities/alerts/recommendations, commentary en français).`
  const raw = await chatCompletion(
    [
      { role: 'system', content: STRUCTURED_SYSTEM },
      { role: 'user', content: userContent },
    ],
    { max_tokens: 1200, temperature: 0.3, response_format: { type: 'json_object' } }
  )
  const jsonStr = extractJson(raw)
  let parsed: PredictionStructured
  try {
    parsed = JSON.parse(jsonStr) as PredictionStructured
  } catch {
    throw new Error('Réponse IA invalide (JSON attendu)')
  }
  if (!parsed || typeof parsed.forecast_week_ca !== 'number' || typeof parsed.forecast_month_ca !== 'number') {
    throw new Error('Réponse IA incomplète')
  }
  parsed.restock_priorities = Array.isArray(parsed.restock_priorities) ? parsed.restock_priorities : []
  parsed.alerts = Array.isArray(parsed.alerts) ? parsed.alerts : []
  parsed.recommendations = Array.isArray(parsed.recommendations) ? parsed.recommendations : []
  parsed.commentary = typeof parsed.commentary === 'string' ? parsed.commentary : ''
  parsed.trend_reason = typeof parsed.trend_reason === 'string' ? parsed.trend_reason : ''
  return { structured: parsed, text: parsed.commentary }
}

// --- Persistence: last prediction per company/store (replaced on next run) ---
const LAST_PREDICTION_TYPE = 'last_prediction'

export interface LastPredictionPayload {
  structured: PredictionStructured
  text: string
  contextSummary: {
    period: string
    salesSummaryTotalAmount: number
  }
}

export async function getLastPrediction(
  companyId: string,
  storeId: string | null
): Promise<LastPredictionPayload | null> {
  const supabase = (await import('@/lib/supabase')).supabase
  let q = supabase
    .from('ai_insights_cache')
    .select('payload, created_at')
    .eq('company_id', companyId)
    .eq('insight_type', LAST_PREDICTION_TYPE)
  if (storeId) q = q.eq('store_id', storeId)
  else q = q.is('store_id', null)
  const { data, error } = await q.order('created_at', { ascending: false }).limit(1)
  if (error || !data?.length) return null
  const payload = (data[0] as { payload: LastPredictionPayload }).payload
  if (!payload?.structured) return null
  return payload
}

export async function saveLastPrediction(
  companyId: string,
  storeId: string | null,
  payload: LastPredictionPayload
): Promise<void> {
  const supabase = (await import('@/lib/supabase')).supabase
  const expiresAt = new Date()
  expiresAt.setFullYear(expiresAt.getFullYear() + 10)
  const { error } = await supabase.from('ai_insights_cache').insert({
    company_id: companyId,
    store_id: storeId,
    insight_type: LAST_PREDICTION_TYPE,
    payload: payload as unknown as Record<string, unknown>,
    expires_at: expiresAt.toISOString(),
  })
  if (error) throw error
}
