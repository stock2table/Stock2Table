import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator, Animated } from 'react-native';
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
  const { pantryItems, fetchPantry, recipes } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (sessionToken) {
      loadData();
    }
  }, [sessionToken]);

  const loadData = async () => {
    await fetchPantry(sessionToken!);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getAIRecommendations = async () => {
    if (pantryItems.length === 0) {
      alert('Add some ingredients to your pantry first!');
      return;
    }
    
    try {
      setLoadingRecs(true);
      setRecommendations([]);
      
      const response = await axios.post(
        `${BACKEND_URL}/api/recipes/recommend`,
        {},
        { headers: { Authorization: `Bearer ${sessionToken}` }, timeout: 15000 }
      );
      
      setRecommendations(response.data.recommendations);
      
      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Error getting recommendations:', error);
      alert('Failed to get recommendations. Please try again.');
    } finally {
      setLoadingRecs(false);
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
            <Ionicons name="basket-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Your pantry is empty</Text>
            <Text style={styles.emptySubtext}>Scan ingredients to get started</Text>
          </View>
        ) : (
          Object.keys(categorizedItems).map(category => (
            <View key={category} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
              {categorizedItems[category].map((item: any) => (
                <View key={item.item_id} style={styles.pantryItem}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemQuantity}>
                      {item.quantity} {item.unit}
                    </Text>
                    {item.expiry_date && (
                      <Text style={styles.itemExpiry}>
                        Expires: {item.expiry_date}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                </View>
              ))}
            </View>
          ))
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
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  actionsContainer: {
    padding: 16,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
  recommendationsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  recommendationCard: {
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
  },
  recipeReason: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  categorySection: {
    padding: 16,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  pantryItem: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  itemExpiry: {
    fontSize: 12,
    color: '#FF9800',
    marginTop: 2,
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
  },
});
