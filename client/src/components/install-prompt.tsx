import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Download, Smartphone, X } from "lucide-react"
import { usePWA } from "@/hooks/use-pwa"
import { useState } from "react"

export function InstallPrompt() {
  const { canInstall, promptInstall, isInstalled } = usePWA()
  const [dismissed, setDismissed] = useState(false)

  if (!canInstall || dismissed || isInstalled) {
    return null
  }

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 bg-background/95 backdrop-blur-sm border shadow-lg md:max-w-md md:left-auto md:right-4" data-testid="card-install-prompt">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Smartphone className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 space-y-2">
            <div>
              <h3 className="font-medium text-sm">Install Stock2Table</h3>
              <p className="text-xs text-muted-foreground">
                Get the app experience with offline access and notifications
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={promptInstall}
                className="flex items-center gap-1"
                data-testid="button-install-app"
              >
                <Download className="h-3 w-3" />
                Install
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setDismissed(true)}
                data-testid="button-dismiss-install"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}