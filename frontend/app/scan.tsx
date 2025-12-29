import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useAppStore } from '../store/appStore';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function ScanScreen() {
  const router = useRouter();
  const { sessionToken } = useAuth();
  const { addPantryItem } = useAppStore();
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
        { headers: { Authorization: `Bearer ${sessionToken}` } }
      );

      setIngredients(response.data.ingredients);
    } catch (error: any) {
      console.error('Scan error:', error);
      Alert.alert(
        'Scan Failed',
        error.response?.data?.detail || 'Failed to identify ingredients'
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
      
      // Remove from list
      setIngredients(prev => prev.filter(i => i.name !== ingredient.name));
      
      if (ingredients.length === 1) {
        Alert.alert('Success', 'All ingredients added to pantry!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
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
      setIngredients([]);
      Alert.alert('Success', 'All ingredients added to pantry!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to add ingredients');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Ingredient</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Camera Preview/Image */}
        {!image ? (
          <View style={styles.placeholderContainer}>
            <Ionicons name="camera" size={80} color="#ccc" />
            <Text style={styles.placeholderText}>Take a photo or choose from gallery</Text>
          </View>
        ) : (
          <View style={styles.imageContainer}>
            <Image source={{ uri: image }} style={styles.image} />
            {scanning && (
              <View style={styles.scanningOverlay}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.scanningText}>Analyzing image...</Text>
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
          >
            <Ionicons name="camera" size={24} color="#4CAF50" />
            <Text style={styles.actionButtonText}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={pickFromGallery}
            disabled={scanning}
          >
            <Ionicons name="images" size={24} color="#4CAF50" />
            <Text style={styles.actionButtonText}>Choose Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Detected Ingredients */}
        {ingredients.length > 0 && (
          <View style={styles.ingredientsSection}>
            <View style={styles.ingredientsHeader}>
              <Text style={styles.sectionTitle}>Detected Ingredients</Text>
              <TouchableOpacity
                style={styles.saveAllButton}
                onPress={saveAll}
                disabled={saving}
              >
                <Text style={styles.saveAllText}>Save All</Text>
              </TouchableOpacity>
            </View>

            {ingredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredientCard}>
                <View style={styles.ingredientInfo}>
                  <Text style={styles.ingredientName}>{ingredient.name}</Text>
                  <Text style={styles.ingredientDetails}>
                    {ingredient.quantity} {ingredient.unit} • {ingredient.category}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => saveIngredient(ingredient)}
                  disabled={saving}
                >
                  <Ionicons name="add-circle" size={32} color="#4CAF50" />
                </TouchableOpacity>
              </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  placeholderContainer: {
    height: 300,
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  placeholderText: {
    marginTop: 16,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  imageContainer: {
    height: 300,
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningText: {
    marginTop: 16,
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  actionButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  ingredientsSection: {
    padding: 16,
  },
  ingredientsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  saveAllButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveAllText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  ingredientCard: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textTransform: 'capitalize',
  },
  ingredientDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  addButton: {
    padding: 4,
  },
});
