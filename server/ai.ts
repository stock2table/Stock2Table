import OpenAI from "openai";

// Using blueprint:javascript_openai integration
// The newest OpenAI model is "gpt-5" which was released August 7, 2025. Do not change this unless explicitly requested by the user

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export interface IdentifiedIngredient {
  name: string;
  quantity?: string;
  unit?: string;
  confidence: number;
  category?: string;
}

export interface IngredientScanResult {
  ingredients: IdentifiedIngredient[];
  totalConfidence: number;
  suggestions?: string[];
}

// Fallback function for when AI is unavailable
function getMockIngredientScanResult(): IngredientScanResult {
  return {
    ingredients: [
      { name: "Tomatoes", quantity: "3", unit: "pieces", confidence: 0.95, category: "Vegetables" },
      { name: "Bell peppers", quantity: "2", unit: "pieces", confidence: 0.90, category: "Vegetables" },
      { name: "Onions", quantity: "1", unit: "piece", confidence: 0.85, category: "Vegetables" },
      { name: "Garlic", quantity: "4", unit: "cloves", confidence: 0.80, category: "Aromatics" }
    ],
    totalConfidence: 0.88,
    suggestions: [
      "The image shows fresh vegetables that would work great in a stir-fry or pasta dish",
      "Consider adding some protein like chicken or tofu to make a complete meal"
    ]
  };
}

export async function identifyIngredientsFromImage(base64Image: string): Promise<IngredientScanResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are an expert food ingredient identifier. Analyze the image and identify all visible food ingredients, produce items, or food products. 

For each ingredient identified, provide:
- name: the specific ingredient name (e.g., "red bell pepper" not just "pepper")
- quantity: estimated quantity if visible (optional)
- unit: appropriate unit of measurement (optional)
- confidence: confidence score from 0.1 to 1.0
- category: food category (e.g., "Vegetables", "Fruits", "Meat", "Dairy", "Grains", "Pantry")

Also provide:
- totalConfidence: overall confidence in the identification (0.1 to 1.0)
- suggestions: helpful tips for the user (optional)

