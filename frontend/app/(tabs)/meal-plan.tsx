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

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'];

// Helper to get day name from date string
const getDayNameFromDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return DAYS[date.getDay() === 0 ? 6 : date.getDay() - 1]; // Adjust for Sunday
};

// Helper to get date string for a specific day offset from week start
const getDateForDayIndex = (weekStartDate: string, dayIndex: number) => {
  const startDate = new Date(weekStartDate);
  const targetDate = new Date(startDate);
  targetDate.setDate(startDate.getDate() + dayIndex);
  return targetDate.toISOString().split('T')[0];
};

const MEAL_ICONS: any = {
  breakfast: 'sunny',
  lunch: 'partly-sunny',
  dinner: 'moon',
};

// Reliable food images for each meal type
const MEAL_IMAGES: Record<string, string[]> = {
  breakfast: [
    'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=300&q=80',
    'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=300&q=80',
    'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=300&q=80',
  ],
  lunch: [
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&q=80',
    'https://images.unsplash.com/photo-1547592180-85f173990554?w=300&q=80',
  ],
  dinner: [
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=300&q=80',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&q=80',
    'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=300&q=80',
  ],
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
      // Fetch pantry first, then meal plans
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

  const getMealForDayAndType = (day: string, mealType: string) => {
    if (!selectedPlan || !selectedPlan.meals) {
      console.log('No selected plan or meals array');
      return null;
    }
    
    // Log for debugging
    console.log(`Looking for meal: day=${day}, type=${mealType}`);
    console.log('Available meals:', selectedPlan.meals);
    
    // Try multiple matching strategies
    const meal = selectedPlan.meals.find((m: any) => {
      // Case-insensitive matching for both day and meal_type
      const dayMatch = m.day?.toLowerCase() === day.toLowerCase();
      const typeMatch = m.meal_type?.toLowerCase() === mealType.toLowerCase();
      return dayMatch && typeMatch;
    });
    
    if (meal) {
      console.log(`Found meal for ${day} ${mealType}:`, meal.recipe_name);
    }
    
    return meal;
  };

  const getMealColor = (mealType: string) => {
    switch (mealType) {
      case 'breakfast': return ['#f97316', '#ea580c'];
      case 'lunch': return ['#22c55e', '#16a34a'];
      case 'dinner': return ['#8b5cf6', '#7c3aed'];
      default: return ['#6b7280', '#4b5563'];
    }
  };

  const getMealImage = (mealType: string, index: number) => {
    const images = MEAL_IMAGES[mealType] || MEAL_IMAGES.dinner;
    return images[index % images.length];
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
        ) : selectedPlan ? (
          <View style={styles.planContainer}>
            {/* Plan Header */}
            <View style={styles.planHeader}>
              <View style={styles.planInfo}>
                <Ionicons name="calendar" size={24} color="#22c55e" />
                <View>
                  <Text style={styles.planTitle}>Week of {selectedPlan.week_start_date}</Text>
                  <Text style={styles.planMeals}>
                    {selectedPlan.meals?.length || 0} meals planned
                    {selectedPlan.meals?.length > 0 && ` (${selectedPlan.meals.map((m: any) => m.day).filter((v: any, i: number, a: any) => a.indexOf(v) === i).length} days)`}
                  </Text>
                </View>
              </View>
            </View>

            {/* Debug Info - Remove in production */}
            {selectedPlan.meals && selectedPlan.meals.length > 0 && (
              <View style={styles.debugInfo}>
                <Text style={styles.debugText}>
                  Sample meal: {JSON.stringify(selectedPlan.meals[0])}
                </Text>
              </View>
            )}

            {/* Days */}
            {DAYS.map((day, dayIndex) => (
              <View key={day} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayTitle}>{day}</Text>
                  <Text style={styles.dayNumber}>{dayIndex + 1}</Text>
                </View>
                
                <View style={styles.mealsContainer}>
                  {MEAL_TYPES.map((mealType, mealIndex) => {
                    const meal = getMealForDayAndType(day, mealType);
                    const [color1, color2] = getMealColor(mealType);
                    
                    return (
                      <TouchableOpacity 
                        key={mealType} 
                        style={styles.mealSlot}
                        onPress={() => meal && navigateToRecipe(meal)}
                        activeOpacity={meal ? 0.7 : 1}
                        disabled={!meal}
                      >
                        {meal && (
                          <Image 
                            source={{ uri: getMealImage(mealType, dayIndex + mealIndex) }} 
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
                            <Text style={styles.mealName} numberOfLines={1}>
                              {meal.recipe_name}
                            </Text>
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
            ))}
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
  debugInfo: { backgroundColor: '#fef3c7', padding: 12, marginHorizontal: 16, marginBottom: 12, borderRadius: 8 },
  debugText: { fontSize: 10, color: '#92400e', fontFamily: 'monospace' },
});
