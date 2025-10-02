import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Plus, Clock, Loader2 } from "lucide-react"
import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { apiRequest } from "@/lib/queryClient"
import { useToast } from "@/hooks/use-toast"

interface MealSuggestion {
  title: string
  description: string
  cookTime: number
  ingredients: string[]
  instructions?: string[]
  tags?: string[]
}

interface DailyMealPlan {
  day: string
  date: string
  meals: {
    breakfast?: MealSuggestion
    lunch?: MealSuggestion
    dinner?: MealSuggestion
  }
}

interface WeeklyMealPlan {
  days: DailyMealPlan[]
  shoppingList: {
    ingredients: string[]
    categories: Record<string, string[]>
  }
  nutritionSummary?: {
    averageCalories: number
    proteinBalance: string
    varietyScore: number
  }
}

export function MealPlanner() {
  const [selectedDay, setSelectedDay] = useState<string>("Monday")
  const [weekPlan, setWeekPlan] = useState<DailyMealPlan[]>([])
  const [shoppingList, setShoppingList] = useState<WeeklyMealPlan['shoppingList'] | null>(null)
  const [nutritionSummary, setNutritionSummary] = useState<WeeklyMealPlan['nutritionSummary'] | null>(null)
  const { toast } = useToast()

  const generateMealPlanMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/meal-plans/generate', {
        userId: 'default-user-id'
      })
      return await response.json() as WeeklyMealPlan
    },
    onSuccess: (data) => {
      if (!data || !data.days || !Array.isArray(data.days)) {
        toast({
          title: "Invalid Response",
          description: "Received invalid data from server. Please try again.",
          variant: "destructive"
        })
        return
      }
      
      setWeekPlan(data.days)
      setShoppingList(data.shoppingList || null)
      setNutritionSummary(data.nutritionSummary || null)
      
      if (data.days.length > 0) {
        setSelectedDay(data.days[0].day)
      }
      
      toast({
        title: "Meal Plan Generated!",
        description: `Created a balanced ${data.days.length}-day meal plan with shopping list`,
      })
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate meal plan",
        variant: "destructive"
      })
    }
  })

  const handleGenerateWeek = () => {
    generateMealPlanMutation.mutate()
  }

  const selectedDayPlan = weekPlan?.find(plan => plan.day === selectedDay)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Weekly Meal Planner</h2>
          <p className="text-muted-foreground">Plan your family's meals for the week ahead</p>
        </div>
        <Button 
          onClick={handleGenerateWeek}
          disabled={generateMealPlanMutation.isPending}
          data-testid="button-generate-meal-plan"
        >
          {generateMealPlanMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Calendar className="h-4 w-4 mr-2" />
              AI Generate Week
            </>
          )}
        </Button>
      </div>

      {weekPlan.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Meal Plan Yet</h3>
            <p className="text-muted-foreground mb-4">
              Generate an AI-powered weekly meal plan based on your family's preferences
            </p>
            <Button onClick={handleGenerateWeek} data-testid="button-generate-first-plan">
              <Calendar className="h-4 w-4 mr-2" />
              Generate Your First Week
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Week Overview */}
          <div className="grid grid-cols-7 gap-2 md:gap-4">
            {weekPlan.map((day) => {
              const mealCount = Object.keys(day.meals).length
              return (
                <Card 
                  key={day.day}
                  className={`cursor-pointer transition-all ${
                    selectedDay === day.day 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'hover-elevate'
                  }`}
                  onClick={() => setSelectedDay(day.day)}
                  data-testid={`card-day-${day.day.toLowerCase()}`}
                >
                  <CardHeader className="pb-2 p-3">
                    <CardTitle className="text-xs md:text-sm font-medium text-center">
                      {day.day.substring(0, 3)}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground text-center">{day.date}</p>
                  </CardHeader>
                  <CardContent className="pt-0 p-2">
                    <div className="space-y-1">
                      {mealCount === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-1">
                          No meals
                        </p>
                      ) : (
                        <p className="text-xs text-center font-medium">
                          {mealCount} {mealCount === 1 ? 'meal' : 'meals'}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Detailed Day View */}
          {selectedDayPlan && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between flex-wrap gap-2">
                  <span>{selectedDayPlan.day} - {selectedDayPlan.date}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {(['breakfast', 'lunch', 'dinner'] as const).map((mealType) => {
                    const meal = selectedDayPlan.meals[mealType]
                    return (
                      <Card key={mealType} className="border-dashed border-2">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base capitalize flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {mealType}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {meal ? (
                            <div className="space-y-3">
                              <div>
                                <h4 className="font-medium">{meal.title}</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {meal.description}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="secondary" className="text-xs">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {meal.cookTime} min
                                  </Badge>
                                  {meal.tags?.slice(0, 2).map(tag => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <div className="space-y-2">
                                <p className="text-xs font-medium text-muted-foreground">
                                  Ingredients ({meal.ingredients.length})
                                </p>
                                <div className="text-xs text-muted-foreground max-h-20 overflow-y-auto">
                                  {meal.ingredients.slice(0, 5).map((ingredient, idx) => (
                                    <div key={idx}>• {ingredient}</div>
                                  ))}
                                  {meal.ingredients.length > 5 && (
                                    <div className="text-xs italic">
                                      +{meal.ingredients.length - 5} more
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <Plus className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                              <span className="text-sm text-muted-foreground">No {mealType} planned</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Shopping List Preview */}
          {shoppingList && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Weekly Shopping List</span>
                  <Badge variant="secondary">
                    {shoppingList.ingredients.length} items
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {nutritionSummary && (
                    <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-md">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Avg Calories</p>
                        <p className="text-lg font-semibold">{nutritionSummary.averageCalories}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Variety Score</p>
                        <p className="text-lg font-semibold">{nutritionSummary.varietyScore}/10</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Balance</p>
                        <p className="text-sm font-medium">{nutritionSummary.proteinBalance}</p>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(shoppingList.categories).map(([category, items]) => (
                      <div key={category} className="space-y-2">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          {category}
                          <Badge variant="outline" className="text-xs">
                            {items.length}
                          </Badge>
                        </h4>
                        <ul className="text-sm text-muted-foreground space-y-1 pl-4">
                          {items.map((item, idx) => (
                            <li key={idx} className="list-disc">{item}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
