"""Seed recipe database with sample recipes"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

mongo_url = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.getenv('DB_NAME', 'test_database')

client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Sample recipes across 10 cuisines
SAMPLE_RECIPES = [
    # Italian
    {
        "recipe_id": "recipe_001",
        "name": "Classic Spaghetti Carbonara",
        "cuisine_type": "Italian",
        "ingredients": [
            {"name": "spaghetti", "quantity": 400, "unit": "g"},
            {"name": "bacon", "quantity": 200, "unit": "g"},
            {"name": "eggs", "quantity": 4, "unit": "pieces"},
            {"name": "parmesan cheese", "quantity": 100, "unit": "g"},
            {"name": "black pepper", "quantity": 1, "unit": "tsp"}
        ],
        "instructions": [
            "Cook spaghetti according to package instructions",
            "Fry bacon until crispy",
            "Beat eggs with grated parmesan",
            "Drain pasta and mix with bacon",
            "Remove from heat and stir in egg mixture",
            "Season with black pepper and serve"
        ],
        "prep_time": 10,
        "cook_time": 20,
        "difficulty": "easy",
        "dietary_tags": [],
        "image_url": "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400",
        "nutritional_info": {"calories": 450, "protein": 20, "carbs": 50, "fat": 15}
    },
    # Mexican
    {
        "recipe_id": "recipe_002",
        "name": "Chicken Tacos",
        "cuisine_type": "Mexican",
        "ingredients": [
            {"name": "chicken breast", "quantity": 500, "unit": "g"},
            {"name": "taco shells", "quantity": 8, "unit": "pieces"},
            {"name": "lettuce", "quantity": 1, "unit": "head"},
            {"name": "tomatoes", "quantity": 2, "unit": "pieces"},
            {"name": "cheese", "quantity": 100, "unit": "g"},
            {"name": "taco seasoning", "quantity": 2, "unit": "tbsp"}
        ],
        "instructions": [
            "Cook chicken with taco seasoning",
            "Shred chicken",
            "Chop lettuce and tomatoes",
            "Warm taco shells",
            "Assemble tacos with chicken and toppings"
        ],
        "prep_time": 15,
        "cook_time": 20,
        "difficulty": "easy",
        "dietary_tags": [],
        "image_url": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400",
        "nutritional_info": {"calories": 350, "protein": 25, "carbs": 30, "fat": 12}
    },
    # Indian
    {
        "recipe_id": "recipe_003",
        "name": "Butter Chicken",
        "cuisine_type": "Indian",
        "ingredients": [
            {"name": "chicken thighs", "quantity": 600, "unit": "g"},
            {"name": "butter", "quantity": 50, "unit": "g"},
            {"name": "heavy cream", "quantity": 200, "unit": "ml"},
            {"name": "tomato puree", "quantity": 400, "unit": "g"},
            {"name": "garam masala", "quantity": 2, "unit": "tbsp"},
            {"name": "garlic", "quantity": 4, "unit": "cloves"}
        ],
        "instructions": [
            "Marinate chicken in yogurt and spices",
            "Cook chicken until browned",
            "Make sauce with butter, cream, and tomato puree",
            "Add spices to sauce",
            "Combine chicken with sauce",
            "Simmer for 20 minutes"
        ],
        "prep_time": 30,
        "cook_time": 40,
        "difficulty": "medium",
        "dietary_tags": [],
        "image_url": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400",
        "nutritional_info": {"calories": 520, "protein": 35, "carbs": 15, "fat": 35}
    },
    # Chinese
    {
        "recipe_id": "recipe_004",
        "name": "Vegetable Stir Fry",
        "cuisine_type": "Chinese",
        "ingredients": [
            {"name": "broccoli", "quantity": 200, "unit": "g"},
            {"name": "bell peppers", "quantity": 2, "unit": "pieces"},
            {"name": "carrots", "quantity": 2, "unit": "pieces"},
            {"name": "soy sauce", "quantity": 3, "unit": "tbsp"},
            {"name": "garlic", "quantity": 3, "unit": "cloves"},
            {"name": "ginger", "quantity": 1, "unit": "inch"}
        ],
        "instructions": [
            "Chop all vegetables",
            "Heat oil in wok",
            "Stir fry garlic and ginger",
            "Add vegetables and stir fry",
            "Add soy sauce and cook until tender"
        ],
        "prep_time": 15,
        "cook_time": 10,
        "difficulty": "easy",
        "dietary_tags": ["vegetarian", "vegan"],
        "image_url": "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400",
        "nutritional_info": {"calories": 150, "protein": 5, "carbs": 20, "fat": 5}
    },
    # Japanese
    {
        "recipe_id": "recipe_005",
        "name": "Teriyaki Salmon",
        "cuisine_type": "Japanese",
        "ingredients": [
            {"name": "salmon fillets", "quantity": 4, "unit": "pieces"},
            {"name": "soy sauce", "quantity": 4, "unit": "tbsp"},
            {"name": "mirin", "quantity": 2, "unit": "tbsp"},
            {"name": "honey", "quantity": 2, "unit": "tbsp"},
            {"name": "ginger", "quantity": 1, "unit": "inch"}
        ],
        "instructions": [
            "Mix soy sauce, mirin, honey, and ginger",
            "Marinate salmon for 30 minutes",
            "Heat pan with oil",
            "Cook salmon skin-side down first",
            "Flip and cook until done",
            "Glaze with remaining marinade"
        ],
        "prep_time": 35,
        "cook_time": 15,
        "difficulty": "medium",
        "dietary_tags": [],
        "image_url": "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400",
        "nutritional_info": {"calories": 320, "protein": 30, "carbs": 15, "fat": 15}
    },
    # American
    {
        "recipe_id": "recipe_006",
        "name": "Classic Burger",
        "cuisine_type": "American",
        "ingredients": [
            {"name": "ground beef", "quantity": 500, "unit": "g"},
            {"name": "burger buns", "quantity": 4, "unit": "pieces"},
            {"name": "lettuce", "quantity": 4, "unit": "leaves"},
            {"name": "tomato", "quantity": 1, "unit": "piece"},
            {"name": "cheese slices", "quantity": 4, "unit": "pieces"},
            {"name": "onion", "quantity": 1, "unit": "piece"}
        ],
        "instructions": [
            "Form beef into 4 patties",
            "Season with salt and pepper",
            "Grill or pan-fry patties",
            "Add cheese on top to melt",
            "Toast buns",
            "Assemble burgers with toppings"
        ],
        "prep_time": 10,
        "cook_time": 15,
        "difficulty": "easy",
        "dietary_tags": [],
        "image_url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400",
        "nutritional_info": {"calories": 550, "protein": 30, "carbs": 40, "fat": 28}
    },
    # Mediterranean
    {
        "recipe_id": "recipe_007",
        "name": "Greek Salad",
        "cuisine_type": "Mediterranean",
        "ingredients": [
            {"name": "tomatoes", "quantity": 4, "unit": "pieces"},
            {"name": "cucumber", "quantity": 1, "unit": "piece"},
            {"name": "feta cheese", "quantity": 200, "unit": "g"},
            {"name": "olives", "quantity": 100, "unit": "g"},
            {"name": "olive oil", "quantity": 3, "unit": "tbsp"},
            {"name": "red onion", "quantity": 1, "unit": "piece"}
        ],
        "instructions": [
            "Chop tomatoes and cucumber",
            "Slice red onion",
            "Combine vegetables in bowl",
            "Add olives and feta",
            "Drizzle with olive oil",
            "Season with oregano and salt"
        ],
        "prep_time": 15,
        "cook_time": 0,
        "difficulty": "easy",
        "dietary_tags": ["vegetarian"],
        "image_url": "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400",
        "nutritional_info": {"calories": 250, "protein": 8, "carbs": 12, "fat": 18}
    },
    # Thai
    {
        "recipe_id": "recipe_008",
        "name": "Pad Thai",
        "cuisine_type": "Thai",
        "ingredients": [
            {"name": "rice noodles", "quantity": 300, "unit": "g"},
            {"name": "shrimp", "quantity": 300, "unit": "g"},
            {"name": "bean sprouts", "quantity": 100, "unit": "g"},
            {"name": "peanuts", "quantity": 50, "unit": "g"},
            {"name": "fish sauce", "quantity": 3, "unit": "tbsp"},
            {"name": "tamarind paste", "quantity": 2, "unit": "tbsp"}
        ],
        "instructions": [
            "Soak rice noodles in warm water",
            "Heat oil in wok",
            "Cook shrimp",
            "Add noodles and sauce",
            "Toss with bean sprouts",
            "Top with peanuts and lime"
        ],
        "prep_time": 20,
        "cook_time": 15,
        "difficulty": "medium",
        "dietary_tags": [],
        "image_url": "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400",
        "nutritional_info": {"calories": 420, "protein": 22, "carbs": 55, "fat": 12}
    },
    # French
    {
        "recipe_id": "recipe_009",
        "name": "Ratatouille",
        "cuisine_type": "French",
        "ingredients": [
            {"name": "eggplant", "quantity": 1, "unit": "piece"},
            {"name": "zucchini", "quantity": 2, "unit": "pieces"},
            {"name": "bell peppers", "quantity": 2, "unit": "pieces"},
            {"name": "tomatoes", "quantity": 4, "unit": "pieces"},
            {"name": "onion", "quantity": 1, "unit": "piece"},
            {"name": "garlic", "quantity": 4, "unit": "cloves"}
        ],
        "instructions": [
            "Slice all vegetables thinly",
            "Sauté onion and garlic",
            "Layer vegetables in dish",
            "Season with herbs",
            "Bake at 375°F for 45 minutes"
        ],
        "prep_time": 25,
        "cook_time": 45,
        "difficulty": "medium",
        "dietary_tags": ["vegetarian", "vegan"],
        "image_url": "https://images.unsplash.com/photo-1572453800999-e8d2d1589b7c?w=400",
        "nutritional_info": {"calories": 180, "protein": 4, "carbs": 25, "fat": 8}
    },
    # Korean
    {
        "recipe_id": "recipe_010",
        "name": "Bibimbap",
        "cuisine_type": "Korean",
        "ingredients": [
            {"name": "rice", "quantity": 2, "unit": "cups"},
            {"name": "beef", "quantity": 200, "unit": "g"},
            {"name": "spinach", "quantity": 200, "unit": "g"},
            {"name": "carrots", "quantity": 2, "unit": "pieces"},
            {"name": "mushrooms", "quantity": 150, "unit": "g"},
            {"name": "gochujang", "quantity": 2, "unit": "tbsp"},
            {"name": "egg", "quantity": 4, "unit": "pieces"}
        ],
        "instructions": [
            "Cook rice",
            "Marinate and cook beef",
            "Blanch spinach",
            "Sauté vegetables separately",
            "Fry eggs sunny-side up",
            "Arrange ingredients over rice",
            "Top with egg and gochujang"
        ],
        "prep_time": 30,
        "cook_time": 25,
        "difficulty": "medium",
        "dietary_tags": [],
        "image_url": "https://images.unsplash.com/photo-1553163147-622ab57be1c7?w=400",
        "nutritional_info": {"calories": 480, "protein": 28, "carbs": 65, "fat": 12}
    }
]

async def seed_recipes():
    """Seed recipe database"""
    try:
        # Check if recipes already exist
        count = await db.recipes.count_documents({})
        if count > 0:
            print(f"Database already has {count} recipes. Skipping seed.")
            return
        
        # Insert recipes
        result = await db.recipes.insert_many(SAMPLE_RECIPES)
        print(f"Successfully seeded {len(result.inserted_ids)} recipes!")
        
        # Create indexes
        await db.recipes.create_index("recipe_id")
        await db.recipes.create_index("cuisine_type")
        await db.recipes.create_index("dietary_tags")
        print("Indexes created successfully!")
        
    except Exception as e:
        print(f"Error seeding recipes: {str(e)}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(seed_recipes())
