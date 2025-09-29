import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

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

  const httpServer = createServer(app);

  return httpServer;
}
