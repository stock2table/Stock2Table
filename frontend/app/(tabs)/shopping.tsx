import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useAppStore } from '../../store/appStore';

export default function ShoppingScreen() {
  const { sessionToken } = useAuth();
  const { shoppingLists, fetchShoppingLists } = useAppStore();
  const [selectedList, setSelectedList] = useState<any>(null);

  useEffect(() => {
    if (sessionToken) {
      loadShoppingLists();
    }
  }, [sessionToken]);

  const loadShoppingLists = async () => {
    await fetchShoppingLists(sessionToken!);
  };

  useEffect(() => {
    if (shoppingLists.length > 0 && !selectedList) {
      setSelectedList(shoppingLists[0]);
    }
  }, [shoppingLists]);

  const groupedItems = selectedList?.items.reduce((acc: any, item: any) => {
    const category = item.ingredient.toLowerCase().includes('vegetable') ? 'Vegetables' :
                     item.ingredient.toLowerCase().includes('fruit') ? 'Fruits' :
                     item.ingredient.toLowerCase().includes('meat') || item.ingredient.toLowerCase().includes('chicken') ? 'Meat & Poultry' :
                     item.ingredient.toLowerCase().includes('dairy') || item.ingredient.toLowerCase().includes('milk') ? 'Dairy' :
                     'Other';
    
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {}) || {};

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header Stats */}
        {selectedList && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Ionicons name="cart" size={32} color="#4CAF50" />
              <Text style={styles.statNumber}>{selectedList.items.length}</Text>
              <Text style={styles.statLabel}>Items</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="checkmark-circle" size={32} color="#2196F3" />
              <Text style={styles.statNumber}>
                {selectedList.items.filter((item: any) => item.in_pantry).length}
              </Text>
              <Text style={styles.statLabel}>In Pantry</Text>
            </View>
          </View>
        )}

        {!selectedList ? (
          <View style={styles.emptyState}>
            <Ionicons name="cart-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No shopping list</Text>
            <Text style={styles.emptySubtext}>
              Create a meal plan to generate a shopping list
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {Object.keys(groupedItems).map((category) => (
              <View key={category} style={styles.categorySection}>
                <Text style={styles.categoryTitle}>{category}</Text>
                {groupedItems[category].map((item: any, index: number) => (
                  <View
                    key={index}
                    style={[
                      styles.listItem,
                      item.in_pantry && styles.listItemInPantry
                    ]}
                  >
                    <View style={styles.checkbox}>
                      {item.in_pantry && (
                        <Ionicons name="checkmark" size={16} color="#4CAF50" />
                      )}
                    </View>
                    <View style={styles.itemInfo}>
                      <Text
                        style={[
                          styles.itemName,
                          item.in_pantry && styles.itemNameInPantry
                        ]}
                      >
                        {item.ingredient}
                      </Text>
                      <Text style={styles.itemDetails}>
                        {item.quantity} {item.unit}
                        {item.recipe_name && ` • for ${item.recipe_name}`}
                      </Text>
                    </View>
                    {item.in_pantry && (
                      <View style={styles.pantryBadge}>
                        <Text style={styles.pantryBadgeText}>In Pantry</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Shopping Lists History */}
        {shoppingLists.length > 1 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>Other Lists</Text>
            {shoppingLists.slice(1, 4).map((list) => (
              <TouchableOpacity
                key={list.list_id}
                style={styles.historyCard}
                onPress={() => setSelectedList(list)}
              >
                <Ionicons name="list" size={24} color="#4CAF50" />
                <View style={styles.historyInfo}>
                  <Text style={styles.historyTitle}>
                    Shopping List
                  </Text>
                  <Text style={styles.historyItems}>
                    {list.items.length} items
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
  listContainer: {
    padding: 16,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  listItem: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  listItemInPantry: {
    backgroundColor: '#E8F5E9',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  itemNameInPantry: {
    color: '#2E7D32',
  },
  itemDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  pantryBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pantryBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
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
  historyItems: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});
