import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { ROUTES } from '@/routes'
import { supabase } from '@/lib/supabase'
import { translateErrorMessage } from '@/lib/errorMessages'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { refreshProfile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? ROUTES.dashboard

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) {
        setError(translateErrorMessage(err.message, (err as { code?: string }).code))
        return
      }
      const profile = await refreshProfile()
      const destination = profile?.is_super_admin ? ROUTES.admin : from
      navigate(destination, { replace: true })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen overflow-y-auto overflow-x-hidden bg-[var(--bg-primary)] p-4 py-6 pb-20 sm:py-8 sm:pb-24">
      <div className="mx-auto w-full max-w-sm rounded-2xl border border-[var(--border-solid)] bg-[var(--card-bg)] p-6 pb-8 shadow-sm">
        <div className="mb-5 flex justify-start">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border-solid)] bg-[var(--card-bg)] px-3.5 py-2 text-sm font-medium text-[var(--text-secondary)] shadow-sm transition-all hover:border-[var(--accent)] hover:text-[var(--accent)] hover:shadow"
            aria-label="Retour à l'accueil"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Retour
          </Link>
        </div>
        <h1 className="mb-2 text-xl font-bold text-[var(--text-primary)]">FasoStock</h1>
        <p className="mb-6 text-sm text-[var(--text-muted)]">Connexion à votre espace</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-[var(--border-solid)] bg-slate-50 px-3 py-2 text-[var(--text-primary)] dark:bg-slate-800"
              placeholder="vous@exemple.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-[var(--border-solid)] bg-slate-50 px-3 py-2 text-[var(--text-primary)] dark:bg-slate-800"
            />
          </div>
          {error && (
            <p className="text-sm text-[var(--danger)]" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="min-h-[44px] rounded-xl bg-[var(--accent)] px-4 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-[var(--text-muted)]">
          <Link to={ROUTES.forgotPassword} className="text-[var(--accent)] hover:underline">
            Mot de passe oublié ?
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-[var(--text-muted)]">
          Pas de compte ?{' '}
          <Link to={ROUTES.register} className="text-[var(--accent)] hover:underline">
            Créer une entreprise
          </Link>
        </p>
      </div>
    </div>
  )
}
