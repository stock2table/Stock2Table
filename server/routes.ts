import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { identifyIngredientsFromImage, generateRecipeRecommendations, enhanceRecipeRecommendations, generateChatResponse, generateSuggestions, generateProactiveSuggestions, generateSmartSuggestions, generateQuickRecipe } from "./ai";
import multer from "multer";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // API health check endpoint
  app.get('/api/health', async (req, res) => {
    try {
      // Test database connection
      const dbHealthy = await storage.getRecipes(1).then(() => true).catch(() => false);
      
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
          database: dbHealthy ? 'healthy' : 'unavailable',
          openai: process.env.OPENAI_API_KEY ? 'configured' : 'not configured'
        }
      });
    } catch (error) {
      res.status(503).json({
        status: 'error',
        message: 'Service unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Test route to verify storage functionality
  app.get('/api/test/storage', async (req, res) => {
    try {
      // Test basic functionality
      const recipes = await storage.getRecipes(5);
      const user = await storage.getUser('default-user-id');
      const pantryItems = await storage.getPantryItems('default-user-id');
      const familyMembers = await storage.getFamilyMembers('default-user-id');
      
      // Test recipe with ingredients
      const recipeWithIngredients = recipes.length > 0 
        ? await storage.getRecipeWithIngredients(recipes[0].id)
        : null;
        
      // Test recommendations
      const availableIngredients = pantryItems.map(item => item.ingredient.name);
      const recommendations = await storage.getRecommendedRecipes('default-user-id', availableIngredients);

      res.json({
        success: true,
        data: {
          recipesCount: recipes.length,
          userFound: !!user,
          pantryItemsCount: pantryItems.length,
          familyMembersCount: familyMembers.length,
          recipeWithIngredients: recipeWithIngredients ? {
            title: recipeWithIngredients.title,
            ingredientsCount: recipeWithIngredients.ingredients.length
          } : null,
          recommendationsCount: recommendations.length,
          availableIngredients
        }
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Get recipes endpoint
  app.get('/api/recipes', async (req, res) => {
    try {
      const recipes = await storage.getRecipes();
      res.json(recipes);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get pantry items endpoint
  app.get('/api/pantry/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const pantryItems = await storage.getPantryItems(userId);
      res.json(pantryItems);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Validation schemas
  const recipeRecommendationSchema = z.object({
    userId: z.string().min(1, "User ID is required"),
    availableIngredients: z.array(z.string()).min(1, "At least one ingredient is required")
  });

  // Set up multer for file uploads with image type validation
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
      // Accept only image files
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed!'));
      }
    }
  });

  // AI ingredient scanning endpoint
  app.post('/api/scan-ingredients', upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      // Convert buffer to base64
      const base64Image = req.file.buffer.toString('base64');

      // Use AI to identify ingredients
      const result = await identifyIngredientsFromImage(base64Image);

      res.json(result);
    } catch (error) {
      console.error('Ingredient scanning error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to scan ingredients' 
      });
    }
  });

  // AI recipe recommendations endpoint  
  app.post('/api/recipes/recommendations', async (req, res) => {
    try {
      // Validate request body
      const validation = recipeRecommendationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Invalid request data',
          details: validation.error.issues
        });
      }

      const { userId, availableIngredients } = validation.data;

      // Get user preferences and family data for enhanced recommendations
      const preferences = await storage.getUserPreferences(userId);
      const familyMembers = await storage.getFamilyMembers(userId);

      // Get dietary restrictions and preferences from family members
      const dietaryRestrictions: string[] = [];
      const cuisinePreferences: string[] = [];
      
      familyMembers.forEach(member => {
        dietaryRestrictions.push(...member.dietary);
        cuisinePreferences.push(...member.preferences);
      });

      // Add user preferences
      if (preferences?.cuisinePreferences) {
        cuisinePreferences.push(...preferences.cuisinePreferences);
      }

      // Generate base recommendations
      const baseRecipes = await generateRecipeRecommendations(
        availableIngredients,
        Array.from(new Set(dietaryRestrictions)), // Remove duplicates
        Array.from(new Set(cuisinePreferences)), // Remove duplicates  
        preferences?.familySize || 4
      );

      // Enhance recommendations with family context if available
      let enhancedRecipes = baseRecipes;
      if (preferences && familyMembers.length > 0) {
        try {
          enhancedRecipes = await enhanceRecipeRecommendations(
            baseRecipes,
            preferences,
            familyMembers
          );
        } catch (error) {
          console.error('Recipe enhancement failed, using base recipes:', error);
        }
      }

      res.json({ recipes: enhancedRecipes });
    } catch (error) {
      console.error('Recipe recommendation error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to get recipe recommendations' 
      });
    }
  });

  // Get recipe with ingredients endpoint
  app.get('/api/recipes/:id/with-ingredients', async (req, res) => {
    try {
      const { id } = req.params;
      const recipe = await storage.getRecipeWithIngredients(id);
      
      if (!recipe) {
        return res.status(404).json({ error: 'Recipe not found' });
      }

      res.json(recipe);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get family members endpoint
  app.get('/api/family/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const familyMembers = await storage.getFamilyMembers(userId);
      res.json(familyMembers);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Add ingredients to pantry endpoint
  const addToPantrySchema = z.object({
    userId: z.string().min(1, "User ID is required"),
    ingredients: z.array(z.object({
      name: z.string().min(1, "Ingredient name is required"),
      quantity: z.string().optional(),
      unit: z.string().optional()
    })).min(1, "At least one ingredient is required")
  });

  app.post('/api/pantry/add', async (req, res) => {
    try {
      // Validate request body
      const validation = addToPantrySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Invalid request data',
          details: validation.error.issues
        });
      }

      const { userId, ingredients } = validation.data;
      const addedItems = [];

      for (const ingredientData of ingredients) {
        // Find or create ingredient
        let ingredient = (await storage.searchIngredients(ingredientData.name)).find(
          ing => ing.name.toLowerCase() === ingredientData.name.toLowerCase()
        );

        if (!ingredient) {
          // Create new ingredient if it doesn't exist
          ingredient = await storage.createIngredient({
            name: ingredientData.name,
            category: "Other", // Default category
            nutritionalInfo: null
          });
        }

        // Add to pantry
        const pantryItem = await storage.createPantryItem({
          userId,
          ingredientId: ingredient.id,
          quantity: ingredientData.quantity || "1",
          unit: ingredientData.unit || "piece",
          expiryDate: null
        });

        addedItems.push(pantryItem);
      }

      res.json({ 
        success: true, 
        message: `Added ${addedItems.length} ingredients to pantry`,
        items: addedItems 
      });
    } catch (error) {
      console.error('Add to pantry error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to add ingredients to pantry' 
      });
    }
  });

  // Chat endpoint for conversational AI agent
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, context } = req.body
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' })
      }

      // Build context for the AI agent
      const pantryItems = context?.pantryItems || []
      const previousMessages = context?.previousMessages || []
      
      const systemPrompt = `You are a helpful meal planning assistant for Stock2Table. You help users:
      - Create recipes from their pantry ingredients
      - Plan weekly meals
      - Generate shopping lists
      - Suggest healthy options
      - Answer cooking questions
      
      User's current pantry: ${pantryItems.map((item: any) => `${item.name} (${item.quantity} ${item.unit})`).join(', ') || 'No ingredients in pantry'}
      
      Keep responses conversational, helpful, and under 150 words. Provide actionable suggestions.`

      const response = await generateChatResponse(message, systemPrompt, previousMessages)
      
      // Generate contextual suggestions based on the conversation
      const suggestions = generateSuggestions(message, pantryItems)
      
      res.json({
        message: response,
        suggestions: suggestions
      })
    } catch (error) {
      console.error('Chat error:', error)
      res.status(500).json({ error: 'Failed to process chat message' })
    }
  })

  // Proactive suggestions endpoints
  app.get('/api/suggestions/proactive/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Get user's pantry and context
      const pantryItems = await storage.getPantryItems(userId);
      const userPreferences = await storage.getUserPreferences(userId);
      
      // Generate proactive suggestions based on pantry, time, and patterns
      const suggestions = await generateProactiveSuggestions(pantryItems, userPreferences);
      
      res.json(suggestions);
    } catch (error) {
      console.error('Proactive suggestions error:', error);
      res.status(500).json({ error: 'Failed to generate suggestions' });
    }
  });

  app.post('/api/suggestions/generate', async (req, res) => {
    try {
      const { userId, context } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      // Get comprehensive user context
      const pantryItems = await storage.getPantryItems(userId);
      const familyMembers = await storage.getFamilyMembers(userId);
      const userPreferences = await storage.getUserPreferences(userId);
      
      // Generate AI-powered suggestions
      const suggestions = await generateSmartSuggestions({
        userId,
        pantryItems,
        familyMembers,
        userPreferences,
        context
      });
      
      res.json({ suggestions });
    } catch (error) {
      console.error('Generate suggestions error:', error);
      res.status(500).json({ error: 'Failed to generate suggestions' });
    }
  });

  app.post('/api/suggestions/dismiss', async (req, res) => {
    try {
      const { suggestionId } = req.body;
      
      if (!suggestionId) {
        return res.status(400).json({ error: 'Suggestion ID is required' });
      }

      // Store dismissed suggestion to avoid re-showing
      // For now, just return success - in production, store in database
      res.json({ success: true });
    } catch (error) {
      console.error('Dismiss suggestion error:', error);
      res.status(500).json({ error: 'Failed to dismiss suggestion' });
    }
  });

  app.post('/api/recipes/quick-generate', async (req, res) => {
    try {
      const { ingredients, preferences } = req.body;
      
      // Generate quick recipe based on available ingredients
      const recipe = await generateQuickRecipe(ingredients, preferences);
      
      res.json(recipe);
    } catch (error) {
      console.error('Quick recipe generation error:', error);
      res.status(500).json({ error: 'Failed to generate recipe' });
    }
  });

  // Get pantry items endpoint
  app.get('/api/pantry/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const pantryItems = await storage.getPantryItems(userId);
      res.json(pantryItems);
    } catch (error) {
      console.error('Get pantry error:', error);
      res.status(500).json({ error: 'Failed to get pantry items' });
    }
  });

  // Meal plan endpoints
  app.post('/api/meal-plans', async (req, res) => {
    try {
      const { userId, startDate, meals } = req.body;
      
      // For now, return success - in production would create meal plan
      res.json({ 
        id: `meal-plan-${Date.now()}`,
        userId,
        startDate,
        message: 'Meal plan created successfully' 
      });
    } catch (error) {
      console.error('Create meal plan error:', error);
      res.status(500).json({ error: 'Failed to create meal plan' });
    }
  });

  app.post('/api/meal-plans/add-recipe', async (req, res) => {
    try {
      const { userId, recipeId, date } = req.body;
      
      // For now, return success - in production would add recipe to meal plan
      res.json({ 
        message: 'Recipe added to meal plan',
        recipeId,
        date 
      });
    } catch (error) {
      console.error('Add recipe to meal plan error:', error);
      res.status(500).json({ error: 'Failed to add recipe to meal plan' });
    }
  });

  // Shopping list endpoint
  app.post('/api/shopping/generate', async (req, res) => {
    try {
      const { userId, mealPlanId } = req.body;
      
      // For now, return mock shopping list - in production would generate from meal plan
      res.json({ 
        id: `shopping-${Date.now()}`,
        items: [
          { name: 'Tomatoes', quantity: '2', unit: 'pieces' },
          { name: 'Onions', quantity: '1', unit: 'pieces' },
          { name: 'Garlic', quantity: '3', unit: 'cloves' }
        ],
        message: 'Shopping list generated' 
      });
    } catch (error) {
      console.error('Generate shopping list error:', error);
      res.status(500).json({ error: 'Failed to generate shopping list' });
    }
  });

  // Recipe favorite endpoint
  app.post('/api/recipes/:id/favorite', async (req, res) => {
    try {
      const { id } = req.params;
      const { userId, isFavorite } = req.body;
      
      // For now, return success - in production would store favorite status
      res.json({ 
        recipeId: id,
        isFavorite,
        message: isFavorite ? 'Added to favorites' : 'Removed from favorites'
      });
    } catch (error) {
      console.error('Toggle favorite error:', error);
      res.status(500).json({ error: 'Failed to toggle favorite' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
