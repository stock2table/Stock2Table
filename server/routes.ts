import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { identifyIngredientsFromImage, generateRecipeRecommendations, enhanceRecipeRecommendations } from "./ai";
import multer from "multer";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
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

  const httpServer = createServer(app);

  return httpServer;
}
