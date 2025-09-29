import { useState, useEffect, useCallback } from 'react'

interface UseSpeechSynthesisOptions {
  rate?: number
  pitch?: number
  volume?: number
  voice?: SpeechSynthesisVoice | null
  lang?: string
}

interface SpeechSynthesisHook {
  speak: (text: string) => void
  speaking: boolean
  supported: boolean
  voices: SpeechSynthesisVoice[]
  cancel: () => void
  pause: () => void
  resume: () => void
}

export function useSpeechSynthesis(options: UseSpeechSynthesisOptions = {}): SpeechSynthesisHook {
  const {
    rate = 1,
    pitch = 1,
    volume = 1,
    voice = null,
    lang = 'en-US'
  } = options

  const [speaking, setSpeaking] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

  // Load available voices
  useEffect(() => {
    if (!supported) return

    const updateVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices()
      setVoices(availableVoices)
    }

    // Initial load
    updateVoices()

    // Some browsers load voices asynchronously
    window.speechSynthesis.onvoiceschanged = updateVoices

    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [supported])

  const speak = useCallback((text: string) => {
    if (!supported || !text) return

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    
    // Set voice options
    utterance.rate = rate
    utterance.pitch = pitch
    utterance.volume = volume
    utterance.lang = lang

    // Use specific voice if provided, otherwise find best match
    if (voice) {
      utterance.voice = voice
    } else {
      // Find a suitable voice for the language
      const suitableVoice = voices.find(v => v.lang.startsWith(lang.split('-')[0]))
      if (suitableVoice) {
        utterance.voice = suitableVoice
      }
    }

    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = (error) => {
      console.error('Speech synthesis error:', error)
      setSpeaking(false)
    }

    window.speechSynthesis.speak(utterance)
  }, [supported, rate, pitch, volume, lang, voice, voices])

  const cancel = useCallback(() => {
    if (!supported) return
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [supported])

  const pause = useCallback(() => {
    if (!supported) return
    window.speechSynthesis.pause()
  }, [supported])

  const resume = useCallback(() => {
    if (!supported) return
    window.speechSynthesis.resume()
  }, [supported])

  return {
    speak,
    speaking,
    supported,
    voices,
    cancel,
    pause,
    resume
  }
}