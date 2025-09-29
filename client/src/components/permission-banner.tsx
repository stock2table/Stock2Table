import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, Mic, X } from "lucide-react"
import { useState } from "react"
import { useVoice } from "@/contexts/voice-context"

export function PermissionBanner() {
  const { hasPermission, isSupported, requestPermission } = useVoice()
  const [dismissed, setDismissed] = useState(false)

  // Don't show if voice is supported and permission granted, or if dismissed
  if (!isSupported || hasPermission === true || dismissed) {
    return null
  }

  const handleRequestPermission = async () => {
    const granted = await requestPermission()
    if (!granted) {
      // Permission was denied, show guidance
      console.log('Microphone permission denied')
    }
  }

  const getPermissionMessage = () => {
    if (hasPermission === false) {
      return {
        title: "Microphone Access Blocked",
        description: "To use voice commands, please allow microphone access in your browser settings and refresh the page.",
        action: "Browser Settings"
      }
    }
    
    return {
      title: "Enable Voice Commands",
      description: "Allow microphone access to use hands-free voice commands for cooking.",
      action: "Allow Microphone"
    }
  }

  const { title, description, action } = getPermissionMessage()

  return (
    <Card className="fixed bottom-20 left-4 right-4 z-40 bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800 md:max-w-md md:left-auto md:right-4">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="bg-orange-100 dark:bg-orange-900 p-2 rounded-lg">
            <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="flex-1 space-y-2">
            <div>
              <h3 className="font-medium text-sm text-orange-800 dark:text-orange-200">{title}</h3>
              <p className="text-xs text-orange-700 dark:text-orange-300">
                {description}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleRequestPermission}
                className="flex items-center gap-1 bg-white dark:bg-gray-800 border-orange-300 dark:border-orange-700"
                data-testid="button-request-mic-permission"
              >
                <Mic className="h-3 w-3" />
                {action}
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setDismissed(true)}
                className="text-orange-700 dark:text-orange-300"
                data-testid="button-dismiss-permission"
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