import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Image, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useAppStore } from '../../store/appStore';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'];

const MEAL_ICONS: any = {
  breakfast: 'sunny',
  lunch: 'partly-sunny',
  dinner: 'moon',
};

const HERO_IMAGE = 'https://images.unsplash.com/photo-1493770348161-369560ae357d?w=800&q=80';

export default function MealPlanScreen() {
  const { sessionToken } = useAuth();
  const { mealPlans, fetchMealPlans, pantryItems } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  useEffect(() => {
    if (sessionToken) {
      loadMealPlans();
    }
  }, [sessionToken]);

  useEffect(() => {
    if (mealPlans.length > 0 && !selectedPlan) {
      setSelectedPlan(mealPlans[0]);
    }
  }, [mealPlans]);

  const loadMealPlans = async () => {
    setLoading(true);
    await fetchMealPlans(sessionToken!);
    setLoading(false);
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
      await loadMealPlans();
    } catch (error) {
      console.error('Error generating meal plan:', error);
      Alert.alert('Error', 'Failed to generate meal plan. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const getMealForDayAndType = (day: string, mealType: string) => {
    if (!selectedPlan) return null;
    return selectedPlan.meals.find(
      (m: any) => m.day === day && m.meal_type === mealType
    );
  };

  const getMealColor = (mealType: string) => {
    switch (mealType) {
      case 'breakfast': return ['#f97316', '#ea580c'];
      case 'lunch': return ['#22c55e', '#16a34a'];
      case 'dinner': return ['#8b5cf6', '#7c3aed'];
      default: return ['#6b7280', '#4b5563'];
    }
  };

  return (
    <View style={styles.container}>
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
                  <Text style={styles.planMeals}>{selectedPlan.meals?.length || 0} meals planned</Text>
                </View>
              </View>
            </View>

            {/* Days */}
            {DAYS.map((day, dayIndex) => (
              <View key={day} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayTitle}>{day}</Text>
                  <Text style={styles.dayNumber}>{dayIndex + 1}</Text>
                </View>
                
                <View style={styles.mealsContainer}>
                  {MEAL_TYPES.map((mealType) => {
                    const meal = getMealForDayAndType(day, mealType);
                    const [color1, color2] = getMealColor(mealType);
                    
                    return (
                      <View key={mealType} style={styles.mealSlot}>
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
                      </View>
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
            <Text style={styles.sectionTitle}>Previous Plans</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {mealPlans.slice(1, 5).map((plan) => (
                <TouchableOpacity
                  key={plan.plan_id}
                  style={[
                    styles.historyCard,
                    selectedPlan?.plan_id === plan.plan_id && styles.historyCardActive
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
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  // Hero
  heroSection: {
    height: 180,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
    justifyContent: 'flex-end',
    padding: 20,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: 'white',
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  // Generate
  generateSection: {
    padding: 16,
    marginTop: -30,
  },
  generateButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  generateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  generateText: {
    fontSize: 17,
    fontWeight: '700',
    color: 'white',
  },
  generateHint: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 12,
  },
  // Loading
  loadingContainer: {
    padding: 60,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 12,
  },
  // Plan
  planContainer: {
    padding: 16,
  },
  planHeader: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  planInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  planMeals: {
    fontSize: 13,
    color: '#6b7280',
  },
  // Day Cards
  dayCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  mealsContainer: {
    gap: 12,
  },
  mealSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mealIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealInfo: {
    flex: 1,
  },
  mealType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mealName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 2,
  },
  emptyMeal: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginTop: 2,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: 48,
  },
  emptyIconBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  // History
  historySection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  historyCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 120,
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  historyCardActive: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  historyDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 8,
  },
  historyMeals: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
});
