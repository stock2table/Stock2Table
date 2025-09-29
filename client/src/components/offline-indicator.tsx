import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff } from "lucide-react"
import { usePWA } from "@/hooks/use-pwa"

export function OfflineIndicator() {
  const { isOnline } = usePWA()

  if (isOnline) {
    return null
  }

  return (
    <Badge 
      variant="secondary" 
      className="fixed top-4 right-4 z-50 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700"
      data-testid="indicator-offline"
    >
      <WifiOff className="h-3 w-3 mr-1" />
      Offline
    </Badge>
  )
}

export function ConnectionStatus() {
  const { isOnline } = usePWA()

  return (
    <div className="flex items-center gap-2 text-sm">
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4 text-green-500" />
          <span className="text-muted-foreground">Online</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 text-yellow-500" />
          <span className="text-muted-foreground">Offline</span>
        </>
      )}
    </div>
  )
}