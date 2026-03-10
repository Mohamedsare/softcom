import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerCompany } from '../api/authService'
import { ROUTES } from '@/routes'
import { translateErrorMessage } from '@/lib/errorMessages'

function slugFromName(name: string): string {
  if (!name.trim()) return ''
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'entreprise'
}

const schema = z
  .object({
    companyName: z.string().min(2, 'Nom requis'),
    companySlug: z.string().min(2, 'Slug requis').regex(/^[a-z0-9-]+$/, 'Slug : lettres minuscules, chiffres, tirets'),
    ownerEmail: z.string().email('Email invalide'),
    ownerPassword: z.string().min(8, 'Minimum 8 caractères'),
    ownerFullName: z.string().min(2, 'Nom requis'),
    firstStoreName: z.string().min(2, 'Nom de la boutique requis'),
    firstStorePhone: z.string().min(8, 'Téléphone requis (ex. 70 00 00 00)'),
  })
  .required()

type FormData = z.infer<typeof schema>

export function RegisterCompanyForm() {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { companySlug: '' },
  })

  const companyName = watch('companyName')
  useEffect(() => {
    if (companyName?.trim()) {
      setValue('companySlug', slugFromName(companyName))
    }
  }, [companyName, setValue])

  const onSubmit = async (data: FormData) => {
    setSubmitError(null)
    try {
      await registerCompany({
        companyName: data.companyName,
        companySlug: data.companySlug || slugFromName(data.companyName),
        ownerEmail: data.ownerEmail,
        ownerPassword: data.ownerPassword,
        ownerFullName: data.ownerFullName,
        firstStoreName: data.firstStoreName,
        firstStorePhone: data.firstStorePhone,
      })
      navigate(ROUTES.login, { state: { message: 'Compte créé. Connectez-vous.' } })
    } catch (e) {
      setSubmitError(e instanceof Error ? translateErrorMessage(e.message) : 'Erreur lors de l’inscription.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 sm:gap-4">
      <div>
        <label htmlFor="companyName" className="mb-0.5 block text-xs sm:text-sm font-medium text-[var(--text-secondary)]">Nom de l’entreprise</label>
        <input id="companyName" {...register('companyName')} className="w-full min-h-[40px] sm:min-h-[44px] rounded-lg border border-[var(--border-solid)] bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800" />
        {errors.companyName && <p className="mt-0.5 text-xs text-[var(--danger)]">{errors.companyName.message}</p>}
      </div>
      <div>
        <label htmlFor="companySlug" className="mb-0.5 block text-xs sm:text-sm font-medium text-[var(--text-secondary)]">Slug (rempli automatiquement)</label>
        <input id="companySlug" {...register('companySlug')} placeholder="mon-entreprise" readOnly className="w-full min-h-[40px] sm:min-h-[44px] rounded-lg border border-[var(--border-solid)] bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800 text-[var(--text-muted)]" />
        {errors.companySlug && <p className="mt-0.5 text-xs text-[var(--danger)]">{errors.companySlug.message}</p>}
      </div>
      <div>
        <label htmlFor="firstStorePhone" className="mb-0.5 block text-xs sm:text-sm font-medium text-[var(--text-secondary)]">Téléphone <span className="text-[var(--danger)]">*</span></label>
        <input id="firstStorePhone" type="tel" {...register('firstStorePhone')} className="w-full min-h-[40px] sm:min-h-[44px] rounded-lg border border-[var(--border-solid)] bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800" placeholder="70 00 00 00 ou +226 70 00 00 00" />
        {errors.firstStorePhone && <p className="mt-0.5 text-xs text-[var(--danger)]">{errors.firstStorePhone.message}</p>}
      </div>
      <div>
        <label htmlFor="ownerFullName" className="mb-0.5 block text-xs sm:text-sm font-medium text-[var(--text-secondary)]">Votre nom complet</label>
        <input id="ownerFullName" {...register('ownerFullName')} className="w-full min-h-[40px] sm:min-h-[44px] rounded-lg border border-[var(--border-solid)] bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800" />
        {errors.ownerFullName && <p className="mt-0.5 text-xs text-[var(--danger)]">{errors.ownerFullName.message}</p>}
      </div>
      <div>
        <label htmlFor="ownerEmail" className="mb-0.5 block text-xs sm:text-sm font-medium text-[var(--text-secondary)]">Email</label>
        <input id="ownerEmail" type="email" {...register('ownerEmail')} className="w-full min-h-[40px] sm:min-h-[44px] rounded-lg border border-[var(--border-solid)] bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800" />
        {errors.ownerEmail && <p className="mt-0.5 text-xs text-[var(--danger)]">{errors.ownerEmail.message}</p>}
      </div>
      <div>
        <label htmlFor="ownerPassword" className="mb-0.5 block text-xs sm:text-sm font-medium text-[var(--text-secondary)]">Mot de passe</label>
        <input id="ownerPassword" type="password" {...register('ownerPassword')} className="w-full min-h-[40px] sm:min-h-[44px] rounded-lg border border-[var(--border-solid)] bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800" />
        {errors.ownerPassword && <p className="mt-0.5 text-xs text-[var(--danger)]">{errors.ownerPassword.message}</p>}
      </div>
      <div>
        <label htmlFor="firstStoreName" className="mb-0.5 block text-xs sm:text-sm font-medium text-[var(--text-secondary)]">Première boutique — nom</label>
        <input id="firstStoreName" {...register('firstStoreName')} className="w-full min-h-[40px] sm:min-h-[44px] rounded-lg border border-[var(--border-solid)] bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800" placeholder="Ma boutique" />
        {errors.firstStoreName && <p className="mt-0.5 text-xs text-[var(--danger)]">{errors.firstStoreName.message}</p>}
      </div>
      {submitError && <p className="text-xs sm:text-sm text-[var(--danger)]">{submitError}</p>}
      {/* Tout dans le flux : rien ne recouvre le bas du formulaire */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-4 w-full min-h-[50px] rounded-xl bg-[var(--accent)] px-4 py-3 text-base font-semibold text-white shadow-lg shadow-orange-500/30 hover:bg-[var(--accent-hover)] disabled:opacity-50"
      >
        {isSubmitting ? 'Création...' : 'Créer mon entreprise'}
      </button>
      <p className="mt-4 text-center text-xs sm:text-sm text-[var(--text-muted)]">
        <Link to={ROUTES.login} className="text-[var(--accent)] hover:underline">
          Déjà un compte ? Se connecter
        </Link>
      </p>
    </form>
  )
}
