import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useAppStore } from '../../store/appStore';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'];

export default function MealPlanScreen() {
  const { sessionToken } = useAuth();
  const { mealPlans, fetchMealPlans } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  useEffect(() => {
    if (sessionToken) {
      loadMealPlans();
    }
  }, [sessionToken]);

  const loadMealPlans = async () => {
    setLoading(true);
    await fetchMealPlans(sessionToken!);
    setLoading(false);
  };

  const generateAIMealPlan = async () => {
    try {
      setGenerating(true);
      const today = new Date();
      const weekStart = today.toISOString().split('T')[0];

      const response = await axios.post(
        `${BACKEND_URL}/api/meal-plans/generate`,
        { week_start_date: weekStart },
        { headers: { Authorization: `Bearer ${sessionToken}` } }
      );

      setSelectedPlan(response.data);
      await loadMealPlans();
    } catch (error) {
      console.error('Error generating meal plan:', error);
      alert('Failed to generate meal plan. Please try again.');
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

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Weekly Meal Plan</Text>
          <TouchableOpacity
            style={styles.generateButton}
            onPress={generateAIMealPlan}
            disabled={generating}
          >
            {generating ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="sparkles" size={20} color="white" />
                <Text style={styles.generateButtonText}>Generate with AI</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
          </View>
        ) : selectedPlan ? (
          <View style={styles.calendarContainer}>
            {DAYS.map((day) => (
              <View key={day} style={styles.dayCard}>
                <Text style={styles.dayTitle}>{day}</Text>
                {MEAL_TYPES.map((mealType) => {
                  const meal = getMealForDayAndType(day, mealType);
                  return (
                    <View key={mealType} style={styles.mealSlot}>
                      <View style={styles.mealHeader}>
                        <Ionicons
                          name={
                            mealType === 'breakfast'
                              ? 'sunny'
                              : mealType === 'lunch'
                              ? 'partly-sunny'
                              : 'moon'
                          }
                          size={16}
                          color="#666"
                        />
                        <Text style={styles.mealType}>
                          {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                        </Text>
                      </View>
                      {meal ? (
                        <Text style={styles.mealName}>{meal.recipe_name}</Text>
                      ) : (
                        <Text style={styles.emptyMeal}>Not planned</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No meal plan yet</Text>
            <Text style={styles.emptySubtext}>
              Generate an AI-powered meal plan based on your pantry
            </Text>
          </View>
        )}

        {/* Meal Plans History */}
        {mealPlans.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>Previous Plans</Text>
            {mealPlans.slice(0, 3).map((plan) => (
              <TouchableOpacity
                key={plan.plan_id}
                style={styles.historyCard}
                onPress={() => setSelectedPlan(plan)}
              >
                <Ionicons name="calendar" size={24} color="#4CAF50" />
                <View style={styles.historyInfo}>
                  <Text style={styles.historyTitle}>
                    Week of {plan.week_start_date}
                  </Text>
                  <Text style={styles.historyMeals}>
                    {plan.meals.length} meals planned
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  generateButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 48,
    alignItems: 'center',
  },
  calendarContainer: {
    padding: 16,
  },
  dayCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  mealSlot: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  mealType: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  mealName: {
    fontSize: 16,
    color: '#333',
    marginLeft: 24,
  },
  emptyMeal: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    marginLeft: 24,
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
    textAlign: 'center',
  },
  historySection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  historyCard: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  historyMeals: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});
