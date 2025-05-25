// src/hooks/usePWAInstall.ts
import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevenir que se muestre automáticamente
      e.preventDefault()
      // Guardar el evento para usarlo después
      setInstallPrompt(e)
      setIsInstallable(true)
    }

    const handleAppInstalled = () => {
      console.log('PWA instalada exitosamente')
      setInstallPrompt(null)
      setIsInstallable(false)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return

    try {
      await installPrompt.prompt()
      const result = await installPrompt.userChoice
      
      if (result.outcome === 'accepted') {
        console.log('Usuario aceptó la instalación')
      } else {
        console.log('Usuario rechazó la instalación')
      }
      
      setInstallPrompt(null)
      setIsInstallable(false)
    } catch (error) {
      console.error('Error al instalar:', error)
    }
  }

  return {
    isInstallable,
    handleInstall
  }
}