import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Clock, ChefHat, ShoppingCart, AlertTriangle, Sparkles, Calendar, X } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiRequest } from "@/lib/queryClient"
import { useToast } from "@/hooks/use-toast"

interface ProactiveSuggestion {
  id: string
  type: 'recipe' | 'meal_plan' | 'shopping' | 'expiry_warning' | 'cooking_tip'
  title: string
  description: string
  action?: string
  priority: 'low' | 'medium' | 'high'
  data?: any
  createdAt: Date
}

interface Recipe {
  id: string
  title: string
  description: string
  cookTime: number
  difficulty: string
  ingredients: string[]
  tags: string[]
}

interface PantryItem {
  id: string
  name: string
  quantity: string
  unit: string
  expiryDate?: string
}

export function ProactiveSuggestions() {
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set())
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Get user's pantry for context
  const { data: pantryItems = [] } = useQuery<PantryItem[]>({
    queryKey: ['/api/pantry']
  })

  // Get proactive suggestions from AI
  const { data: suggestions = [], isLoading } = useQuery<ProactiveSuggestion[]>({
    queryKey: ['/api/suggestions/proactive'],
    enabled: pantryItems.length > 0,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  })

  const dismissSuggestionMutation = useMutation({
    mutationFn: async (suggestionId: string) => {
      return apiRequest('POST', '/api/suggestions/dismiss', { suggestionId })
    },
    onSuccess: (_, suggestionId) => {
      setDismissedSuggestions(prev => new Set([...Array.from(prev), suggestionId]))
      queryClient.invalidateQueries({ queryKey: ['/api/suggestions/proactive'] })
    }
  })

  const actionMutation = useMutation({
    mutationFn: async (action: { type: string, data: any }) => {
      switch (action.type) {
        case 'generate_recipe':
          return apiRequest('POST', '/api/recipes/quick-generate', action.data)
        case 'create_meal_plan':
          return apiRequest('POST', '/api/meal-plans', action.data)
        case 'generate_shopping_list':
          return apiRequest('POST', '/api/shopping/generate', action.data)
        default:
          throw new Error('Unknown action type')
      }
    },
    onSuccess: (_, action) => {
      toast({
        title: "Action Completed",
        description: getSuccessMessage(action.type),
      })
      queryClient.invalidateQueries({ queryKey: ['/api/suggestions/proactive'] })
    },
    onError: (error) => {
      toast({
        title: "Action Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      })
    }
  })

  const handleDismiss = (suggestionId: string) => {
    dismissSuggestionMutation.mutate(suggestionId)
  }

  const handleAction = (suggestion: ProactiveSuggestion) => {
    const actionData = {
      type: getActionType(suggestion.type),
      data: suggestion.data
    }
    actionMutation.mutate(actionData)
  }

  const getActionType = (suggestionType: string): string => {
    switch (suggestionType) {
      case 'recipe': return 'generate_recipe'
      case 'meal_plan': return 'create_meal_plan'
      case 'shopping': return 'generate_shopping_list'
      default: return 'unknown'
    }
  }

  const getSuccessMessage = (actionType: string): string => {
    switch (actionType) {
      case 'generate_recipe': return 'Recipe generated! Check your recipes page.'
      case 'create_meal_plan': return 'Meal plan created! Check your planner.'
      case 'generate_shopping_list': return 'Shopping list updated!'
      default: return 'Action completed successfully!'
    }
  }

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'recipe': return ChefHat
      case 'meal_plan': return Calendar
      case 'shopping': return ShoppingCart
      case 'expiry_warning': return AlertTriangle
      case 'cooking_tip': return Sparkles
      default: return Sparkles
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'default'
    }
  }

  const activeSuggestions = suggestions.filter(s => !dismissedSuggestions.has(s.id))

  if (isLoading || activeSuggestions.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Smart Suggestions</h3>
      </div>

      <div className="space-y-3">
        {activeSuggestions.slice(0, 3).map((suggestion) => {
          const Icon = getSuggestionIcon(suggestion.type)
          
          return (
            <Card key={suggestion.id} className="border-l-4 border-l-primary">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm">{suggestion.title}</CardTitle>
                    <Badge variant={getPriorityColor(suggestion.priority) as any} className="text-xs">
                      {suggestion.priority}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismiss(suggestion.id)}
                    data-testid={`button-dismiss-suggestion-${suggestion.id}`}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {suggestion.description}
                </p>
                
                {suggestion.type === 'expiry_warning' && suggestion.data?.expiringItems && (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-3 w-3 text-orange-500" />
                      <span className="text-xs text-orange-600">Expiring Soon</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {suggestion.data.expiringItems.slice(0, 3).map((item: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {suggestion.type === 'recipe' && suggestion.data?.matchPercentage && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>Ingredient Match</span>
                      <span>{suggestion.data.matchPercentage}%</span>
                    </div>
                    <Progress value={suggestion.data.matchPercentage} className="h-1" />
                  </div>
                )}
                
                {suggestion.action && (
                  <Button
                    onClick={() => handleAction(suggestion)}
                    disabled={actionMutation.isPending}
                    className="w-full"
                    size="sm"
                    data-testid={`button-action-suggestion-${suggestion.id}`}
                  >
                    {actionMutation.isPending ? "Processing..." : suggestion.action}
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {activeSuggestions.length > 3 && (
        <Button variant="outline" className="w-full" size="sm">
          View All {activeSuggestions.length} Suggestions
        </Button>
      )}
    </div>
  )
}

// Hook for generating proactive suggestions based on pantry
export function useProactiveSuggestions() {
  const { data: pantryItems = [] } = useQuery<PantryItem[]>({
    queryKey: ['/api/pantry']
  })

  const generateSuggestionsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/suggestions/generate', {
        context: {
          pantryItems,
          currentTime: new Date().toISOString()
        }
      })
    }
  })

  return {
    generateSuggestions: generateSuggestionsMutation.mutate,
    isGenerating: generateSuggestionsMutation.isPending
  }
}