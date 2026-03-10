import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'

const DISMISS_KEY = 'fasostock_install_banner_dismiss'
const DISMISS_DAYS = 7

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  )
}

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<{ prompt: () => Promise<{ outcome: string }> } | null>(null)
  const [dismissed, setDismissed] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const dismissedUntil = localStorage.getItem(DISMISS_KEY)
    if (dismissedUntil && Date.now() < Number(dismissedUntil)) {
      setDismissed(true)
      return
    }
    if (isStandalone()) {
      setDismissed(true)
      return
    }
    setDismissed(false)

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as unknown as { prompt: () => Promise<{ outcome: string }> })
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    setDeferredPrompt(null)
    setDismissed(true)
  }

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000))
  }

  if (!mounted || dismissed) return null
  if (isStandalone()) return null

  const showIOSHint = isIOS() && !deferredPrompt
  const showChromeInstall = !!deferredPrompt

  if (!showIOSHint && !showChromeInstall) return null

  return (
    <div className="flex items-center justify-between gap-3 bg-[var(--accent)] text-white px-4 py-2.5 text-sm shrink-0">
      <span className="font-medium">
        {showIOSHint
          ? "Installez l'app : Menu du navigateur → « Ajouter à l'écran d'accueil »"
          : 'Installez FasoStock pour un accès rapide'}
      </span>
      <div className="flex items-center gap-2 shrink-0">
        {showChromeInstall && (
          <button
            type="button"
            onClick={handleInstall}
            className="flex items-center gap-1.5 rounded-lg bg-white text-[var(--accent)] px-3 py-1.5 font-medium hover:bg-white/90 touch-manipulation"
          >
            <Download className="h-4 w-4" />
            Installer
          </button>
        )}
        <button
          type="button"
          onClick={handleDismiss}
          className="rounded p-1.5 hover:bg-white/20 touch-manipulation"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
