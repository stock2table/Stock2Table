import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator, Animated, Image } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useAppStore } from '../../store/appStore';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function PantryScreen() {
  const router = useRouter();
  const { sessionToken } = useAuth();
  const { pantryItems, fetchPantry, recipes, fetchRecipes } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (sessionToken) {
      loadData();
    }
  }, [sessionToken]);

  const loadData = async () => {
    await Promise.all([
      fetchPantry(sessionToken!),
      fetchRecipes()
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getAIRecommendations = async () => {
    if (pantryItems.length === 0) {
      alert('Add some ingredients to your pantry first! 🥗');
      return;
    }
    
    try {
      setLoadingRecs(true);
      setRecommendations([]);
      
      // Bounce animation for button
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();
      
      const response = await axios.post(
        `${BACKEND_URL}/api/recipes/recommend`,
        {},
        { headers: { Authorization: `Bearer ${sessionToken}` }, timeout: 20000 }
      );
      
      setRecommendations(response.data.recommendations);
      
      // Fade in animation
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    } catch (error: any) {
      console.error('Error getting recommendations:', error);
      alert('Failed to get AI recommendations. Please try again! 🤖');
    } finally {
      setLoadingRecs(false);
    }
  };

  const findRecipeByName = (recipeName: string) => {
    // Try exact match first
    let recipe = recipes.find(r => 
      r.name.toLowerCase() === recipeName.toLowerCase()
    );
    
    // Try partial match if no exact match
    if (!recipe) {
      recipe = recipes.find(r => 
        r.name.toLowerCase().includes(recipeName.toLowerCase()) ||
        recipeName.toLowerCase().includes(r.name.toLowerCase())
      );
    }
    
    return recipe;
  };

  const handleRecommendationClick = (rec: any) => {
    const recipe = findRecipeByName(rec.name);
    
    if (recipe) {
      router.push(`/recipe-detail/${recipe.recipe_id}`);
    } else {
      alert(`Recipe "${rec.name}" not yet in our database. More recipes coming soon! 🍳`);
    }
  };

  const categorizedItems = pantryItems.reduce((acc: any, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  const getCategoryIcon = (category: string) => {
    const icons: any = {
      vegetables: 'leaf',
      fruits: 'nutrition',
      dairy: 'water',
      meat: 'restaurant',
      grains: 'fast-food',
      spices: 'sparkles',
      other: 'cube'
    };
    return icons[category] || 'cube';
  };

  const getCategoryColor = (category: string) => {
    const colors: any = {
      vegetables: ['#4CAF50', '#81C784'],
      fruits: ['#FF9800', '#FFB74D'],
      dairy: ['#2196F3', '#64B5F6'],
      meat: ['#F44336', '#E57373'],
      grains: ['#FF9800', '#FFB74D'],
      spices: ['#9C27B0', '#BA68C8'],
      other: ['#607D8B', '#90A4AE']
    };
    return colors[category] || ['#607D8B', '#90A4AE'];
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header with Gradient */}
        <LinearGradient
          colors={['#4CAF50', '#45a049']}
          style={styles.headerGradient}
        >
          <Text style={styles.headerTitle}>My Pantry</Text>
          <Text style={styles.headerSubtitle}>Smart ingredient management</Text>
        </LinearGradient>

        {/* Stats Container with Cards */}
        <View style={styles.statsContainer}>
          <LinearGradient
            colors={['#4CAF50', '#66BB6A']}
            style={styles.statCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="basket" size={36} color="white" />
            <Text style={styles.statNumber}>{pantryItems.length}</Text>
            <Text style={styles.statLabel}>Total Items</Text>
          </LinearGradient>
          
          <LinearGradient
            colors={['#FF9800', '#FFB74D']}
            style={styles.statCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="time" size={36} color="white" />
            <Text style={styles.statNumber}>
              {pantryItems.filter(item => item.expiry_date).length}
            </Text>
            <Text style={styles.statLabel}>Expiring Soon</Text>
          </LinearGradient>
        </View>

        {/* AI Recommendations Section */}
        {recommendations.length > 0 && (
          <Animated.View style={[styles.recommendationsSection, { opacity: fadeAnim }]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <LinearGradient
                  colors={['#9C27B0', '#BA68C8']}
                  style={styles.aiIconContainer}
                >
                  <Ionicons name="sparkles" size={20} color="white" />
                </LinearGradient>
                <Text style={styles.sectionTitle}>AI Recipe Ideas</Text>
              </View>
            </View>
            
            {recommendations.map((rec, index) => (
              <TouchableOpacity
                key={index}
                style={styles.recommendationCard}
                onPress={() => {
                  // Try to find matching recipe in database
                  alert(`Opening ${rec.name}... (Feature coming soon!)`);
                }}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#E8F5E9', '#C8E6C9']}
                  style={styles.recommendationGradient}
                >
                  <View style={styles.recommendationHeader}>
                    <View style={styles.recommendationIconBadge}>
                      <Ionicons name="restaurant" size={20} color="#2E7D32" />
                    </View>
                    <Text style={styles.recipeTitle}>{rec.name}</Text>
                  </View>
                  <Text style={styles.recipeReason}>{rec.reason}</Text>
                  {rec.missing_ingredients && rec.missing_ingredients.length > 0 && (
                    <View style={styles.missingContainer}>
                      <Ionicons name="information-circle" size={16} color="#FF9800" />
                      <Text style={styles.missingText}>
                        Missing: {rec.missing_ingredients.join(', ')}
                      </Text>
                    </View>
                  )}
                  <View style={styles.viewRecipeButton}>
                    <Text style={styles.viewRecipeText}>View Recipe</Text>
                    <Ionicons name="arrow-forward" size={16} color="#2E7D32" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

        {/* Action Buttons with Enhanced Design */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.primaryButtonContainer}
            onPress={() => router.push('/scan')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#4CAF50', '#45a049']}
              style={styles.primaryButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="camera" size={28} color="white" />
              <Text style={styles.primaryButtonText}>Scan Ingredient</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButtonContainer}
            onPress={getAIRecommendations}
            disabled={loadingRecs}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#9C27B0', '#BA68C8']}
              style={styles.secondaryButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {loadingRecs ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Ionicons name="bulb" size={28} color="white" />
                  <Text style={styles.secondaryButtonText}>Get AI Ideas</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Pantry Items by Category */}
        {Object.keys(categorizedItems).length === 0 ? (
          <View style={styles.emptyState}>
            <LinearGradient
              colors={['#f5f5f5', '#e0e0e0']}
              style={styles.emptyStateGradient}
            >
              <Ionicons name="basket-outline" size={80} color="#999" />
              <Text style={styles.emptyText}>Your pantry is empty</Text>
              <Text style={styles.emptySubtext}>Scan ingredients to get started</Text>
            </LinearGradient>
          </View>
        ) : (
          Object.keys(categorizedItems).map(category => {
            const [color1, color2] = getCategoryColor(category);
            return (
              <View key={category} style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <LinearGradient
                    colors={[color1, color2]}
                    style={styles.categoryIconContainer}
                  >
                    <Ionicons name={getCategoryIcon(category)} size={20} color="white" />
                  </LinearGradient>
                  <Text style={styles.categoryTitle}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>
                      {categorizedItems[category].length}
                    </Text>
                  </View>
                </View>
                
                {categorizedItems[category].map((item: any) => (
                  <TouchableOpacity
                    key={item.item_id}
                    style={styles.pantryItem}
                    activeOpacity={0.7}
                  >
                    <View style={styles.itemIconContainer}>
                      <LinearGradient
                        colors={[color1 + '30', color2 + '30']}
                        style={styles.itemIcon}
                      >
                        <Ionicons name={getCategoryIcon(category)} size={24} color={color1} />
                      </LinearGradient>
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <View style={styles.itemDetailsRow}>
                        <View style={styles.quantityBadge}>
                          <Text style={styles.itemQuantity}>
                            {item.quantity} {item.unit}
                          </Text>
                        </View>
                        {item.expiry_date && (
                          <View style={styles.expiryBadge}>
                            <Ionicons name="time-outline" size={12} color="#FF9800" />
                            <Text style={styles.itemExpiry}>
                              {item.expiry_date}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                  </TouchableOpacity>
                ))}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  headerGradient: {
    padding: 24,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
    marginTop: -20,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 12,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
    fontWeight: '600',
  },
  actionsContainer: {
    padding: 16,
    gap: 12,
  },
  primaryButtonContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 12,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButtonContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#9C27B0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 12,
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  recommendationsSection: {
    padding: 16,
    paddingTop: 8,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#9C27B0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  recommendationCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  recommendationGradient: {
    padding: 16,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  recommendationIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recipeTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  recipeReason: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
    marginBottom: 12,
  },
  missingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF3E0',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  missingText: {
    flex: 1,
    fontSize: 13,
    color: '#E65100',
  },
  viewRecipeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 10,
  },
  viewRecipeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2E7D32',
  },
  categorySection: {
    padding: 16,
    paddingTop: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  categoryBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  pantryItem: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  itemIconContainer: {
    marginRight: 16,
  },
  itemIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  itemDetailsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quantityBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  itemQuantity: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
  },
  expiryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  itemExpiry: {
    fontSize: 12,
    color: '#E65100',
    fontWeight: '600',
  },
  emptyState: {
    padding: 16,
    marginTop: 32,
  },
  emptyStateGradient: {
    alignItems: 'center',
    padding: 48,
    borderRadius: 20,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});
