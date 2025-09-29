import { Badge } from "@/components/ui/badge"
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react"

interface VoiceIndicatorProps {
  isListening: boolean
  isSpeaking: boolean
  className?: string
}

export function VoiceIndicator({ isListening, isSpeaking, className }: VoiceIndicatorProps) {
  if (!isListening && !isSpeaking) {
    return null
  }

  return (
    <Badge 
      variant="secondary" 
      className={`fixed top-4 left-4 z-50 ${className}`}
      data-testid="indicator-voice-status"
    >
      {isListening && (
        <>
          <Mic className="h-3 w-3 mr-1 text-red-500" />
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1" />
          Listening
        </>
      )}
      {isSpeaking && (
        <>
          <Volume2 className="h-3 w-3 mr-1 text-blue-500" />
          Speaking
        </>
      )}
    </Badge>
  )
}