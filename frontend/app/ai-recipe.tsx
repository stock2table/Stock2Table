import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Linking } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function AIRecipeScreen() {
  const router = useRouter();
  const { recipe: recipeParam } = useLocalSearchParams();
  const { sessionToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [recipeDetails, setRecipeDetails] = useState<any>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (recipeParam) {
      const parsed = JSON.parse(recipeParam as string);
      generateRecipeDetails(parsed);
    }
  }, [recipeParam]);

  const generateRecipeDetails = async (rec: any) => {
    try {
      setLoading(true);
      
      // Prepare ingredients - combine all available sources
      const allIngredients = [
        ...(rec.available_ingredients || []),
        ...(rec.custom_additions || []),
      ];
      
      // Call AI to generate detailed recipe instructions
      const response = await axios.post(
        `${BACKEND_URL}/api/recipes/generate-details`,
        { 
          recipe_name: rec.name, 
          available_ingredients: allIngredients, 
          missing_ingredients: rec.missing_ingredients || [],
          required_ingredients: rec.required_ingredients || [],
          custom_additions: rec.custom_additions || [],
        },
        { headers: { Authorization: `Bearer ${sessionToken}` }, timeout: 60000 }
      );
      
      setRecipeDetails({
        ...rec,
        ...response.data,
        custom_additions: rec.custom_additions || [],
        image_url: response.data.image_url || `https://source.unsplash.com/800x600/?${encodeURIComponent(rec.name)},food`,
      });
    } catch (error) {
      // Fallback to basic recipe structure
      const customAdditions = rec.custom_additions || [];
      setRecipeDetails({
        ...rec,
        custom_additions: customAdditions,
        image_url: `https://source.unsplash.com/800x600/?${encodeURIComponent(rec.name)},food`,
        prep_time: 15,
        cook_time: 30,
        servings: 4,
        difficulty: 'medium',
        ingredients: [
          ...(rec.available_ingredients || []).map((i: string) => ({ name: i, quantity: '1', unit: 'as needed' })), 
          ...(rec.missing_ingredients || []).map((i: string) => ({ name: i, quantity: '1', unit: 'as needed', missing: true })),
          ...customAdditions.map((i: string) => ({ name: i, quantity: '1', unit: 'as needed', custom: true })),
        ],
        instructions: [
          'Gather all ingredients and prepare your workspace.',
          `Prepare ${rec.name} according to traditional methods.`,
          customAdditions.length > 0 ? `Add your custom ingredients: ${customAdditions.join(', ')} to enhance the dish.` : null,
          'Season to taste and adjust flavors as needed.',
          'Plate beautifully and serve hot.',
          'Enjoy your homemade meal!'
        ].filter(Boolean),
        nutritional_info: { calories: 400, protein: 20, carbs: 45, fat: 18 },
        tips: ['Adjust seasoning to your taste', 'Can be prepared ahead of time', 'Pairs well with a fresh salad'],
      });
    } finally {
      setLoading(false);
    }
  };

  const searchYouTube = () => {
    const query = encodeURIComponent(`${recipeDetails?.name} recipe tutorial`);
    Linking.openURL(`https://www.youtube.com/results?search_query=${query}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>Generating recipe details...</Text>
        <Text style={styles.loadingSubtext}>Our AI is crafting the perfect recipe for you</Text>
      </View>
    );
  }

  if (!recipeDetails) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="sad-outline" size={64} color="#d1d5db" />
        <Text style={styles.errorText}>Recipe not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Hero */}
      <View style={styles.heroSection}>
        <Image source={{ uri: recipeDetails.image_url }} style={styles.heroImage} />
        <LinearGradient colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.85)']} style={styles.heroOverlay}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <View style={styles.aiBadge}>
              <Ionicons name="sparkles" size={14} color="white" />
              <Text style={styles.aiBadgeText}>AI Generated</Text>
            </View>
          </View>
          
          <View style={styles.heroContent}>
            <Text style={styles.recipeName}>{recipeDetails.name}</Text>
            {recipeDetails.reason && (
              <Text style={styles.recipeReason}>{recipeDetails.reason}</Text>
            )}
          </View>
        </LinearGradient>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <LinearGradient colors={['#f97316', '#ea580c']} style={styles.statIcon}>
              <Ionicons name="time" size={18} color="white" />
            </LinearGradient>
            <Text style={styles.statValue}>{(recipeDetails.prep_time || 15) + (recipeDetails.cook_time || 30)}</Text>
            <Text style={styles.statLabel}>Minutes</Text>
          </View>
          <View style={styles.statItem}>
            <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.statIcon}>
              <Ionicons name="flame" size={18} color="white" />
            </LinearGradient>
            <Text style={styles.statValue}>{recipeDetails.nutritional_info?.calories || 400}</Text>
            <Text style={styles.statLabel}>Calories</Text>
          </View>
          <View style={styles.statItem}>
            <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.statIcon}>
              <Ionicons name="people" size={18} color="white" />
            </LinearGradient>
            <Text style={styles.statValue}>{recipeDetails.servings || 4}</Text>
            <Text style={styles.statLabel}>Servings</Text>
          </View>
        </View>

        {/* Watch Tutorial Button */}
        <TouchableOpacity style={styles.youtubeBtn} onPress={searchYouTube}>
          <Ionicons name="logo-youtube" size={24} color="white" />
          <Text style={styles.youtubeBtnText}>Watch Video Tutorial</Text>
        </TouchableOpacity>

        {/* Ingredients */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="basket" size={22} color="#22c55e" />
            <Text style={styles.sectionTitle}>Ingredients</Text>
          </View>
          
          <View style={styles.ingredientsList}>
            {recipeDetails.ingredients?.map((ing: any, idx: number) => (
              <View key={idx} style={[styles.ingredientItem, ing.missing && styles.ingredientMissing]}>
                <View style={[styles.ingredientBullet, { backgroundColor: ing.missing ? '#f97316' : '#22c55e' }]} />
                <Text style={styles.ingredientQuantity}>{ing.quantity} {ing.unit}</Text>
                <Text style={styles.ingredientName}>{ing.name}</Text>
                {ing.missing && (
                  <View style={styles.missingTag}>
                    <Text style={styles.missingTagText}>Need</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="list" size={22} color="#8b5cf6" />
            <Text style={styles.sectionTitle}>Instructions</Text>
          </View>
          
          <View style={styles.instructionsList}>
            {recipeDetails.instructions?.map((instruction: string, idx: number) => (
              <View key={idx} style={styles.instructionItem}>
                <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{idx + 1}</Text>
                </LinearGradient>
                <Text style={styles.instructionText}>{instruction}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Chef's Tips */}
        {recipeDetails.tips && recipeDetails.tips.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="bulb" size={22} color="#f59e0b" />
              <Text style={styles.sectionTitle}>Chef's Tips</Text>
            </View>
            
            <View style={styles.tipsList}>
              {recipeDetails.tips.map((tip: string, idx: number) => (
                <View key={idx} style={styles.tipItem}>
                  <Ionicons name="checkmark-circle" size={18} color="#f59e0b" />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Nutrition */}
        {recipeDetails.nutritional_info && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="nutrition" size={22} color="#ef4444" />
              <Text style={styles.sectionTitle}>Nutrition (per serving)</Text>
            </View>
            
            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{recipeDetails.nutritional_info.calories}</Text>
                <Text style={styles.nutritionLabel}>Calories</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{recipeDetails.nutritional_info.protein}g</Text>
                <Text style={styles.nutritionLabel}>Protein</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{recipeDetails.nutritional_info.carbs}g</Text>
                <Text style={styles.nutritionLabel}>Carbs</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{recipeDetails.nutritional_info.fat}g</Text>
                <Text style={styles.nutritionLabel}>Fat</Text>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.addToShoppingBtn} onPress={() => router.push('/(tabs)/shopping')}>
          <Ionicons name="cart" size={20} color="#22c55e" />
          <Text style={styles.addToShoppingText}>Add Missing to Shopping List</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', padding: 40 },
  loadingText: { fontSize: 18, fontWeight: '700', color: '#1f2937', marginTop: 20 },
  loadingSubtext: { fontSize: 14, color: '#6b7280', marginTop: 8, textAlign: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', padding: 24 },
  errorText: { fontSize: 18, fontWeight: '600', color: '#6b7280', marginTop: 16 },
  backButton: { backgroundColor: '#22c55e', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 24 },
  backButtonText: { fontSize: 16, fontWeight: '600', color: 'white' },
  
  heroSection: { height: 280, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'space-between', padding: 20, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  aiBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ec4899', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  aiBadgeText: { fontSize: 12, fontWeight: '700', color: 'white' },
  heroContent: {},
  recipeName: { fontSize: 26, fontWeight: '800', color: 'white', marginBottom: 8 },
  recipeReason: { fontSize: 14, color: 'rgba(255,255,255,0.9)', lineHeight: 20 },
  
  content: { flex: 1, marginTop: -20, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: '#f8fafc' },
  
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: 'white', marginHorizontal: 20, marginTop: 20, borderRadius: 16, padding: 18, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
  statItem: { alignItems: 'center' },
  statIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 18, fontWeight: '800', color: '#1f2937' },
  statLabel: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  
  youtubeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#ef4444', marginHorizontal: 20, marginTop: 16, paddingVertical: 14, borderRadius: 12 },
  youtubeBtnText: { fontSize: 15, fontWeight: '700', color: 'white' },
  
  section: { backgroundColor: 'white', margin: 20, marginBottom: 0, borderRadius: 16, padding: 18, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1f2937' },
  
  ingredientsList: { gap: 10 },
  ingredientItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ingredientMissing: { opacity: 0.8 },
  ingredientBullet: { width: 8, height: 8, borderRadius: 4 },
  ingredientQuantity: { fontSize: 13, fontWeight: '600', color: '#6b7280', minWidth: 70 },
  ingredientName: { flex: 1, fontSize: 14, color: '#1f2937', textTransform: 'capitalize' },
  missingTag: { backgroundColor: '#fff7ed', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  missingTagText: { fontSize: 10, fontWeight: '700', color: '#f97316' },
  
  instructionsList: { gap: 16 },
  instructionItem: { flexDirection: 'row', gap: 12 },
  stepNumber: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  stepNumberText: { fontSize: 13, fontWeight: '700', color: 'white' },
  instructionText: { flex: 1, fontSize: 14, color: '#374151', lineHeight: 22 },
  
  tipsList: { gap: 10 },
  tipItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  tipText: { flex: 1, fontSize: 14, color: '#374151', lineHeight: 20 },
  
  nutritionGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  nutritionItem: { alignItems: 'center' },
  nutritionValue: { fontSize: 18, fontWeight: '800', color: '#1f2937' },
  nutritionLabel: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  
  bottomBar: { backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 32, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  addToShoppingBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#f0fdf4', paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#22c55e' },
  addToShoppingText: { fontSize: 15, fontWeight: '700', color: '#22c55e' },
});
