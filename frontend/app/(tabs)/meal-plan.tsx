import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Image, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useAppStore } from '../../store/appStore';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'];

// Get day name from date string
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr + 'T00:00:00');
  const dayName = DAY_NAMES[date.getDay()];
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  return { dayName, formatted: `${dayName}, ${month} ${day}` };
};

// Get unique dates from meals
const getUniqueDates = (meals: any[]) => {
  if (!meals || meals.length === 0) return [];
  const dates = [...new Set(meals.map(m => m.day))].sort();
  return dates;
};

const MEAL_ICONS: any = {
  breakfast: 'sunny',
  lunch: 'partly-sunny',
  dinner: 'moon',
};

// Reliable food images based on recipe name keywords
const getMealImageByName = (recipeName: string, mealType: string) => {
  const name = recipeName.toLowerCase();
  
  // Breakfast images
  if (name.includes('egg') || name.includes('scrambled')) {
    return 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&q=80';
  }
  if (name.includes('toast') || name.includes('avocado')) {
    return 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=400&q=80';
  }
  if (name.includes('cereal') || name.includes('yogurt')) {
    return 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=400&q=80';
  }
  if (name.includes('bagel')) {
    return 'https://images.unsplash.com/photo-1585445490387-f47934b73b54?w=400&q=80';
  }
  if (name.includes('pancake') || name.includes('waffle')) {
    return 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80';
  }
  
  // Lunch/Dinner images
  if (name.includes('salad')) {
    return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80';
  }
  if (name.includes('pasta') || name.includes('spaghetti')) {
    return 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&q=80';
  }
  if (name.includes('curry') || name.includes('dal') || name.includes('lentil')) {
    return 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80';
  }
  if (name.includes('chicken') || name.includes('nugget')) {
    return 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80';
  }
  if (name.includes('rice')) {
    return 'https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=400&q=80';
  }
  if (name.includes('stir fry') || name.includes('vegetable')) {
    return 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=400&q=80';
  }
  if (name.includes('soup') || name.includes('stew')) {
    return 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80';
  }
  if (name.includes('sandwich') || name.includes('burger') || name.includes('patty')) {
    return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80';
  }
  if (name.includes('chickpea') || name.includes('chana')) {
    return 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=400&q=80';
  }
  
  // Default images by meal type
  const defaults: Record<string, string> = {
    breakfast: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&q=80',
    lunch: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
    dinner: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80',
  };
  
  return defaults[mealType] || defaults.lunch;
};

const HERO_IMAGE = 'https://images.unsplash.com/photo-1493770348161-369560ae357d?w=800&q=80';

