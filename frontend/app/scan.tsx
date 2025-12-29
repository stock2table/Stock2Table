import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { useAppStore } from '../store/appStore';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function ScanScreen() {
  const router = useRouter();
  const { sessionToken } = useAuth();
  const { addPantryItem, fetchPantry } = useAppStore();
  const [image, setImage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Camera permission is needed to scan ingredients'
      );
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
      await scanIngredient(result.assets[0].base64);
    }
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
      await scanIngredient(result.assets[0].base64);
    }
  };

  const scanIngredient = async (base64Image: string) => {
    try {
      setScanning(true);
      const response = await axios.post(
        `${BACKEND_URL}/api/scan-ingredient`,
        { image_base64: base64Image },
        { headers: { Authorization: `Bearer ${sessionToken}` }, timeout: 30000 }
      );

      setIngredients(response.data.ingredients);
    } catch (error: any) {
      console.error('Scan error:', error);
      Alert.alert(
        'Scan Failed',
        error.response?.data?.detail || 'Failed to identify ingredients. Please try again.'
      );
    } finally {
      setScanning(false);
    }
  };

  const saveIngredient = async (ingredient: any) => {
    try {
      setSaving(true);
      await addPantryItem(sessionToken!, {
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        category: ingredient.category,
      });
      
      // Refresh pantry in background
      fetchPantry(sessionToken!);
      
      // Remove from list
      setIngredients(prev => prev.filter(i => i.name !== ingredient.name));
      
      if (ingredients.length === 1) {
        Alert.alert(
          'Success! 🎉', 
          'All ingredients added to your pantry. You can now edit or delete them anytime!', 
          [{ text: 'Go to Pantry', onPress: () => router.replace('/(tabs)') }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add ingredient');
    } finally {
      setSaving(false);
    }
  };

  const saveAll = async () => {
    try {
      setSaving(true);
      for (const ingredient of ingredients) {
        await addPantryItem(sessionToken!, {
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          category: ingredient.category,
        });
      }
      
      // Refresh pantry
      await fetchPantry(sessionToken!);
      
      setIngredients([]);
      Alert.alert(
        'Success! 🎉',
        `${ingredients.length} ingredients added to your pantry. You can edit or delete them from the Pantry tab!`,
        [{ text: 'Go to Pantry', onPress: () => router.replace('/(tabs)') }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to add ingredients');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#8b5cf6', '#6366f1']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Ingredient Scanner</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={20} color="#8b5cf6" />
          <Text style={styles.infoText}>
            Scanned ingredients are added to your pantry and can be edited or deleted anytime!
          </Text>
        </View>

        {/* Camera Preview/Image */}
        {!image ? (
          <LinearGradient colors={['#f3f4f6', '#e5e7eb']} style={styles.placeholderContainer}>
            <View style={styles.placeholderIcon}>
              <Ionicons name="camera" size={60} color="#8b5cf6" />
            </View>
            <Text style={styles.placeholderTitle}>Capture Your Ingredients</Text>
            <Text style={styles.placeholderText}>Take a photo or choose from gallery</Text>
          </LinearGradient>
        ) : (
          <View style={styles.imageContainer}>
            <Image source={{ uri: image }} style={styles.image} />
            {scanning && (
              <View style={styles.scanningOverlay}>
                <LinearGradient colors={['#8b5cf6', '#ec4899']} style={styles.scanningCircle}>
                  <ActivityIndicator size="large" color="white" />
                </LinearGradient>
                <Text style={styles.scanningText}>AI is analyzing...</Text>
                <Text style={styles.scanningSubtext}>Identifying ingredients</Text>
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={takePhoto}
            disabled={scanning}
            activeOpacity={0.8}
          >
            <LinearGradient colors={['#8b5cf6', '#6366f1']} style={styles.actionGradient}>
              <Ionicons name="camera" size={26} color="white" />
              <Text style={styles.actionButtonText}>Take Photo</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={pickFromGallery}
            disabled={scanning}
            activeOpacity={0.8}
          >
            <LinearGradient colors={['#ec4899', '#f43f5e']} style={styles.actionGradient}>
              <Ionicons name="images" size={26} color="white" />
              <Text style={styles.actionButtonText}>Choose Photo</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Detected Ingredients */}
        {ingredients.length > 0 && (
          <View style={styles.ingredientsSection}>
            <View style={styles.ingredientsHeader}>
              <View style={styles.headerBadge}>
                <LinearGradient colors={['#10b981', '#34d399']} style={styles.badgeGradient}>
                  <Ionicons name="checkmark-circle" size={18} color="white" />
                  <Text style={styles.badgeText}>Found {ingredients.length}</Text>
                </LinearGradient>
              </View>
              <TouchableOpacity
                style={styles.saveAllButton}
                onPress={saveAll}
                disabled={saving}
              >
                <LinearGradient colors={['#8b5cf6', '#ec4899']} style={styles.saveAllGradient}>
                  <Text style={styles.saveAllText}>Add All to Pantry</Text>
                  <Ionicons name="arrow-forward" size={16} color="white" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionSubtitle}>
              Tap to add individually or use "Add All" button
            </Text>

            {ingredients.map((ingredient, index) => (
              <TouchableOpacity
                key={index}
                style={styles.ingredientCard}
                onPress={() => saveIngredient(ingredient)}
                disabled={saving}
                activeOpacity={0.9}
              >
                <View style={styles.ingredientIconCircle}>
                  <Ionicons name="nutrition" size={28} color="#8b5cf6" />
                </View>
                <View style={styles.ingredientInfo}>
                  <Text style={styles.ingredientName}>{ingredient.name}</Text>
                  <Text style={styles.ingredientDetails}>
                    {ingredient.quantity} {ingredient.unit} • {ingredient.category}
                  </Text>
                </View>
                <View style={styles.addIconCircle}>
                  <Ionicons name="add" size={24} color="white" />
                </View>
              </TouchableOpacity>
            ))}

            <View style={styles.editHint}>
              <Ionicons name="information-circle-outline" size={18} color="#6b7280" />
              <Text style={styles.editHintText}>
                After adding, you can edit quantities or delete items from the Pantry tab
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: 'white' },
  content: { flex: 1 },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f3f4f6',
    padding: 16,
    marginHorizontal: 24,
    marginTop: 20,
    borderRadius: 16,
  },
  infoText: { flex: 1, fontSize: 14, color: '#374151', fontWeight: '500', lineHeight: 20 },
  placeholderContainer: {
    height: 300,
    marginHorizontal: 24,
    marginTop: 20,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  placeholderIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  placeholderTitle: { fontSize: 20, fontWeight: '700', color: '#1f2937', marginBottom: 8 },
  placeholderText: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  imageContainer: {
    height: 300,
    marginHorizontal: 24,
    marginTop: 20,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  image: { width: '100%', height: '100%', resizeMode: 'contain' },
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  scanningText: { color: 'white', fontSize: 20, fontWeight: '700', marginBottom: 8 },
  scanningSubtext: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  actionButtons: { flexDirection: 'row', paddingHorizontal: 24, marginTop: 20, gap: 12 },
  actionButton: { flex: 1, borderRadius: 16, overflow: 'hidden', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  actionGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  actionButtonText: { color: 'white', fontSize: 15, fontWeight: '700' },
  ingredientsSection: { marginTop: 32, paddingHorizontal: 24 },
  ingredientsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerBadge: { borderRadius: 20, overflow: 'hidden' },
  badgeGradient: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8 },
  badgeText: { fontSize: 13, fontWeight: '700', color: 'white' },
  saveAllButton: { borderRadius: 12, overflow: 'hidden' },
  saveAllGradient: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10 },
  saveAllText: { color: 'white', fontSize: 14, fontWeight: '700' },
  sectionSubtitle: { fontSize: 14, color: '#6b7280', marginBottom: 16 },
  ingredientCard: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    gap: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  ingredientIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ingredientInfo: { flex: 1 },
  ingredientName: { fontSize: 17, fontWeight: '700', color: '#1f2937', marginBottom: 4, textTransform: 'capitalize' },
  ingredientDetails: { fontSize: 14, color: '#6b7280' },
  addIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  editHintText: { flex: 1, fontSize: 13, color: '#6b7280', lineHeight: 18 },
});
