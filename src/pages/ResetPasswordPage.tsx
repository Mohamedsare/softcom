import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ROUTES } from '@/routes'
import { Button, Input, Label } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { translateErrorMessage } from '@/lib/errorMessages'

const schema = z
  .object({
    password: z.string().min(8, 'Minimum 8 caractères'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

export function ResetPasswordPage() {
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const onSubmit = async (data: FormData) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: data.password })
      if (error) throw error
      setSuccess(true)
      toast.success('Mot de passe mis à jour. Connectez-vous.')
    } catch (e) {
      console.error(e)
      toast.error(e instanceof Error ? translateErrorMessage(e.message) : 'Une erreur s’est produite.')
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] p-4">
        <div className="w-full max-w-sm rounded-2xl border border-[var(--border-solid)] bg-[var(--card-bg)] p-6 shadow-sm">
          <h1 className="mb-2 text-xl font-bold text-[var(--text-primary)]">Mot de passe mis à jour</h1>
          <p className="mb-6 text-sm text-[var(--text-muted)]">
            Votre mot de passe a été réinitialisé. Connectez-vous avec le nouveau mot de passe.
          </p>
          <Link
            to={ROUTES.login}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-2 font-medium text-white hover:bg-[var(--accent-hover)] touch-manipulation"
          >
            Se connecter
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] p-4">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border-solid)] bg-[var(--card-bg)] p-6 shadow-sm">
        <h1 className="mb-2 text-xl font-bold text-[var(--text-primary)]">Nouveau mot de passe</h1>
        <p className="mb-6 text-sm text-[var(--text-muted)]">
          Entrez votre nouveau mot de passe. Minimum 8 caractères.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="password" className="mb-2 block">Mot de passe *</Label>
            <Input
              id="password"
              type="password"
              {...register('password')}
              error={errors.password?.message}
              autoComplete="new-password"
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword" className="mb-2 block">Confirmer *</Label>
            <Input
              id="confirmPassword"
              type="password"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
              autoComplete="new-password"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Mise à jour...' : 'Mettre à jour'}
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
