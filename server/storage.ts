import { 
  type User, 
  type InsertUser,
  type FamilyMember,
  type InsertFamilyMember,
  type Ingredient,
  type InsertIngredient,
  type PantryItem,
  type InsertPantryItem,
  type Recipe,
  type InsertRecipe,
  type RecipeIngredient,
  type InsertRecipeIngredient,
  type MealPlan,
  type InsertMealPlan,
  type Meal,
  type InsertMeal,
  type ShoppingList,
  type InsertShoppingList,
  type ShoppingListItem,
  type InsertShoppingListItem,
  type UserPreferences,
  type InsertUserPreferences
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Family Members
  getFamilyMembers(userId: string): Promise<FamilyMember[]>;
  getFamilyMember(id: string): Promise<FamilyMember | undefined>;
  createFamilyMember(member: InsertFamilyMember): Promise<FamilyMember>;
  updateFamilyMember(id: string, updates: Partial<FamilyMember>): Promise<FamilyMember>;
  deleteFamilyMember(id: string): Promise<void>;
  
  // Ingredients
  getIngredients(): Promise<Ingredient[]>;
  getIngredient(id: string): Promise<Ingredient | undefined>;
  getIngredientByName(name: string): Promise<Ingredient | undefined>;
  createIngredient(ingredient: InsertIngredient): Promise<Ingredient>;
  searchIngredients(query: string): Promise<Ingredient[]>;
  
  // Pantry Items
  getPantryItems(userId: string): Promise<(PantryItem & { ingredient: Ingredient })[]>;
  createPantryItem(item: InsertPantryItem): Promise<PantryItem>;
  updatePantryItem(id: string, updates: Partial<PantryItem>): Promise<PantryItem>;
  deletePantryItem(id: string): Promise<void>;
  
  // Recipes
  getRecipes(limit?: number, offset?: number): Promise<Recipe[]>;
  getRecipe(id: string): Promise<Recipe | undefined>;
  getRecipeWithIngredients(id: string): Promise<(Recipe & { ingredients: (RecipeIngredient & { ingredient: Ingredient })[] }) | undefined>;
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
  addRecipeIngredient(recipeIngredient: InsertRecipeIngredient): Promise<RecipeIngredient>;
  searchRecipes(query: string, filters?: { cuisine?: string; tags?: string[]; maxCookTime?: number }): Promise<Recipe[]>;
  getRecommendedRecipes(userId: string, availableIngredients?: string[]): Promise<Recipe[]>;
  
  // User Favorites
  getUserFavorites(userId: string): Promise<Recipe[]>;
  addToFavorites(userId: string, recipeId: string): Promise<void>;
  removeFromFavorites(userId: string, recipeId: string): Promise<void>;
  isFavorite(userId: string, recipeId: string): Promise<boolean>;
  
  // Meal Plans
  getMealPlan(userId: string, weekStarting: Date): Promise<MealPlan | undefined>;
  getMealPlanWithMeals(userId: string, weekStarting: Date): Promise<(MealPlan & { meals: (Meal & { recipe: Recipe })[] }) | undefined>;
  createMealPlan(mealPlan: InsertMealPlan): Promise<MealPlan>;
  addMealToPlan(meal: InsertMeal): Promise<Meal>;
  updateMeal(id: string, updates: Partial<Meal>): Promise<Meal>;
  deleteMeal(id: string): Promise<void>;
  
  // Shopping Lists
  getShoppingLists(userId: string): Promise<ShoppingList[]>;
  getShoppingList(id: string): Promise<ShoppingList | undefined>;
  getShoppingListWithItems(id: string): Promise<(ShoppingList & { items: (ShoppingListItem & { ingredient?: Ingredient })[] }) | undefined>;
  createShoppingList(list: InsertShoppingList): Promise<ShoppingList>;
  addShoppingListItem(item: InsertShoppingListItem): Promise<ShoppingListItem>;
  updateShoppingListItem(id: string, updates: Partial<ShoppingListItem>): Promise<ShoppingListItem>;
  deleteShoppingListItem(id: string): Promise<void>;
  generateShoppingListFromMealPlan(userId: string, mealPlanId: string): Promise<ShoppingList>;
  
  // User Preferences
  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences>;
  updateUserPreferences(userId: string, updates: Partial<UserPreferences>): Promise<UserPreferences>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private familyMembers: Map<string, FamilyMember> = new Map();
  private ingredients: Map<string, Ingredient> = new Map();
  private pantryItems: Map<string, PantryItem> = new Map();
  private recipes: Map<string, Recipe> = new Map();
  private recipeIngredients: Map<string, RecipeIngredient> = new Map();
  private userFavorites: Map<string, { userId: string; recipeId: string; createdAt: Date }> = new Map();
  private mealPlans: Map<string, MealPlan> = new Map();
  private meals: Map<string, Meal> = new Map();
  private shoppingLists: Map<string, ShoppingList> = new Map();
  private shoppingListItems: Map<string, ShoppingListItem> = new Map();
  private userPreferences: Map<string, UserPreferences> = new Map();

  constructor() {
    try {
      this.seedData();
    } catch (error) {
      console.error('Error seeding initial data:', error);
      // Continue anyway - app can still work with empty data
    }
  }

  private seedData() {
    try {
    // Seed default user
    const defaultUser: User = {
      id: "default-user-id",
      username: "sarah_mom",
      email: "sarah@example.com", 
      name: "Sarah",
      createdAt: new Date()
    };
    this.users.set(defaultUser.id, defaultUser);

    // Seed ingredients
    const ingredientsData = [
      { name: "Chicken breast", category: "Meat" },
      { name: "Quinoa", category: "Grains" },
      { name: "Broccoli", category: "Vegetables" },
      { name: "Bell peppers", category: "Vegetables" },
      { name: "Carrots", category: "Vegetables" },
      { name: "Pasta", category: "Grains" },
      { name: "Tomato sauce", category: "Pantry" },
      { name: "Fresh basil", category: "Herbs" },
      { name: "Garlic", category: "Aromatics" },
      { name: "Olive oil", category: "Pantry" },
      { name: "Onions", category: "Vegetables" },
      { name: "Tomatoes", category: "Vegetables" },
      { name: "Mozzarella cheese", category: "Dairy" },
      { name: "Ground beef", category: "Meat" },
      { name: "Rice", category: "Grains" },
      { name: "Salmon", category: "Seafood" },
      { name: "Eggs", category: "Dairy" },
      { name: "Spinach", category: "Vegetables" },
      { name: "Milk", category: "Dairy" },
      { name: "Bread", category: "Grains" }
    ];

    ingredientsData.forEach(data => {
      const id = randomUUID();
      const ingredient: Ingredient = {
        id,
        name: data.name,
        category: data.category,
        nutritionalInfo: null,
        createdAt: new Date()
      };
      this.ingredients.set(id, ingredient);
    });

    // Seed recipes
    const recipesData = [
      {
        title: "Grilled Chicken with Quinoa & Roasted Vegetables",
        description: "A healthy, balanced meal with lean protein, whole grains, and colorful vegetables.",
        instructions: [
          "Season chicken breast with salt, pepper, and herbs",
          "Grill chicken for 6-8 minutes per side until cooked through",
          "Cook quinoa according to package instructions",
          "Roast vegetables in oven at 400°F for 20-25 minutes",
          "Serve chicken over quinoa with roasted vegetables on the side"
        ],
        cookTime: 45,
        servings: 4,
        difficulty: "Medium",
        cuisine: "American",
        tags: ["Healthy", "High-protein", "Gluten-free", "Meal prep"],
        imageUrl: "/generated_images/Healthy_balanced_meal_plating_25acb6fe.png"
      },
      {
        title: "Classic Pasta Marinara with Fresh Basil",
        description: "Simple and delicious pasta with homemade tomato sauce and fresh herbs.",
        instructions: [
          "Cook pasta according to package directions",
          "Heat olive oil in large pan",
          "Sauté garlic until fragrant",
          "Add tomato sauce and simmer for 10 minutes",
          "Toss pasta with sauce and fresh basil",
          "Serve with grated cheese"
        ],
        cookTime: 25,
        servings: 2,
        difficulty: "Easy",
        cuisine: "Italian",
        tags: ["Italian", "Vegetarian", "Quick", "Comfort food"],
        imageUrl: "/generated_images/Appetizing_pasta_dish_photo_6cb6d75b.png"
      },
      {
        title: "Beef and Vegetable Stir Fry",
        description: "Quick and nutritious stir fry with tender beef and crisp vegetables.",
        instructions: [
          "Slice beef into thin strips",
          "Heat oil in wok or large skillet",
          "Stir-fry beef until browned",
          "Add vegetables and cook until crisp-tender",
          "Season with soy sauce and garlic",
          "Serve over rice"
        ],
        cookTime: 20,
        servings: 4,
        difficulty: "Easy",
        cuisine: "Asian",
        tags: ["Quick", "High-protein", "Gluten-free option"],
        imageUrl: null
      },
      {
        title: "Baked Salmon with Herbs",
        description: "Flaky salmon baked with fresh herbs and lemon.",
        instructions: [
          "Preheat oven to 425°F",
          "Season salmon with salt, pepper, and herbs",
          "Place on baking sheet with lemon slices",
          "Bake for 12-15 minutes until flakes easily",
          "Serve with steamed vegetables"
        ],
        cookTime: 30,
        servings: 4,
        difficulty: "Easy",
        cuisine: "American",
        tags: ["Healthy", "Seafood", "Low-carb", "Quick"],
        imageUrl: null
      }
    ];

    const recipeIds: string[] = [];
    recipesData.forEach(data => {
      const id = randomUUID();
      const recipe: Recipe = {
        id,
        title: data.title,
        description: data.description,
        instructions: data.instructions,
        cookTime: data.cookTime,
        servings: data.servings,
        difficulty: data.difficulty,
        cuisine: data.cuisine,
        tags: data.tags,
        nutritionalInfo: null,
        imageUrl: data.imageUrl,
        createdAt: new Date()
      };
      this.recipes.set(id, recipe);
      recipeIds.push(id);
    });

    // Seed family members
    const familyMembersData = [
      { name: "Sarah (Mom)", age: 35, dietary: ["Vegetarian"], allergies: ["Nuts"], preferences: ["Italian", "Mexican", "Asian"] },
      { name: "Mike (Dad)", age: 37, dietary: [], allergies: [], preferences: ["BBQ", "American", "Italian"] },
      { name: "Emma (8)", age: 8, dietary: [], allergies: ["Dairy"], preferences: ["Simple", "Mild flavors"] },
      { name: "Jake (12)", age: 12, dietary: [], allergies: [], preferences: ["Pizza", "Pasta", "Chicken"] }
    ];

    familyMembersData.forEach(data => {
      const id = randomUUID();
      const member: FamilyMember = {
        id,
        userId: defaultUser.id,
        name: data.name,
        age: data.age,
        dietary: data.dietary,
        allergies: data.allergies,
        preferences: data.preferences,
        isActive: true,
        createdAt: new Date()
      };
      this.familyMembers.set(id, member);
    });

    // Seed user preferences
    const preferences: UserPreferences = {
      id: randomUUID(),
      userId: defaultUser.id,
      familySize: 4,
      cookingSkill: "Intermediate",
      budget: "Medium",
      cookingTime: "30-45 mins",
      cuisinePreferences: ["Italian", "American", "Mexican", "Asian"],
      healthyAlternatives: true,
      seasonalIngredients: true,
      mealVariety: true,
      updatedAt: new Date()
    };
    this.userPreferences.set(preferences.id, preferences);

    // Seed some pantry items
    const availableIngredients = Array.from(this.ingredients.values()).slice(0, 8);
    availableIngredients.forEach(ingredient => {
      const id = randomUUID();
      const pantryItem: PantryItem = {
        id,
        userId: defaultUser.id,
        ingredientId: ingredient.id,
        quantity: "1",
        unit: "piece",
        expiryDate: null,
        addedAt: new Date()
      };
      this.pantryItems.set(id, pantryItem);
    });

    // Seed recipe ingredients
    const ingredientsByName = new Map<string, string>();
    Array.from(this.ingredients.values()).forEach(ing => {
      ingredientsByName.set(ing.name.toLowerCase(), ing.id);
    });

    const recipeIngredientsData = [
      // Grilled Chicken with Quinoa & Roasted Vegetables
      {
        recipeIndex: 0,
        ingredients: [
          { name: "chicken breast", quantity: "2", unit: "lbs" },
          { name: "quinoa", quantity: "1", unit: "cup" },
          { name: "broccoli", quantity: "1", unit: "head" },
          { name: "bell peppers", quantity: "2", unit: "pieces" },
          { name: "carrots", quantity: "3", unit: "pieces" },
          { name: "olive oil", quantity: "2", unit: "tbsp" }
        ]
      },
      // Classic Pasta Marinara with Fresh Basil
      {
        recipeIndex: 1,
        ingredients: [
          { name: "pasta", quantity: "1", unit: "lb" },
          { name: "tomato sauce", quantity: "2", unit: "cups" },
          { name: "fresh basil", quantity: "1/4", unit: "cup" },
          { name: "garlic", quantity: "3", unit: "cloves" },
          { name: "olive oil", quantity: "2", unit: "tbsp" }
        ]
      },
      // Beef and Vegetable Stir Fry
      {
        recipeIndex: 2,
        ingredients: [
          { name: "ground beef", quantity: "1", unit: "lb" },
          { name: "bell peppers", quantity: "2", unit: "pieces" },
          { name: "onions", quantity: "1", unit: "piece" },
          { name: "carrots", quantity: "2", unit: "pieces" },
          { name: "garlic", quantity: "2", unit: "cloves" },
          { name: "rice", quantity: "2", unit: "cups" }
        ]
      },
      // Baked Salmon with Herbs
      {
        recipeIndex: 3,
        ingredients: [
          { name: "salmon", quantity: "1.5", unit: "lbs" },
          { name: "olive oil", quantity: "1", unit: "tbsp" },
          { name: "garlic", quantity: "2", unit: "cloves" }
        ]
      }
    ];

    recipeIngredientsData.forEach(recipeData => {
      const recipeId = recipeIds[recipeData.recipeIndex];
      if (!recipeId) return;

      recipeData.ingredients.forEach(ingData => {
        const ingredientId = ingredientsByName.get(ingData.name.toLowerCase());
        if (!ingredientId) return;

        const id = randomUUID();
        const recipeIngredient: RecipeIngredient = {
          id,
          recipeId,
          ingredientId,
          quantity: ingData.quantity,
          unit: ingData.unit,
          isOptional: false
        };
        this.recipeIngredients.set(id, recipeIngredient);
      });
    });
    } catch (error) {
      console.error('Error in seedData:', error);
      // Continue with empty data if seed fails
    }
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  // Family Members
  async getFamilyMembers(userId: string): Promise<FamilyMember[]> {
    return Array.from(this.familyMembers.values()).filter(member => member.userId === userId);
  }

  async getFamilyMember(id: string): Promise<FamilyMember | undefined> {
    return this.familyMembers.get(id);
  }

  async createFamilyMember(member: InsertFamilyMember): Promise<FamilyMember> {
    const id = randomUUID();
    const familyMember: FamilyMember = {
      id,
      userId: member.userId,
      name: member.name,
      age: member.age ?? null,
      dietary: member.dietary ?? [],
      allergies: member.allergies ?? [],
      preferences: member.preferences ?? [],
      isActive: member.isActive ?? true,
      createdAt: new Date()
    };
    this.familyMembers.set(id, familyMember);
    return familyMember;
  }

  async updateFamilyMember(id: string, updates: Partial<FamilyMember>): Promise<FamilyMember> {
    const member = this.familyMembers.get(id);
    if (!member) throw new Error('Family member not found');
    
    const updated = { ...member, ...updates };
    this.familyMembers.set(id, updated);
    return updated;
  }

  async deleteFamilyMember(id: string): Promise<void> {
    this.familyMembers.delete(id);
  }

  // Ingredients
  async getIngredients(): Promise<Ingredient[]> {
    return Array.from(this.ingredients.values());
  }

  async getIngredient(id: string): Promise<Ingredient | undefined> {
    return this.ingredients.get(id);
  }

  async getIngredientByName(name: string): Promise<Ingredient | undefined> {
    return Array.from(this.ingredients.values()).find(ingredient => 
      ingredient.name.toLowerCase() === name.toLowerCase()
    );
  }

  async createIngredient(ingredient: InsertIngredient): Promise<Ingredient> {
    const id = randomUUID();
    const newIngredient: Ingredient = {
      id,
      name: ingredient.name,
      category: ingredient.category,
      nutritionalInfo: ingredient.nutritionalInfo ?? null,
      createdAt: new Date()
    };
    this.ingredients.set(id, newIngredient);
    return newIngredient;
  }

  async searchIngredients(query: string): Promise<Ingredient[]> {
    return Array.from(this.ingredients.values()).filter(ingredient =>
      ingredient.name.toLowerCase().includes(query.toLowerCase()) ||
      ingredient.category.toLowerCase().includes(query.toLowerCase())
    );
  }

  // Pantry Items
  async getPantryItems(userId: string): Promise<(PantryItem & { ingredient: Ingredient })[]> {
    const userPantryItems = Array.from(this.pantryItems.values()).filter(item => item.userId === userId);
    return userPantryItems.map(item => ({
      ...item,
      ingredient: this.ingredients.get(item.ingredientId)!
    }));
  }

  async createPantryItem(item: InsertPantryItem): Promise<PantryItem> {
    const id = randomUUID();
    const pantryItem: PantryItem = {
      id,
      userId: item.userId,
      ingredientId: item.ingredientId,
      quantity: item.quantity ?? null,
      unit: item.unit ?? null,
      expiryDate: item.expiryDate ?? null,
      addedAt: new Date()
    };
    this.pantryItems.set(id, pantryItem);
    return pantryItem;
  }

  async updatePantryItem(id: string, updates: Partial<PantryItem>): Promise<PantryItem> {
    const item = this.pantryItems.get(id);
    if (!item) throw new Error('Pantry item not found');
    
    const updated = { ...item, ...updates };
    this.pantryItems.set(id, updated);
    return updated;
  }

  async deletePantryItem(id: string): Promise<void> {
    this.pantryItems.delete(id);
  }

  // Recipes
  async getRecipes(limit = 50, offset = 0): Promise<Recipe[]> {
    return Array.from(this.recipes.values()).slice(offset, offset + limit);
  }

  async getRecipe(id: string): Promise<Recipe | undefined> {
    return this.recipes.get(id);
  }

  async getRecipeWithIngredients(id: string): Promise<(Recipe & { ingredients: (RecipeIngredient & { ingredient: Ingredient })[] }) | undefined> {
    const recipe = this.recipes.get(id);
    if (!recipe) return undefined;

    const recipeIngredients = Array.from(this.recipeIngredients.values())
      .filter(ri => ri.recipeId === id)
      .map(ri => ({
        ...ri,
        ingredient: this.ingredients.get(ri.ingredientId)!
      }));

    return {
      ...recipe,
      ingredients: recipeIngredients
    };
  }

  async createRecipe(recipe: InsertRecipe): Promise<Recipe> {
    const id = randomUUID();
    const newRecipe: Recipe = {
      id,
      title: recipe.title,
      description: recipe.description ?? null,
      instructions: recipe.instructions,
      cookTime: recipe.cookTime,
      servings: recipe.servings,
      difficulty: recipe.difficulty,
      cuisine: recipe.cuisine ?? null,
      tags: recipe.tags ?? [],
      nutritionalInfo: recipe.nutritionalInfo ?? null,
      imageUrl: recipe.imageUrl ?? null,
      createdAt: new Date()
    };
    this.recipes.set(id, newRecipe);
    return newRecipe;
  }

  async addRecipeIngredient(recipeIngredient: InsertRecipeIngredient): Promise<RecipeIngredient> {
    const id = randomUUID();
    const ingredient: RecipeIngredient = {
      id,
      recipeId: recipeIngredient.recipeId,
      ingredientId: recipeIngredient.ingredientId,
      quantity: recipeIngredient.quantity,
      unit: recipeIngredient.unit ?? null,
      isOptional: recipeIngredient.isOptional ?? false
    };
    this.recipeIngredients.set(id, ingredient);
    return ingredient;
  }

  async searchRecipes(query: string, filters?: { cuisine?: string; tags?: string[]; maxCookTime?: number }): Promise<Recipe[]> {
    return Array.from(this.recipes.values()).filter(recipe => {
      const matchesQuery = recipe.title.toLowerCase().includes(query.toLowerCase()) ||
                          recipe.description?.toLowerCase().includes(query.toLowerCase());
      
      const matchesCuisine = !filters?.cuisine || recipe.cuisine === filters.cuisine;
      const matchesTags = !filters?.tags?.length || filters.tags.some(tag => recipe.tags.includes(tag));
      const matchesCookTime = !filters?.maxCookTime || recipe.cookTime <= filters.maxCookTime;
      
      return matchesQuery && matchesCuisine && matchesTags && matchesCookTime;
    });
  }

  async getRecommendedRecipes(userId: string, availableIngredients?: string[]): Promise<Recipe[]> {
    // Simple recommendation logic - can be enhanced with AI
    const allRecipes = Array.from(this.recipes.values());
    if (!availableIngredients?.length) {
      return allRecipes.slice(0, 10); // Return first 10 recipes
    }
    
    // Score recipes based on available ingredients
    const scoredRecipes = allRecipes.map(recipe => {
      const recipeIngredients = Array.from(this.recipeIngredients.values())
        .filter(ri => ri.recipeId === recipe.id)
        .map(ri => this.ingredients.get(ri.ingredientId)?.name || '');
      
      const matchingIngredients = recipeIngredients.filter(ing => 
        availableIngredients.some(available => 
          available.toLowerCase().includes(ing.toLowerCase())
        )
      );
      
      return {
        recipe,
        score: matchingIngredients.length / recipeIngredients.length
      };
    });
    
    return scoredRecipes
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(item => item.recipe);
  }

  // User Favorites
  async getUserFavorites(userId: string): Promise<Recipe[]> {
    const favoriteIds = Array.from(this.userFavorites.values())
      .filter(fav => fav.userId === userId)
      .map(fav => fav.recipeId);
    
    return favoriteIds.map(id => this.recipes.get(id)).filter(Boolean) as Recipe[];
  }

  async addToFavorites(userId: string, recipeId: string): Promise<void> {
    const id = randomUUID();
    this.userFavorites.set(id, { userId, recipeId, createdAt: new Date() });
  }

  async removeFromFavorites(userId: string, recipeId: string): Promise<void> {
    const entries = Array.from(this.userFavorites.entries());
    for (const [id, fav] of entries) {
      if (fav.userId === userId && fav.recipeId === recipeId) {
        this.userFavorites.delete(id);
        break;
      }
    }
  }

  async isFavorite(userId: string, recipeId: string): Promise<boolean> {
    return Array.from(this.userFavorites.values()).some(fav => 
      fav.userId === userId && fav.recipeId === recipeId
    );
  }

  // Meal Plans
  async getMealPlan(userId: string, weekStarting: Date): Promise<MealPlan | undefined> {
    return Array.from(this.mealPlans.values()).find(plan => 
      plan.userId === userId && plan.weekStarting.getTime() === weekStarting.getTime()
    );
  }

  async getMealPlanWithMeals(userId: string, weekStarting: Date): Promise<(MealPlan & { meals: (Meal & { recipe: Recipe })[] }) | undefined> {
    const mealPlan = await this.getMealPlan(userId, weekStarting);
    if (!mealPlan) return undefined;

    const meals = Array.from(this.meals.values())
      .filter(meal => meal.mealPlanId === mealPlan.id)
      .map(meal => ({
        ...meal,
        recipe: this.recipes.get(meal.recipeId)!
      }));

    return {
      ...mealPlan,
      meals
    };
  }

  async createMealPlan(mealPlan: InsertMealPlan): Promise<MealPlan> {
    const id = randomUUID();
    const newMealPlan: MealPlan = {
      ...mealPlan,
      id,
      createdAt: new Date()
    };
    this.mealPlans.set(id, newMealPlan);
    return newMealPlan;
  }

  async addMealToPlan(meal: InsertMeal): Promise<Meal> {
    const id = randomUUID();
    const newMeal: Meal = {
      id,
      mealPlanId: meal.mealPlanId,
      recipeId: meal.recipeId,
      dayOfWeek: meal.dayOfWeek,
      mealType: meal.mealType,
      scheduledTime: meal.scheduledTime ?? null
    };
    this.meals.set(id, newMeal);
    return newMeal;
  }

  async updateMeal(id: string, updates: Partial<Meal>): Promise<Meal> {
    const meal = this.meals.get(id);
    if (!meal) throw new Error('Meal not found');
    
    const updated = { ...meal, ...updates };
    this.meals.set(id, updated);
    return updated;
  }

  async deleteMeal(id: string): Promise<void> {
    this.meals.delete(id);
  }

  // Shopping Lists
  async getShoppingLists(userId: string): Promise<ShoppingList[]> {
    return Array.from(this.shoppingLists.values()).filter(list => list.userId === userId);
  }

  async getShoppingList(id: string): Promise<ShoppingList | undefined> {
    return this.shoppingLists.get(id);
  }

  async getShoppingListWithItems(id: string): Promise<(ShoppingList & { items: (ShoppingListItem & { ingredient?: Ingredient })[] }) | undefined> {
    const list = this.shoppingLists.get(id);
    if (!list) return undefined;

    const items = Array.from(this.shoppingListItems.values())
      .filter(item => item.shoppingListId === id)
      .map(item => ({
        ...item,
        ingredient: item.ingredientId ? this.ingredients.get(item.ingredientId) : undefined
      }));

    return {
      ...list,
      items
    };
  }

  async createShoppingList(list: InsertShoppingList): Promise<ShoppingList> {
    const id = randomUUID();
    const newList: ShoppingList = {
      id,
      userId: list.userId,
      name: list.name,
      mealPlanId: list.mealPlanId ?? null,
      isCompleted: list.isCompleted ?? false,
      createdAt: new Date()
    };
    this.shoppingLists.set(id, newList);
    return newList;
  }

  async addShoppingListItem(item: InsertShoppingListItem): Promise<ShoppingListItem> {
    const id = randomUUID();
    const newItem: ShoppingListItem = {
      id,
      shoppingListId: item.shoppingListId,
      ingredientId: item.ingredientId ?? null,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit ?? null,
      isChecked: item.isChecked ?? false,
      addedFrom: item.addedFrom ?? null
    };
    this.shoppingListItems.set(id, newItem);
    return newItem;
  }

  async updateShoppingListItem(id: string, updates: Partial<ShoppingListItem>): Promise<ShoppingListItem> {
    const item = this.shoppingListItems.get(id);
    if (!item) throw new Error('Shopping list item not found');
    
    const updated = { ...item, ...updates };
    this.shoppingListItems.set(id, updated);
    return updated;
  }

  async deleteShoppingListItem(id: string): Promise<void> {
    this.shoppingListItems.delete(id);
  }

  async generateShoppingListFromMealPlan(userId: string, mealPlanId: string): Promise<ShoppingList> {
    const mealPlan = this.mealPlans.get(mealPlanId);
    if (!mealPlan) throw new Error('Meal plan not found');

    const meals = Array.from(this.meals.values()).filter(meal => meal.mealPlanId === mealPlanId);
    const shoppingList = await this.createShoppingList({
      userId,
      name: `Shopping List - Week of ${mealPlan.weekStarting.toLocaleDateString()}`,
      mealPlanId,
      isCompleted: false
    });

    // Aggregate ingredients from all meals
    const ingredientMap = new Map<string, { quantity: number; unit: string; recipes: string[] }>();
    
    for (const meal of meals) {
      const recipe = this.recipes.get(meal.recipeId);
      if (!recipe) continue;

      const recipeIngredients = Array.from(this.recipeIngredients.values())
        .filter(ri => ri.recipeId === meal.recipeId);

      for (const ri of recipeIngredients) {
        const ingredient = this.ingredients.get(ri.ingredientId);
        if (!ingredient) continue;

        const key = ingredient.name;
        if (ingredientMap.has(key)) {
          const existing = ingredientMap.get(key)!;
          existing.recipes.push(recipe.title);
        } else {
          ingredientMap.set(key, {
            quantity: parseFloat(ri.quantity) || 1,
            unit: ri.unit || '',
            recipes: [recipe.title]
          });
        }
      }
    }

    // Create shopping list items
    const ingredientEntries = Array.from(ingredientMap.entries());
    for (const [name, data] of ingredientEntries) {
      const ingredient = await this.getIngredientByName(name);
      await this.addShoppingListItem({
        shoppingListId: shoppingList.id,
        ingredientId: ingredient?.id,
        name,
        category: ingredient?.category || 'Other',
        quantity: data.quantity.toString(),
        unit: data.unit,
        isChecked: false,
        addedFrom: data.recipes.join(', ')
      });
    }

    return shoppingList;
  }

  // User Preferences
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    return Array.from(this.userPreferences.values()).find(prefs => prefs.userId === userId);
  }

  async createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    const id = randomUUID();
    const newPreferences: UserPreferences = {
      id,
      userId: preferences.userId,
      familySize: preferences.familySize ?? 1,
      cookingSkill: preferences.cookingSkill ?? 'Beginner',
      budget: preferences.budget ?? 'Medium',
      cookingTime: preferences.cookingTime ?? '30 mins',
      cuisinePreferences: preferences.cuisinePreferences ?? [],
      healthyAlternatives: preferences.healthyAlternatives ?? true,
      seasonalIngredients: preferences.seasonalIngredients ?? true,
      mealVariety: preferences.mealVariety ?? true,
      updatedAt: new Date()
    };
    this.userPreferences.set(id, newPreferences);
    return newPreferences;
  }

  async updateUserPreferences(userId: string, updates: Partial<UserPreferences>): Promise<UserPreferences> {
    const existing = await this.getUserPreferences(userId);
    if (!existing) throw new Error('User preferences not found');
    
    const updated = { 
      ...existing, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.userPreferences.set(existing.id, updated);
    return updated;
  }
}

// Initialize storage with error handling
let storage: MemStorage;
try {
  storage = new MemStorage();
} catch (error) {
  console.error('Failed to initialize storage, creating empty storage:', error);
  // Create a minimal storage instance that will work but with no seed data
  storage = new MemStorage();
}

export { storage };
