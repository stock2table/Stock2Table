import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { ShoppingCart, Plus, Trash2, Share, Download } from "lucide-react"
import { useState } from "react"

interface ShoppingItem {
  id: string
  name: string
  category: string
  quantity: string
  isChecked: boolean
  addedFrom?: string // recipe name if added from a recipe
}

export function ShoppingList() {
  const [newItem, setNewItem] = useState("")
  
  // todo: remove mock functionality
  const [items, setItems] = useState<ShoppingItem[]>([
    { id: "1", name: "Chicken breast", category: "Meat", quantity: "2 lbs", isChecked: false, addedFrom: "Grilled Chicken with Quinoa" },
    { id: "2", name: "Quinoa", category: "Grains", quantity: "1 cup", isChecked: false, addedFrom: "Grilled Chicken with Quinoa" },
    { id: "3", name: "Bell peppers", category: "Vegetables", quantity: "3 pieces", isChecked: true },
    { id: "4", name: "Broccoli", category: "Vegetables", quantity: "1 head", isChecked: false, addedFrom: "Grilled Chicken with Quinoa" },
    { id: "5", name: "Pasta", category: "Grains", quantity: "1 box", isChecked: false, addedFrom: "Pasta Marinara" },
    { id: "6", name: "Tomato sauce", category: "Pantry", quantity: "1 jar", isChecked: false, addedFrom: "Pasta Marinara" },
    { id: "7", name: "Fresh basil", category: "Herbs", quantity: "1 bunch", isChecked: false, addedFrom: "Pasta Marinara" },
    { id: "8", name: "Milk", category: "Dairy", quantity: "1 gallon", isChecked: false }
  ])

  const handleItemCheck = (id: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, isChecked: !item.isChecked } : item
    ))
    console.log(`Item ${id} toggled`)
  }

  const handleAddItem = () => {
    if (newItem.trim()) {
      const newShoppingItem: ShoppingItem = {
        id: Date.now().toString(),
        name: newItem.trim(),
        category: "Other",
        quantity: "1",
        isChecked: false
      }
      setItems([...items, newShoppingItem])
      setNewItem("")
      console.log("Added new item:", newItem)
    }
  }

  const handleDeleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
    console.log(`Item ${id} deleted`)
  }

  const groupedItems = items.reduce((groups, item) => {
    const category = item.category
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(item)
    return groups
  }, {} as Record<string, ShoppingItem[]>)

  const checkedCount = items.filter(item => item.isChecked).length
  const totalCount = items.length

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <ShoppingCart className="h-6 w-6" />
            Shopping List
          </h2>
          <p className="text-muted-foreground">
            {checkedCount} of {totalCount} items completed
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" data-testid="button-share-list">
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm" data-testid="button-export-list">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${totalCount > 0 ? (checkedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Add new item */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Input
              placeholder="Add item to shopping list..."
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
              data-testid="input-new-item"
            />
            <Button onClick={handleAddItem} data-testid="button-add-item">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Shopping list by category */}
      <div className="space-y-4">
        {Object.entries(groupedItems).map(([category, categoryItems]) => (
          <Card key={category}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>{category}</span>
                <Badge variant="secondary">
                  {categoryItems.filter(item => !item.isChecked).length} items
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categoryItems.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-3 rounded-md border ${
                      item.isChecked ? 'bg-muted/50' : 'bg-background'
                    }`}
                  >
                    <Checkbox
                      checked={item.isChecked}
                      onCheckedChange={() => handleItemCheck(item.id)}
                      data-testid={`checkbox-item-${item.id}`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${item.isChecked ? 'line-through text-muted-foreground' : ''}`}>
                          {item.name}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {item.quantity}
                        </span>
                      </div>
                      {item.addedFrom && (
                        <p className="text-xs text-muted-foreground">
                          from {item.addedFrom}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteItem(item.id)}
                      data-testid={`button-delete-${item.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2 justify-center">
            <Button 
              variant="outline" 
              onClick={() => console.log("Generating shopping list from meal plan")}
              data-testid="button-generate-from-meal-plan"
            >
              Generate from Meal Plan
            </Button>
            <Button 
              variant="outline"
              onClick={() => console.log("Adding pantry essentials")}
              data-testid="button-add-pantry-essentials"
            >
              Add Pantry Essentials
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}