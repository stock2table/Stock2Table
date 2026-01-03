import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator, Animated, Image, Modal, TextInput, Alert, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useAppStore } from '../../store/appStore';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

const { width } = Dimensions.get('window');
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const CATEGORIES = ['vegetables', 'fruits', 'dairy', 'meat', 'grains', 'spices', 'other'];
const UNITS = ['kg', 'g', 'L', 'ml', 'pieces', 'cups', 'tbsp', 'tsp', 'lbs', 'oz'];

const CATEGORY_IMAGES: Record<string, string> = {
  vegetables: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80',
  fruits: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&q=80',
  dairy: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400&q=80',
  meat: 'https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=400&q=80',
  grains: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80',
  spices: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80',
  other: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=400&q=80',
};

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
  const [todaySuggestion, setTodaySuggestion] = useState<any>(null);
  
  // Form state
  const [formName, setFormName] = useState('');
  const [formQuantity, setFormQuantity] = useState('');
  const [formUnit, setFormUnit] = useState('pieces');
  const [formCategory, setFormCategory] = useState('other');
  const [formExpiry, setFormExpiry] = useState('');
  const [saving, setSaving] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (sessionToken) {
      loadData();
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    }
  }, [sessionToken]);

  useEffect(() => {
    // Set today's suggestion from recipes
    if (recipes.length > 0 && !todaySuggestion) {
      const randomRecipe = recipes[Math.floor(Math.random() * recipes.length)];
      setTodaySuggestion(randomRecipe);
    }
  }, [recipes]);

  const loadData = async () => {
    await Promise.all([fetchPantry(sessionToken!), fetchRecipes()]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    // Refresh today's suggestion
    if (recipes.length > 0) {
      const randomRecipe = recipes[Math.floor(Math.random() * recipes.length)];
      setTodaySuggestion(randomRecipe);
    }
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
    } catch (error) {
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
    if (!formName.trim() || !formQuantity) {
      Alert.alert('Error', 'Please fill in name and quantity');
      return;
    }
    try {
      setSaving(true);
      if (editingItem) {
        await axios.put(
          `${BACKEND_URL}/api/pantry/${editingItem.item_id}`,
          { name: formName.trim(), quantity: parseFloat(formQuantity), unit: formUnit, category: formCategory, expiry_date: formExpiry || null },
          { headers: { Authorization: `Bearer ${sessionToken}` } }
        );
      } else {
        await addPantryItem(sessionToken!, { name: formName.trim(), quantity: parseFloat(formQuantity), unit: formUnit, category: formCategory, expiry_date: formExpiry || null });
      }
      setShowAddModal(false);
      await fetchPantry(sessionToken!);
    } catch (error) {
      Alert.alert('Error', 'Failed to save ingredient');
    } finally {
      setSaving(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = { vegetables: 'leaf', fruits: 'nutrition', dairy: 'water', meat: 'restaurant', grains: 'fast-food', spices: 'sparkles', other: 'cube' };
    return icons[category] || 'cube';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = { vegetables: '#22c55e', fruits: '#f97316', dairy: '#3b82f6', meat: '#ef4444', grains: '#eab308', spices: '#a855f7', other: '#6b7280' };
    return colors[category] || '#6b7280';
  };

  const categorizedItems = pantryItems.reduce((acc: any, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const trendingRecipes = recipes.slice(0, 6);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] || 'Chef'}! 👋</Text>
            <Text style={styles.subGreeting}>What would you like to cook today?</Text>
          </View>
          <TouchableOpacity style={styles.notificationBtn} onPress={() => router.push('/(tabs)/profile')}>
            <Ionicons name="notifications-outline" size={24} color="#1f2937" />
          </TouchableOpacity>
        </View>

        {/* Today's Suggestion */}
        {todaySuggestion && (
          <TouchableOpacity 
            style={styles.suggestionCard}
            onPress={() => router.push(`/recipe-detail/${todaySuggestion.recipe_id}`)}
            activeOpacity={0.9}
          >
            <Image source={{ uri: todaySuggestion.image_url }} style={styles.suggestionImage} />
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.suggestionOverlay}>
              <View style={styles.suggestionBadge}>
                <Ionicons name="star" size={14} color="#fbbf24" />
                <Text style={styles.suggestionBadgeText}>Today's Suggestion</Text>
              </View>
              <Text style={styles.suggestionTitle}>{todaySuggestion.name}</Text>
              <Text style={styles.suggestionDesc} numberOfLines={2}>{todaySuggestion.description}</Text>
              <View style={styles.suggestionMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={16} color="white" />
                  <Text style={styles.metaText}>{todaySuggestion.prep_time + todaySuggestion.cook_time} min</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="people-outline" size={16} color="white" />
                  <Text style={styles.metaText}>4 servings</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="heart" size={16} color="#ef4444" />
                  <Text style={styles.metaText}>4.8</Text>
                </View>
              </View>
              <View style={styles.cookNowBtn}>
                <Text style={styles.cookNowText}>Cook Now</Text>
                <Ionicons name="arrow-forward" size={18} color="white" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Quick Feature Cards */}
        <View style={styles.featureCards}>
          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => router.push('/(tabs)/recipes')}
            activeOpacity={0.8}
          >
            <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.featureGradient}>
              <View style={styles.featureIconBg}>
                <Ionicons name="play-circle" size={28} color="#8b5cf6" />
              </View>
              <Text style={styles.featureTitle}>Video Tutorials</Text>
              <Text style={styles.featureSubtitle}>5 new videos</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => router.push('/(tabs)/meal-plan')}
            activeOpacity={0.8}
          >
            <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.featureGradient}>
              <View style={styles.featureIconBg}>
                <Ionicons name="calendar" size={28} color="#22c55e" />
              </View>
              <Text style={styles.featureTitle}>Weekly Plan</Text>
              <Text style={styles.featureSubtitle}>Plan your meals</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Trending Recipes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="trending-up" size={22} color="#f97316" />
              <Text style={styles.sectionTitle}>Trending Now</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/recipes')}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {trendingRecipes.map((recipe) => (
              <TouchableOpacity
                key={recipe.recipe_id}
                style={styles.trendingCard}
                onPress={() => router.push(`/recipe-detail/${recipe.recipe_id}`)}
                activeOpacity={0.9}
              >
                <Image source={{ uri: recipe.image_url }} style={styles.trendingImage} />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.trendingOverlay}>
                  <Text style={styles.trendingName} numberOfLines={1}>{recipe.name}</Text>
                  <View style={styles.trendingMeta}>
                    <Ionicons name="time" size={12} color="white" />
                    <Text style={styles.trendingTime}>{recipe.prep_time + recipe.cook_time}m</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/scan')} activeOpacity={0.8}>
              <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.actionGradient}>
                <Ionicons name="camera" size={26} color="white" />
              </LinearGradient>
              <Text style={styles.actionText}>Scan Items</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={getAIRecommendations} disabled={loadingRecs} activeOpacity={0.8}>
              <LinearGradient colors={['#ec4899', '#db2777']} style={styles.actionGradient}>
                {loadingRecs ? <ActivityIndicator color="white" /> : <Ionicons name="sparkles" size={26} color="white" />}
              </LinearGradient>
              <Text style={styles.actionText}>Get Ideas</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/shopping')} activeOpacity={0.8}>
              <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.actionGradient}>
                <Ionicons name="cart" size={26} color="white" />
              </LinearGradient>
              <Text style={styles.actionText}>Shopping</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={openAddModal} activeOpacity={0.8}>
              <LinearGradient colors={['#f97316', '#ea580c']} style={styles.actionGradient}>
                <Ionicons name="add" size={26} color="white" />
              </LinearGradient>
              <Text style={styles.actionText}>Add Item</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Recommendations */}
        {recommendations.length > 0 && (
          <View style={styles.section}>
            <View style={styles.aiBadge}>
              <Ionicons name="sparkles" size={16} color="white" />
              <Text style={styles.aiBadgeText}>AI Suggestions</Text>
            </View>
            <Text style={styles.sectionTitle}>Recipes You Can Make</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
              {recommendations.map((rec, idx) => {
                const recipe = findRecipeByName(rec.name);
                return (
                  <TouchableOpacity
                    key={idx}
                    style={styles.recCard}
                    onPress={() => recipe ? router.push(`/recipe-detail/${recipe.recipe_id}`) : router.push('/(tabs)/recipes')}
                    activeOpacity={0.9}
                  >
                    <Image source={{ uri: recipe?.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80' }} style={styles.recImage} />
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.recOverlay}>
                      <Text style={styles.recTitle} numberOfLines={2}>{rec.name}</Text>
                      <Text style={styles.recReason} numberOfLines={2}>{rec.reason}</Text>
                      {rec.missing_ingredients?.length > 0 && (
                        <View style={styles.missingBadge}>
                          <Ionicons name="cart" size={12} color="#f97316" />
                          <Text style={styles.missingText}>+{rec.missing_ingredients.length} items</Text>
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* My Pantry */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="basket" size={22} color="#22c55e" />
              <Text style={styles.sectionTitle}>My Pantry</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{pantryItems.length}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={openAddModal} style={styles.addIconBtn}>
              <Ionicons name="add-circle" size={28} color="#22c55e" />
            </TouchableOpacity>
          </View>

          {Object.keys(categorizedItems).length === 0 ? (
            <View style={styles.emptyPantry}>
              <Ionicons name="basket-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyTitle}>Your Pantry is Empty</Text>
              <Text style={styles.emptySubtitle}>Scan or add ingredients to get started</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={openAddModal}>
                <Text style={styles.emptyBtnText}>Add First Item</Text>
              </TouchableOpacity>
            </View>
          ) : (
            Object.keys(categorizedItems).map(cat => {
              const color = getCategoryColor(cat);
              return (
                <View key={cat} style={styles.categorySection}>
                  <View style={styles.categoryHeader}>
                    <View style={[styles.categoryIcon, { backgroundColor: color + '20' }]}>
                      <Ionicons name={getCategoryIcon(cat)} size={18} color={color} />
                    </View>
                    <Text style={styles.categoryTitle}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</Text>
                    <Text style={styles.categoryCount}>{categorizedItems[cat].length}</Text>
                  </View>
                  {categorizedItems[cat].map((item: any) => (
                    <TouchableOpacity 
                      key={item.item_id} 
                      style={styles.pantryItem}
                      onPress={() => openEditModal(item)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.itemDot, { backgroundColor: color }]} />
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemQty}>{item.quantity} {item.unit}</Text>
                      <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
                    </TouchableOpacity>
                  ))}
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

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
              <TextInput style={styles.formInput} placeholder="e.g., Tomatoes" placeholderTextColor="#9ca3af" value={formName} onChangeText={setFormName} />

              <Text style={styles.formLabel}>Quantity *</Text>
              <TextInput style={styles.formInput} placeholder="e.g., 5" placeholderTextColor="#9ca3af" value={formQuantity} onChangeText={setFormQuantity} keyboardType="decimal-pad" />

              <Text style={styles.formLabel}>Unit</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {UNITS.map(unit => (
                  <TouchableOpacity key={unit} style={[styles.chip, formUnit === unit && styles.chipActive]} onPress={() => setFormUnit(unit)}>
                    <Text style={[styles.chipText, formUnit === unit && styles.chipTextActive]}>{unit}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.formLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity key={cat} style={[styles.chip, formCategory === cat && styles.chipActive]} onPress={() => setFormCategory(cat)}>
                    <Ionicons name={getCategoryIcon(cat)} size={16} color={formCategory === cat ? 'white' : '#6b7280'} />
                    <Text style={[styles.chipText, formCategory === cat && styles.chipTextActive]}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.formLabel}>Expiry Date (optional)</Text>
              <TextInput style={styles.formInput} placeholder="YYYY-MM-DD" placeholderTextColor="#9ca3af" value={formExpiry} onChangeText={setFormExpiry} />
            </ScrollView>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveItem} disabled={saving}>
              <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.saveGradient}>
                {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>{editingItem ? 'Update' : 'Add'} Ingredient</Text>}
              </LinearGradient>
            </TouchableOpacity>

            {editingItem && (
              <TouchableOpacity 
                style={styles.deleteButton} 
                onPress={() => {
                  const itemId = editingItem.item_id;
                  setShowAddModal(false);
                  axios.delete(`${BACKEND_URL}/api/pantry/${itemId}`, { headers: { Authorization: `Bearer ${sessionToken}` } })
                    .then(() => fetchPantry(sessionToken!))
                    .catch(() => Alert.alert('Error', 'Failed to delete'));
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="trash" size={20} color="#ef4444" />
                <Text style={styles.deleteButtonText}>Delete This Item</Text>
              </TouchableOpacity>
            )}
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
  
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  greeting: { fontSize: 26, fontWeight: '800', color: '#1f2937' },
  subGreeting: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  notificationBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  
  // Today's Suggestion
  suggestionCard: { marginHorizontal: 20, height: 220, borderRadius: 24, overflow: 'hidden', marginBottom: 20 },
  suggestionImage: { width: '100%', height: '100%' },
  suggestionOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '100%', justifyContent: 'flex-end', padding: 20 },
  suggestionBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(251,191,36,0.2)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 12 },
  suggestionBadgeText: { fontSize: 12, fontWeight: '700', color: '#fbbf24' },
  suggestionTitle: { fontSize: 22, fontWeight: '800', color: 'white', marginBottom: 4 },
  suggestionDesc: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 12 },
  suggestionMeta: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13, color: 'white', fontWeight: '500' },
  cookNowBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f97316', alignSelf: 'flex-start', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  cookNowText: { fontSize: 15, fontWeight: '700', color: 'white' },
  
  // Feature Cards
  featureCards: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 24 },
  featureCard: { flex: 1, borderRadius: 20, overflow: 'hidden' },
  featureGradient: { padding: 16, alignItems: 'center' },
  featureIconBg: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  featureTitle: { fontSize: 14, fontWeight: '700', color: 'white' },
  featureSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  
  // Section
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#1f2937' },
  seeAllText: { fontSize: 14, fontWeight: '600', color: '#22c55e' },
  countBadge: { backgroundColor: '#22c55e', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginLeft: 8 },
  countText: { fontSize: 12, fontWeight: '700', color: 'white' },
  addIconBtn: {},
  
  // Trending
  trendingCard: { width: 140, height: 180, borderRadius: 16, overflow: 'hidden', marginRight: 12 },
  trendingImage: { width: '100%', height: '100%' },
  trendingOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12, height: '50%', justifyContent: 'flex-end' },
  trendingName: { fontSize: 13, fontWeight: '700', color: 'white', marginBottom: 4 },
  trendingMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trendingTime: { fontSize: 11, color: 'rgba(255,255,255,0.9)' },
  
  // Quick Actions
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: { alignItems: 'center', width: (width - 64) / 4 },
  actionGradient: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionText: { fontSize: 11, fontWeight: '600', color: '#6b7280' },
  
  // AI Badge & Recommendations
  aiBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ec4899', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 8 },
  aiBadgeText: { fontSize: 12, fontWeight: '700', color: 'white' },
  recCard: { width: 180, height: 240, borderRadius: 16, overflow: 'hidden', marginRight: 12 },
  recImage: { width: '100%', height: '100%' },
  recOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14, height: '60%', justifyContent: 'flex-end' },
  recTitle: { fontSize: 14, fontWeight: '700', color: 'white', marginBottom: 4 },
  recReason: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginBottom: 6 },
  missingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(249,115,22,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  missingText: { fontSize: 10, color: '#f97316', fontWeight: '600' },
  
  // Pantry
  emptyPantry: { alignItems: 'center', padding: 32, backgroundColor: 'white', borderRadius: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#9ca3af', marginTop: 4 },
  emptyBtn: { backgroundColor: '#22c55e', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 20 },
  emptyBtnText: { fontSize: 15, fontWeight: '700', color: 'white' },
  
  categorySection: { marginBottom: 16 },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  categoryIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  categoryTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#1f2937' },
  categoryCount: { fontSize: 14, color: '#9ca3af', fontWeight: '500' },
  
  pantryItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, marginBottom: 8, gap: 12 },
  itemDot: { width: 8, height: 8, borderRadius: 4 },
  itemName: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1f2937', textTransform: 'capitalize' },
  itemQty: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#1f2937' },
  modalForm: { padding: 24 },
  formLabel: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8, marginTop: 16 },
  formInput: { backgroundColor: '#f9fafb', borderWidth: 2, borderColor: '#e5e7eb', borderRadius: 12, padding: 16, fontSize: 16, color: '#1f2937' },
  chipScroll: { marginTop: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f3f4f6', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 8 },
  chipActive: { backgroundColor: '#22c55e' },
  chipText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  chipTextActive: { color: 'white' },
  saveButton: { margin: 24, marginTop: 16, borderRadius: 14, overflow: 'hidden' },
  saveGradient: { paddingVertical: 18, alignItems: 'center' },
  saveButtonText: { fontSize: 17, fontWeight: '800', color: 'white' },
  deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 24, marginBottom: 24, paddingVertical: 16, borderRadius: 14, backgroundColor: '#fef2f2', borderWidth: 2, borderColor: '#fecaca', gap: 8 },
  deleteButtonText: { fontSize: 16, fontWeight: '700', color: '#ef4444' },
});