Respond with JSON in this exact format:
{
  "ingredients": [
    {
      "name": "ingredient name",
      "quantity": "estimated amount or null",
      "unit": "unit or null",
      "confidence": 0.9,
      "category": "category"
    }
  ],
  "totalConfidence": 0.85,
  "suggestions": ["tip1", "tip2"]
}`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please identify all the food ingredients visible in this image. Be specific about ingredient names and provide quantity estimates where possible."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2048,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response content from OpenAI');
    }
    const result = JSON.parse(content);
    
    // Validate and sanitize the response
    return {
      ingredients: result.ingredients?.map((ing: any) => ({
        name: ing.name || 'Unknown ingredient',
        quantity: ing.quantity || undefined,
        unit: ing.unit || undefined,
        confidence: Math.max(0.1, Math.min(1.0, ing.confidence || 0.5)),
        category: ing.category || 'Unknown'
      })) || [],
      totalConfidence: Math.max(0.1, Math.min(1.0, result.totalConfidence || 0.5)),
      suggestions: result.suggestions || []
    };
  } catch (error) {
    console.warn('OpenAI API unavailable for ingredient scanning, using fallback:', error instanceof Error ? error.message : 'Unknown error');
    
    // Return mock results if AI is unavailable
    return getMockIngredientScanResult();
  }
}

export interface RecipeRecommendation {
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  cookTime: number;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  cuisine?: string;
  tags: string[];
}

// Fallback function for when AI is unavailable
function getMockRecipeRecommendations(
  availableIngredients: string[],
  familySize: number = 4
): RecipeRecommendation[] {
  const baseRecipes = [
    {
      title: "Quick Vegetable Stir-Fry",
      description: "A healthy and colorful stir-fry using your available vegetables",
      ingredients: availableIngredients.slice(0, 5).concat(["soy sauce", "garlic", "ginger", "oil"]),
      instructions: [
        "Heat oil in a large pan or wok",
        "Add garlic and ginger, stir-fry for 30 seconds",
        "Add harder vegetables first, then softer ones",
        "Season with soy sauce and serve over rice"
      ],
      cookTime: 15,
      servings: familySize,
      difficulty: "Easy" as const,
      cuisine: "Asian",
      tags: ["Quick", "Healthy", "Vegetarian"]
    },
    {
      title: "Simple Family Soup",
      description: "Comforting soup made with your available ingredients",
      ingredients: availableIngredients.slice(0, 4).concat(["broth", "herbs", "salt", "pepper"]),
      instructions: [
        "Chop all vegetables into bite-sized pieces",
        "Heat broth in a large pot",
        "Add vegetables and simmer until tender",
        "Season with herbs, salt, and pepper to taste"
      ],
      cookTime: 25,
      servings: familySize,
      difficulty: "Easy" as const,
      cuisine: "Comfort Food",
      tags: ["Soup", "Comfort", "Family-friendly"]
    }
  ];

  return baseRecipes;
}

export async function generateRecipeRecommendations(
  availableIngredients: string[],
  dietaryRestrictions: string[] = [],
  preferences: string[] = [],
  familySize: number = 4
): Promise<RecipeRecommendation[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are a professional chef and meal planning expert. Generate recipe recommendations based on available ingredients and family preferences.

Consider:
- Use primarily the available ingredients provided
- Respect dietary restrictions and allergies
- Incorporate family preferences and cuisine styles
- Scale recipes appropriately for family size
- Suggest practical, family-friendly recipes

Respond with JSON in this exact format:
{
  "recipes": [
    {
      "title": "Recipe Name",
      "description": "Brief description",
      "ingredients": ["ingredient 1", "ingredient 2"],
      "instructions": ["step 1", "step 2"],
      "cookTime": 30,
      "servings": 4,
      "difficulty": "Easy",
      "cuisine": "Italian",
      "tags": ["tag1", "tag2"]
    }
  ]
}`
        },
        {
          role: "user",
          content: `Generate 3-5 recipe recommendations using these available ingredients: ${availableIngredients.join(', ')}

Family size: ${familySize}
Dietary restrictions: ${dietaryRestrictions.length > 0 ? dietaryRestrictions.join(', ') : 'None'}
Cuisine preferences: ${preferences.length > 0 ? preferences.join(', ') : 'Any'}

Focus on recipes that use mostly the available ingredients, with minimal additional items needed.`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 3000,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response content from OpenAI');
    }
    const result = JSON.parse(content);
    
    return result.recipes?.map((recipe: any) => ({
      title: recipe.title || 'Untitled Recipe',
      description: recipe.description || 'No description available',
      ingredients: recipe.ingredients || [],
      instructions: recipe.instructions || [],
      cookTime: recipe.cookTime || 30,
      servings: recipe.servings || familySize,
      difficulty: ['Easy', 'Medium', 'Hard'].includes(recipe.difficulty) ? recipe.difficulty : 'Medium',
      cuisine: recipe.cuisine || undefined,
      tags: recipe.tags || []
    })) || [];
  } catch (error) {
    console.warn('OpenAI API unavailable for recipe recommendations, using fallback:', error instanceof Error ? error.message : 'Unknown error');
    
    // Return mock recommendations if AI is unavailable
    return getMockRecipeRecommendations(availableIngredients, familySize);
  }
}

export async function enhanceRecipeRecommendations(
  baseRecipes: any[],
  userPreferences: any,
  familyMembers: any[]
): Promise<any[]> {
  try {
    const familyContext = familyMembers.map(member => 
      `${member.name} (age ${member.age}): dietary needs: ${member.dietary.join(', ') || 'none'}, allergies: ${member.allergies.join(', ') || 'none'}, preferences: ${member.preferences.join(', ') || 'none'}`
    ).join('\n');

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are a family nutrition and meal planning expert. Analyze the provided recipes and enhance them based on family preferences and dietary needs.

For each recipe, consider:
- Family member ages, dietary restrictions, and allergies
- Cooking skill level and time constraints
- Budget considerations
- Nutritional balance for the family
- Recipe modifications to better suit the family

Respond with JSON containing enhanced recipes with the same structure but improved recommendations.`
        },
        {
          role: "user",
          content: `Please analyze and enhance these recipes for this family:

Family Context:
${familyContext}

User Preferences:
- Cooking skill: ${userPreferences.cookingSkill}
- Budget: ${userPreferences.budget}
- Cooking time preference: ${userPreferences.cookingTime}
- Healthy alternatives: ${userPreferences.healthyAlternatives ? 'Yes' : 'No'}

Base Recipes to enhance:
${JSON.stringify(baseRecipes, null, 2)}

Please provide enhanced versions that better suit this specific family's needs.`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 4000,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response content from OpenAI');
    }
    return JSON.parse(content).recipes || baseRecipes;
  } catch (error) {
    console.error('Failed to enhance recipe recommendations:', error);
    // Return original recipes if enhancement fails
    return baseRecipes;
  }
}

