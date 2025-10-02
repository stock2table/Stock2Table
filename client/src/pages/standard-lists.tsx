import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChefHat, Home, Plus, Check, GraduationCap, UtensilsCrossed, Coffee, Soup, Globe, Leaf } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiRequest } from "@/lib/queryClient"

interface IngredientItem {
  name: string
  category: string
  essential: boolean
}

interface StandardList {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  ingredients: IngredientItem[]
}

const standardLists: StandardList[] = [
  {
    id: "dorm-basics",
    title: "Dorm Move-in Essentials",
    description: "Basic ingredients for students starting college dorm cooking",
    icon: GraduationCap,
    ingredients: [
      { name: "Pasta", category: "Grains", essential: true },
      { name: "Rice", category: "Grains", essential: true },
      { name: "Instant noodles", category: "Grains", essential: true },
      { name: "Canned tomatoes", category: "Pantry", essential: true },
      { name: "Olive oil", category: "Pantry", essential: true },
      { name: "Salt", category: "Pantry", essential: true },
      { name: "Black pepper", category: "Pantry", essential: true },
      { name: "Garlic powder", category: "Pantry", essential: true },
      { name: "Onion powder", category: "Pantry", essential: true },
      { name: "Eggs", category: "Dairy", essential: true },
      { name: "Milk", category: "Dairy", essential: true },
      { name: "Cheese", category: "Dairy", essential: true },
      { name: "Bread", category: "Grains", essential: true },
      { name: "Peanut butter", category: "Pantry", essential: true },
      { name: "Canned beans", category: "Pantry", essential: false },
      { name: "Frozen vegetables", category: "Vegetables", essential: false },
      { name: "Hot sauce", category: "Pantry", essential: false },
      { name: "Soy sauce", category: "Pantry", essential: false }
    ]
  },
  {
    id: "italian-basics",
    title: "Italian Cuisine Essentials",
    description: "Core ingredients for authentic Italian cooking",
    icon: UtensilsCrossed,
    ingredients: [
      { name: "Extra virgin olive oil", category: "Pantry", essential: true },
      { name: "Garlic", category: "Aromatics", essential: true },
      { name: "Fresh basil", category: "Herbs", essential: true },
      { name: "Parmesan cheese", category: "Dairy", essential: true },
      { name: "San Marzano tomatoes", category: "Pantry", essential: true },
      { name: "Pasta varieties", category: "Grains", essential: true },
      { name: "Arborio rice", category: "Grains", essential: true },
      { name: "Balsamic vinegar", category: "Pantry", essential: true },
      { name: "Mozzarella cheese", category: "Dairy", essential: true },
      { name: "Prosciutto", category: "Meat", essential: false },
      { name: "Pine nuts", category: "Nuts", essential: false },
      { name: "Fresh oregano", category: "Herbs", essential: false },
      { name: "Capers", category: "Pantry", essential: false },
      { name: "Pancetta", category: "Meat", essential: false },
      { name: "White wine", category: "Pantry", essential: false },
      { name: "Pecorino Romano", category: "Dairy", essential: false }
    ]
  },
  {
    id: "indian-basics",
    title: "Indian Cuisine Essentials",
    description: "Fundamental spices and ingredients for Indian cooking",
    icon: Coffee,
    ingredients: [
      { name: "Basmati rice", category: "Grains", essential: true },
      { name: "Turmeric powder", category: "Spices", essential: true },
      { name: "Cumin seeds", category: "Spices", essential: true },
      { name: "Coriander seeds", category: "Spices", essential: true },
      { name: "Garam masala", category: "Spices", essential: true },
      { name: "Red chili powder", category: "Spices", essential: true },
      { name: "Ginger", category: "Aromatics", essential: true },
      { name: "Garlic", category: "Aromatics", essential: true },
      { name: "Onions", category: "Vegetables", essential: true },
      { name: "Tomatoes", category: "Vegetables", essential: true },
      { name: "Coconut oil", category: "Pantry", essential: true },
      { name: "Ghee", category: "Dairy", essential: true },
      { name: "Lentils (dal)", category: "Legumes", essential: true },
      { name: "Mustard seeds", category: "Spices", essential: false },
      { name: "Curry leaves", category: "Herbs", essential: false },
      { name: "Asafoetida", category: "Spices", essential: false },
      { name: "Cardamom", category: "Spices", essential: false },
      { name: "Cinnamon", category: "Spices", essential: false },
      { name: "Bay leaves", category: "Herbs", essential: false },
      { name: "Fenugreek seeds", category: "Spices", essential: false }
    ]
  },
  {
    id: "mexican-basics",
    title: "Mexican Cuisine Essentials",
    description: "Key ingredients for authentic Mexican dishes",
    icon: Soup,
    ingredients: [
      { name: "Corn tortillas", category: "Grains", essential: true },
      { name: "Black beans", category: "Legumes", essential: true },
      { name: "Cumin", category: "Spices", essential: true },
      { name: "Chili powder", category: "Spices", essential: true },
      { name: "Paprika", category: "Spices", essential: true },
      { name: "Lime", category: "Citrus", essential: true },
      { name: "Cilantro", category: "Herbs", essential: true },
      { name: "Onions", category: "Vegetables", essential: true },
      { name: "Tomatoes", category: "Vegetables", essential: true },
      { name: "Jalapeños", category: "Vegetables", essential: true },
      { name: "Avocados", category: "Vegetables", essential: true },
      { name: "Mexican cheese", category: "Dairy", essential: true },
      { name: "Chipotle peppers", category: "Spices", essential: false },
      { name: "Oregano", category: "Herbs", essential: false },
      { name: "Garlic", category: "Aromatics", essential: false },
      { name: "Rice", category: "Grains", essential: false }
    ]
  },
  {
    id: "asian-basics",
    title: "Asian Cuisine Essentials",
    description: "Versatile ingredients for various Asian cooking styles",
    icon: Globe,
    ingredients: [
      { name: "Soy sauce", category: "Pantry", essential: true },
      { name: "Sesame oil", category: "Pantry", essential: true },
      { name: "Rice vinegar", category: "Pantry", essential: true },
      { name: "Ginger", category: "Aromatics", essential: true },
      { name: "Garlic", category: "Aromatics", essential: true },
      { name: "Scallions", category: "Vegetables", essential: true },
      { name: "Rice", category: "Grains", essential: true },
      { name: "Noodles", category: "Grains", essential: true },
      { name: "Miso paste", category: "Pantry", essential: false },
      { name: "Fish sauce", category: "Pantry", essential: false },
      { name: "Chili garlic sauce", category: "Pantry", essential: false },
      { name: "Coconut milk", category: "Pantry", essential: false },
      { name: "Lemongrass", category: "Herbs", essential: false },
      { name: "Star anise", category: "Spices", essential: false }
    ]
  },
  {
    id: "mediterranean-basics",
    title: "Mediterranean Essentials",
    description: "Fresh and healthy Mediterranean cooking staples",
    icon: Leaf,
    ingredients: [
      { name: "Extra virgin olive oil", category: "Pantry", essential: true },
      { name: "Lemons", category: "Citrus", essential: true },
      { name: "Fresh herbs", category: "Herbs", essential: true },
      { name: "Tomatoes", category: "Vegetables", essential: true },
      { name: "Olives", category: "Pantry", essential: true },
      { name: "Feta cheese", category: "Dairy", essential: true },
      { name: "Chickpeas", category: "Legumes", essential: true },
      { name: "Bulgur wheat", category: "Grains", essential: true },
      { name: "Tahini", category: "Pantry", essential: false },
      { name: "Pomegranate molasses", category: "Pantry", essential: false },
      { name: "Za'atar", category: "Spices", essential: false },
      { name: "Sumac", category: "Spices", essential: false }
    ]
  }
]

