import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator, Animated, Image, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useAppStore } from '../../store/appStore';
import { LinearGradient } from 'expo-linear-gradient';
import { Swipeable } from 'react-native-gesture-handler';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const CATEGORIES = ['vegetables', 'fruits', 'dairy', 'meat', 'grains', 'spices', 'other'];
const UNITS = ['kg', 'g', 'L', 'ml', 'pieces', 'cups', 'tbsp', 'tsp', 'lbs', 'oz'];

export default function PantryScreen() {
  const router = useRouter();
  const { sessionToken, user } = useAuth();
  const { pantryItems, fetchPantry, recipes, fetchRecipes, deletePantryItem, addPantryItem } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Form state
  const [formName, setFormName] = useState('');
  const [formQuantity, setFormQuantity] = useState('');
  const [formUnit, setFormUnit] = useState('pieces');
  const [formCategory, setFormCategory] = useState('other');
  const [formExpiry, setFormExpiry] = useState('');
  const [saving, setSaving] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

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
      Alert.alert('Empty Pantry', 'Add some ingredients first to get AI recipe recommendations! 🥗');
      return;
    }
    try {
      setLoadingRecs(true);
      setRecommendations([]);
      const response = await axios.post(
        `${BACKEND_URL}/api/recipes/recommend`,
        {},
        { headers: { Authorization: `Bearer ${sessionToken}` }, timeout: 20000 }
      );
      setRecommendations(response.data.recommendations);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to get AI recommendations. Please try again! 🤖');
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
        'Recipe Coming Soon',
        `"${rec.name}" will be added to our database soon! Meanwhile, try our other amazing recipes. 🍳`,
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

  const deleteItem = async (item: any) => {
    try {
      await deletePantryItem(sessionToken!, item.item_id);
      Alert.alert('Deleted', `${item.name} removed from pantry!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete ingredient');
    }
  };

  const renderRightActions = (item: any) => {
    return (
      <View style={styles.swipeActions}>
        <TouchableOpacity
          style={styles.editAction}
          onPress={() => openEditModal(item)}
        >
          <Ionicons name="create" size={24} color="white" />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteAction}
          onPress={() => {
            Alert.alert(
              'Delete Ingredient',
              `Remove "${item.name}" from your pantry?`,
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deleteItem(item) }
              ]
            );
          }}
        >
          <Ionicons name="trash" size={24} color="white" />
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const getCategoryIcon = (category: string) => {
    const icons: any = {
      vegetables: 'leaf', fruits: 'nutrition', dairy: 'water',
      meat: 'restaurant', grains: 'fast-food', spices: 'sparkles', other: 'cube'
    };
    return icons[category] || 'cube';
  };

  const getCategoryGradient = (category: string) => {
    const gradients: any = {
      vegetables: ['#10b981', '#34d399'],
      fruits: ['#f59e0b', '#fbbf24'],
      dairy: ['#3b82f6', '#60a5fa'],
      meat: ['#ef4444', '#f87171'],
      grains: ['#f59e0b', '#fcd34d'],
      spices: ['#8b5cf6', '#a78bfa'],
      other: ['#6b7280', '#9ca3af']
    };
    return gradients[category] || ['#6b7280', '#9ca3af'];
  };

  const categorizedItems = pantryItems.reduce((acc: any, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const expiringCount = pantryItems.filter(i => i.expiry_date).length;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#8b5cf6', '#6366f1']} style={styles.headerGradient}>
        <Animated.View style={[styles.headerContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.greetingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greetingText}>Hello, {user?.name?.split(' ')[0] || 'there'}! 👋</Text>
              <Text style={styles.subGreeting}>What's cooking today?</Text>
            </View>
            {user?.picture && (
              <Image source={{ uri: user.picture }} style={styles.profilePic} />
            )}
          </View>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" />}
      >
        <Animated.View style={[styles.statsRow, { opacity: fadeAnim }]}>
          <TouchableOpacity style={styles.statCard} activeOpacity={0.85}>
            <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.statGradient}>
              <View style={styles.statIconCircle}>
                <Ionicons name="basket" size={28} color="white" />
              </View>
              <Text style={styles.statNumber}>{pantryItems.length}</Text>
              <Text style={styles.statLabel}>Items in Pantry</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statCard} activeOpacity={0.85}>
            <LinearGradient colors={['#f59e0b', '#f97316']} style={styles.statGradient}>
              <View style={styles.statIconCircle}>
                <Ionicons name="time" size={28} color="white" />
              </View>
              <Text style={styles.statNumber}>{expiringCount}</Text>
              <Text style={styles.statLabel}>Expiring Soon</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Swipe Tutorial Hint */}
        {pantryItems.length > 0 && (
          <View style={styles.hintBanner}>
            <Ionicons name="hand-left" size={20} color="#8b5cf6" />
            <Text style={styles.hintText}>Swipe left on any item to edit or delete</Text>
          </View>
        )}

        {recommendations.length > 0 && (
          <Animated.View style={[styles.recSection, { opacity: fadeAnim }]}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.aiHeaderBadge}>
                <LinearGradient colors={['#ec4899', '#f43f5e']} style={styles.aiBadgeGrad}>
                  <Ionicons name="sparkles" size={18} color="white" />
                  <Text style={styles.aiBadgeText}>AI Powered</Text>
                </LinearGradient>
              </View>
            </View>
            <Text style={styles.sectionTitle}>Recipes You Can Make</Text>

            {recommendations.map((rec, idx) => {
              const recipe = findRecipeByName(rec.name);
              return (
                <TouchableOpacity
                  key={idx}
                  style={styles.recCard}
                  onPress={() => handleRecommendationClick(rec)}
                  activeOpacity={0.8}
                >
                  <View style={styles.recImageContainer}>
                    {recipe?.image_url ? (
                      <Image source={{ uri: recipe.image_url }} style={styles.recImage} />
                    ) : (
                      <LinearGradient colors={['#ec4899', '#f43f5e']} style={styles.recImagePlaceholder}>
                        <Ionicons name="restaurant" size={40} color="white" />
                      </LinearGradient>
                    )}
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.recImageOverlay} />
                    <View style={styles.recBadge}>
                      <Ionicons name="star" size={14} color="#fbbf24" />
                      <Text style={styles.recBadgeText}>Match</Text>
                    </View>
                  </View>
                  <View style={styles.recContent}>
                    <Text style={styles.recTitle}>{rec.name}</Text>
                    <Text style={styles.recReason} numberOfLines={2}>{rec.reason}</Text>
                    {rec.missing_ingredients && rec.missing_ingredients.length > 0 && (
                      <View style={styles.missingBadge}>
                        <Ionicons name="alert-circle" size={14} color="#f97316" />
                        <Text style={styles.missingText} numberOfLines={1}>
                          Need: {rec.missing_ingredients.slice(0, 2).join(', ')}
                          {rec.missing_ingredients.length > 2 && ` +${rec.missing_ingredients.length - 2}`}
                        </Text>
                      </View>
                    )}
                    <View style={styles.viewRecipeBtn}>
                      <Text style={styles.viewRecipeText}>View Recipe</Text>
                      <Ionicons name="arrow-forward" size={16} color="#8b5cf6" />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </Animated.View>
        )}

        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.primaryAction} onPress={() => router.push('/scan')} activeOpacity={0.85}>
            <LinearGradient colors={['#8b5cf6', '#6366f1']} style={styles.actionGrad}>
              <View style={styles.actionIconCircle}>
                <Ionicons name="camera" size={26} color="white" />
              </View>
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>Scan Ingredients</Text>
                <Text style={styles.actionSubtitle}>Use AI to identify food</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.7)" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryAction} onPress={getAIRecommendations} disabled={loadingRecs} activeOpacity={0.85}>
            <LinearGradient colors={['#ec4899', '#f43f5e']} style={styles.actionGrad}>
              {loadingRecs ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <View style={styles.actionIconCircle}>
                    <Ionicons name="bulb" size={26} color="white" />
                  </View>
                  <View style={styles.actionText}>
                    <Text style={styles.actionTitle}>Get Recipe Ideas</Text>
                    <Text style={styles.actionSubtitle}>AI-powered suggestions</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.7)" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {Object.keys(categorizedItems).length === 0 ? (
          <View style={styles.emptyContainer}>
            <LinearGradient colors={['#f3f4f6', '#e5e7eb']} style={styles.emptyGrad}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="basket-outline" size={60} color="#9ca3af" />
              </View>
              <Text style={styles.emptyTitle}>Your Pantry is Empty</Text>
              <Text style={styles.emptySubtitle}>Start by adding or scanning ingredients!</Text>
              <TouchableOpacity style={styles.emptyButton} onPress={openAddModal}>
                <Text style={styles.emptyButtonText}>Add Your First Item</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        ) : (
          Object.keys(categorizedItems).map(cat => {
            const [c1, c2] = getCategoryGradient(cat);
            return (
              <View key={cat} style={styles.categoryContainer}>
                <View style={styles.categoryHeader}>
                  <LinearGradient colors={[c1, c2]} style={styles.catIconCircle}>
                    <Ionicons name={getCategoryIcon(cat)} size={20} color="white" />
                  </LinearGradient>
                  <Text style={styles.categoryTitle}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Text>
                  <View style={styles.categoryCount}>
                    <Text style={styles.categoryCountText}>{categorizedItems[cat].length}</Text>
                  </View>
                </View>
                {categorizedItems[cat].map((item: any) => (
                  <Swipeable
                    key={item.item_id}
                    renderRightActions={() => renderRightActions(item)}
                    overshootRight={false}
                  >
                    <View style={styles.pantryCard}>
                      <LinearGradient colors={[c1 + '15', c2 + '15']} style={styles.itemIconBg}>
                        <Ionicons name={getCategoryIcon(cat)} size={28} color={c1} />
                      </LinearGradient>
                      <View style={styles.itemDetails}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <View style={styles.itemMeta}>
                          <View style={[styles.itemBadge, { backgroundColor: c1 + '20' }]}>
                            <Text style={[styles.itemBadgeText, { color: c1 }]}>
                              {item.quantity} {item.unit}
                            </Text>
                          </View>
                          {item.expiry_date && (
                            <View style={styles.expiryBadge}>
                              <Ionicons name="time-outline" size={12} color="#f97316" />
                              <Text style={styles.expiryText}>{item.expiry_date}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <Ionicons name="chevron-back" size={20} color="#d1d5db" />
                    </View>
                  </Swipeable>
                ))}
              </View>
            );
          })
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <TouchableOpacity style={styles.fabButton} onPress={openAddModal} activeOpacity={0.9}>
        <LinearGradient colors={['#8b5cf6', '#ec4899']} style={styles.fabGradient}>
          <Ionicons name="add" size={32} color="white" />
        </LinearGradient>
      </TouchableOpacity>

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
                value={formName}
                onChangeText={setFormName}
              />

              <Text style={styles.formLabel}>Quantity *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g., 5"
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
                value={formExpiry}
                onChangeText={setFormExpiry}
              />
            </ScrollView>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveItem} disabled={saving}>
              <LinearGradient colors={['#8b5cf6', '#ec4899']} style={styles.saveGradient}>
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
  container: { flex: 1, backgroundColor: '#fafafa' },
  headerGradient: { paddingTop: 60, paddingBottom: 32, paddingHorizontal: 24 },
  headerContent: {},
  greetingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greetingText: { fontSize: 28, fontWeight: '700', color: 'white', marginBottom: 4 },
  subGreeting: { fontSize: 16, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },
  profilePic: { width: 50, height: 50, borderRadius: 25, borderWidth: 3, borderColor: 'white' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 24, marginTop: -40, gap: 16 },
  statCard: { flex: 1, borderRadius: 24, overflow: 'hidden', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 },
  statGradient: { padding: 24, alignItems: 'center' },
  statIconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statNumber: { fontSize: 32, fontWeight: '800', color: 'white', marginBottom: 4 },
  statLabel: { fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  hintBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#f3f4f6', padding: 16, marginHorizontal: 24, marginTop: 20, borderRadius: 12 },
  hintText: { flex: 1, fontSize: 14, color: '#374151', fontWeight: '500' },
  recSection: { marginTop: 32, paddingHorizontal: 24 },
  sectionHeaderRow: { marginBottom: 12 },
  aiHeaderBadge: { alignSelf: 'flex-start', borderRadius: 20, overflow: 'hidden' },
  aiBadgeGrad: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8 },
  aiBadgeText: { fontSize: 13, fontWeight: '700', color: 'white' },
  sectionTitle: { fontSize: 24, fontWeight: '800', color: '#1f2937', marginBottom: 16 },
  recCard: { backgroundColor: 'white', borderRadius: 20, marginBottom: 16, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
  recImageContainer: { position: 'relative', height: 180 },
  recImage: { width: '100%', height: '100%' },
  recImagePlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  recImageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 },
  recBadge: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  recBadgeText: { fontSize: 12, fontWeight: '700', color: 'white' },
  recContent: { padding: 16 },
  recTitle: { fontSize: 20, fontWeight: '700', color: '#1f2937', marginBottom: 8 },
  recReason: { fontSize: 14, color: '#6b7280', lineHeight: 20, marginBottom: 12 },
  missingBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff7ed', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginBottom: 12 },
  missingText: { flex: 1, fontSize: 13, color: '#ea580c', fontWeight: '600' },
  viewRecipeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#f3f4f6', paddingVertical: 12, borderRadius: 12 },
  viewRecipeText: { fontSize: 15, fontWeight: '700', color: '#8b5cf6' },
  actionsSection: { marginTop: 32, paddingHorizontal: 24, gap: 12 },
  primaryAction: { borderRadius: 20, overflow: 'hidden', elevation: 6, shadowColor: '#8b5cf6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
  secondaryAction: { borderRadius: 20, overflow: 'hidden', elevation: 6, shadowColor: '#ec4899', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
  actionGrad: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 },
  actionIconCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center' },
  actionText: { flex: 1 },
  actionTitle: { fontSize: 17, fontWeight: '700', color: 'white', marginBottom: 2 },
  actionSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },
  categoryContainer: { marginTop: 32, paddingHorizontal: 24 },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  catIconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6 },
  categoryTitle: { flex: 1, fontSize: 20, fontWeight: '700', color: '#1f2937' },
  categoryCount: { backgroundColor: '#f3f4f6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  categoryCountText: { fontSize: 14, fontWeight: '700', color: '#6b7280' },
  pantryCard: { backgroundColor: 'white', flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
  itemIconBg: { width: 60, height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  itemDetails: { flex: 1 },
  itemName: { fontSize: 17, fontWeight: '600', color: '#1f2937', marginBottom: 8, textTransform: 'capitalize' },
  itemMeta: { flexDirection: 'row', gap: 8 },
  itemBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  itemBadgeText: { fontSize: 13, fontWeight: '700' },
  expiryBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff7ed', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  expiryText: { fontSize: 12, fontWeight: '600', color: '#ea580c' },
  swipeActions: { flexDirection: 'row', marginBottom: 12 },
  editAction: { backgroundColor: '#8b5cf6', justifyContent: 'center', alignItems: 'center', width: 80, paddingHorizontal: 12 },
  deleteAction: { backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center', width: 80, paddingHorizontal: 12 },
  actionText: { color: 'white', fontSize: 12, fontWeight: '600', marginTop: 4 },
  emptyContainer: { marginTop: 60, marginHorizontal: 24, borderRadius: 24, overflow: 'hidden' },
  emptyGrad: { padding: 48, alignItems: 'center' },
  emptyIconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#374151', marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: '#6b7280', textAlign: 'center', marginBottom: 24 },
  emptyButton: { backgroundColor: '#8b5cf6', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  emptyButtonText: { fontSize: 15, fontWeight: '700', color: 'white' },
  fabButton: { position: 'absolute', bottom: 24, right: 24, borderRadius: 32, overflow: 'hidden', elevation: 12, shadowColor: '#8b5cf6', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16 },
  fabGradient: { width: 64, height: 64, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  modalTitle: { fontSize: 24, fontWeight: '800', color: '#1f2937' },
  modalForm: { padding: 24 },
  formLabel: { fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 10, marginTop: 16 },
  formInput: { backgroundColor: '#f9fafb', borderWidth: 2, borderColor: '#e5e7eb', borderRadius: 12, padding: 16, fontSize: 16, color: '#1f2937' },
  chipScroll: { marginTop: 8, marginBottom: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f3f4f6', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 8 },
  chipActive: { backgroundColor: '#8b5cf6' },
  chipText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  chipTextActive: { color: 'white' },
  saveButton: { margin: 24, marginTop: 16, borderRadius: 16, overflow: 'hidden' },
  saveGradient: { paddingVertical: 18, alignItems: 'center' },
  saveButtonText: { fontSize: 17, fontWeight: '800', color: 'white' },
});
