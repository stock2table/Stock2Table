import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Camera, Upload, Scan, Check, X } from "lucide-react"
import { useState } from "react"
import scanningImage from '@assets/generated_images/AI_ingredient_scanning_interface_164d3552.png'

interface Ingredient {
  name: string
  confidence: number
  category: string
}

export function IngredientScanner() {
  const [isScanning, setIsScanning] = useState(false)
  const [scannedIngredients, setScannedIngredients] = useState<Ingredient[]>([])
  const [confirmedIngredients, setConfirmedIngredients] = useState<Set<string>>(new Set())

  // todo: remove mock functionality
  const mockIngredients: Ingredient[] = [
    { name: "Tomatoes", confidence: 0.95, category: "Vegetables" },
    { name: "Basil", confidence: 0.88, category: "Herbs" },
    { name: "Garlic", confidence: 0.92, category: "Aromatics" },
    { name: "Bell Peppers", confidence: 0.87, category: "Vegetables" }
  ]

  const handleScan = () => {
    setIsScanning(true)
    console.log("Starting ingredient scan...")
    
    // todo: remove mock functionality - simulate AI scanning
    setTimeout(() => {
      setScannedIngredients(mockIngredients)
      setIsScanning(false)
      console.log("Scan completed, ingredients detected")
    }, 2000)
  }

  const handleIngredientConfirm = (ingredient: string) => {
    const newConfirmed = new Set(confirmedIngredients)
    if (newConfirmed.has(ingredient)) {
      newConfirmed.delete(ingredient)
    } else {
      newConfirmed.add(ingredient)
    }
    setConfirmedIngredients(newConfirmed)
    console.log(`Ingredient ${ingredient} ${newConfirmed.has(ingredient) ? 'confirmed' : 'removed'}`)
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5 text-primary" />
            AI Ingredient Recognition
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isScanning && scannedIngredients.length === 0 && (
            <div className="text-center">
              <img 
                src={scanningImage} 
                alt="Camera scanning interface" 
                className="w-full h-48 object-cover rounded-md mb-4"
              />
              <p className="text-muted-foreground mb-4">
                Point your camera at ingredients to identify them with AI
              </p>
            </div>
          )}

          {isScanning && (
            <div className="text-center py-8">
              <div className="animate-pulse">
                <Scan className="h-12 w-12 mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Analyzing ingredients...</p>
              </div>
            </div>
          )}

          {scannedIngredients.length > 0 && !isScanning && (
            <div className="space-y-3">
              <h3 className="font-medium">Detected Ingredients</h3>
              {scannedIngredients.map((ingredient) => (
                <div
                  key={ingredient.name}
                  className="flex items-center justify-between p-3 border rounded-md hover-elevate cursor-pointer"
                  onClick={() => handleIngredientConfirm(ingredient.name)}
                  data-testid={`ingredient-${ingredient.name.toLowerCase().replace(' ', '-')}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      confirmedIngredients.has(ingredient.name) 
                        ? 'bg-primary border-primary' 
                        : 'border-muted-foreground'
                    }`}>
                      {confirmedIngredients.has(ingredient.name) && (
                        <Check className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{ingredient.name}</p>
                      <p className="text-xs text-muted-foreground">{ingredient.category}</p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {Math.round(ingredient.confidence * 100)}%
                  </Badge>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              className="flex-1" 
              onClick={handleScan}
              disabled={isScanning}
              data-testid="button-scan-camera"
            >
              <Camera className="h-4 w-4 mr-2" />
              {isScanning ? "Scanning..." : "Scan with Camera"}
            </Button>
            <Button variant="outline" size="icon" data-testid="button-upload-image">
              <Upload className="h-4 w-4" />
            </Button>
          </div>

          {scannedIngredients.length > 0 && (
            <Button 
              className="w-full" 
              variant="default"
              onClick={() => console.log("Adding confirmed ingredients to pantry:", Array.from(confirmedIngredients))}
              data-testid="button-add-to-pantry"
            >
              Add {confirmedIngredients.size} to Pantry
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}