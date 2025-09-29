import { useState, useEffect, useRef, useCallback } from 'react'

interface SpeechRecognitionResult {
  transcript: string
  confidence: number
  isFinal: boolean
}

interface UseSpeechRecognitionOptions {
  continuous?: boolean
  interimResults?: boolean
  language?: string
  onResult?: (result: SpeechRecognitionResult) => void
  onError?: (error: string) => void
  onStart?: () => void
  onEnd?: () => void
}

interface SpeechRecognitionHook {
  isListening: boolean
  transcript: string
  interimTranscript: string
  isSupported: boolean
  confidence: number
  start: () => void
  stop: () => void
  toggle: () => void
  reset: () => void
}

// Extend window interface for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}): SpeechRecognitionHook {
  const {
    continuous = true,
    interimResults = true,
    language = 'en-US',
    onResult,
    onError,
    onStart,
    onEnd
  } = options

  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [confidence, setConfidence] = useState(0)
  const recognitionRef = useRef<any>(null)

  // Check if speech recognition is supported
  const isSupported = typeof window !== 'undefined' && 
    (window.SpeechRecognition || window.webkitSpeechRecognition)

  const initializeRecognition = useCallback(() => {
    if (!isSupported) return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    recognitionRef.current = new SpeechRecognition()

    recognitionRef.current.continuous = continuous
    recognitionRef.current.interimResults = interimResults
    recognitionRef.current.lang = language

    recognitionRef.current.onstart = () => {
      setIsListening(true)
      onStart?.()
    }

    recognitionRef.current.onend = () => {
      setIsListening(false)
      onEnd?.()
    }

    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
      onError?.(event.error)
    }

    recognitionRef.current.onresult = (event: any) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcript = result[0].transcript

        if (result.isFinal) {
          finalTranscript += transcript
          setConfidence(result[0].confidence)
        } else {
          interimTranscript += transcript
        }
      }

      if (finalTranscript) {
        setTranscript(prev => prev + finalTranscript)
        
        onResult?.({
          transcript: finalTranscript,
          confidence: event.results[event.results.length - 1][0].confidence,
          isFinal: true
        })
      }

      setInterimTranscript(interimTranscript)

      if (interimTranscript && onResult) {
        onResult({
          transcript: interimTranscript,
          confidence: 0,
          isFinal: false
        })
      }
    }
  }, [continuous, interimResults, language, onResult, onError, onStart, onEnd, isSupported])

  useEffect(() => {
    if (isSupported) {
      initializeRecognition()
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [initializeRecognition, isSupported])

  const start = useCallback(() => {
    if (!isSupported || !recognitionRef.current || isListening) return

    try {
      recognitionRef.current.start()
    } catch (error) {
      console.error('Failed to start speech recognition:', error)
    }
  }, [isSupported, isListening])

  const stop = useCallback(() => {
    if (!recognitionRef.current || !isListening) return

    try {
      recognitionRef.current.stop()
    } catch (error) {
      console.error('Failed to stop speech recognition:', error)
    }
  }, [isListening])

  const toggle = useCallback(() => {
    if (isListening) {
      stop()
    } else {
      start()
    }
  }, [isListening, start, stop])

  const reset = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
    setConfidence(0)
  }, [])

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    confidence,
    start,
    stop,
    toggle,
    reset
  }
}