import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useAppStore } from '../../store/appStore';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const HERO_IMAGE = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80';

export default function ShoppingScreen() {
  const { sessionToken } = useAuth();
  const { shoppingLists, fetchShoppingLists, mealPlans, fetchMealPlans } = useAppStore();
  const [selectedList, setSelectedList] = useState<any>(null);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (sessionToken) {
      loadData();
    }
  }, [sessionToken]);

  const loadData = async () => {
    await Promise.all([
      fetchShoppingLists(sessionToken!),
      fetchMealPlans(sessionToken!)
    ]);
  };

  useEffect(() => {
    if (shoppingLists.length > 0 && !selectedList) {
      setSelectedList(shoppingLists[0]);
    }
  }, [shoppingLists]);

  const generateShoppingList = async () => {
    if (mealPlans.length === 0) {
      Alert.alert(
        'No Meal Plan',
        'Create a meal plan first to generate a shopping list!',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setGenerating(true);
      const latestPlan = mealPlans[0];
      const response = await axios.post(
        `${BACKEND_URL}/api/shopping-lists/generate/${latestPlan.plan_id}`,
        {},
        { headers: { Authorization: `Bearer ${sessionToken}` } }
      );
      setSelectedList(response.data);
      await fetchShoppingLists(sessionToken!);
    } catch (error) {
      console.error('Error generating shopping list:', error);
      Alert.alert('Error', 'Failed to generate shopping list. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const toggleItem = (itemKey: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(itemKey)) {
      newChecked.delete(itemKey);
    } else {
      newChecked.add(itemKey);
    }
    setCheckedItems(newChecked);
  };

  const getCategoryColor = (ingredient: string) => {
    const lowerIngredient = ingredient.toLowerCase();
    if (lowerIngredient.includes('vegetable') || lowerIngredient.includes('tomato') || lowerIngredient.includes('onion') || lowerIngredient.includes('lettuce') || lowerIngredient.includes('carrot') || lowerIngredient.includes('pepper')) {
      return ['#22c55e', '#16a34a'];
    }
    if (lowerIngredient.includes('fruit') || lowerIngredient.includes('apple') || lowerIngredient.includes('orange') || lowerIngredient.includes('banana') || lowerIngredient.includes('berry')) {
      return ['#f97316', '#ea580c'];
    }
    if (lowerIngredient.includes('meat') || lowerIngredient.includes('chicken') || lowerIngredient.includes('beef') || lowerIngredient.includes('pork') || lowerIngredient.includes('fish')) {
      return ['#ef4444', '#dc2626'];
    }
    if (lowerIngredient.includes('dairy') || lowerIngredient.includes('milk') || lowerIngredient.includes('cheese') || lowerIngredient.includes('yogurt') || lowerIngredient.includes('cream')) {
      return ['#3b82f6', '#2563eb'];
    }
    if (lowerIngredient.includes('grain') || lowerIngredient.includes('bread') || lowerIngredient.includes('rice') || lowerIngredient.includes('pasta') || lowerIngredient.includes('flour')) {
      return ['#eab308', '#ca8a04'];
    }
    return ['#8b5cf6', '#7c3aed'];
  };

  const totalItems = selectedList?.items?.length || 0;
  const checkedCount = checkedItems.size;
  const inPantryCount = selectedList?.items?.filter((item: any) => item.in_pantry).length || 0;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Image source={{ uri: HERO_IMAGE }} style={styles.heroImage} />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.heroOverlay}>
            <Text style={styles.heroTitle}>Shopping List</Text>
            <Text style={styles.heroSubtitle}>Your smart grocery companion</Text>
          </LinearGradient>
        </View>

        {/* Stats */}
        {selectedList && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.statGradient}>
                <Ionicons name="cart" size={24} color="white" />
                <Text style={styles.statNumber}>{totalItems}</Text>
                <Text style={styles.statLabel}>Total Items</Text>
              </LinearGradient>
            </View>
            <View style={styles.statCard}>
              <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.statGradient}>
                <Ionicons name="checkmark-circle" size={24} color="white" />
                <Text style={styles.statNumber}>{inPantryCount}</Text>
                <Text style={styles.statLabel}>In Pantry</Text>
              </LinearGradient>
            </View>
            <View style={styles.statCard}>
              <LinearGradient colors={['#f97316', '#ea580c']} style={styles.statGradient}>
                <Ionicons name="bag-check" size={24} color="white" />
                <Text style={styles.statNumber}>{checkedCount}</Text>
                <Text style={styles.statLabel}>Got It</Text>
              </LinearGradient>
            </View>
          </View>
        )}

        {/* Generate Button */}
        <View style={styles.generateSection}>
          <TouchableOpacity
            style={styles.generateButton}
            onPress={generateShoppingList}
            disabled={generating}
            activeOpacity={0.9}
          >
            <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.generateGradient}>
              {generating ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="list" size={22} color="white" />
                  <Text style={styles.generateText}>Generate from Meal Plan</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {!selectedList ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBg}>
              <Ionicons name="cart-outline" size={64} color="#d1d5db" />
            </View>
            <Text style={styles.emptyTitle}>No Shopping List</Text>
            <Text style={styles.emptySubtitle}>
              Create a meal plan and generate a shopping list to see what you need to buy
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {selectedList.items?.map((item: any, index: number) => {
              const itemKey = `${item.ingredient}-${index}`;
              const isChecked = checkedItems.has(itemKey) || item.in_pantry;
              const [color1, color2] = getCategoryColor(item.ingredient);
              
              return (
                <TouchableOpacity
                  key={itemKey}
                  style={[styles.listItem, isChecked && styles.listItemChecked]}
                  onPress={() => !item.in_pantry && toggleItem(itemKey)}
                  activeOpacity={0.8}
                >
                  <View style={styles.checkboxContainer}>
                    <LinearGradient
                      colors={isChecked ? [color1, color2] : ['#e5e7eb', '#d1d5db']}
                      style={styles.checkbox}
                    >
                      {isChecked && <Ionicons name="checkmark" size={16} color="white" />}
                    </LinearGradient>
                  </View>
                  
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemName, isChecked && styles.itemNameChecked]}>
                      {item.ingredient}
                    </Text>
                    <View style={styles.itemDetails}>
                      <Text style={styles.itemQuantity}>
                        {item.quantity} {item.unit}
                      </Text>
                      {item.recipe_name && (
                        <Text style={styles.itemRecipe} numberOfLines={1}>
                          for {item.recipe_name}
                        </Text>
                      )}
                    </View>
                  </View>
                  
                  {item.in_pantry && (
                    <View style={[styles.pantryBadge, { backgroundColor: color1 }]}>
                      <Text style={styles.pantryBadgeText}>In Pantry</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Other Lists */}
        {shoppingLists.length > 1 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>Previous Lists</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {shoppingLists.slice(1, 5).map((list) => (
                <TouchableOpacity
                  key={list.list_id}
                  style={[
                    styles.historyCard,
                    selectedList?.list_id === list.list_id && styles.historyCardActive
                  ]}
                  onPress={() => {
                    setSelectedList(list);
                    setCheckedItems(new Set());
                  }}
                >
                  <Ionicons name="list" size={24} color="#22c55e" />
                  <Text style={styles.historyItems}>{list.items?.length || 0} items</Text>
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
    height: 160,
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
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  // Stats
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: -24,
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  statGradient: {
    padding: 14,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    marginTop: 6,
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  // Generate
  generateSection: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  generateButton: {
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  generateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  generateText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  // List
  listContainer: {
    padding: 16,
    gap: 8,
  },
  listItem: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  listItemChecked: {
    backgroundColor: '#f0fdf4',
  },
  checkboxContainer: {},
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    textTransform: 'capitalize',
  },
  itemNameChecked: {
    color: '#16a34a',
    textDecorationLine: 'line-through',
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  itemQuantity: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  itemRecipe: {
    fontSize: 12,
    color: '#9ca3af',
    flex: 1,
  },
  pantryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pantryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'white',
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
    borderRadius: 14,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 100,
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
  historyItems: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 8,
  },
});