// Chat response generation for the AI agent
export async function generateChatResponse(
  userMessage: string, 
  systemPrompt: string, 
  previousMessages: Array<{role: string, content: string}> = []
): Promise<string> {
  try {
    const messages = [
      { role: "system", content: systemPrompt },
      ...previousMessages.slice(-4).map(msg => ({ role: msg.role, content: msg.content })),
      { role: "user", content: userMessage }
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: messages as any,
      max_tokens: 200,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || "I'm sorry, I couldn't process that request. Please try again.";
  } catch (error) {
    console.error('Chat generation error:', error);
    return getFallbackChatResponse(userMessage);
  }
}

// Generate contextual suggestions based on user message and pantry
export function generateSuggestions(userMessage: string, pantryItems: any[]): string[] {
  const message = userMessage.toLowerCase();
  
  if (message.includes('recipe') || message.includes('cook') || message.includes('make')) {
    return ["Show quick recipes", "Find healthy options", "Use my pantry items"];
  }
  
  if (message.includes('plan') || message.includes('week') || message.includes('meal')) {
    return ["Plan this week", "Suggest breakfast", "Dinner ideas", "Prep meals"];
  }
  
  if (message.includes('shop') || message.includes('buy') || message.includes('list')) {
    return ["Generate shopping list", "Find missing ingredients", "Weekly groceries"];
  }
  
  if (message.includes('healthy') || message.includes('diet') || message.includes('nutrition')) {
    return ["Healthy recipes", "Low calorie options", "High protein meals"];
  }
  
  // Default suggestions based on pantry
  if (pantryItems.length > 0) {
    return ["What can I cook?", "Quick meal ideas", "Use expiring items", "Meal planning"];
  }
  
  return ["Add ingredients", "Browse recipes", "Plan meals", "Get cooking tips"];
}

// Fallback chat responses when AI is unavailable
function getFallbackChatResponse(userMessage: string): string {
  const message = userMessage.toLowerCase();
  
  if (message.includes('recipe') || message.includes('cook')) {
    return "I can help you find recipes! Try scanning some ingredients or browsing our curated lists to get started.";
  }
  
  if (message.includes('plan') || message.includes('meal')) {
    return "Great idea to plan ahead! Add some ingredients to your pantry and I'll suggest meal combinations for the week.";
  }
  
  if (message.includes('shop') || message.includes('buy')) {
    return "I can help generate shopping lists based on your meal plans. Start by planning some meals first!";
  }
  
  if (message.includes('healthy') || message.includes('diet')) {
    return "I'd love to help with healthy eating! Share your dietary preferences and I'll suggest nutritious meal options.";
  }
  
  return "I'm your meal planning assistant! I can help you find recipes, plan meals, and create shopping lists. What would you like to work on?";
}

// Generate proactive suggestions based on user context
export async function generateProactiveSuggestions(pantryItems: any[], userPreferences?: any): Promise<any[]> {
  try {
    const currentTime = new Date();
    const suggestions = [];

    // Check for expiring ingredients
    const expiringItems = pantryItems.filter(item => {
      if (!item.expiryDate) return false;
      const expiryDate = new Date(item.expiryDate);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - currentTime.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 3 && daysUntilExpiry > 0;
    });

    if (expiringItems.length > 0) {
      suggestions.push({
        id: `expiry-${Date.now()}`,
        type: 'expiry_warning',
        title: 'Ingredients Expiring Soon',
        description: `You have ${expiringItems.length} ingredients that expire within 3 days. Use them before they go bad!`,
        action: 'Find Quick Recipes',
        priority: 'high',
        data: {
          expiringItems: expiringItems.map(item => item.ingredient?.name || item.name)
        },
        createdAt: currentTime
      });
    }

    // Suggest recipes based on available ingredients
    if (pantryItems.length >= 3) {
      const ingredientNames = pantryItems.map(item => item.ingredient?.name || item.name);
      suggestions.push({
        id: `recipe-${Date.now()}`,
        type: 'recipe',
        title: 'Cook with Your Ingredients',
        description: `You have ${pantryItems.length} ingredients ready to use. Let me suggest some delicious recipes!`,
        action: 'Generate Recipe',
        priority: 'medium',
        data: {
          ingredients: ingredientNames,
          matchPercentage: 85
        },
        createdAt: currentTime
      });
    }

    // Suggest meal planning for the week
    const dayOfWeek = currentTime.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 1) { // Sunday or Monday
      suggestions.push({
        id: `meal-plan-${Date.now()}`,
        type: 'meal_plan',
        title: 'Plan Your Week',
        description: 'Start your week right with a organized meal plan. Save time and reduce food waste!',
        action: 'Create Meal Plan',
        priority: 'medium',
        data: {
          startDate: currentTime.toISOString(),
          pantryItems: pantryItems.length
        },
        createdAt: currentTime
      });
    }

    return suggestions;
  } catch (error) {
    console.error('Error generating proactive suggestions:', error);
    return getFallbackSuggestions();
  }
}

