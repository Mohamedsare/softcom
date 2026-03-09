import { Link } from 'react-router-dom'
import { RegisterCompanyForm } from '@/features/auth/components/RegisterCompanyForm'

function BackToLanding() {
  return (
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
  )
}

export function RegisterPage() {
  return (
    <div className="h-[100dvh] min-h-[100dvh] overflow-y-auto overflow-x-hidden bg-[var(--bg-primary)]">
      <div className="flex min-h-full flex-col items-start py-4 px-3 pb-24 sm:py-8 sm:px-4 sm:pb-28">
        <div className="mx-auto w-full max-w-md shrink-0 rounded-2xl border border-[var(--border-solid)] bg-[var(--card-bg)] p-4 pb-12 shadow-sm sm:p-6 sm:pb-14">
          <div className="mb-5 flex justify-start">
            <BackToLanding />
          </div>
          <h1 className="mb-1.5 text-lg sm:text-xl font-bold text-[var(--text-primary)]">Créer une entreprise</h1>
          <p className="mb-4 sm:mb-6 text-xs sm:text-sm text-[var(--text-muted)]">Inscription : entreprise, compte owner et première boutique.</p>
          <RegisterCompanyForm />
        </div>
      </div>
    </div>
  )
}
