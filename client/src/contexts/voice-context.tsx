import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useSpeechRecognition } from '@/hooks/use-speech-recognition'
import { useSpeechSynthesis } from '@/hooks/use-speech-synthesis'

interface VoiceContextType {
  // Recognition state
  isListening: boolean
  transcript: string
  interimTranscript: string
  confidence: number
  isSupported: boolean
  
  // Speech synthesis state
  speaking: boolean
  
  // Actions
  startListening: () => void
  stopListening: () => void
  toggleListening: () => void
  speak: (text: string) => void
  
  // Permission handling
  hasPermission: boolean | null
  requestPermission: () => Promise<boolean>
  
  // Chat integration
  onVoiceMessage?: (message: string) => void
  setOnVoiceMessage: (handler: (message: string) => void) => void
}

const VoiceContext = createContext<VoiceContextType | null>(null)

interface VoiceProviderProps {
  children: ReactNode
}

export function VoiceProvider({ children }: VoiceProviderProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [onVoiceMessage, setOnVoiceMessage] = useState<((message: string) => void) | undefined>()

  // Text-to-speech with coordination
  const { speak: speakText, speaking, cancel: cancelSpeech } = useSpeechSynthesis()

  // Speech recognition with central coordination
  const {
    isListening,
    transcript,
    interimTranscript,
    confidence,
    isSupported,
    start,
    stop,
    reset
  } = useSpeechRecognition({
    continuous: false,
    interimResults: true,
    onResult: (result) => {
      if (result.isFinal && result.transcript.trim() && onVoiceMessage) {
        onVoiceMessage(result.transcript.trim())
        reset()
      }
    },
    onError: (error) => {
      if (error === 'not-allowed') {
        setHasPermission(false)
      }
    },
    onStart: () => {
      setHasPermission(true)
    }
  })

  // Coordinated speech to pause recognition during TTS
  const speak = (text: string) => {
    if (isListening) {
      stop() // Pause recognition while speaking
    }
    speakText(text)
  }

  // Resume listening after speech ends for hands-free experience
  const [wasListeningBeforeSpeech, setWasListeningBeforeSpeech] = useState(false)
  
  useEffect(() => {
    if (speaking && isListening) {
      // Remember we were listening before speech started
      setWasListeningBeforeSpeech(true)
    } else if (!speaking && wasListeningBeforeSpeech && hasPermission) {
      // Auto-resume listening after TTS ends
      setTimeout(() => {
        start()
        setWasListeningBeforeSpeech(false)
      }, 1000) // Small delay to ensure speech fully ended
    }
  }, [speaking, isListening, wasListeningBeforeSpeech, hasPermission, start])

  const startListening = () => {
    if (!isSupported) return
    
    if (speaking) {
      cancelSpeech() // Stop any ongoing speech
    }
    
    start()
  }

  const stopListening = () => {
    stop()
  }

  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) return false
    
    try {
      // Try to start recognition to trigger permission request
      start()
      return true
    } catch (error) {
      setHasPermission(false)
      return false
    }
  }

  return (
    <VoiceContext.Provider value={{
      isListening,
      transcript,
      interimTranscript,
      confidence,
      isSupported,
      speaking,
      startListening,
      stopListening,
      toggleListening,
      speak,
      hasPermission,
      requestPermission,
      onVoiceMessage,
      setOnVoiceMessage
    }}>
      {children}
    </VoiceContext.Provider>
  )
}

export function useVoice() {
  const context = useContext(VoiceContext)
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider')
  }
  return context
}