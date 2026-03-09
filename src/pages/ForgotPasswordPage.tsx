import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ROUTES } from '@/routes'
import { Button, Input, Label } from '@/components/ui'
import { resetPasswordForEmail } from '@/features/auth/api/authService'
import { toast } from 'sonner'

const schema = z.object({
  email: z.string().email('Email invalide'),
})

type FormData = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      await resetPasswordForEmail(data.email)
      setSent(true)
      toast.success('Email envoyé. Vérifiez votre boîte de réception.')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
    }
  }

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] p-4">
        <div className="w-full max-w-sm rounded-2xl border border-[var(--border-solid)] bg-[var(--card-bg)] p-6 shadow-sm">
          <h1 className="mb-2 text-xl font-bold text-[var(--text-primary)]">Email envoyé</h1>
          <p className="mb-6 text-sm text-[var(--text-muted)]">
            Un lien de réinitialisation a été envoyé. Vérifiez votre boîte de réception et suivez le lien.
          </p>
          <Link
            to={ROUTES.login}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-2 font-medium text-white hover:bg-[var(--accent-hover)] touch-manipulation"
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] p-4">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border-solid)] bg-[var(--card-bg)] p-6 shadow-sm">
        <h1 className="mb-2 text-xl font-bold text-[var(--text-primary)]">Mot de passe oublié</h1>
        <p className="mb-6 text-sm text-[var(--text-muted)]">
          Entrez votre email pour recevoir un lien de réinitialisation.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="email" className="mb-2 block">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="vous@exemple.com"
              {...register('email')}
              error={errors.email?.message}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Envoi...' : 'Envoyer le lien'}
            </Button>
            <Link to={ROUTES.login}>
              <Button type="button" variant="secondary">Annuler</Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
