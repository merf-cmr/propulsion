import { useState, useEffect } from 'react'
import { X, Download } from 'lucide-react'
import { INSTALL_PROMPT_MIN_VISITS } from '../../lib/constants'

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)

  useEffect(() => {
    const visits = parseInt(localStorage.getItem('propulsion-visits') || '0') + 1
    localStorage.setItem('propulsion-visits', visits.toString())

    const dismissed = localStorage.getItem('propulsion-install-dismissed')
    if (dismissed) return

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.navigator.standalone
    setIsIOS(ios)

    if (ios && visits >= INSTALL_PROMPT_MIN_VISITS) {
      setShowBanner(true)
    }

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      if (visits >= INSTALL_PROMPT_MIN_VISITS) setShowBanner(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true)
      return
    }
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setShowBanner(false)
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem('propulsion-install-dismissed', '1')
  }

  if (!showBanner) return null

  if (showIOSInstructions) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-violet text-white px-4 py-3 shadow-lg">
        <div className="flex items-start justify-between gap-2">
          <div className="text-sm">
            <p className="font-semibold mb-1">Installer Propulsion sur iOS</p>
            <p>Appuyez sur <strong>Partager</strong> puis <strong>Ajouter à l'écran d'accueil</strong></p>
          </div>
          <button onClick={handleDismiss} className="p-1 flex-shrink-0">
            <X size={18} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-violet text-white px-4 py-3 shadow-lg">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Download size={20} className="flex-shrink-0" />
          <p className="text-sm font-medium">Installer Propulsion sur votre écran d'accueil</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleInstall}
            className="bg-white text-violet text-xs font-bold px-3 py-1.5 rounded-full"
          >
            Installer
          </button>
          <button onClick={handleDismiss}>
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