export default function StandardListsPage() {
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(new Set())
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const addToPantryMutation = useMutation({
    mutationFn: async (ingredients: string[]) => {
      const ingredientData = ingredients.map(name => ({
        name,
        quantity: "1",
        unit: "piece"
      }))

      return apiRequest('POST', '/api/pantry/add', {
        ingredients: ingredientData
      })
    },
    onSuccess: (data) => {
      toast({
        title: "Added to Pantry",
        description: `${selectedIngredients.size} ingredients added to your pantry`,
      })
      queryClient.invalidateQueries({ queryKey: ['/api/pantry'] })
      setSelectedIngredients(new Set())
    },
    onError: (error) => {
      toast({
        title: "Failed to Add",
        description: error instanceof Error ? error.message : "Failed to add ingredients to pantry",
        variant: "destructive"
      })
    }
  })

  const handleIngredientToggle = (ingredient: string) => {
    const newSelected = new Set(selectedIngredients)
    if (newSelected.has(ingredient)) {
      newSelected.delete(ingredient)
    } else {
      newSelected.add(ingredient)
    }
    setSelectedIngredients(newSelected)
  }

  const handleAddToPantry = () => {
    if (selectedIngredients.size > 0) {
      addToPantryMutation.mutate(Array.from(selectedIngredients))
    }
  }

  const renderIngredientList = (list: StandardList) => (
    <Card key={list.id}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <list.icon className="h-6 w-6 text-primary" />
          {list.title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{list.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Essential Ingredients</h4>
          <div className="space-y-2">
            {list.ingredients.filter(ing => ing.essential).map((ingredient) => (
              <div
                key={ingredient.name}
                className="flex items-center justify-between p-2 border rounded-md hover-elevate cursor-pointer"
                onClick={() => handleIngredientToggle(ingredient.name)}
                data-testid={`ingredient-${ingredient.name.toLowerCase().replace(/\s+/g, '-')}-${list.id}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selectedIngredients.has(ingredient.name) 
                      ? 'bg-primary border-primary' 
                      : 'border-muted-foreground'
                  }`}>
                    {selectedIngredients.has(ingredient.name) && (
                      <Check className="h-3 w-3 text-primary-foreground" />
                    )}
                  </div>
                  <span className="font-medium">{ingredient.name}</span>
                </div>
                <Badge variant="secondary">{ingredient.category}</Badge>
              </div>
            ))}
          </div>
        </div>

        {list.ingredients.filter(ing => !ing.essential).length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Optional Ingredients</h4>
            <div className="space-y-2">
              {list.ingredients.filter(ing => !ing.essential).map((ingredient) => (
                <div
                  key={ingredient.name}
                  className="flex items-center justify-between p-2 border rounded-md hover-elevate cursor-pointer opacity-80"
                  onClick={() => handleIngredientToggle(ingredient.name)}
                  data-testid={`ingredient-${ingredient.name.toLowerCase().replace(/\s+/g, '-')}-${list.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selectedIngredients.has(ingredient.name) 
                        ? 'bg-primary border-primary' 
                        : 'border-muted-foreground'
                    }`}>
                      {selectedIngredients.has(ingredient.name) && (
                        <Check className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                    <span>{ingredient.name}</span>
                  </div>
                  <Badge variant="outline">{ingredient.category}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <ChefHat className="h-8 w-8 text-primary" />
          Standard Ingredient Lists
        </h1>
        <p className="text-muted-foreground">
          Curated ingredient collections for different cuisines and cooking scenarios
        </p>
      </div>

      {selectedIngredients.size > 0 && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{selectedIngredients.size} ingredients selected</p>
                <p className="text-sm text-muted-foreground">Add them to your pantry to get personalized recipes</p>
              </div>
              <Button 
                onClick={handleAddToPantry} 
                disabled={addToPantryMutation.isPending}
                data-testid="button-add-selected-to-pantry"
              >
                <Plus className="h-4 w-4 mr-2" />
                {addToPantryMutation.isPending ? "Adding..." : "Add to Pantry"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="lifestyle" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="lifestyle">Lifestyle</TabsTrigger>
          <TabsTrigger value="cuisine">By Cuisine</TabsTrigger>
        </TabsList>
        
        <TabsContent value="lifestyle" className="space-y-6">
          {renderIngredientList(standardLists.find(list => list.id === "dorm-basics")!)}
        </TabsContent>
        
        <TabsContent value="cuisine" className="space-y-6">
          {standardLists.filter(list => list.id !== "dorm-basics").map(renderIngredientList)}
        </TabsContent>
      </Tabs>
    </div>
  )
}