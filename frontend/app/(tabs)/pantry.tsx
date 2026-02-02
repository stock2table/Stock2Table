import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator, Image, Modal, TextInput, Alert, KeyboardAvoidingView, Platform, StatusBar, Dimensions } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useAppStore } from '../../store/appStore';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';

const { width } = Dimensions.get('window');
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const CATEGORIES = ['vegetables', 'fruits', 'dairy', 'meat', 'grains', 'spices', 'other'];
const UNITS = ['kg', 'g', 'L', 'ml', 'pieces', 'cups', 'tbsp', 'tsp', 'lbs', 'oz'];

const CATEGORY_DATA: Record<string, { color: string; icon: string; gradient: string[]; image: string }> = {
  vegetables: { 
    color: '#22c55e', 
    icon: 'leaf', 
    gradient: ['#22c55e', '#16a34a'],
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80'
  },
  fruits: { 
    color: '#f97316', 
    icon: 'nutrition', 
    gradient: ['#f97316', '#ea580c'],
    image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&q=80'
  },
  dairy: { 
    color: '#3b82f6', 
    icon: 'water', 
    gradient: ['#3b82f6', '#2563eb'],
    image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400&q=80'
  },
  meat: { 
    color: '#ef4444', 
    icon: 'restaurant', 
    gradient: ['#ef4444', '#dc2626'],
    image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&q=80'
  },
  grains: { 
    color: '#eab308', 
    icon: 'fast-food', 
    gradient: ['#eab308', '#ca8a04'],
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e8ac?w=400&q=80'
  },
  spices: { 
    color: '#a855f7', 
    icon: 'sparkles', 
    gradient: ['#a855f7', '#9333ea'],
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80'
  },
  other: { 
    color: '#6b7280', 
    icon: 'cube', 
    gradient: ['#6b7280', '#4b5563'],
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80'
  }
};

