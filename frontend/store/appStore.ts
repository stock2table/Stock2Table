import { create } from 'zustand';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface PantryItem {
  item_id: string;
  name: string;
  quantity: number;
  unit: string;
  expiry_date?: string;
  category: string;
  image_base64?: string;
}

interface Recipe {
  recipe_id: string;
  name: string;
  cuisine_type: string;
  ingredients: any[];
  instructions: string[];
  prep_time: number;
  cook_time: number;
  difficulty: string;
  dietary_tags: string[];
  image_url: string;
}

interface FamilyMember {
  member_id: string;
  name: string;
  age?: number;
  email?: string;
  relationship?: string;
  dietary_restrictions: string[];
  allergies: string[];
  preferences: string[];
}

interface MealPlan {
  plan_id: string;
  week_start_date: string;
  meals: any[];
}

interface ShoppingList {
  list_id: string;
  meal_plan_id?: string;
  items: any[];
}

interface AppState {
  pantryItems: PantryItem[];
  recipes: Recipe[];
  familyMembers: FamilyMember[];
  mealPlans: MealPlan[];
  shoppingLists: ShoppingList[];
  favorites: string[];
  
  // Actions
  fetchPantry: (token: string) => Promise<void>;
  addPantryItem: (token: string, item: any) => Promise<void>;
  deletePantryItem: (token: string, itemId: string) => Promise<void>;
  
  fetchRecipes: (filters?: any) => Promise<void>;
  toggleFavorite: (recipeId: string) => Promise<void>;
  
  fetchFamilyMembers: (token: string) => Promise<void>;
  addFamilyMember: (token: string, member: any) => Promise<void>;
  
  fetchMealPlans: (token: string) => Promise<void>;
  fetchShoppingLists: (token: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  pantryItems: [],
  recipes: [],
  familyMembers: [],
  mealPlans: [],
  shoppingLists: [],
  favorites: [],

  fetchPantry: async (token: string) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/pantry`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ pantryItems: response.data });
    } catch (error) {
      console.error('Error fetching pantry:', error);
    }
  },

  addPantryItem: async (token: string, item: any) => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/pantry`, item, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set((state) => ({ pantryItems: [...state.pantryItems, response.data] }));
    } catch (error) {
      console.error('Error adding pantry item:', error);
      throw error;
    }
  },

  deletePantryItem: async (token: string, itemId: string) => {
    try {
      await axios.delete(`${BACKEND_URL}/api/pantry/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set((state) => ({
        pantryItems: state.pantryItems.filter(item => item.item_id !== itemId)
      }));
    } catch (error) {
      console.error('Error deleting pantry item:', error);
      throw error;
    }
  },

  fetchRecipes: async (filters?: any) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await axios.get(`${BACKEND_URL}/api/recipes?${params}`);
      set({ recipes: response.data });
    } catch (error) {
      console.error('Error fetching recipes:', error);
    }
  },

  toggleFavorite: async (recipeId: string) => {
    try {
      const { favorites } = get();
      const newFavorites = favorites.includes(recipeId)
        ? favorites.filter(id => id !== recipeId)
        : [...favorites, recipeId];
      
      await AsyncStorage.setItem('favorites', JSON.stringify(newFavorites));
      set({ favorites: newFavorites });
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  },

  fetchFamilyMembers: async (token: string) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/family`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ familyMembers: response.data });
    } catch (error) {
      console.error('Error fetching family members:', error);
    }
  },

  addFamilyMember: async (token: string, member: any) => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/family`, member, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set((state) => ({ familyMembers: [...state.familyMembers, response.data] }));
    } catch (error) {
      console.error('Error adding family member:', error);
      throw error;
    }
  },

  fetchMealPlans: async (token: string) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/meal-plans`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ mealPlans: response.data });
    } catch (error) {
      console.error('Error fetching meal plans:', error);
    }
  },

  fetchShoppingLists: async (token: string) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/shopping-lists`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ shoppingLists: response.data });
    } catch (error) {
      console.error('Error fetching shopping lists:', error);
    }
  },
}));
