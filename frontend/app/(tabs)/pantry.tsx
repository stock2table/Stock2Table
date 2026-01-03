import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator, Image, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useAppStore } from '../../store/appStore';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const CATEGORIES = ['vegetables', 'fruits', 'dairy', 'meat', 'grains', 'spices', 'other'];
const UNITS = ['kg', 'g', 'L', 'ml', 'pieces', 'cups', 'tbsp', 'tsp', 'lbs', 'oz'];

const CATEGORY_COLORS: Record<string, string> = {
  vegetables: '#22c55e', fruits: '#f97316', dairy: '#3b82f6', 
  meat: '#ef4444', grains: '#eab308', spices: '#a855f7', other: '#6b7280'
};

const CATEGORY_ICONS: Record<string, string> = {
  vegetables: 'leaf', fruits: 'nutrition', dairy: 'water',
  meat: 'restaurant', grains: 'fast-food', spices: 'sparkles', other: 'cube'
};

export default function PantryScreen() {
  const router = useRouter();
  const { sessionToken } = useAuth();
  const { pantryItems, fetchPantry, addPantryItem } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  
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

  const categorizedItems = pantryItems.reduce((acc: Record<string, any[]>, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const totalItems = pantryItems.length;
  const categoryCount = Object.keys(categorizedItems).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Pantry</Text>
          <Text style={styles.headerSubtitle}>{totalItems} items in {categoryCount} categories</Text>
        </View>
        <TouchableOpacity style={styles.scanBtn} onPress={() => router.push('/scan')}>
          <Ionicons name="camera" size={22} color="white" />
        </TouchableOpacity>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{totalItems}</Text>
          <Text style={styles.statLabel}>Total Items</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{categoryCount}</Text>
          <Text style={styles.statLabel}>Categories</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{pantryItems.filter(i => i.expiry_date).length}</Text>
          <Text style={styles.statLabel}>Expiring</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />}
      >
        {totalItems === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="basket-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>Your Pantry is Empty</Text>
            <Text style={styles.emptySubtitle}>Add items manually or scan receipts to get started</Text>
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
          Object.keys(categorizedItems).map(cat => {
            const color = CATEGORY_COLORS[cat] || '#6b7280';
            const icon = CATEGORY_ICONS[cat] || 'cube';
            const items = categorizedItems[cat];
            
            return (
              <View key={cat} style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <View style={[styles.categoryIconBox, { backgroundColor: color + '20' }]}>
                    <Ionicons name={icon as any} size={18} color={color} />
                  </View>
                  <Text style={styles.categoryTitle}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</Text>
                  <View style={[styles.categoryBadge, { backgroundColor: color + '20' }]}>
                    <Text style={[styles.categoryBadgeText, { color }]}>{items.length}</Text>
                  </View>
                </View>
                
                {items.map((item: any) => (
                  <TouchableOpacity 
                    key={item.item_id}
                    style={styles.itemCard}
                    onPress={() => openEditModal(item)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.itemIndicator, { backgroundColor: color }]} />
                    <View style={styles.itemContent}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemQty}>{item.quantity} {item.unit}</Text>
                    </View>
                    {item.expiry_date && (
                      <View style={styles.expiryBadge}>
                        <Ionicons name="time" size={12} color="#f97316" />
                        <Text style={styles.expiryText}>{item.expiry_date}</Text>
                      </View>
                    )}
                    <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
                  </TouchableOpacity>
                ))}
              </View>
            );
          })
        )}
        
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openAddModal} activeOpacity={0.9}>
        <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.fabGradient}>
          <Ionicons name="add" size={28} color="white" />
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
                {CATEGORIES.map(cat => (
                  <TouchableOpacity key={cat} style={[styles.chip, formCategory === cat && styles.chipActive]} onPress={() => setFormCategory(cat)}>
                    <Ionicons name={CATEGORY_ICONS[cat] as any} size={16} color={formCategory === cat ? 'white' : '#6b7280'} />
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
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, backgroundColor: '#22c55e' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: 'white' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  scanBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  
  statsBar: { flexDirection: 'row', backgroundColor: 'white', marginHorizontal: 20, marginTop: -10, borderRadius: 14, padding: 16, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6 },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: '#22c55e' },
  statLabel: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: '#e5e7eb' },
  
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 16 },
  
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#374151', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#9ca3af', marginTop: 8, textAlign: 'center' },
  emptyActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  emptyBtnPrimary: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#22c55e', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { fontSize: 15, fontWeight: '700', color: 'white' },
  emptyBtnSecondary: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f0fdf4', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  emptyBtnTextSecondary: { fontSize: 15, fontWeight: '700', color: '#22c55e' },
  
  categorySection: { marginBottom: 20 },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  categoryIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  categoryTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#1f2937' },
  categoryBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  categoryBadgeText: { fontSize: 13, fontWeight: '700' },
  
  itemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', paddingVertical: 14, paddingHorizontal: 14, borderRadius: 12, marginBottom: 8, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
  itemIndicator: { width: 4, height: 36, borderRadius: 2, marginRight: 12 },
  itemContent: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#1f2937', textTransform: 'capitalize' },
  itemQty: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  expiryBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff7ed', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 8 },
  expiryText: { fontSize: 10, fontWeight: '600', color: '#f97316' },
  
  fab: { position: 'absolute', bottom: 90, right: 20, borderRadius: 28, overflow: 'hidden', elevation: 8, shadowColor: '#22c55e', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
  fabGradient: { width: 56, height: 56, justifyContent: 'center', alignItems: 'center' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1f2937' },
  modalForm: { padding: 20 },
  formLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8, marginTop: 14 },
  formInput: { backgroundColor: '#f9fafb', borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10, padding: 14, fontSize: 15, color: '#1f2937' },
  chipScroll: { marginTop: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f3f4f6', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18, marginRight: 8 },
  chipActive: { backgroundColor: '#22c55e' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  chipTextActive: { color: 'white' },
  saveButton: { margin: 20, marginTop: 14, borderRadius: 12, overflow: 'hidden' },
  saveGradient: { paddingVertical: 16, alignItems: 'center' },
  saveButtonText: { fontSize: 16, fontWeight: '700', color: 'white' },
  deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 20, marginBottom: 24, paddingVertical: 14, borderRadius: 12, backgroundColor: '#fef2f2', borderWidth: 1.5, borderColor: '#fecaca', gap: 8 },
  deleteButtonText: { fontSize: 15, fontWeight: '700', color: '#ef4444' },
});