export default function MealPlanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sessionToken } = useAuth();
  const { mealPlans, fetchMealPlans, pantryItems, fetchPantry } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  useEffect(() => {
    if (sessionToken) {
      loadInitialData();
    }
  }, [sessionToken]);

  useEffect(() => {
    if (mealPlans.length > 0 && !selectedPlan) {
      setSelectedPlan(mealPlans[0]);
    }
  }, [mealPlans]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await fetchPantry(sessionToken!);
      await fetchMealPlans(sessionToken!);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAIMealPlan = async () => {
    if (pantryItems.length === 0) {
      Alert.alert(
        'Empty Pantry',
        'Add some ingredients to your pantry first so the AI can create a personalized meal plan!',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setGenerating(true);
      const today = new Date();
      const weekStart = today.toISOString().split('T')[0];

      const response = await axios.post(
        `${BACKEND_URL}/api/meal-plans/generate`,
        { week_start_date: weekStart },
        { headers: { Authorization: `Bearer ${sessionToken}` }, timeout: 60000 }
      );

      setSelectedPlan(response.data);
      await fetchMealPlans(sessionToken!);
    } catch (error) {
      console.error('Error generating meal plan:', error);
      Alert.alert('Error', 'Failed to generate meal plan. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // Get meals for a specific date
  const getMealsForDate = (dateStr: string) => {
    if (!selectedPlan || !selectedPlan.meals) return [];
    return selectedPlan.meals.filter((m: any) => m.day === dateStr);
  };

  // Get a specific meal for date and type
  const getMealForDateAndType = (dateStr: string, mealType: string) => {
    if (!selectedPlan || !selectedPlan.meals) return null;
    return selectedPlan.meals.find((m: any) => 
      m.day === dateStr && m.meal_type?.toLowerCase() === mealType.toLowerCase()
    );
  };

  // Navigate to recipe detail or create one
  const navigateToMeal = (meal: any) => {
    if (meal) {
      // For now, just show the meal details in an alert
      // In the future, you could navigate to a recipe detail page
      Alert.alert(
        meal.recipe_name,
        `Ingredients needed:\n${meal.ingredients_needed?.join('\n• ') || 'No ingredients listed'}`,
        [{ text: 'OK' }]
      );
    }
  };

  const getMealColor = (mealType: string): [string, string] => {
    switch (mealType) {
      case 'breakfast': return ['#f97316', '#ea580c'];
      case 'lunch': return ['#22c55e', '#16a34a'];
      case 'dinner': return ['#8b5cf6', '#7c3aed'];
      default: return ['#6b7280', '#4b5563'];
    }
  };

  const navigateToRecipe = (meal: any) => {
    if (!meal) return;
    
    // Track activity
    try {
      axios.post(`${BACKEND_URL}/api/activity`, {
        activity_type: 'recipe_view',
        item_name: meal.recipe_name
      }, { headers: { Authorization: `Bearer ${sessionToken}` } });
    } catch (error) {}
    
    // Navigate to AI recipe screen with meal details
    router.push({
      pathname: '/ai-recipe',
      params: { 
        recipe: JSON.stringify({
          name: meal.recipe_name,
          meal_type: meal.meal_type,
          available_ingredients: pantryItems.map((p: any) => p.name),
        })
      }
    });
  };

  // Get unique dates from the selected plan
  const planDates = selectedPlan?.meals ? getUniqueDates(selectedPlan.meals) : [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Image source={{ uri: HERO_IMAGE }} style={styles.heroImage} />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.heroOverlay}>
            <Text style={styles.heroTitle}>Meal Planner</Text>
            <Text style={styles.heroSubtitle}>AI-powered weekly meal plans</Text>
          </LinearGradient>
        </View>

        {/* Generate Button */}
        <View style={styles.generateSection}>
          <TouchableOpacity
            style={styles.generateButton}
            onPress={generateAIMealPlan}
            disabled={generating}
            activeOpacity={0.9}
          >
            <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.generateGradient}>
              {generating ? (
                <>
                  <ActivityIndicator color="white" size="small" />
                  <Text style={styles.generateText}>Creating Your Plan...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="sparkles" size={24} color="white" />
                  <Text style={styles.generateText}>Generate AI Meal Plan</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.generateHint}>
            Based on your pantry ({pantryItems.length} items)
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#22c55e" />
            <Text style={styles.loadingText}>Loading meal plans...</Text>
          </View>
        ) : selectedPlan && planDates.length > 0 ? (
          <View style={styles.planContainer}>
            {/* Plan Header */}
            <View style={styles.planHeader}>
              <View style={styles.planInfo}>
                <Ionicons name="calendar" size={24} color="#22c55e" />
                <View>
                  <Text style={styles.planTitle}>Week of {selectedPlan.week_start_date}</Text>
                  <Text style={styles.planMeals}>{selectedPlan.meals?.length || 0} meals planned</Text>
                </View>
              </View>
            </View>

            {/* Days - Using actual dates from the plan */}
            {planDates.map((dateStr: string, dayIndex: number) => {
              const { dayName, formatted } = formatDate(dateStr);
              
              return (
                <View key={dateStr} style={styles.dayCard}>
                  <View style={styles.dayHeader}>
                    <Text style={styles.dayTitle}>{formatted}</Text>
                    <Text style={styles.dayNumber}>Day {dayIndex + 1}</Text>
                  </View>
                  
                  <View style={styles.mealsContainer}>
                    {MEAL_TYPES.map((mealType) => {
                      const meal = getMealForDateAndType(dateStr, mealType);
                      const [color1, color2] = getMealColor(mealType);
                      const mealImage = meal ? getMealImageByName(meal.recipe_name, mealType) : null;
                      
                      return (
                        <TouchableOpacity 
                          key={mealType} 
                          style={styles.mealSlot}
                          onPress={() => meal && navigateToRecipe(meal)}
                          activeOpacity={meal ? 0.7 : 1}
                          disabled={!meal}
                        >
                          {meal && mealImage && (
                            <Image 
                              source={{ uri: mealImage }} 
                              style={styles.mealThumbnail} 
                            />
                          )}
                          <LinearGradient colors={[color1, color2]} style={styles.mealIcon}>
                            <Ionicons name={MEAL_ICONS[mealType]} size={16} color="white" />
                          </LinearGradient>
                          <View style={styles.mealInfo}>
                            <Text style={styles.mealType}>
                              {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                            </Text>
                            {meal ? (
                              <>
                                <Text style={styles.mealName} numberOfLines={2}>
                                  {meal.recipe_name}
                                </Text>
                                <Text style={styles.ingredientCount}>
                                  {meal.ingredients_needed?.length || 0} ingredients
                                </Text>
                              </>
                            ) : (
                              <Text style={styles.emptyMeal}>Not planned</Text>
                            )}
                          </View>
                          {meal && (
                            <Ionicons name="chevron-forward" size={18} color="#22c55e" />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBg}>
              <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
            </View>
            <Text style={styles.emptyTitle}>No Meal Plan Yet</Text>
            <Text style={styles.emptySubtitle}>
              Generate an AI-powered meal plan based on the ingredients in your pantry
            </Text>
          </View>
        )}

        {/* Previous Plans */}
        {mealPlans.length > 1 && (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>Previous Plans</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {mealPlans.slice(1, 5).map((plan) => (
                <TouchableOpacity
                  key={plan.plan_id}
                  style={[
                    styles.historyCard,
                    selectedPlan?.plan_id === plan.plan_id && styles.historyCardActive,
                  ]}
                  onPress={() => setSelectedPlan(plan)}
                >
                  <Ionicons name="calendar" size={24} color="#22c55e" />
                  <Text style={styles.historyDate}>{plan.week_start_date}</Text>
                  <Text style={styles.historyMeals}>{plan.meals?.length || 0} meals</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollView: { flex: 1 },

  heroSection: { height: 180, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '100%', justifyContent: 'flex-end', padding: 20, paddingBottom: 24 },
  heroTitle: { fontSize: 28, fontWeight: '800', color: 'white' },
  heroSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 },

  generateSection: { alignItems: 'center', padding: 16, marginTop: -30 },
  generateButton: { width: '100%', borderRadius: 16, overflow: 'hidden', elevation: 6, shadowColor: '#22c55e', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  generateGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 10 },
  generateText: { fontSize: 17, fontWeight: '700', color: 'white' },
  generateHint: { marginTop: 10, fontSize: 13, color: '#6b7280' },

  loadingContainer: { padding: 60, alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6b7280' },

  planContainer: { padding: 16, paddingTop: 0 },
  planHeader: { backgroundColor: 'white', padding: 16, borderRadius: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 2 },
  planInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  planTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
  planMeals: { fontSize: 13, color: '#6b7280', marginTop: 2 },

  dayCard: { backgroundColor: 'white', borderRadius: 16, marginBottom: 12, overflow: 'hidden', elevation: 2 },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#f9fafb' },
  dayTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
  dayNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center', fontSize: 13, fontWeight: '600', color: '#6b7280', textAlign: 'center', lineHeight: 28 },

  mealsContainer: { padding: 12, gap: 10 },
  mealSlot: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#f9fafb', borderRadius: 12, gap: 12 },
  mealThumbnail: { width: 50, height: 50, borderRadius: 10, backgroundColor: '#e5e7eb' },
  mealIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  mealInfo: { flex: 1 },
  mealType: { fontSize: 11, fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase' },
  mealName: { fontSize: 14, fontWeight: '600', color: '#1f2937', marginTop: 2 },
  emptyMeal: { fontSize: 13, color: '#d1d5db', fontStyle: 'italic', marginTop: 2 },

  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyIconBg: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#374151' },
  emptySubtitle: { fontSize: 14, color: '#9ca3af', textAlign: 'center', marginTop: 8, lineHeight: 22 },

  historySection: { padding: 16, paddingTop: 8 },
  historyTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937', marginBottom: 12 },
  historyCard: { backgroundColor: 'white', borderRadius: 14, padding: 16, marginRight: 12, alignItems: 'center', minWidth: 120, borderWidth: 2, borderColor: 'transparent', elevation: 2 },
  historyCardActive: { borderColor: '#22c55e', backgroundColor: '#f0fdf4' },
  historyDate: { fontSize: 13, fontWeight: '600', color: '#1f2937', marginTop: 8 },
  historyMeals: { fontSize: 12, color: '#6b7280', marginTop: 2 },
});
