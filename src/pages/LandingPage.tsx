import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/routes'
import { LandingChatbot } from '@/components/landing/LandingChatbot'
import {
  BarChart3,
  Package,
  Store,
  Sparkles,
  Shield,
  Smartphone,
  Check,
  ArrowRight,
  Zap,
  Menu,
  X,
} from 'lucide-react'

const WHATSAPP_NUMBER = '22664712044'
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)

  const navLinks = (
    <>
      <a href="#tarifs" onClick={closeMenu} className="text-slate-300 hover:text-white transition-colors">
        Tarifs
      </a>
      <a href="#fonctionnalites" onClick={closeMenu} className="text-slate-300 hover:text-white transition-colors">
        Fonctionnalités
      </a>
      <Link to={ROUTES.login} onClick={closeMenu} className="text-slate-300 hover:text-white transition-colors">
        Connexion
      </Link>
      <Link
        to={ROUTES.register}
        onClick={closeMenu}
        className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
      >
        Essai gratuit
      </Link>
    </>
  )

  return (
    <div className="h-screen max-h-[100dvh] overflow-y-auto overflow-x-hidden bg-[#0a0a0b] text-white overscroll-behavior-y-contain">
      {/* Nav — mobile first avec menu burger */}
      <header className="sticky top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0a0a0b]/95 backdrop-blur-md safe-area-inset-top">
        <div className="mx-auto flex h-14 sm:h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">FasoStock</span>
          </div>
          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-6 text-sm">
            {navLinks}
          </nav>
          {/* Burger — visible sur mobile/tablette */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 hover:text-white lg:hidden touch-manipulation"
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      {/* Menu mobile (drawer) */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={closeMenu}
            aria-hidden
          />
          <div className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-[280px] flex flex-col border-l border-white/10 bg-[#0a0a0b] shadow-xl animate-slide-in-right lg:hidden">
            <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
              <span className="font-semibold">Menu</span>
              <button
                type="button"
                onClick={closeMenu}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white touch-manipulation"
                aria-label="Fermer le menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1 p-4 text-lg">
              <a href="#tarifs" onClick={closeMenu} className="rounded-lg px-4 py-3 text-slate-300 hover:bg-white/10 hover:text-white">
                Tarifs
              </a>
              <a href="#fonctionnalites" onClick={closeMenu} className="rounded-lg px-4 py-3 text-slate-300 hover:bg-white/10 hover:text-white">
                Fonctionnalités
              </a>
              <Link to={ROUTES.login} onClick={closeMenu} className="rounded-lg px-4 py-3 text-slate-300 hover:bg-white/10 hover:text-white">
                Connexion
              </Link>
              <Link
                to={ROUTES.register}
                onClick={closeMenu}
                className="mt-2 rounded-lg bg-orange-500 px-4 py-3 text-center font-semibold text-white hover:bg-orange-600"
              >
                Essai gratuit
              </Link>
            </nav>
          </div>
        </>
      )}

      {/* Hero */}
      <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(249,115,22,0.15),transparent)]" />
        <div className="relative mx-auto max-w-4xl text-center">
          <p className="mb-4 inline-block rounded-full border border-orange-500/40 bg-orange-500/10 px-4 py-1.5 text-sm font-medium text-orange-400">
            7 jours d&apos;essai gratuit · Sans carte bancaire
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Gérez vos stocks et ventes
            <span className="block mt-2 bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
              en toute simplicité
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
            Pour les entreprises et boutiques au Burkina Faso. Caisse, inventaire, rapports et
            prédictions IA — tout en un, sur ordinateur et mobile.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={ROUTES.register}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-orange-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-orange-500/25 hover:bg-orange-600 transition-all"
            >
              Démarrer l&apos;essai gratuit
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#tarifs"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-8 py-4 text-base font-medium text-white hover:bg-white/10 transition-colors"
            >
              Voir les tarifs
            </a>
          </div>
        </div>
      </section>

      {/* Social proof / badges */}
      <section className="border-y border-white/10 py-8 px-4">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-8 text-slate-400 text-sm">
          <span className="flex items-center gap-2">
            <Check className="h-5 w-5 text-emerald-500" />
            Multi-boutiques
          </span>
          <span className="flex items-center gap-2">
            <Check className="h-5 w-5 text-emerald-500" />
            POS mobile
          </span>
          <span className="flex items-center gap-2">
            <Check className="h-5 w-5 text-emerald-500" />
            Prédictions IA
          </span>
          <span className="flex items-center gap-2">
            <Check className="h-5 w-5 text-emerald-500" />
            Tickets & rapports
          </span>
        </div>
      </section>

      {/* Features */}
      <section id="fonctionnalites" className="py-20 sm:py-28 px-4">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold sm:text-4xl">
            Tout ce dont vous avez besoin
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-slate-400">
            Une seule plateforme pour vendre, suivre les stocks et piloter votre activité.
          </p>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Store,
                title: 'Caisse & POS',
                desc: 'Encaissement rapide, tickets 58 ou 80 mm, multi-boutiques et panier mobile.',
              },
              {
                icon: Package,
                title: 'Stocks & inventaire',
                desc: 'Suivi en temps réel, alertes rupture, transferts entre boutiques et inventaires.',
              },
              {
                icon: Sparkles,
                title: 'Prédictions IA',
                desc: 'Prévisions de CA, réappro prioritaire et recommandations pour mieux vendre.',
              },
              {
                icon: BarChart3,
                title: 'Rapports & stats',
                desc: 'Ventes, achats, marges et tableaux de bord par boutique ou global.',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition hover:border-orange-500/30 hover:bg-white/[0.07]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="tarifs" className="py-20 sm:py-28 px-4">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold sm:text-4xl">
            Un tarif simple, pour toutes les tailles
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-slate-400">
            7 jours d&apos;essai gratuit pour toute entreprise ou boutique. Sans engagement.
          </p>
          <div className="mt-14 grid gap-8 md:grid-cols-2">
            <div className="rounded-2xl border border-white/15 bg-white/5 p-8 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-400" />
                <span className="text-sm font-medium text-orange-400">Mensuel</span>
              </div>
              <p className="mt-4 text-4xl font-bold">
                10 000 <span className="text-lg font-normal text-slate-400">FCFA</span>
                <span className="text-lg font-normal text-slate-400">/mois</span>
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Facturation mensuelle. Résiliable à tout moment.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  Toutes les fonctionnalités
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  Multi-boutiques inclus
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  Prédictions IA
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  Support par email
                </li>
              </ul>
              <Link
                to={ROUTES.register}
                className="mt-8 block w-full rounded-xl border border-orange-500/50 bg-orange-500/10 py-3.5 text-center font-semibold text-orange-400 hover:bg-orange-500/20 transition-colors"
              >
                Essayer 7 jours gratuits
              </Link>
            </div>
            <div className="relative rounded-2xl border-2 border-orange-500/50 bg-orange-500/5 p-8 backdrop-blur-sm">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-orange-500 px-4 py-1 text-xs font-semibold text-white">
                Économisez 42 %
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-orange-400" />
                <span className="text-sm font-medium text-orange-400">Annuel</span>
              </div>
              <p className="mt-4 text-4xl font-bold">
                70 000 <span className="text-lg font-normal text-slate-400">FCFA</span>
                <span className="text-lg font-normal text-slate-400">/an</span>
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Soit 5 833 FCFA/mois. Paiement unique pour 12 mois.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  Tout du forfait mensuel
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  2 mois offerts
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  Priorité support
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  Mises à jour incluses
                </li>
              </ul>
              <Link
                to={ROUTES.register}
                className="mt-8 block w-full rounded-xl bg-orange-500 py-3.5 text-center font-semibold text-white shadow-lg shadow-orange-500/25 hover:bg-orange-600 transition-colors"
              >
                Essayer 7 jours gratuits
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-8 rounded-2xl border border-white/10 bg-white/5 p-8 sm:grid-cols-3 sm:p-10">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Données sécurisées</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Hébergement fiable, sauvegardes et accès contrôlés.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">PC et mobile</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Utilisez la caisse et les rapports sur téléphone ou tablette.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Sans engagement</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Essai 7 jours gratuit. Résiliez quand vous voulez.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28 px-4">
        <div className="mx-auto max-w-3xl rounded-3xl border border-orange-500/30 bg-gradient-to-b from-orange-500/10 to-transparent p-10 text-center sm:p-14">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Prêt à simplifier votre gestion ?
          </h2>
          <p className="mt-4 text-slate-400">
            Rejoignez les entreprises et boutiques qui utilisent FasoStock au quotidien.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={ROUTES.register}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-8 py-4 text-base font-semibold text-white hover:bg-orange-600 transition-colors"
            >
              Créer mon compte
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to={ROUTES.login}
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              J&apos;ai déjà un compte
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10 px-4">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold">FasoStock</span>
          </div>
          <div className="flex gap-6 text-sm text-slate-400">
            <Link to={ROUTES.login} className="hover:text-white transition-colors">
              Connexion
            </Link>
            <Link to={ROUTES.register} className="hover:text-white transition-colors">
              Inscription
            </Link>
          </div>
        </div>
      </footer>

      {/* Chatbot IA (DeepSeek) — conversion */}
      <LandingChatbot />

      {/* Bouton WhatsApp fixe — contact / demande d'info */}
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/40 hover:bg-[#20BD5A] hover:scale-105 active:scale-95 transition-transform touch-manipulation"
        style={{ bottom: 'max(1.25rem, env(safe-area-inset-bottom, 0px))' }}
        aria-label="Nous contacter sur WhatsApp"
        title="Contacter FasoStock sur WhatsApp"
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
    </div>
  )
}
