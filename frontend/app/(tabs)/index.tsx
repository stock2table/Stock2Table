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

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="basket" size={32} color="#4CAF50" />
            <Text style={styles.statNumber}>{pantryItems.length}</Text>
            <Text style={styles.statLabel}>Items</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time" size={32} color="#FF9800" />
            <Text style={styles.statNumber}>
              {pantryItems.filter(item => item.expiry_date).length}
            </Text>
            <Text style={styles.statLabel}>Expiring</Text>
          </View>
        </View>

        {/* AI Recommendations */}
        {recommendations.length > 0 && (
          <View style={styles.recommendationsSection}>
            <Text style={styles.sectionTitle}>AI Recommendations</Text>
            {recommendations.map((rec, index) => (
              <View key={index} style={styles.recommendationCard}>
                <Text style={styles.recipeTitle}>{rec.name}</Text>
                <Text style={styles.recipeReason}>{rec.reason}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/scan')}
          >
            <Ionicons name="camera" size={24} color="white" />
            <Text style={styles.primaryButtonText}>Scan Ingredient</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={getAIRecommendations}
          >
            <Ionicons name="bulb" size={24} color="#4CAF50" />
            <Text style={styles.secondaryButtonText}>Get Recipe Ideas</Text>
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
