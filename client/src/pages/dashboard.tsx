import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RecipeCard } from "@/components/recipe-card"
import { Camera, Calendar, ShoppingCart, Sparkles, TrendingUp } from "lucide-react"
import healthyMealImage from '@assets/generated_images/Healthy_balanced_meal_plating_25acb6fe.png'
import pastaImage from '@assets/generated_images/Appetizing_pasta_dish_photo_6cb6d75b.png'
import ingredientsImage from '@assets/generated_images/Fresh_cooking_ingredients_display_7238e8ad.png'

// todo: remove mock functionality
const todayRecommendations = [
  {
    id: "1",
    title: "Grilled Chicken with Quinoa & Roasted Vegetables",
    image: healthyMealImage,
    cookTime: 45,
    servings: 4,
    difficulty: "Medium" as const,
    tags: ["Healthy", "High-protein", "Gluten-free"],
    matchScore: 95
  },
  {
    id: "2", 
    title: "Classic Pasta Marinara with Fresh Basil",
    image: pastaImage,
    cookTime: 25,
    servings: 2,
    difficulty: "Easy" as const,
    tags: ["Italian", "Vegetarian", "Quick"],
    matchScore: 88
  }
]

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Good morning, Sarah!</h1>
        <p className="text-muted-foreground">
          Ready to plan some delicious meals? Here's what we recommend for your family today.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover-elevate cursor-pointer" data-testid="card-quick-scan">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="bg-primary/10 p-3 rounded-lg">
              <Camera className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Scan Ingredients</h3>
              <p className="text-sm text-muted-foreground">AI identify what you have</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate cursor-pointer" data-testid="card-quick-plan">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="bg-primary/10 p-3 rounded-lg">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Plan This Week</h3>
              <p className="text-sm text-muted-foreground">Smart meal planning</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate cursor-pointer" data-testid="card-quick-shopping">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="bg-primary/10 p-3 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Shopping List</h3>
              <p className="text-sm text-muted-foreground">12 items ready</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">AI Recommendations for Today</h2>
          </div>
          <Button variant="outline" data-testid="button-refresh-recommendations">
            <TrendingUp className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {todayRecommendations.map((recipe) => (
            <div key={recipe.id} className="relative">
              <Badge 
                className="absolute -top-2 -right-2 z-10 bg-primary text-primary-foreground"
                data-testid={`badge-match-score-${recipe.id}`}
              >
                {recipe.matchScore}% match
              </Badge>
              <RecipeCard {...recipe} />
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            This Week's Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 text-center">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
              <div key={day} className="p-3 rounded-lg border">
                <p className="text-sm font-medium mb-2">{day}</p>
                {index < 2 ? (
                  <div className="space-y-1">
                    <div className="w-full h-2 bg-primary/20 rounded"></div>
                    <p className="text-xs text-muted-foreground">Planned</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="w-full h-2 bg-muted rounded"></div>
                    <p className="text-xs text-muted-foreground">Empty</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          <Button className="w-full mt-4" data-testid="button-plan-week">
            Plan Full Week with AI
          </Button>
        </CardContent>
      </Card>

      {/* Pantry Status */}
      <Card>
        <CardHeader>
          <CardTitle>Pantry Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <img 
              src={ingredientsImage} 
              alt="Fresh ingredients" 
              className="w-24 h-24 rounded-lg object-cover"
            />
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <div>
                  <p className="text-2xl font-semibold">24</p>
                  <p className="text-sm text-muted-foreground">Ingredients tracked</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold">8</p>
                  <p className="text-sm text-muted-foreground">Running low</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Last updated 2 hours ago via ingredient scanning
              </p>
              <Button variant="outline" data-testid="button-scan-more">
                <Camera className="h-4 w-4 mr-2" />
                Scan More Ingredients
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}