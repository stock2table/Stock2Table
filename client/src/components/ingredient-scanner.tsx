import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Camera, Upload, Scan, Check, X } from "lucide-react"
import { useState, useRef } from "react"
import { useMutation } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import scanningImage from '@assets/generated_images/AI_ingredient_scanning_interface_164d3552.png'

interface Ingredient {
  name: string
  confidence: number
  category: string
  quantity?: string
  unit?: string
}

interface ScanResult {
  ingredients: Ingredient[]
  totalConfidence: number
  suggestions?: string[]
}

export function IngredientScanner() {
  const [scannedIngredients, setScannedIngredients] = useState<Ingredient[]>([])
  const [confirmedIngredients, setConfirmedIngredients] = useState<Set<string>>(new Set())
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Mutation for scanning ingredients from uploaded image
  const scanMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/scan-ingredients', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to scan ingredients')
      }

      return response.json() as Promise<ScanResult>
    },
    onSuccess: (data) => {
      setScannedIngredients(data.ingredients)
      setScanResult(data)
      setConfirmedIngredients(new Set())
      toast({
        title: "Scan Complete!",
        description: `Found ${data.ingredients.length} ingredients with ${Math.round(data.totalConfidence * 100)}% confidence`,
      })
    },
    onError: (error) => {
      toast({
        title: "Scan Failed",
        description: error instanceof Error ? error.message : "Failed to scan ingredients",
        variant: "destructive"
      })
    }
  })

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File",
          description: "Please select an image file",
          variant: "destructive"
        })
        return
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File Too Large", 
          description: "Please select an image smaller than 10MB",
          variant: "destructive"
        })
        return
      }

      scanMutation.mutate(file)
    }
  }

  const handleScan = () => {
    fileInputRef.current?.click()
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
          {!scanMutation.isPending && scannedIngredients.length === 0 && (
            <div className="text-center">
              <img 
                src={scanningImage} 
                alt="Camera scanning interface" 
                className="w-full h-48 object-cover rounded-md mb-4"
              />
              <p className="text-muted-foreground mb-4">
                Upload an image of ingredients to identify them with AI
              </p>
            </div>
          )}

          {scanMutation.isPending && (
            <div className="text-center py-8">
              <div className="animate-pulse">
                <Scan className="h-12 w-12 mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Analyzing ingredients...</p>
              </div>
            </div>
          )}

          {scanResult?.suggestions && scanResult.suggestions.length > 0 && (
            <div className="bg-muted/30 p-3 rounded-md">
              <h4 className="font-medium text-sm mb-2">AI Suggestions:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {scanResult.suggestions.map((suggestion, index) => (
                  <li key={index}>• {suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          {scannedIngredients.length > 0 && !scanMutation.isPending && (
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

          <div className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
            
            <div className="flex gap-2">
              <Button 
                className="flex-1" 
                onClick={handleScan}
                disabled={scanMutation.isPending}
                data-testid="button-scan-camera"
              >
                <Upload className="h-4 w-4 mr-2" />
                {scanMutation.isPending ? "Scanning..." : "Upload Image"}
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleScan}
                disabled={scanMutation.isPending}
                data-testid="button-upload-image"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>

            {scannedIngredients.length > 0 && (
              <Button 
                className="w-full" 
                variant="default"
                onClick={() => {
                  const confirmed = Array.from(confirmedIngredients)
                  if (confirmed.length > 0) {
                    toast({
                      title: "Added to Pantry",
                      description: `${confirmed.length} ingredients added to your pantry`,
                    })
                    // TODO: Actually add to pantry via API
                    console.log("Adding confirmed ingredients to pantry:", confirmed)
                  }
                }}
                disabled={confirmedIngredients.size === 0}
                data-testid="button-add-to-pantry"
              >
                Add {confirmedIngredients.size} to Pantry
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}