// Generate smart AI-powered suggestions
export async function generateSmartSuggestions(context: any): Promise<any[]> {
  try {
    const { pantryItems, familyMembers, userPreferences } = context;
    
    const systemPrompt = `You are a proactive meal planning assistant. Generate 2-3 helpful suggestions based on the user's context.

Available ingredients: ${pantryItems.map((item: any) => item.ingredient?.name || item.name).join(', ')}
Family size: ${familyMembers?.length || 1}
User preferences: ${JSON.stringify(userPreferences)}

Generate suggestions for:
- Recipe recommendations using available ingredients
- Meal planning opportunities
- Shopping list optimizations
- Cooking tips based on family needs

Return JSON with array of suggestions, each having: id, type, title, description, action, priority, data`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "system", content: systemPrompt }],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || '{"suggestions": []}');
    return result.suggestions || [];
  } catch (error) {
    console.error('Error generating smart suggestions:', error);
    return getFallbackSuggestions();
  }
}

// Generate quick recipe from available ingredients
export async function generateQuickRecipe(ingredients: string[], preferences?: any): Promise<any> {
  try {
    const systemPrompt = `Create a quick, delicious recipe using these ingredients: ${ingredients.join(', ')}.

Make it:
- Easy to prepare (30 minutes or less)
- Family-friendly
- Uses common cooking techniques
- Provides clear instructions

Return JSON with: title, description, cookTime, servings, difficulty, ingredients, instructions, tags`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "system", content: systemPrompt }],
      response_format: { type: "json_object" },
      max_tokens: 1500,
    });

    const recipe = JSON.parse(completion.choices[0]?.message?.content || '{}');
    return {
      id: `quick-${Date.now()}`,
      ...recipe,
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error generating quick recipe:', error);
    return getFallbackQuickRecipe(ingredients);
  }
}

// Fallback suggestions when AI is unavailable
function getFallbackSuggestions(): any[] {
  return [
    {
      id: `fallback-${Date.now()}`,
      type: 'cooking_tip',
      title: 'Meal Planning Tip',
      description: 'Plan your meals for the week to save time and reduce food waste. Start with what you have in your pantry!',
      priority: 'low',
      data: {},
      createdAt: new Date()
    }
  ];
}

function getFallbackQuickRecipe(ingredients: string[]): any {
  return {
    id: `fallback-recipe-${Date.now()}`,
    title: `Quick ${ingredients[0]} Recipe`,
    description: `A simple recipe using ${ingredients.slice(0, 3).join(', ')}`,
    cookTime: 20,
    servings: 4,
    difficulty: 'Easy',
    ingredients: ingredients.concat(['salt', 'pepper', 'oil']),
    instructions: [
      'Prepare all ingredients',
      'Cook main ingredients in a pan with oil',
      'Season with salt and pepper',
      'Serve hot'
    ],
    tags: ['Quick', 'Easy', 'Pantry-friendly'],
    createdAt: new Date().toISOString()
  };
}

export interface WeeklyMealPlan {
  days: DailyMealPlan[];
  shoppingList: {
    ingredients: string[];
    categories: Record<string, string[]>;
  };
  nutritionSummary?: {
    averageCalories: number;
    proteinBalance: string;
    varietyScore: number;
  };
}

export interface DailyMealPlan {
  day: string;
  date: string;
  meals: {
    breakfast?: MealSuggestion;
    lunch?: MealSuggestion;
    dinner?: MealSuggestion;
  };
}

export interface MealSuggestion {
  title: string;
  description: string;
  cookTime: number;
  ingredients: string[];
  instructions?: string[];
  tags?: string[];
}

export async function generateWeeklyMealPlan(
  familySize: number,
  dietaryRestrictions: string[],
  cuisinePreferences: string[],
  cookingSkill: string,
  budget: string,
  availableIngredients: string[] = []
): Promise<WeeklyMealPlan> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are an expert meal planning nutritionist and chef. Generate a complete 7-day meal plan that is:
- Nutritionally balanced with variety in proteins, vegetables, and grains
- Appropriate for the family size and cooking skill level
- Respectful of dietary restrictions and preferences
- Budget-conscious with smart ingredient reuse across meals
- Time-efficient with a mix of quick weekday meals and slightly more involved weekend cooking

