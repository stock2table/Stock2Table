import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Plus, Clock, Users } from "lucide-react"
import { useState } from "react"
import healthyMealImage from '@assets/generated_images/Healthy_balanced_meal_plating_25acb6fe.png'
import pastaImage from '@assets/generated_images/Appetizing_pasta_dish_photo_6cb6d75b.png'

interface MealPlan {
  id: string
  day: string
  date: string
  meals: {
    breakfast?: { name: string; image?: string; time: string }
    lunch?: { name: string; image?: string; time: string }
    dinner?: { name: string; image?: string; time: string }
  }
}

export function MealPlanner() {
  const [selectedDay, setSelectedDay] = useState<string>("Monday")
  
  // todo: remove mock functionality
  const [weekPlan, setWeekPlan] = useState<MealPlan[]>([
    {
      id: "monday",
      day: "Monday",
      date: "Dec 16",
      meals: {
        breakfast: { name: "Overnight Oats", time: "8:00 AM" },
        dinner: { name: "Grilled Chicken with Quinoa", image: healthyMealImage, time: "7:00 PM" }
      }
    },
    {
      id: "tuesday", 
      day: "Tuesday",
      date: "Dec 17",
      meals: {
        lunch: { name: "Caesar Salad", time: "12:30 PM" },
        dinner: { name: "Pasta Marinara", image: pastaImage, time: "6:30 PM" }
      }
    },
    {
      id: "wednesday",
      day: "Wednesday", 
      date: "Dec 18",
      meals: {}
    },
    {
      id: "thursday",
      day: "Thursday",
      date: "Dec 19", 
      meals: {}
    },
    {
      id: "friday",
      day: "Friday",
      date: "Dec 20",
      meals: {}
    }
  ])

  const handleAddMeal = (day: string, mealType: string) => {
    console.log(`Adding ${mealType} for ${day}`)
    // todo: remove mock functionality - open meal selection modal
  }

  const selectedDayPlan = weekPlan.find(plan => plan.day === selectedDay)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Weekly Meal Planner</h2>
          <p className="text-muted-foreground">Plan your family's meals for the week ahead</p>
        </div>
        <Button data-testid="button-generate-meal-plan">
          <Calendar className="h-4 w-4 mr-2" />
          AI Generate Week
        </Button>
      </div>

      {/* Week Overview */}
      <div className="grid grid-cols-5 gap-4">
        {weekPlan.map((day) => (
          <Card 
            key={day.id}
            className={`cursor-pointer transition-all ${
              selectedDay === day.day 
                ? 'ring-2 ring-primary bg-primary/5' 
                : 'hover-elevate'
            }`}
            onClick={() => setSelectedDay(day.day)}
            data-testid={`card-day-${day.day.toLowerCase()}`}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-center">
                {day.day}
              </CardTitle>
              <p className="text-xs text-muted-foreground text-center">{day.date}</p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1">
                {Object.entries(day.meals).length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    No meals planned
                  </p>
                ) : (
                  Object.entries(day.meals).map(([mealType, meal]) => (
                    <div key={mealType} className="text-xs">
                      <Badge variant="outline" className="text-xs mb-1">
                        {mealType}
                      </Badge>
                      <p className="truncate">{meal.name}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Day View */}
      {selectedDayPlan && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{selectedDayPlan.day} - {selectedDayPlan.date}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" data-testid="button-copy-previous-day">
                  Copy Previous Day
                </Button>
                <Button size="sm" data-testid="button-ai-suggest-meals">
                  AI Suggest Meals
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['breakfast', 'lunch', 'dinner'].map((mealType) => {
                const meal = selectedDayPlan.meals[mealType as keyof typeof selectedDayPlan.meals]
                return (
                  <Card key={mealType} className="border-dashed border-2 hover-elevate">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base capitalize flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {mealType}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {meal ? (
                        <div className="space-y-3">
                          {meal.image && (
                            <img 
                              src={meal.image} 
                              alt={meal.name}
                              className="w-full h-32 object-cover rounded-md"
                            />
                          )}
                          <div>
                            <h4 className="font-medium">{meal.name}</h4>
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3" />
                              {meal.time}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1"
                              data-testid={`button-edit-${mealType}`}
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              data-testid={`button-remove-${mealType}`}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Button
                            variant="ghost"
                            className="w-full h-full flex flex-col gap-2"
                            onClick={() => handleAddMeal(selectedDayPlan.day, mealType)}
                            data-testid={`button-add-${mealType}`}
                          >
                            <Plus className="h-8 w-8 text-muted-foreground" />
                            <span className="text-muted-foreground">Add {mealType}</span>
                          </Button>
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
    </div>
  )
}