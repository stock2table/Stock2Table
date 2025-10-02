import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Users, ChefHat, Plus, Heart, Star } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiRequest } from "@/lib/queryClient"
import { useToast } from "@/hooks/use-toast"

interface Recipe {
  id: string
  title: string
  description: string
  cookTime: number
  servings: number
  difficulty: 'Easy' | 'Medium' | 'Hard'
  cuisine?: string
  tags: string[]
  ingredients: string[]
  instructions: string[]
  availableIngredients?: number
  totalIngredients?: number
  matchPercentage?: number
  rating?: number
  isFavorite?: boolean
}

interface RecipeCardsProps {
  recipes: Recipe[]
  title?: string
  showAddToPlan?: boolean
  showFavorite?: boolean
  compact?: boolean
  maxItems?: number
}

export function RecipeCards({ 
  recipes, 
  title = "Recommended Recipes",
  showAddToPlan = true,
  showFavorite = true,
  compact = false,
  maxItems = 6
}: RecipeCardsProps) {
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const addToMealPlanMutation = useMutation({
    mutationFn: async (recipeId: string) => {
      return apiRequest('POST', '/api/meal-plans/add-recipe', {
        recipeId,
        date: new Date().toISOString()
      })
    },
    onSuccess: () => {
      toast({
        title: "Added to Meal Plan",
        description: "Recipe added to your weekly meal plan",
      })
      queryClient.invalidateQueries({ queryKey: ['/api/meal-plans'] })
    },
    onError: (error) => {
      toast({
        title: "Failed to Add",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      })
    }
  })

  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ recipeId, isFavorite }: { recipeId: string, isFavorite: boolean }) => {
      return apiRequest('POST', `/api/recipes/${recipeId}/favorite`, {
        isFavorite: !isFavorite
      })
    },
    onSuccess: (_, { isFavorite }) => {
      toast({
        title: isFavorite ? "Removed from Favorites" : "Added to Favorites",
        description: isFavorite ? "Recipe removed from your favorites" : "Recipe saved to your favorites",
      })
      queryClient.invalidateQueries({ queryKey: ['/api/recipes'] })
    }
  })

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'Hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleAddToPlan = (recipeId: string) => {
    addToMealPlanMutation.mutate(recipeId)
  }

  const handleToggleFavorite = (recipe: Recipe) => {
    toggleFavoriteMutation.mutate({
      recipeId: recipe.id,
      isFavorite: recipe.isFavorite || false
    })
  }

  const displayedRecipes = recipes.slice(0, maxItems)

  if (displayedRecipes.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <ChefHat className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No recipes found. Try adding more ingredients to your pantry!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        {recipes.length > maxItems && (
          <Button variant="outline" size="sm">
            View All ({recipes.length})
          </Button>
        )}
      </div>

      <div className={compact ? "space-y-3" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"}>
        {displayedRecipes.map((recipe) => (
          <Card key={recipe.id} className="hover-elevate transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-sm leading-tight">{recipe.title}</CardTitle>
                  {!compact && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {recipe.description}
                    </p>
                  )}
                </div>
                {showFavorite && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleFavorite(recipe)}
                    disabled={toggleFavoriteMutation.isPending}
                    data-testid={`button-favorite-${recipe.id}`}
                  >
                    <Heart 
                      className={`h-4 w-4 ${recipe.isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} 
                    />
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {recipe.cookTime}m
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {recipe.servings}
                </div>
                {recipe.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {recipe.rating.toFixed(1)}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={getDifficultyColor(recipe.difficulty)} variant="secondary">
                  {recipe.difficulty}
                </Badge>
                {recipe.cuisine && (
                  <Badge variant="outline" className="text-xs">
                    {recipe.cuisine}
                  </Badge>
                )}
                {recipe.matchPercentage && (
                  <Badge variant="default" className="text-xs">
                    {recipe.matchPercentage}% match
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {recipe.availableIngredients && recipe.totalIngredients && (
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span>You have {recipe.availableIngredients}/{recipe.totalIngredients} ingredients</span>
                    <span>{Math.round((recipe.availableIngredients / recipe.totalIngredients) * 100)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1">
                    <div 
                      className="bg-primary h-1 rounded-full" 
                      style={{ width: `${(recipe.availableIngredients / recipe.totalIngredients) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {!compact && recipe.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {recipe.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {recipe.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{recipe.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => setExpandedRecipe(expandedRecipe === recipe.id ? null : recipe.id)}
                  data-testid={`button-view-recipe-${recipe.id}`}
                >
                  {expandedRecipe === recipe.id ? "Hide Details" : "View Recipe"}
                </Button>
                {showAddToPlan && (
                  <Button 
                    size="sm"
                    onClick={() => handleAddToPlan(recipe.id)}
                    disabled={addToMealPlanMutation.isPending}
                    data-testid={`button-add-to-plan-${recipe.id}`}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                )}
              </div>

              {expandedRecipe === recipe.id && (
                <div className="mt-4 pt-4 border-t space-y-3">
                  <div>
                    <h4 className="font-medium text-sm mb-2">Ingredients</h4>
                    <ul className="text-xs space-y-1">
                      {recipe.ingredients.slice(0, 5).map((ingredient, index) => (
                        <li key={index} className="text-muted-foreground">• {ingredient}</li>
                      ))}
                      {recipe.ingredients.length > 5 && (
                        <li className="text-muted-foreground">• +{recipe.ingredients.length - 5} more...</li>
                      )}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm mb-2">Instructions</h4>
                    <ol className="text-xs space-y-1">
                      {recipe.instructions.slice(0, 3).map((step, index) => (
                        <li key={index} className="text-muted-foreground">
                          {index + 1}. {step}
                        </li>
                      ))}
                      {recipe.instructions.length > 3 && (
                        <li className="text-muted-foreground">
                          +{recipe.instructions.length - 3} more steps...
                        </li>
                      )}
                    </ol>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}