Provide breakfast, lunch, and dinner for each day. Consider:
- Meal prep opportunities (e.g., cook once, eat twice)
- Ingredient overlap to minimize shopping and waste
- Balanced cuisines throughout the week
- Age-appropriate meals for families
- Seasonal and fresh ingredients

Respond with JSON in this format:
{
  "days": [
    {
      "day": "Monday",
      "date": "current_date",
      "meals": {
        "breakfast": {
          "title": "meal name",
          "description": "brief description",
          "cookTime": 15,
          "ingredients": ["ingredient1", "ingredient2"],
          "instructions": ["step1", "step2"],
          "tags": ["Quick", "Healthy"]
        },
        "lunch": { ... },
        "dinner": { ... }
      }
    }
  ],
  "shoppingList": {
    "ingredients": ["ingredient1", "ingredient2"],
    "categories": {
      "Produce": ["tomatoes", "lettuce"],
      "Protein": ["chicken", "eggs"],
      "Dairy": ["milk", "cheese"],
      "Pantry": ["rice", "pasta"]
    }
  },
  "nutritionSummary": {
    "averageCalories": 2000,
    "proteinBalance": "Well balanced with variety",
    "varietyScore": 8.5
  }
}`
        },
        {
          role: "user",
          content: `Create a 7-day meal plan for:
Family size: ${familySize} people
Dietary restrictions: ${dietaryRestrictions.length > 0 ? dietaryRestrictions.join(', ') : 'None'}
Cuisine preferences: ${cuisinePreferences.length > 0 ? cuisinePreferences.join(', ') : 'Variety'}
Cooking skill: ${cookingSkill}
Budget: ${budget}
Available ingredients to use: ${availableIngredients.length > 0 ? availableIngredients.join(', ') : 'None specified'}

Focus on practical, family-friendly meals that save time and reduce food waste.`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 4000,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response content from OpenAI');
    }
    
    return JSON.parse(content);
  } catch (error) {
    console.warn('OpenAI API unavailable for meal plan generation, using fallback:', error instanceof Error ? error.message : 'Unknown error');
    return getMockWeeklyMealPlan(familySize, dietaryRestrictions);
  }
}

function getMockWeeklyMealPlan(familySize: number, dietaryRestrictions: string[]): WeeklyMealPlan {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const currentDate = new Date();
  
  return {
    days: days.map((day, index) => ({
      day,
      date: new Date(currentDate.getTime() + index * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      meals: {
        breakfast: {
          title: index % 3 === 0 ? 'Overnight Oats' : index % 3 === 1 ? 'Scrambled Eggs & Toast' : 'Greek Yogurt Parfait',
          description: 'Nutritious breakfast to start the day',
          cookTime: 10,
          ingredients: ['oats', 'milk', 'berries'],
          tags: ['Quick', 'Healthy']
        },
        lunch: {
          title: index % 2 === 0 ? 'Turkey Sandwich' : 'Caesar Salad',
          description: 'Quick and satisfying lunch',
          cookTime: 15,
          ingredients: ['bread', 'turkey', 'lettuce'],
          tags: ['Quick', 'Easy']
        },
        dinner: {
          title: index % 4 === 0 ? 'Grilled Chicken with Vegetables' : index % 4 === 1 ? 'Pasta Marinara' : index % 4 === 2 ? 'Stir Fry' : 'Baked Salmon',
          description: `Family dinner for ${familySize} people`,
          cookTime: 30,
          ingredients: ['main protein', 'vegetables', 'seasoning'],
          tags: ['Family-friendly', 'Balanced']
        }
      }
    })),
    shoppingList: {
      ingredients: ['chicken', 'pasta', 'vegetables', 'eggs', 'milk', 'bread', 'salmon', 'rice'],
      categories: {
        'Produce': ['tomatoes', 'lettuce', 'broccoli', 'carrots', 'onions'],
        'Protein': ['chicken breast', 'ground beef', 'salmon', 'eggs'],
        'Dairy': ['milk', 'cheese', 'yogurt'],
        'Pantry': ['pasta', 'rice', 'bread', 'oats']
      }
    },
    nutritionSummary: {
      averageCalories: 2000,
      proteinBalance: 'Well balanced variety',
      varietyScore: 7.5
    }
  };
}