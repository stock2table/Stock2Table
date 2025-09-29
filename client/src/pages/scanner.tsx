import { IngredientScanner } from "@/components/ingredient-scanner"

export default function ScannerPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Ingredient Scanner</h1>
        <p className="text-muted-foreground">
          Use AI to identify and catalog ingredients from your kitchen
        </p>
      </div>
      
      <IngredientScanner />
    </div>
  )
}