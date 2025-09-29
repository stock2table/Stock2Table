import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface PWAState {
  isInstallable: boolean
  isInstalled: boolean
  isOnline: boolean
  promptInstall: () => Promise<void>
  canInstall: boolean
}

export function usePWA(): PWAState {
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true)
      }
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
    }

    // Listen for successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
    }

    // Listen for online/offline status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js', { scope: '/' })
          .then((registration) => {
            console.log('SW registered successfully:', registration.scope)
          })
          .catch((error) => {
            console.error('SW registration failed:', error)
          })
      })
    }

    checkInstalled()
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const promptInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
      setIsInstallable(false)
    }
  }

  return {
    isInstallable,
    isInstalled,
    isOnline,
    promptInstall,
    canInstall: isInstallable && !isInstalled
  }
}

// Hook for managing background sync
export function useBackgroundSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [syncQueue, setSyncQueue] = useState<Array<() => Promise<void>>>([])

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // Process sync queue when back online
      if (syncQueue.length > 0) {
        syncQueue.forEach(action => action())
        setSyncQueue([])
      }
    }

    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [syncQueue])

  const queueAction = (action: () => Promise<void>) => {
    if (isOnline) {
      action()
    } else {
      setSyncQueue(prev => [...prev, action])
    }
  }

  return { isOnline, queueAction }
}