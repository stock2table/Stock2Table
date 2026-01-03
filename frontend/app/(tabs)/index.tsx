import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, Animated, Image, Modal, TextInput, Alert, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useAppStore } from '../../store/appStore';
import { LinearGradient } from 'expo-linear-gradient';
import { TouchableOpacity } from 'react-native-gesture-handler';
import axios from 'axios';

const { width } = Dimensions.get('window');
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const CATEGORIES = ['vegetables', 'fruits', 'dairy', 'meat', 'grains', 'spices', 'other'];
const UNITS = ['kg', 'g', 'L', 'ml', 'pieces', 'cups', 'tbsp', 'tsp', 'lbs', 'oz'];

const CATEGORY_IMAGES: any = {
  vegetables: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80',
  fruits: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&q=80',
  dairy: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400&q=80',
  meat: 'https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=400&q=80',
  grains: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80',
  spices: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80',
  other: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=400&q=80',
};

const HERO_IMAGE = 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=800&q=80';

export default function PantryScreen() {
  const router = useRouter();
  const { sessionToken, user } = useAuth();
  const { pantryItems, fetchPantry, recipes, fetchRecipes, addPantryItem } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Form state
  const [formName, setFormName] = useState('');
  const [formQuantity, setFormQuantity] = useState('');
  const [formUnit, setFormUnit] = useState('pieces');
  const [formCategory, setFormCategory] = useState('other');
  const [formExpiry, setFormExpiry] = useState('');
  const [saving, setSaving] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (sessionToken) {
      loadData();
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 20 })
      ]).start();
    }
  }, [sessionToken]);

  const loadData = async () => {
    await Promise.all([fetchPantry(sessionToken!), fetchRecipes()]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getAIRecommendations = async () => {
    if (pantryItems.length === 0) {
      Alert.alert('Empty Pantry', 'Add some ingredients first to get AI recipe recommendations!');
      return;
    }
    try {
      setLoadingRecs(true);
      setRecommendations([]);
      const response = await axios.post(
        `${BACKEND_URL}/api/recipes/recommend`,
        {},
        { headers: { Authorization: `Bearer ${sessionToken}` }, timeout: 30000 }
      );
      setRecommendations(response.data.recommendations || []);
    } catch (error: any) {
      console.error('AI Recommendation error:', error);
      Alert.alert('Error', 'Failed to get AI recommendations. Please try again!');
    } finally {
      setLoadingRecs(false);
    }
  };

  const findRecipeByName = (recipeName: string) => {
    let recipe = recipes.find(r => r.name.toLowerCase() === recipeName.toLowerCase());
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
      Alert.alert(
        'Recipe Details',
        `"${rec.name}"\n\n${rec.reason}\n\nThis AI-suggested recipe isn't in our database yet. Browse our recipe collection for similar options!`,
        [{ text: 'Browse Recipes', onPress: () => router.push('/(tabs)/recipes') }, { text: 'OK' }]
      );
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormQuantity('');
    setFormUnit('pieces');
    setFormCategory('other');
    setFormExpiry('');
    setShowAddModal(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormQuantity(item.quantity.toString());
    setFormUnit(item.unit);
    setFormCategory(item.category);
    setFormExpiry(item.expiry_date || '');
    setShowAddModal(true);
  };

  const handleSaveItem = async () => {
    if (!formName.trim()) {
      Alert.alert('Error', 'Please enter an ingredient name');
      return;
    }
    if (!formQuantity || parseFloat(formQuantity) <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    try {
      setSaving(true);
      if (editingItem) {
        await axios.put(
          `${BACKEND_URL}/api/pantry/${editingItem.item_id}`,
          {
            name: formName.trim(),
            quantity: parseFloat(formQuantity),
            unit: formUnit,
            category: formCategory,
            expiry_date: formExpiry || null
          },
          { headers: { Authorization: `Bearer ${sessionToken}` } }
        );
      } else {
        await addPantryItem(sessionToken!, {
          name: formName.trim(),
          quantity: parseFloat(formQuantity),
          unit: formUnit,
          category: formCategory,
          expiry_date: formExpiry || null
        });
      }
      setShowAddModal(false);
      await fetchPantry(sessionToken!);
    } catch (error) {
      Alert.alert('Error', 'Failed to save ingredient. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // FIXED: Direct delete function with proper error handling
  const handleDeleteItem = async (item: any) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to remove "${item.name}" from your pantry?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(item.item_id);
              console.log('Deleting item:', item.item_id);
              
              const response = await axios.delete(
                `${BACKEND_URL}/api/pantry/${item.item_id}`,
                { headers: { Authorization: `Bearer ${sessionToken}` } }
              );
              
              console.log('Delete response:', response.status);
              
              // Refresh pantry after successful delete
              await fetchPantry(sessionToken!);
              
            } catch (error: any) {
              console.error('Delete error:', error.response?.data || error.message);
              Alert.alert('Error', error.response?.data?.detail || 'Failed to delete item. Please try again.');
            } finally {
              setDeletingId(null);
            }
          }
        }
      ]
    );
  };

  const getCategoryIcon = (category: string) => {
    const icons: any = {
      vegetables: 'leaf', fruits: 'nutrition', dairy: 'water',
      meat: 'restaurant', grains: 'fast-food', spices: 'sparkles', other: 'cube'
    };
    return icons[category] || 'cube';
  };

  const getCategoryColor = (category: string) => {
    const colors: any = {
      vegetables: '#22c55e',
      fruits: '#f97316',
      dairy: '#3b82f6',
      meat: '#ef4444',
      grains: '#eab308',
      spices: '#a855f7',
      other: '#6b7280'
    };
    return colors[category] || '#6b7280';
  };

  const categorizedItems = pantryItems.reduce((acc: any, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const totalItems = pantryItems.length;
  const expiringCount = pantryItems.filter(i => i.expiry_date).length;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Image source={{ uri: HERO_IMAGE }} style={styles.heroImage} />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.heroOverlay}>
            <Animated.View style={[styles.heroContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] || 'Chef'}!</Text>
              <Text style={styles.subGreeting}>Ready to cook something amazing?</Text>
            </Animated.View>
          </LinearGradient>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <TouchableOpacity style={styles.statCard} activeOpacity={0.8}>
            <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.statGradient}>
              <Ionicons name="basket" size={28} color="white" />
              <Text style={styles.statNumber}>{totalItems}</Text>
              <Text style={styles.statLabel}>Items</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statCard} activeOpacity={0.8}>
            <LinearGradient colors={['#f97316', '#ea580c']} style={styles.statGradient}>
              <Ionicons name="time" size={28} color="white" />
              <Text style={styles.statNumber}>{expiringCount}</Text>
              <Text style={styles.statLabel}>Tracked</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statCard} activeOpacity={0.8} onPress={() => router.push('/(tabs)/recipes')}>
            <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.statGradient}>
              <Ionicons name="book" size={28} color="white" />
              <Text style={styles.statNumber}>{recipes.length}</Text>
              <Text style={styles.statLabel}>Recipes</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/scan')} activeOpacity={0.8}>
              <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.actionGradient}>
                <View style={styles.actionIconBg}>
                  <Ionicons name="camera" size={28} color="#22c55e" />
                </View>
                <Text style={styles.actionTitle}>Scan Items</Text>
                <Text style={styles.actionSubtitle}>AI-powered</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={getAIRecommendations} disabled={loadingRecs} activeOpacity={0.8}>
              <LinearGradient colors={['#ec4899', '#db2777']} style={styles.actionGradient}>
                {loadingRecs ? (
                  <ActivityIndicator color="white" size="large" />
                ) : (
                  <>
                    <View style={styles.actionIconBg}>
                      <Ionicons name="sparkles" size={28} color="#ec4899" />
                    </View>
                    <Text style={styles.actionTitle}>Get Ideas</Text>
                    <Text style={styles.actionSubtitle}>AI recipes</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Recommendations */}
        {recommendations.length > 0 && (
          <View style={styles.recSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.aiBadge}>
                <Ionicons name="sparkles" size={16} color="white" />
                <Text style={styles.aiBadgeText}>AI Suggestions</Text>
              </View>
            </View>
            <Text style={styles.sectionTitle}>Recipes You Can Make</Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recScroll}>
              {recommendations.map((rec, idx) => {
                const recipe = findRecipeByName(rec.name);
                return (
                  <TouchableOpacity
                    key={idx}
                    style={styles.recCard}
                    onPress={() => handleRecommendationClick(rec)}
                    activeOpacity={0.9}
                  >
                    <Image 
                      source={{ uri: recipe?.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80' }} 
                      style={styles.recImage} 
                    />
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.recOverlay}>
                      <Text style={styles.recTitle} numberOfLines={2}>{rec.name}</Text>
                      <Text style={styles.recReason} numberOfLines={2}>{rec.reason}</Text>
                      {rec.missing_ingredients?.length > 0 && (
                        <View style={styles.missingBadge}>
                          <Ionicons name="cart" size={12} color="#f97316" />
                          <Text style={styles.missingText}>
                            +{rec.missing_ingredients.length} items needed
                          </Text>
                        </View>
                      )}
                      <View style={styles.viewRecipeBtn}>
                        <Text style={styles.viewRecipeText}>View Recipe</Text>
                        <Ionicons name="arrow-forward" size={14} color="white" />
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Pantry Section */}
        <View style={styles.pantrySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Pantry</Text>
            <TouchableOpacity onPress={openAddModal} style={styles.addBtn}>
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>

          {Object.keys(categorizedItems).length === 0 ? (
            <View style={styles.emptyContainer}>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=400&q=80' }} 
                style={styles.emptyImage} 
              />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.emptyOverlay}>
                <Ionicons name="basket-outline" size={48} color="white" />
                <Text style={styles.emptyTitle}>Your Pantry is Empty</Text>
                <Text style={styles.emptySubtitle}>Scan or add ingredients to get started!</Text>
                <TouchableOpacity style={styles.emptyButton} onPress={openAddModal}>
                  <Text style={styles.emptyButtonText}>Add First Item</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          ) : (
            Object.keys(categorizedItems).map(cat => {
              const color = getCategoryColor(cat);
              return (
                <View key={cat} style={styles.categoryContainer}>
                  <View style={styles.categoryHeader}>
                    <Image source={{ uri: CATEGORY_IMAGES[cat] }} style={styles.categoryImage} />
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.categoryOverlay}>
                      <Ionicons name={getCategoryIcon(cat)} size={20} color="white" />
                      <Text style={styles.categoryTitle}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </Text>
                      <View style={styles.categoryCount}>
                        <Text style={styles.categoryCountText}>{categorizedItems[cat].length}</Text>
                      </View>
                    </LinearGradient>
                  </View>
                  
                  {categorizedItems[cat].map((item: any) => (
                    <View key={item.item_id} style={styles.pantryCard}>
                      <View style={[styles.itemIndicator, { backgroundColor: color }]} />
                      <View style={styles.itemContent}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <View style={styles.itemMeta}>
                          <View style={[styles.itemBadge, { backgroundColor: color + '20' }]}>
                            <Text style={[styles.itemBadgeText, { color }]}>
                              {item.quantity} {item.unit}
                            </Text>
                          </View>
                          {item.expiry_date && (
                            <View style={styles.expiryBadge}>
                              <Ionicons name="time" size={12} color="#f97316" />
                              <Text style={styles.expiryText}>{item.expiry_date}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <View style={styles.itemActions}>
                        <TouchableOpacity 
                          style={styles.editBtn}
                          onPress={() => {
                            console.log('Edit pressed for:', item.name);
                            openEditModal(item);
                          }}
                          activeOpacity={0.6}
                        >
                          <Ionicons name="pencil" size={18} color="#6b7280" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.deleteBtn}
                          onPress={() => {
                            console.log('Delete pressed for:', item.name, item.item_id);
                            handleDeleteItem(item);
                          }}
                          disabled={deletingId === item.item_id}
                          activeOpacity={0.6}
                        >
                          {deletingId === item.item_id ? (
                            <ActivityIndicator size="small" color="#ef4444" />
                          ) : (
                            <Ionicons name="trash" size={18} color="#ef4444" />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openAddModal} activeOpacity={0.9}>
        <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.fabGradient}>
          <Ionicons name="add" size={32} color="white" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingItem ? 'Edit' : 'Add'} Ingredient</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={28} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>Name *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g., Tomatoes"
                placeholderTextColor="#9ca3af"
                value={formName}
                onChangeText={setFormName}
              />

              <Text style={styles.formLabel}>Quantity *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g., 5"
                placeholderTextColor="#9ca3af"
                value={formQuantity}
                onChangeText={setFormQuantity}
                keyboardType="decimal-pad"
              />

              <Text style={styles.formLabel}>Unit *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {UNITS.map(unit => (
                  <TouchableOpacity
                    key={unit}
                    style={[styles.chip, formUnit === unit && styles.chipActive]}
                    onPress={() => setFormUnit(unit)}
                  >
                    <Text style={[styles.chipText, formUnit === unit && styles.chipTextActive]}>{unit}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.formLabel}>Category *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.chip, formCategory === cat && styles.chipActive]}
                    onPress={() => setFormCategory(cat)}
                  >
                    <Ionicons name={getCategoryIcon(cat)} size={16} color={formCategory === cat ? 'white' : '#6b7280'} />
                    <Text style={[styles.chipText, formCategory === cat && styles.chipTextActive]}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.formLabel}>Expiry Date (optional)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9ca3af"
                value={formExpiry}
                onChangeText={setFormExpiry}
              />
            </ScrollView>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveItem} disabled={saving}>
              <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.saveGradient}>
                {saving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.saveButtonText}>{editingItem ? 'Update' : 'Add'} Ingredient</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  
  // Hero
  heroSection: { height: 220, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '100%', justifyContent: 'flex-end', padding: 24 },
  heroContent: {},
  greeting: { fontSize: 28, fontWeight: '800', color: 'white' },
  subGreeting: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  
  // Stats
  statsContainer: { flexDirection: 'row', paddingHorizontal: 16, marginTop: -30, gap: 12 },
  statCard: { flex: 1, borderRadius: 16, overflow: 'hidden', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
  statGradient: { padding: 16, alignItems: 'center' },
  statNumber: { fontSize: 28, fontWeight: '800', color: 'white', marginTop: 8 },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  
  // Actions
  actionsSection: { marginTop: 24, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: '#1f2937', marginBottom: 16 },
  actionsGrid: { flexDirection: 'row', gap: 12 },
  actionCard: { flex: 1, borderRadius: 20, overflow: 'hidden', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
  actionGradient: { padding: 20, alignItems: 'center' },
  actionIconBg: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  actionTitle: { fontSize: 16, fontWeight: '700', color: 'white' },
  actionSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  
  // AI Recommendations
  recSection: { marginTop: 32, paddingHorizontal: 16 },
  sectionHeader: { marginBottom: 8 },
  aiBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ec4899', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  aiBadgeText: { fontSize: 12, fontWeight: '700', color: 'white' },
  recScroll: { marginTop: 8 },
  recCard: { width: 200, height: 280, borderRadius: 20, marginRight: 16, overflow: 'hidden' },
  recImage: { width: '100%', height: '100%' },
  recOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, height: '70%', justifyContent: 'flex-end' },
  recTitle: { fontSize: 16, fontWeight: '700', color: 'white', marginBottom: 4 },
  recReason: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 8 },
  missingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(249,115,22,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 8 },
  missingText: { fontSize: 11, color: '#f97316', fontWeight: '600' },
  viewRecipeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, alignSelf: 'flex-start' },
  viewRecipeText: { fontSize: 12, fontWeight: '700', color: 'white' },
  
  // Pantry
  pantrySection: { marginTop: 32, paddingHorizontal: 16 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#22c55e', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { fontSize: 14, fontWeight: '700', color: 'white' },
  
  categoryContainer: { marginTop: 20 },
  categoryHeader: { height: 80, borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  categoryImage: { width: '100%', height: '100%' },
  categoryOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '100%', flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  categoryTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: 'white' },
  categoryCount: { backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  categoryCountText: { fontSize: 14, fontWeight: '700', color: 'white' },
  
  pantryCard: { backgroundColor: 'white', flexDirection: 'row', alignItems: 'center', borderRadius: 16, marginBottom: 8, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  itemIndicator: { width: 4, height: '100%' },
  itemContent: { flex: 1, padding: 16 },
  itemName: { fontSize: 16, fontWeight: '600', color: '#1f2937', textTransform: 'capitalize' },
  itemMeta: { flexDirection: 'row', gap: 8, marginTop: 6 },
  itemBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  itemBadgeText: { fontSize: 12, fontWeight: '700' },
  expiryBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff7ed', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  expiryText: { fontSize: 11, fontWeight: '600', color: '#f97316' },
  itemActions: { flexDirection: 'row', paddingRight: 8, gap: 8 },
  editBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },
  deleteBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fef2f2', justifyContent: 'center', alignItems: 'center' },
  
  // Empty
  emptyContainer: { height: 280, borderRadius: 24, overflow: 'hidden', marginTop: 16 },
  emptyImage: { width: '100%', height: '100%' },
  emptyOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '100%', alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: 'white', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 8 },
  emptyButton: { backgroundColor: '#22c55e', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 20 },
  emptyButtonText: { fontSize: 15, fontWeight: '700', color: 'white' },
  
  // FAB
  fab: { position: 'absolute', bottom: 100, right: 24, borderRadius: 32, overflow: 'hidden', elevation: 12, shadowColor: '#22c55e', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 16 },
  fabGradient: { width: 64, height: 64, justifyContent: 'center', alignItems: 'center' },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  modalTitle: { fontSize: 24, fontWeight: '800', color: '#1f2937' },
  modalForm: { padding: 24 },
  formLabel: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8, marginTop: 16 },
  formInput: { backgroundColor: '#f9fafb', borderWidth: 2, borderColor: '#e5e7eb', borderRadius: 12, padding: 16, fontSize: 16, color: '#1f2937' },
  chipScroll: { marginTop: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f3f4f6', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 8 },
  chipActive: { backgroundColor: '#22c55e' },
  chipText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  chipTextActive: { color: 'white' },
  saveButton: { margin: 24, marginTop: 16, borderRadius: 16, overflow: 'hidden' },
  saveGradient: { paddingVertical: 18, alignItems: 'center' },
  saveButtonText: { fontSize: 17, fontWeight: '800', color: 'white' },
});