export default function PantryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sessionToken } = useAuth();
  const { pantryItems, fetchPantry, addPantryItem } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Form state
  const [formName, setFormName] = useState('');
  const [formQuantity, setFormQuantity] = useState('');
  const [formUnit, setFormUnit] = useState('pieces');
  const [formCategory, setFormCategory] = useState('other');
  const [formExpiry, setFormExpiry] = useState('');

  useEffect(() => {
    if (sessionToken) {
      fetchPantry(sessionToken);
    }
  }, [sessionToken]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPantry(sessionToken!);
    setRefreshing(false);
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

  const handleDeleteItem = () => {
    if (!editingItem) return;
    const itemId = editingItem.item_id;
    setShowAddModal(false);
    axios.delete(`${BACKEND_URL}/api/pantry/${itemId}`, { headers: { Authorization: `Bearer ${sessionToken}` } })
      .then(() => fetchPantry(sessionToken!))
      .catch(() => Alert.alert('Error', 'Failed to delete'));
  };

  // Direct delete from list (with confirmation)
  const handleQuickDelete = (item: any) => {
    Alert.alert(
      'Delete Item',
      `Remove "${item.name}" from your pantry?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${BACKEND_URL}/api/pantry/${item.item_id}`, {
                headers: { Authorization: `Bearer ${sessionToken}` }
              });
              await fetchPantry(sessionToken!);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete item');
            }
          }
        }
      ]
    );
  };

  const categorizedItems = pantryItems.reduce((acc: Record<string, any[]>, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const totalItems = pantryItems.length;
  const categoryCount = Object.keys(categorizedItems).length;
  const expiringItems = pantryItems.filter(i => i.expiry_date).length;

  const filteredCategories = selectedCategory 
    ? { [selectedCategory]: categorizedItems[selectedCategory] || [] }
    : categorizedItems;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Hero Header */}
      <View style={styles.heroHeader}>
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=800&q=80' }} 
          style={styles.heroImage}
        />
        <LinearGradient colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']} style={styles.heroOverlay}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>My Pantry</Text>
              <Text style={styles.headerSubtitle}>
                {totalItems} items in {categoryCount} categories
              </Text>
            </View>
            <TouchableOpacity style={styles.scanBtn} onPress={() => router.push('/scan')}>
              <Ionicons name="scan" size={24} color="white" />
            </TouchableOpacity>
          </View>
          
          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{totalItems}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{categoryCount}</Text>
              <Text style={styles.statLabel}>Categories</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statValue, expiringItems > 0 && { color: '#fbbf24' }]}>{expiringItems}</Text>
              <Text style={styles.statLabel}>Expiring</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Category Filter */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, !selectedCategory && styles.filterChipActive]}
            onPress={() => setSelectedCategory(null)}
          >
            <Ionicons name="apps" size={16} color={!selectedCategory ? 'white' : '#6b7280'} />
            <Text style={[styles.filterText, !selectedCategory && styles.filterTextActive]}>All</Text>
          </TouchableOpacity>
          
          {CATEGORIES.map(cat => {
            const data = CATEGORY_DATA[cat];
            const count = categorizedItems[cat]?.length || 0;
            if (count === 0 && selectedCategory !== cat) return null;
            
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.filterChip, selectedCategory === cat && { backgroundColor: data.color }]}
                onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              >
                <Ionicons name={data.icon as any} size={16} color={selectedCategory === cat ? 'white' : data.color} />
                <Text style={[styles.filterText, selectedCategory === cat && styles.filterTextActive]}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Text>
                {count > 0 && (
                  <View style={[styles.filterBadge, { backgroundColor: selectedCategory === cat ? 'rgba(255,255,255,0.3)' : data.color + '20' }]}>
                    <Text style={[styles.filterBadgeText, { color: selectedCategory === cat ? 'white' : data.color }]}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />}
      >
        {totalItems === 0 ? (
          <View style={styles.emptyState}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1543362906-acfc16c67564?w=400&q=80' }}
              style={styles.emptyImage}
            />
            <Text style={styles.emptyTitle}>Your Pantry is Empty</Text>
            <Text style={styles.emptySubtitle}>Start by adding ingredients or scan your groceries</Text>
            <View style={styles.emptyActions}>
              <TouchableOpacity style={styles.emptyBtnPrimary} onPress={openAddModal}>
                <Ionicons name="add" size={20} color="white" />
                <Text style={styles.emptyBtnText}>Add Item</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.emptyBtnSecondary} onPress={() => router.push('/scan')}>
                <Ionicons name="camera" size={20} color="#22c55e" />
                <Text style={styles.emptyBtnTextSecondary}>Scan</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          Object.keys(filteredCategories).map(cat => {
            const data = CATEGORY_DATA[cat] || CATEGORY_DATA.other;
            const items = filteredCategories[cat];
            if (!items || items.length === 0) return null;
            
            return (
              <View key={cat} style={styles.categorySection}>
                {/* Category Header Card */}
                <View style={styles.categoryHeader}>
                  <Image source={{ uri: data.image }} style={styles.categoryImage} />
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.categoryOverlay}>
                    <View style={styles.categoryInfo}>
                      <View style={[styles.categoryIconBox, { backgroundColor: data.color }]}>
                        <Ionicons name={data.icon as any} size={20} color="white" />
                      </View>
                      <Text style={styles.categoryTitle}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</Text>
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryBadgeText}>{items.length}</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </View>
                
                {/* Items Grid */}
                <View style={styles.itemsGrid}>
                  {items.map((item: any) => (
                    <View key={item.item_id} style={styles.itemCard}>
                      <TouchableOpacity 
                        style={styles.itemTouchable}
                        onPress={() => openEditModal(item)}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.itemColor, { backgroundColor: data.color }]} />
                        <View style={styles.itemContent}>
                          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                          <Text style={styles.itemQty}>{item.quantity} {item.unit}</Text>
                        </View>
                        {item.expiry_date && (
                          <View style={styles.expiryTag}>
                            <Ionicons name="time" size={10} color="#f97316" />
                          </View>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.itemDeleteBtn}
                        onPress={() => handleQuickDelete(item)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="trash-outline" size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            );
          })
        )}
        
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openAddModal} activeOpacity={0.9}>
        <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.fabGradient}>
          <Ionicons name="add" size={30} color="white" />
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
                {CATEGORIES.map(cat => {
                  const data = CATEGORY_DATA[cat];
                  return (
                    <TouchableOpacity 
                      key={cat} 
                      style={[styles.chip, formCategory === cat && { backgroundColor: data.color }]} 
                      onPress={() => setFormCategory(cat)}
                    >
                      <Ionicons name={data.icon as any} size={16} color={formCategory === cat ? 'white' : data.color} />
                      <Text style={[styles.chipText, formCategory === cat && styles.chipTextActive]}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</Text>
                    </TouchableOpacity>
                  );
                })}
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
              <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteItem} activeOpacity={0.7}>
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
  
  heroHeader: { height: 200, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'flex-end', padding: 20 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: 'white' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  scanBtn: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  
  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: 14 },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '800', color: 'white' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.2)' },
  
  filterSection: { backgroundColor: 'white', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  filterScroll: { paddingHorizontal: 20, gap: 8 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f3f4f6', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, marginRight: 8 },
  filterChipActive: { backgroundColor: '#22c55e' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  filterTextActive: { color: 'white' },
  filterBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 2 },
  filterBadgeText: { fontSize: 11, fontWeight: '700' },
  
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 16 },
  
  emptyState: { alignItems: 'center', paddingVertical: 20 },
  emptyImage: { width: width - 80, height: 180, borderRadius: 20, marginBottom: 24 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#374151' },
  emptySubtitle: { fontSize: 14, color: '#9ca3af', marginTop: 8, textAlign: 'center', paddingHorizontal: 20 },
  emptyActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  emptyBtnPrimary: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#22c55e', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },
  emptyBtnText: { fontSize: 15, fontWeight: '700', color: 'white' },
  emptyBtnSecondary: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f0fdf4', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },
  emptyBtnTextSecondary: { fontSize: 15, fontWeight: '700', color: '#22c55e' },
  
  categorySection: { marginBottom: 24 },
  categoryHeader: { height: 80, borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  categoryImage: { width: '100%', height: '100%' },
  categoryOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'flex-end', padding: 14 },
  categoryInfo: { flexDirection: 'row', alignItems: 'center' },
  categoryIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  categoryTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: 'white' },
  categoryBadge: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  categoryBadgeText: { fontSize: 13, fontWeight: '700', color: 'white' },
  
  itemsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  itemCard: { width: (width - 50) / 2, flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 14, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, position: 'relative', overflow: 'hidden' },
  itemTouchable: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 12, paddingRight: 36 },
  itemColor: { width: 4, height: 36, borderRadius: 2, marginRight: 10 },
  itemContent: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#1f2937', textTransform: 'capitalize' },
  itemQty: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  expiryTag: { position: 'absolute', top: 8, right: 36, width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff7ed', justifyContent: 'center', alignItems: 'center' },
  itemDeleteBtn: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 36, backgroundColor: '#fef2f2', justifyContent: 'center', alignItems: 'center', borderLeftWidth: 1, borderLeftColor: '#fee2e2' },
  
  fab: { position: 'absolute', bottom: 90, right: 20, borderRadius: 28, overflow: 'hidden', elevation: 8, shadowColor: '#22c55e', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10 },
  fabGradient: { width: 60, height: 60, justifyContent: 'center', alignItems: 'center' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#1f2937' },
  modalForm: { padding: 20 },
  formLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8, marginTop: 14 },
  formInput: { backgroundColor: '#f9fafb', borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, fontSize: 15, color: '#1f2937' },
  chipScroll: { marginTop: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f3f4f6', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, marginRight: 8 },
  chipActive: { backgroundColor: '#22c55e' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  chipTextActive: { color: 'white' },
  saveButton: { margin: 20, marginTop: 14, borderRadius: 14, overflow: 'hidden' },
  saveGradient: { paddingVertical: 16, alignItems: 'center' },
  saveButtonText: { fontSize: 16, fontWeight: '700', color: 'white' },
  deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 20, marginBottom: 32, paddingVertical: 14, borderRadius: 14, backgroundColor: '#fef2f2', borderWidth: 1.5, borderColor: '#fecaca', gap: 8 },
  deleteButtonText: { fontSize: 15, fontWeight: '700', color: '#ef4444' },
});
