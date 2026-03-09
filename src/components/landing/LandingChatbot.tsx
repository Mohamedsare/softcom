import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/routes'
import { MessageCircle, Send, X, Loader2 } from 'lucide-react'
import { chatCompletion, isDeepSeekConfigured } from '@/features/ai/api/deepseekApi'
import type { ChatMessage } from '@/features/ai/api/deepseekApi'
import { saveLandingChatMessage } from '@/features/ai/landingChatApi'

const SYSTEM_PROMPT = `Tu es l'assistant commercial de FasoStock, une application SaaS de gestion de stocks et ventes pour les entreprises et boutiques au Burkina Faso. Ton objectif est de CONVERTIR les visiteurs en clients (inscription, essai gratuit).

RÈGLES :
- Réponds UNIQUEMENT en français, de façon chaleureuse et professionnelle.
- Sois concis (2-4 phrases par message), mobile-friendly.
- Présente FasoStock : caisse (POS) mobile, inventaire, rapports, prédictions IA, multi-boutiques. Essai gratuit 7 jours, puis 10 000 FCFA/mois ou 70 000 FCFA/an (2 mois offerts).
- Pose des questions STRATÉGIQUES : type d'activité (boutique, commerce, etc.), nombre de points de vente, problèmes actuels (stock, caisse, rapports).
- Quand le moment est opportun, propose de "réserver un rappel" ou "envoyer les infos" et demande : prénom/nom, téléphone (ou email) pour les recontacter.
- Pousse doucement vers l'essai gratuit : "Voulez-vous créer un compte pour tester 7 jours gratuits ? C'est sans engagement."
- Si la personne hésite sur le prix : rappelle la valeur (tout-en-un, gain de temps, moins d'erreurs, rapports en temps réel).
- Ne invente pas de fonctionnalités. Reste sur : ventes, stocks, inventaire, POS, rapports, prédictions IA, multi-boutiques.
- Si on te demande un contact humain : indique qu'ils peuvent nous écrire sur WhatsApp (+226 64 71 20 44) ou s'inscrire pour un essai gratuit.`

const WELCOME_MESSAGE = `Bonjour ! 👋 Je suis l'assistant FasoStock. Vous gérez des stocks et des ventes ? Je peux vous présenter la solution et répondre à vos questions. Qu'est-ce qui vous amène aujourd'hui ?`

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export function LandingChatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>(() => [
    { id: 'welcome', role: 'assistant', content: WELCOME_MESSAGE },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const sessionIdRef = useRef<string | null>(null)
  const configured = isDeepSeekConfigured()

  useEffect(() => {
    if (open && !sessionIdRef.current) {
      sessionIdRef.current = crypto.randomUUID()
    }
  }, [open])

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)
    setError(null)

    const sid = sessionIdRef.current
    if (sid) {
      saveLandingChatMessage(sid, 'user', text).catch(() => {})
    }

    const saveAssistantReply = (content: string) => {
      if (sid) saveLandingChatMessage(sid, 'assistant', content).catch(() => {})
    }

    if (!configured) {
      const fallback =
        "Le chat n'est pas activé sur cette démo. Contactez-nous directement sur WhatsApp (+226 64 71 20 44) ou inscrivez-vous pour un essai gratuit !"
      saveAssistantReply(fallback)
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: 'assistant', content: fallback },
      ])
      setLoading(false)
      return
    }

    try {
      const history: ChatMessage[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.slice(1).map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user', content: text },
      ]
      const reply = await chatCompletion(history, { max_tokens: 512, temperature: 0.7 })
      const replyTrimmed = reply.trim()
      saveAssistantReply(replyTrimmed)
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: 'assistant', content: replyTrimmed },
      ])
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : 'Erreur'
      setError(errMsg)
      const fallback =
        "Désolé, une erreur s'est produite. Vous pouvez nous contacter sur WhatsApp (+226 64 71 20 44) ou réessayer plus tard."
      saveAssistantReply(fallback)
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: 'assistant', content: fallback },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Bouton flottant pour ouvrir le chat — petit signe à l’arrivée, ne s’ouvre pas tout seul */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-lg shadow-orange-500/30 hover:bg-[var(--accent-hover)] hover:scale-105 active:scale-95 transition-transform touch-manipulation animate-chatbot-wave"
        style={{ bottom: 'max(1.25rem, env(safe-area-inset-bottom, 0px))' }}
        aria-label="Ouvrir le chat"
        title="Posez vos questions sur FasoStock"
      >
        <MessageCircle className="h-7 w-7" />
      </button>

      {/* Panneau de chat */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0a0b] sm:inset-auto sm:bottom-6 sm:right-6 sm:left-auto sm:top-auto sm:h-[min(560px,85vh)] sm:w-[380px] sm:rounded-2xl sm:shadow-2xl sm:border sm:border-white/10">
          {/* Header */}
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-[#0a0a0b] px-4 sm:rounded-t-2xl">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white">FasoStock</p>
                <p className="text-xs text-slate-400">Assistant · Réponses instantanées</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white touch-manipulation"
              aria-label="Fermer le chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={listRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.role === 'user'
                      ? 'bg-orange-500 text-white'
                      : 'bg-white/10 text-slate-200'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-white/10 px-4 py-2.5">
                  <Loader2 className="h-5 w-5 animate-spin text-orange-400" />
                </div>
              </div>
            )}
            {error && (
              <p className="text-xs text-red-400 px-1">{error}</p>
            )}
          </div>

          {/* CTA court */}
          <div className="shrink-0 border-t border-white/10 p-2">
            <p className="text-center text-xs text-slate-500 mb-2">
              Essai 7 jours gratuit · <Link to={ROUTES.register} onClick={() => setOpen(false)} className="text-orange-400 hover:underline">S&apos;inscrire</Link>
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder="Votre message..."
                className="flex-1 min-h-[44px] rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                type="button"
                onClick={send}
                disabled={loading || !input.trim()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 disabled:pointer-events-none touch-manipulation"
                aria-label="Envoyer"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
