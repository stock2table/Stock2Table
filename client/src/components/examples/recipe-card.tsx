import { RecipeCard } from '../recipe-card'
import healthyMealImage from '@assets/generated_images/Healthy_balanced_meal_plating_25acb6fe.png'
import pastaImage from '@assets/generated_images/Appetizing_pasta_dish_photo_6cb6d75b.png'

export default function RecipeCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 max-w-4xl">
      <RecipeCard
        id="1"
        title="Grilled Chicken with Quinoa & Roasted Vegetables"
        image={healthyMealImage}
        cookTime={45}
        servings={4}
        difficulty="Medium"
        tags={["Healthy", "High-protein", "Gluten-free", "Meal prep"]}
        isFavorite={true}
      />
      <RecipeCard
        id="2"
        title="Classic Pasta Marinara with Fresh Basil"
        image={pastaImage}
        cookTime={25}
        servings={2}
        difficulty="Easy"
        tags={["Italian", "Vegetarian", "Quick", "Comfort food"]}
        isFavorite={false}
      />
    </div>
  )
}