import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, Input, Label } from '@/components/ui'
import { ROUTES } from '@/routes'
import { translateErrorMessage } from '@/lib/errorMessages'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export function CreateSuperAdminPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    const secret = code.trim()
    if (!secret) {
      setMessage({ type: 'error', text: 'Code d\'accès requis (saisissez le code défini dans Supabase Edge Function).' })
      return
    }
    if (!email.trim() || !password) {
      setMessage({ type: 'error', text: 'Email et mot de passe requis.' })
      return
    }
    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 6 caractères.' })
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/create-super-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          secret,
          email: email.trim().toLowerCase(),
          password,
          full_name: fullName.trim() || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMessage({ type: 'error', text: (data as { error?: string }).error || 'Erreur lors de la création.' })
        return
      }
      setMessage({
        type: 'success',
        text: `Super admin créé : ${(data as { email?: string }).email}. Connectez-vous puis allez sur "Admin plateforme".`,
      })
      setEmail('')
      setPassword('')
      setFullName('')
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? translateErrorMessage(err.message) : 'Erreur réseau.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] py-8 px-4">
      <div className="mx-auto max-w-md">
        <Card className="p-6">
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Créer un super admin</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Cette page permet de créer un compte super admin (accès Admin plateforme). À supprimer après usage.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <Label className="mb-1 block">Code d&apos;accès *</Label>
              <Input
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Code défini dans Supabase Edge Function"
                autoComplete="off"
              />
            </div>
            <div>
              <Label className="mb-1 block">Email *</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@exemple.com"
                required
              />
            </div>
            <div>
              <Label className="mb-1 block">Mot de passe * (min. 6 caractères)</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            <div>
              <Label className="mb-1 block">Nom (optionnel)</Label>
              <Input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Super Admin"
              />
            </div>
            {message && (
              <p
                className={`text-sm ${message.type === 'success' ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}
                role="alert"
              >
                {message.text}
              </p>
            )}
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? 'Création...' : 'Créer le super admin'}
              </Button>
              <Link to={ROUTES.login}>
                <Button type="button" variant="secondary">
                  Retour connexion
                </Button>
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
