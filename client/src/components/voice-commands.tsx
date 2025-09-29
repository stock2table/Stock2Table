import { useState, useCallback, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mic, MicOff, Volume2, VolumeX, Command, Clock, Navigation, ChefHat } from "lucide-react"
import { useVoice } from "@/contexts/voice-context"
import { useLocation } from "wouter"
import { useToast } from "@/hooks/use-toast"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiRequest } from "@/lib/queryClient"

interface VoiceCommandsProps {
  onChatMessage?: (message: string) => void
  className?: string
}

export function VoiceCommands({ onChatMessage, className }: VoiceCommandsProps) {
  const [, setLocation] = useLocation()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [showCommands, setShowCommands] = useState(false)

  // Timer state for cooking timers
  const [activeTimers, setActiveTimers] = useState<Map<string, NodeJS.Timeout>>(new Map())

  // Recipe search mutation
  const searchRecipesMutation = useMutation({
    mutationFn: async (query: string) => {
      return apiRequest('POST', '/api/recipes/search', { query, userId: 'default-user-id' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recipes'] })
    }
  })

  // Define cooking-specific voice commands
  const voiceCommands = [
    // Navigation commands
    {
      patterns: [
        'go to dashboard',
        'show dashboard',
        'home',
        'go home'
      ],
      action: () => setLocation('/'),
      description: 'Navigate to dashboard',
      category: 'navigation' as const
    },
    {
      patterns: [
        'scan ingredients',
        'go to scanner',
        'open scanner',
        'scan food'
      ],
      action: () => setLocation('/scanner'),
      description: 'Open ingredient scanner',
      category: 'navigation' as const
    },
    {
      patterns: [
        'meal plan',
        'planning',
        'go to planner',
        'plan meals'
      ],
      action: () => setLocation('/planner'),
      description: 'Open meal planner',
      category: 'navigation' as const
    },
    {
      patterns: [
        'shopping list',
        'grocery list',
        'go to shopping'
      ],
      action: () => setLocation('/shopping'),
      description: 'Open shopping list',
      category: 'navigation' as const
    },

    // Recipe commands
    {
      patterns: [
        'find recipe for (.+)',
        'search for (.+) recipe',
        'look up (.+)',
        'I want to cook (.+)'
      ],
      action: async (params: string[]) => {
        if (params && params[0]) {
          const ingredient = params[0]
          await searchRecipesMutation.mutateAsync(ingredient)
          toast({
            title: "Recipe Search",
            description: `Searching recipes for ${ingredient}...`
          })
        }
      },
      description: 'Search for recipes',
      category: 'recipe' as const
    },
    {
      patterns: [
        'generate shopping list',
        'create shopping list',
        'make shopping list'
      ],
      action: async () => {
        try {
          await apiRequest('POST', '/api/shopping/generate', { 
            userId: 'default-user-id',
            mealPlanId: 'current'
          })
          toast({
            title: "Shopping List",
            description: "Shopping list generated from your meal plan"
          })
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to generate shopping list",
            variant: "destructive"
          })
        }
      },
      description: 'Generate shopping list from meal plan',
      category: 'recipe' as const
    },

    // Timer commands
    {
      patterns: [
        'set timer for (\\d+) minutes?',
        'timer (\\d+) minutes?',
        'remind me in (\\d+) minutes?'
      ],
      action: (params: string[]) => {
        if (params && params[0]) {
          const minutes = parseInt(params[0])
          const timerId = `timer-${Date.now()}`
          
          const timeout = setTimeout(() => {
            toast({
              title: "Timer Complete! 🍳",
              description: `Your ${minutes} minute timer is done`,
            })
            setActiveTimers(prev => {
              const newTimers = new Map(prev)
              newTimers.delete(timerId)
              return newTimers
            })
          }, minutes * 60 * 1000)
          
          setActiveTimers(prev => new Map(prev).set(timerId, timeout))
          
          toast({
            title: "Timer Set ⏰",
            description: `Timer set for ${minutes} minute${minutes !== 1 ? 's' : ''}`
          })
        }
      },
      description: 'Set cooking timer',
      category: 'timer' as const
    },
    {
      patterns: [
        'cancel timer',
        'stop timer',
        'clear timer'
      ],
      action: () => {
        activeTimers.forEach(timer => clearTimeout(timer))
        setActiveTimers(new Map())
        toast({
          title: "Timers Cleared",
          description: "All active timers cancelled"
        })
      },
      description: 'Cancel all timers',
      category: 'timer' as const
    },

    // Chat commands
    {
      patterns: [
        'ask (.+)',
        'chat (.+)',
        'tell me about (.+)',
        'what is (.+)',
        'how do I (.+)'
      ],
      action: (params: string[]) => {
        if (params && params[0] && onChatMessage) {
          onChatMessage(params[0])
          toast({
            title: "Chat Message",
            description: "Sent message to AI assistant"
          })
        }
      },
      description: 'Send message to AI chat',
      category: 'general' as const
    },

    // General commands
    {
      patterns: [
        'help',
        'what can you do',
        'show commands',
        'voice commands'
      ],
      action: () => {
        setShowCommands(true)
        toast({
          title: "Voice Commands",
          description: "Showing available voice commands"
        })
      },
      description: 'Show available commands',
      category: 'general' as const
    }
  ]

  // Use centralized voice context to prevent multiple recognition instances
  const {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    confidence,
    startListening,
    stopListening,
    toggleListening,
    speaking,
    setOnVoiceMessage
  } = useVoice()

  const [lastCommand, setLastCommand] = useState<string>('')

  // Process voice commands from centralized context
  const processVoiceCommand = useCallback((message: string) => {
    if (!message || !message.trim()) return

    // Try to match against voice commands
    for (const command of voiceCommands) {
      for (const pattern of command.patterns) {
        const regex = new RegExp(`^${pattern}$`, 'i')
        const match = message.match(regex)
        
        if (match) {
          setLastCommand(message)
          const params = match.slice(1) // Extract captured groups
          command.action(params)
          return // Command found and executed
        }
      }
    }
    
    // If no command matched, send to chat
    if (onChatMessage) {
      onChatMessage(message)
    }
  }, [voiceCommands, onChatMessage])

  // Register command processor with voice context
  useEffect(() => {
    setOnVoiceMessage(processVoiceCommand)
  }, [setOnVoiceMessage, processVoiceCommand])

  const getCommandsByCategory = useCallback(() => {
    const categories = {
      navigation: voiceCommands.filter(cmd => cmd.category === 'navigation'),
      recipe: voiceCommands.filter(cmd => cmd.category === 'recipe'),
      timer: voiceCommands.filter(cmd => cmd.category === 'timer'),
      general: voiceCommands.filter(cmd => cmd.category === 'general')
    }
    return categories
  }, [voiceCommands])

  if (!isSupported) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground">
            <MicOff className="h-8 w-8 mx-auto mb-2" />
            <p>Voice commands not supported in this browser</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={className}>
      {/* Voice Control Interface */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Command className="h-5 w-5" />
            Voice Assistant
            {speaking && <Volume2 className="h-4 w-4 text-primary animate-pulse" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main voice control button */}
          <div className="flex items-center gap-3">
            <Button
              onClick={toggleListening}
              variant={isListening ? "default" : "outline"}
              className={`flex-1 ${isListening ? 'bg-red-500 hover:bg-red-600' : ''}`}
              data-testid="button-voice-toggle"
            >
              {isListening ? (
                <>
                  <MicOff className="h-4 w-4 mr-2" />
                  Stop Listening
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-2" />
                  Start Voice Commands
                </>
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCommands(!showCommands)}
              data-testid="button-show-commands"
            >
              <Command className="h-4 w-4" />
            </Button>
          </div>

          {/* Live transcript */}
          {(isListening || transcript || interimTranscript) && (
            <div className="space-y-2">
              {isListening && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  Listening...
                </div>
              )}
              
              {(transcript || interimTranscript) && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm">
                    <span className="font-medium">{transcript}</span>
                    {interimTranscript && (
                      <span className="text-muted-foreground italic"> {interimTranscript}</span>
                    )}
                  </div>
                  {confidence > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Confidence: {Math.round(confidence * 100)}%
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Last command executed */}
          {lastCommand && (
            <div className="text-xs text-muted-foreground">
              Last command: "{lastCommand}"
            </div>
          )}

          {/* Active timers */}
          {activeTimers.size > 0 && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <Badge variant="outline" className="text-xs">
                {activeTimers.size} timer{activeTimers.size !== 1 ? 's' : ''} active
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Commands help panel */}
      {showCommands && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Available Voice Commands</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(getCommandsByCategory()).map(([category, commands]) => (
              <div key={category}>
                <div className="flex items-center gap-2 mb-2">
                  {category === 'navigation' && <Navigation className="h-4 w-4" />}
                  {category === 'recipe' && <ChefHat className="h-4 w-4" />}
                  {category === 'timer' && <Clock className="h-4 w-4" />}
                  {category === 'general' && <Command className="h-4 w-4" />}
                  <h4 className="font-medium capitalize">{category}</h4>
                </div>
                <div className="space-y-1 ml-6">
                  {commands.map((command, index) => (
                    <div key={index} className="text-sm">
                      <div className="font-medium">{command.description}</div>
                      <div className="text-muted-foreground text-xs">
                        Say: "{command.patterns[0].replace(/[()\\+?.*]/g, '').replace(/\\d/g, '[number]')}"
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}