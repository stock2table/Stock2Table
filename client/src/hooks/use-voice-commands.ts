import { useCallback, useEffect, useState } from 'react'
import { useSpeechRecognition } from './use-speech-recognition'
import { useSpeechSynthesis } from './use-speech-synthesis'

interface VoiceCommand {
  patterns: string[]
  action: (params?: any) => void | Promise<void>
  description: string
  category: 'navigation' | 'recipe' | 'timer' | 'general'
  parameters?: RegExp
}

interface UseVoiceCommandsOptions {
  enabled?: boolean
  language?: string
  confirmationSound?: boolean
  voiceResponse?: boolean
}

interface VoiceCommandsHook {
  isListening: boolean
  isSupported: boolean
  transcript: string
  interimTranscript: string
  startListening: () => void
  stopListening: () => void
  toggleListening: () => void
  executeCommand: (text: string) => Promise<boolean>
  availableCommands: VoiceCommand[]
  lastCommand: string | null
  confidence: number
  speaking: boolean
}

export function useVoiceCommands(
  commands: VoiceCommand[],
  options: UseVoiceCommandsOptions = {}
): VoiceCommandsHook {
  const {
    enabled = true,
    language = 'en-US',
    confirmationSound = true,
    voiceResponse = true
  } = options

  const [lastCommand, setLastCommand] = useState<string | null>(null)
  const [commandHistory, setCommandHistory] = useState<string[]>([])

  const { speak, speaking, supported: ttsSupported } = useSpeechSynthesis({ 
    rate: 1.1, 
    lang: language 
  })

  const processVoiceResult = useCallback(async (result: any) => {
    if (!result.isFinal || !enabled) return

    const success = await executeCommand(result.transcript)
    
    if (success && voiceResponse && ttsSupported) {
      // Provide audio feedback for successful commands
      speak('Got it')
    }
  }, [enabled, voiceResponse, ttsSupported])

  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    confidence,
    start,
    stop,
    toggle,
    reset
  } = useSpeechRecognition({
    continuous: true,
    interimResults: true,
    language,
    onResult: processVoiceResult,
    onError: (error) => {
      console.error('Voice recognition error:', error)
      if (voiceResponse && ttsSupported) {
        speak('Sorry, I didnt catch that')
      }
    }
  })

  const executeCommand = useCallback(async (text: string): Promise<boolean> => {
    const normalizedText = text.toLowerCase().trim()
    
    // Find matching command
    for (const command of commands) {
      for (const pattern of command.patterns) {
        const regex = new RegExp(pattern, 'i')
        const match = normalizedText.match(regex)
        
        if (match) {
          try {
            setLastCommand(normalizedText)
            setCommandHistory(prev => [...prev.slice(-9), normalizedText])
            
            // Extract parameters if pattern includes capture groups
            const params = match.length > 1 ? match.slice(1) : undefined
            
            await command.action(params)
            
            console.log(`Executed voice command: ${command.description}`)
            return true
          } catch (error) {
            console.error('Error executing voice command:', error)
            if (voiceResponse && ttsSupported) {
              speak('Sorry, I couldnt do that right now')
            }
            return false
          }
        }
      }
    }
    
    return false
  }, [commands, voiceResponse, ttsSupported, speak])

  const startListening = useCallback(() => {
    if (!enabled) return
    reset()
    start()
  }, [enabled, reset, start])

  const stopListening = useCallback(() => {
    stop()
  }, [stop])

  const toggleListening = useCallback(() => {
    if (!enabled) return
    toggle()
  }, [enabled, toggle])

  // Auto-cleanup on unmount
  useEffect(() => {
    return () => {
      stop()
    }
  }, [stop])

  return {
    isListening,
    isSupported: isSupported && enabled,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    toggleListening,
    executeCommand,
    availableCommands: commands,
    lastCommand,
    confidence,
    speaking
  }
}