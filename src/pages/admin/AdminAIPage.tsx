import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, Button, PageHeader, Label } from '@/components/ui'
import {
  adminListCompanies,
  adminUpdateCompany,
  adminListLandingChatMessages,
  type LandingChatMessage,
} from '@/features/admin/api/adminApi'
import { chatCompletion } from '@/features/ai/api/deepseekApi'
import { Power, PowerOff, MessageCircle, Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

function formatDate(s: string) {
  const d = new Date(s)
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function shortSession(sessionId: string) {
  return sessionId.slice(0, 8)
}

const PREDICTIONS_PROMPT = `Tu es un expert SaaS et analyste business. FasoStock est une application de gestion de stocks et ventes pour le Burkina Faso (POS, inventaire, rapports, prédictions IA, multi-boutiques). Voici les questions que des visiteurs ont posées sur notre chatbot landing.

Analyse-les et fournis une réponse structurée en français :
1) **Prédictions de conversion** : quels types de visiteurs semblent les plus intéressés ? Quels besoins reviennent ? Qui a le plus de potentiel de conversion ?
2) **Gain potentiel du SaaS** : comment quantifier la valeur (gain de temps, réduction d'erreurs, professionnalisation) ? Arguments à mettre en avant sur la landing.
3) **Conseils et suggestions** : idées de fonctionnalités, d'offres (prix, essai), de messaging ou de contenu pour améliorer la conversion.

Sois concret et actionnable. Si la liste est vide ou très courte, donne tout de même des recommandations générales pour un SaaS B2B de gestion.`

export function AdminAIPage() {
  const queryClient = useQueryClient()
  const [predictionsResult, setPredictionsResult] = useState<string | null>(null)

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['admin-companies'],
    queryFn: adminListCompanies,
  })

  const { data: chatMessages = [], isLoading: loadingChat } = useQuery({
    queryKey: ['admin-landing-chat'],
    queryFn: () => adminListLandingChatMessages(500),
  })

  const updateCompanyMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { ai_predictions_enabled?: boolean } }) =>
      adminUpdateCompany(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-companies'] })
      toast.success('Prédictions IA mises à jour')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erreur'),
  })

  const generatePredictionsMutation = useMutation({
    mutationFn: async () => {
      const userQuestions = chatMessages
        .filter((m) => m.role === 'user')
        .map((m) => `- ${m.content}`)
        .join('\n')
      const questionList = userQuestions || '(Aucune question enregistrée pour le moment.)'
      const prompt = `${PREDICTIONS_PROMPT}\n\n--- Questions posées par les visiteurs ---\n${questionList}`
      const reply = await chatCompletion(
        [{ role: 'user', content: prompt }],
        { max_tokens: 1500, temperature: 0.5 }
      )
      return reply
    },
    onSuccess: (result) => {
      setPredictionsResult(result)
      toast.success('Rapport généré')
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erreur'),
  })

  const enabledCount = companies.filter((c) => c.ai_predictions_enabled).length
  const userQuestionsCount = chatMessages.filter((m) => m.role === 'user').length

  return (
    <div className="space-y-8">
      <PageHeader
        title="AI"
        description="Questions du chatbot landing, prédictions et conseils SaaS"
      />

      {/* Prédictions par entreprise (existant) */}
      <Card className="p-4">
        <p className="text-sm text-[var(--text-muted)]">
          {enabledCount} entreprise(s) avec prédictions IA activées sur {companies.length}.
        </p>
      </Card>

      {isLoading ? (
        <p className="text-sm text-[var(--text-muted)]">Chargement…</p>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-solid)] bg-slate-50 dark:bg-slate-800/50">
                  <th className="p-3 text-left font-medium text-[var(--text-muted)]">Entreprise</th>
                  <th className="p-3 text-left font-medium text-[var(--text-muted)]">Prédictions IA</th>
                  <th className="p-3 text-right font-medium text-[var(--text-muted)]">Action</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-[var(--border-solid)] hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                  >
                    <td className="p-3 font-medium text-[var(--text-primary)]">{c.name}</td>
                    <td className="p-3">
                      <span
                        className={
                          c.ai_predictions_enabled
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-[var(--text-muted)]'
                        }
                      >
                        {c.ai_predictions_enabled ? 'Activées' : 'Désactivées'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          updateCompanyMutation.mutate({
                            id: c.id,
                            patch: { ai_predictions_enabled: !c.ai_predictions_enabled },
                          })
                        }
                        title={c.ai_predictions_enabled ? 'Désactiver' : 'Activer'}
                      >
                        {c.ai_predictions_enabled ? (
                          <PowerOff className="h-4 w-4" />
                        ) : (
                          <Power className="h-4 w-4" />
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Questions du chatbot landing */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--text-primary)]">
          <MessageCircle className="h-5 w-5 text-orange-500" />
          Questions du chatbot (landing)
        </h2>
        <p className="text-sm text-[var(--text-muted)]">
          Toutes les questions que les visiteurs posent sur la landing page ({userQuestionsCount} question
          {userQuestionsCount !== 1 ? 's' : ''}).
        </p>
        {loadingChat ? (
          <p className="text-sm text-[var(--text-muted)]">Chargement…</p>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/50 z-10">
                  <tr className="border-b border-[var(--border-solid)]">
                    <th className="p-3 text-left font-medium text-[var(--text-muted)]">Date</th>
                    <th className="p-3 text-left font-medium text-[var(--text-muted)]">Session</th>
                    <th className="p-3 text-left font-medium text-[var(--text-muted)]">Rôle</th>
                    <th className="p-3 text-left font-medium text-[var(--text-muted)]">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {chatMessages.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-[var(--text-muted)]">
                        Aucun message pour le moment. Les questions posées sur la landing apparaîtront ici.
                      </td>
                    </tr>
                  ) : (
                    chatMessages.map((m: LandingChatMessage) => (
                      <tr
                        key={m.id}
                        className="border-b border-[var(--border-solid)] hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                      >
                        <td className="p-3 text-[var(--text-muted)] whitespace-nowrap">
                          {formatDate(m.created_at)}
                        </td>
                        <td className="p-3 font-mono text-xs text-[var(--text-muted)]">
                          {shortSession(m.session_id)}
                        </td>
                        <td className="p-3">
                          <span
                            className={
                              m.role === 'user'
                                ? 'text-orange-600 dark:text-orange-400'
                                : 'text-[var(--text-muted)]'
                            }
                          >
                            {m.role === 'user' ? 'Visiteur' : 'Assistant'}
                          </span>
                        </td>
                        <td className="p-3 text-[var(--text-secondary)] max-w-md">
                          <span className="line-clamp-2" title={m.content}>
                            {m.content.length > 200 ? `${m.content.slice(0, 200)}…` : m.content}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </section>

      {/* Générer prédictions / gain SaaS */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--text-primary)]">
          <Sparkles className="h-5 w-5 text-orange-500" />
          Prédictions & gain SaaS
        </h2>
        <p className="text-sm text-[var(--text-muted)]">
          Génère un rapport de conseils, prédictions de conversion et suggestions à partir des questions des
          visiteurs.
        </p>
        <Card className="p-4 space-y-4">
          <div>
            <Button
              onClick={() => generatePredictionsMutation.mutate()}
              disabled={generatePredictionsMutation.isPending}
            >
              {generatePredictionsMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Génération…
                </>
              ) : (
                'Générer le rapport'
              )}
            </Button>
          </div>
          {predictionsResult && (
            <div>
              <Label className="text-sm font-medium text-[var(--text-muted)]">Rapport généré</Label>
              <div className="mt-2 p-4 rounded-lg border border-[var(--border-solid)] bg-slate-50 dark:bg-slate-800/30 text-sm text-[var(--text-primary)] whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                {predictionsResult}
              </div>
            </div>
          )}
        </Card>
      </section>
    </div>
  )
}
