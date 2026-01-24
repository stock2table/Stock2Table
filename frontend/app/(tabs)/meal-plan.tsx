import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Image, Alert, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
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
  try {
    if (!dateStr || typeof dateStr !== 'string') {
      return { dayName: 'Unknown', formatted: 'Unknown Date' };
    }
    
    // Handle different date formats
    let date: Date;
    if (dateStr.includes('T')) {
      date = new Date(dateStr);
    } else if (dateStr.includes('-')) {
      // YYYY-MM-DD format
      date = new Date(dateStr + 'T12:00:00');
    } else {
      // Assume it's a day name like "Monday"
      return { dayName: dateStr, formatted: dateStr };
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return { dayName: dateStr, formatted: dateStr };
    }
    
    const dayName = DAY_NAMES[date.getDay()];
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    return { dayName, formatted: `${dayName}, ${month} ${day}` };
  } catch (error) {
    console.error('Date formatting error:', error, 'for date:', dateStr);
    return { dayName: 'Unknown', formatted: dateStr || 'Unknown Date' };
  }
};

// Get unique dates from meals
const getUniqueDates = (meals: any[]) => {
  if (!meals || !Array.isArray(meals) || meals.length === 0) return [];
  // Filter out undefined/null days and get unique values
  const validDays = meals.filter(m => m && m.day).map(m => m.day);
  const dates = [...new Set(validDays)].sort();
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
  
  // Modal state for customizing meals
  const [mealModalVisible, setMealModalVisible] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<any>(null);
  const [additionalIngredients, setAdditionalIngredients] = useState('');
  const [customIngredientsList, setCustomIngredientsList] = useState<string[]>([]);
  
  // Modal state for adding new meals
  const [addMealModalVisible, setAddMealModalVisible] = useState(false);
  const [addMealDate, setAddMealDate] = useState('');
  const [newMealName, setNewMealName] = useState('');
  const [newMealType, setNewMealType] = useState('lunch');
  const [newMealIngredients, setNewMealIngredients] = useState('');
  const [newMealIngredientsList, setNewMealIngredientsList] = useState<string[]>([]);
  const [savingMeal, setSavingMeal] = useState(false);

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

  // Open add meal modal for a specific date
  const openAddMealModal = (dateStr: string) => {
    setAddMealDate(dateStr);
    setNewMealName('');
    setNewMealType('lunch');
    setNewMealIngredients('');
    setNewMealIngredientsList([]);
    setAddMealModalVisible(true);
  };

  // Add ingredient to new meal
  const addNewMealIngredient = () => {
    const ingredient = newMealIngredients.trim();
    if (ingredient && !newMealIngredientsList.includes(ingredient)) {
      setNewMealIngredientsList([...newMealIngredientsList, ingredient]);
      setNewMealIngredients('');
    }
  };

  // Remove ingredient from new meal
  const removeNewMealIngredient = (ingredient: string) => {
    setNewMealIngredientsList(newMealIngredientsList.filter(i => i !== ingredient));
  };

  // Save new custom meal
  const saveNewMeal = async () => {
    if (!newMealName.trim()) {
      Alert.alert('Error', 'Please enter a meal name');
      return;
    }

    try {
      setSavingMeal(true);
      
      // Add the meal to the current plan
      const newMeal = {
        day: addMealDate,
        meal_type: newMealType,
        recipe_name: newMealName.trim(),
        ingredients_needed: newMealIngredientsList.length > 0 
          ? newMealIngredientsList 
          : pantryItems.slice(0, 3).map((p: any) => p.name),
        is_custom: true,
      };

      // Update the plan via API
      const response = await axios.post(
        `${BACKEND_URL}/api/meal-plans/${selectedPlan.plan_id}/add-meal`,
        newMeal,
        { headers: { Authorization: `Bearer ${sessionToken}` } }
      );

      // Update local state
      setSelectedPlan({
        ...selectedPlan,
        meals: [...(selectedPlan.meals || []), newMeal],
      });

      setAddMealModalVisible(false);
      Alert.alert('Success', 'Meal added successfully!');
    } catch (error) {
      console.error('Error adding meal:', error);
      // Still add locally even if API fails
      setSelectedPlan({
        ...selectedPlan,
        meals: [...(selectedPlan.meals || []), {
          day: addMealDate,
          meal_type: newMealType,
          recipe_name: newMealName.trim(),
          ingredients_needed: newMealIngredientsList.length > 0 
            ? newMealIngredientsList 
            : pantryItems.slice(0, 3).map((p: any) => p.name),
          is_custom: true,
        }],
      });
      setAddMealModalVisible(false);
    } finally {
      setSavingMeal(false);
    }
  };

  // Open meal customization modal
  const openMealModal = (meal: any) => {
    if (meal) {
      setSelectedMeal(meal);
      setAdditionalIngredients('');
      setCustomIngredientsList([]);
      setMealModalVisible(true);
    }
  };

  // Add ingredient to custom list
  const addCustomIngredient = () => {
    const ingredient = additionalIngredients.trim();
    if (ingredient && !customIngredientsList.includes(ingredient)) {
      setCustomIngredientsList([...customIngredientsList, ingredient]);
      setAdditionalIngredients('');
    }
  };

  // Remove ingredient from custom list
  const removeCustomIngredient = (ingredient: string) => {
    setCustomIngredientsList(customIngredientsList.filter(i => i !== ingredient));
  };

  // Get recipe with all ingredients (planned + custom)
  const getCustomRecipe = () => {
    if (!selectedMeal) return;
    
    // Combine planned ingredients with custom ones
    const allIngredients = [
      ...(selectedMeal.ingredients_needed || []),
      ...customIngredientsList
    ];
    
    // Track activity
    try {
      axios.post(`${BACKEND_URL}/api/activity`, {
        activity_type: 'recipe_view',
        item_name: selectedMeal.recipe_name
      }, { headers: { Authorization: `Bearer ${sessionToken}` } });
    } catch (error) {}
    
    setMealModalVisible(false);
    
    // Navigate to AI recipe screen with all ingredients
    router.push({
      pathname: '/ai-recipe',
      params: { 
        recipe: JSON.stringify({
          name: selectedMeal.recipe_name,
          meal_type: selectedMeal.meal_type,
          available_ingredients: [
            ...pantryItems.map((p: any) => p.name),
            ...customIngredientsList
          ],
          required_ingredients: allIngredients,
          custom_additions: customIngredientsList,
        })
      }
    });
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
                    <View>
                      <Text style={styles.dayTitle}>{formatted}</Text>
                      <Text style={styles.dayNumber}>Day {dayIndex + 1}</Text>
                    </View>
                    {/* Add Meal Button */}
                    <TouchableOpacity 
                      style={styles.addMealButton}
                      onPress={() => openAddMealModal(dateStr)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="add-circle" size={28} color="#22c55e" />
                    </TouchableOpacity>
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
                          onPress={() => meal && openMealModal(meal)}
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
                                  {meal.ingredients_needed?.length || 0} ingredients • Tap to customize
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

      {/* Meal Customization Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={mealModalVisible}
        onRequestClose={() => setMealModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                onPress={() => setMealModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Customize Your Meal</Text>
              <View style={{ width: 32 }} />
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Meal Info */}
              {selectedMeal && (
                <View style={styles.mealPreview}>
                  <Image 
                    source={{ uri: getMealImageByName(selectedMeal.recipe_name, selectedMeal.meal_type) }}
                    style={styles.mealPreviewImage}
                  />
                  <Text style={styles.mealPreviewTitle}>{selectedMeal.recipe_name}</Text>
                  <Text style={styles.mealPreviewType}>
                    {selectedMeal.meal_type?.charAt(0).toUpperCase() + selectedMeal.meal_type?.slice(1)}
                  </Text>
                </View>
              )}

              {/* Planned Ingredients */}
              <View style={styles.ingredientsSection}>
                <Text style={styles.sectionTitle}>Planned Ingredients</Text>
                <View style={styles.ingredientTags}>
                  {selectedMeal?.ingredients_needed?.map((ingredient: string, idx: number) => (
                    <View key={idx} style={styles.ingredientTag}>
                      <Ionicons name="checkmark-circle" size={14} color="#22c55e" />
                      <Text style={styles.ingredientTagText}>{ingredient}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Add Custom Ingredients */}
              <View style={styles.customSection}>
                <Text style={styles.sectionTitle}>Add Extra Ingredients</Text>
                <Text style={styles.sectionHint}>
                  Add your own ingredients to customize this recipe
                </Text>
                
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.ingredientInput}
                    placeholder="e.g., cheese, spinach, mushrooms"
                    placeholderTextColor="#9ca3af"
                    value={additionalIngredients}
                    onChangeText={setAdditionalIngredients}
                    onSubmitEditing={addCustomIngredient}
                    returnKeyType="done"
                  />
                  <TouchableOpacity 
                    style={styles.addButton}
                    onPress={addCustomIngredient}
                    disabled={!additionalIngredients.trim()}
                  >
                    <Ionicons name="add" size={24} color="white" />
                  </TouchableOpacity>
                </View>

                {/* Custom Ingredients List */}
                {customIngredientsList.length > 0 && (
                  <View style={styles.customIngredientsList}>
                    <Text style={styles.customIngredientsLabel}>Your additions:</Text>
                    <View style={styles.ingredientTags}>
                      {customIngredientsList.map((ingredient, idx) => (
                        <TouchableOpacity 
                          key={idx} 
                          style={[styles.ingredientTag, styles.customTag]}
                          onPress={() => removeCustomIngredient(ingredient)}
                        >
                          <Ionicons name="add-circle" size={14} color="#8b5cf6" />
                          <Text style={[styles.ingredientTagText, { color: '#8b5cf6' }]}>
                            {ingredient}
                          </Text>
                          <Ionicons name="close-circle" size={14} color="#8b5cf6" />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.quickRecipeBtn}
                onPress={() => {
                  setMealModalVisible(false);
                  navigateToRecipe(selectedMeal);
                }}
              >
                <Ionicons name="flash" size={20} color="#22c55e" />
                <Text style={styles.quickRecipeBtnText}>Quick Recipe</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.getRecipeBtn}
                onPress={getCustomRecipe}
              >
                <LinearGradient 
                  colors={['#22c55e', '#16a34a']} 
                  style={styles.getRecipeBtnGradient}
                >
                  <Ionicons name="restaurant" size={20} color="white" />
                  <Text style={styles.getRecipeBtnText}>
                    Get Custom Recipe
                    {customIngredientsList.length > 0 && ` (+${customIngredientsList.length})`}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add New Meal Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={addMealModalVisible}
        onRequestClose={() => setAddMealModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                onPress={() => setAddMealModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Add New Meal</Text>
              <View style={{ width: 32 }} />
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Date Display */}
              <View style={styles.addMealDateSection}>
                <Ionicons name="calendar" size={20} color="#22c55e" />
                <Text style={styles.addMealDateText}>
                  {addMealDate ? formatDate(addMealDate).formatted : 'Select a date'}
                </Text>
              </View>

              {/* Meal Type Selection */}
              <View style={styles.mealTypeSection}>
                <Text style={styles.sectionTitle}>Meal Type</Text>
                <View style={styles.mealTypeButtons}>
                  {MEAL_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.mealTypeButton,
                        newMealType === type && styles.mealTypeButtonActive
                      ]}
                      onPress={() => setNewMealType(type)}
                    >
                      <Ionicons 
                        name={MEAL_ICONS[type]} 
                        size={18} 
                        color={newMealType === type ? 'white' : '#6b7280'} 
                      />
                      <Text style={[
                        styles.mealTypeButtonText,
                        newMealType === type && styles.mealTypeButtonTextActive
                      ]}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Meal Name Input */}
              <View style={styles.inputSection}>
                <Text style={styles.sectionTitle}>Meal Name</Text>
                <TextInput
                  style={styles.mealNameInput}
                  placeholder="e.g., Grilled Chicken Salad, Pasta Primavera..."
                  placeholderTextColor="#9ca3af"
                  value={newMealName}
                  onChangeText={setNewMealName}
                />
              </View>

              {/* Ingredients Section */}
              <View style={styles.inputSection}>
                <Text style={styles.sectionTitle}>Ingredients (Optional)</Text>
                <Text style={styles.sectionHint}>
                  Add ingredients for your meal, or we'll suggest from your pantry
                </Text>
                
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.ingredientInput}
                    placeholder="e.g., chicken breast, olive oil..."
                    placeholderTextColor="#9ca3af"
                    value={newMealIngredients}
                    onChangeText={setNewMealIngredients}
                    onSubmitEditing={addNewMealIngredient}
                    returnKeyType="done"
                  />
                  <TouchableOpacity 
                    style={styles.addButton}
                    onPress={addNewMealIngredient}
                    disabled={!newMealIngredients.trim()}
                  >
                    <Ionicons name="add" size={24} color="white" />
                  </TouchableOpacity>
                </View>

                {/* Added Ingredients List */}
                {newMealIngredientsList.length > 0 && (
                  <View style={styles.customIngredientsList}>
                    <View style={styles.ingredientTags}>
                      {newMealIngredientsList.map((ingredient, idx) => (
                        <TouchableOpacity 
                          key={idx} 
                          style={[styles.ingredientTag, styles.customTag]}
                          onPress={() => removeNewMealIngredient(ingredient)}
                        >
                          <Text style={[styles.ingredientTagText, { color: '#8b5cf6' }]}>
                            {ingredient}
                          </Text>
                          <Ionicons name="close-circle" size={14} color="#8b5cf6" />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Pantry Suggestions */}
                {pantryItems.length > 0 && newMealIngredientsList.length === 0 && (
                  <View style={styles.pantryHint}>
                    <Ionicons name="bulb" size={16} color="#f59e0b" />
                    <Text style={styles.pantryHintText}>
                      Quick add from pantry: 
                    </Text>
                  </View>
                )}
                {pantryItems.length > 0 && newMealIngredientsList.length === 0 && (
                  <View style={styles.ingredientTags}>
                    {pantryItems.slice(0, 6).map((item: any, idx: number) => (
                      <TouchableOpacity 
                        key={idx} 
                        style={styles.pantryTag}
                        onPress={() => setNewMealIngredientsList([...newMealIngredientsList, item.name])}
                      >
                        <Ionicons name="add" size={12} color="#22c55e" />
                        <Text style={styles.pantryTagText}>{item.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Save Button */}
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelBtn}
                onPress={() => setAddMealModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.getRecipeBtn, { flex: 2 }]}
                onPress={saveNewMeal}
                disabled={savingMeal || !newMealName.trim()}
              >
                <LinearGradient 
                  colors={newMealName.trim() ? ['#22c55e', '#16a34a'] : ['#d1d5db', '#9ca3af']} 
                  style={styles.getRecipeBtnGradient}
                >
                  {savingMeal ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="white" />
                      <Text style={styles.getRecipeBtnText}>Add Meal</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  dayNumber: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  addMealButton: { padding: 4 },

  mealsContainer: { padding: 12, gap: 10 },
  mealSlot: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#f9fafb', borderRadius: 12, gap: 12 },
  mealThumbnail: { width: 50, height: 50, borderRadius: 10, backgroundColor: '#e5e7eb' },
  mealIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  mealInfo: { flex: 1 },
  mealType: { fontSize: 11, fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase' },
  mealName: { fontSize: 14, fontWeight: '600', color: '#1f2937', marginTop: 2 },
  ingredientCount: { fontSize: 11, color: '#22c55e', marginTop: 2 },
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

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%', paddingBottom: 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  modalCloseBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937' },
  modalScroll: { maxHeight: 400 },

  // Meal Preview
  mealPreview: { alignItems: 'center', padding: 20, backgroundColor: '#f9fafb' },
  mealPreviewImage: { width: 120, height: 120, borderRadius: 16, marginBottom: 12 },
  mealPreviewTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937', textAlign: 'center' },
  mealPreviewType: { fontSize: 14, color: '#6b7280', marginTop: 4 },

  // Ingredients Section
  ingredientsSection: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 8 },
  sectionHint: { fontSize: 13, color: '#6b7280', marginBottom: 12 },
  ingredientTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ingredientTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f0fdf4', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  ingredientTagText: { fontSize: 13, color: '#15803d' },
  customTag: { backgroundColor: '#f3e8ff' },

  // Custom Ingredients Section
  customSection: { padding: 16, paddingTop: 0 },
  inputRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  ingredientInput: { flex: 1, backgroundColor: '#f9fafb', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, borderWidth: 1, borderColor: '#e5e7eb' },
  addButton: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center' },
  customIngredientsList: { marginTop: 12 },
  customIngredientsLabel: { fontSize: 13, color: '#6b7280', marginBottom: 8 },

  // Modal Actions
  modalActions: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingTop: 16 },
  quickRecipeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#f0fdf4', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#22c55e' },
  quickRecipeBtnText: { fontSize: 15, fontWeight: '600', color: '#22c55e' },
  getRecipeBtn: { flex: 2, borderRadius: 12, overflow: 'hidden' },
  getRecipeBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  getRecipeBtnText: { fontSize: 15, fontWeight: '700', color: 'white' },
  cancelBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', paddingVertical: 14, borderRadius: 12 },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#6b7280' },

  // Add Meal Modal Styles
  addMealDateSection: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, backgroundColor: '#f0fdf4', marginHorizontal: 16, marginTop: 16, borderRadius: 12 },
  addMealDateText: { fontSize: 15, fontWeight: '600', color: '#15803d' },
  mealTypeSection: { padding: 16 },
  mealTypeButtons: { flexDirection: 'row', gap: 10 },
  mealTypeButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: '#f3f4f6' },
  mealTypeButtonActive: { backgroundColor: '#22c55e' },
  mealTypeButtonText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  mealTypeButtonTextActive: { color: 'white' },
  inputSection: { padding: 16, paddingTop: 0 },
  mealNameInput: { backgroundColor: '#f9fafb', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, borderWidth: 1, borderColor: '#e5e7eb' },
  pantryHint: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, marginBottom: 8 },
  pantryHintText: { fontSize: 13, color: '#6b7280' },
  pantryTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f0fdf4', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#dcfce7' },
  pantryTagText: { fontSize: 12, color: '#15803d' },
});
