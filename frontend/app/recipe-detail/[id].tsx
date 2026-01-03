import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../../store/appStore';
import axios from 'axios';

const { width } = Dimensions.get('window');
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function RecipeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { favorites, toggleFavorite } = useAppStore();
  const [recipe, setRecipe] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const isFavorite = favorites.includes(id as string);

  useEffect(() => {
    loadRecipe();
  }, [id]);

  const loadRecipe = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/recipes/${id}`);
      setRecipe(response.data);
    } catch (error) {
      console.error('Error loading recipe:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#22c55e';
      case 'medium': return '#f97316';
      case 'hard': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>Loading recipe...</Text>
      </View>
    );
  }

  if (!recipe) {
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
      {/* Hero Image */}
      <View style={styles.heroSection}>
        <Image source={{ uri: recipe.image_url }} style={styles.heroImage} />
        <LinearGradient colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.8)']} style={styles.heroOverlay}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => toggleFavorite(recipe.recipe_id)} style={styles.headerBtn}>
              <Ionicons 
                name={isFavorite ? 'heart' : 'heart-outline'} 
                size={24} 
                color={isFavorite ? '#ef4444' : 'white'} 
              />
            </TouchableOpacity>
          </View>
          
          {/* Recipe Title */}
          <View style={styles.heroContent}>
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(recipe.difficulty) }]}>
              <Text style={styles.difficultyText}>{recipe.difficulty}</Text>
            </View>
            <Text style={styles.recipeName}>{recipe.name}</Text>
            <Text style={styles.cuisineType}>{recipe.cuisine_type} Cuisine</Text>
          </View>
        </LinearGradient>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <LinearGradient colors={['#f97316', '#ea580c']} style={styles.statIcon}>
              <Ionicons name="time" size={20} color="white" />
            </LinearGradient>
            <Text style={styles.statValue}>{recipe.prep_time + recipe.cook_time}</Text>
            <Text style={styles.statLabel}>Minutes</Text>
          </View>
          <View style={styles.statItem}>
            <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.statIcon}>
              <Ionicons name="flame" size={20} color="white" />
            </LinearGradient>
            <Text style={styles.statValue}>{recipe.nutritional_info?.calories || 0}</Text>
            <Text style={styles.statLabel}>Calories</Text>
          </View>
          <View style={styles.statItem}>
            <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.statIcon}>
              <Ionicons name="people" size={20} color="white" />
            </LinearGradient>
            <Text style={styles.statValue}>4</Text>
            <Text style={styles.statLabel}>Servings</Text>
          </View>
        </View>

        {/* Dietary Tags */}
        {recipe.dietary_tags?.length > 0 && (
          <View style={styles.tagsSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {recipe.dietary_tags.map((tag: string) => (
                <View key={tag} style={styles.tag}>
                  <Ionicons name="checkmark-circle" size={14} color="#22c55e" />
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Ingredients */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="basket" size={24} color="#22c55e" />
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <Text style={styles.sectionCount}>{recipe.ingredients?.length || 0} items</Text>
          </View>
          
          <View style={styles.ingredientsList}>
            {recipe.ingredients?.map((ingredient: any, index: number) => (
              <View key={index} style={styles.ingredientItem}>
                <View style={styles.ingredientBullet} />
                <Text style={styles.ingredientQuantity}>
                  {ingredient.quantity} {ingredient.unit}
                </Text>
                <Text style={styles.ingredientName}>{ingredient.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="list" size={24} color="#8b5cf6" />
            <Text style={styles.sectionTitle}>Instructions</Text>
            <Text style={styles.sectionCount}>{recipe.instructions?.length || 0} steps</Text>
          </View>
          
          <View style={styles.instructionsList}>
            {recipe.instructions?.map((instruction: string, index: number) => (
              <View key={index} style={styles.instructionItem}>
                <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </LinearGradient>
                <Text style={styles.instructionText}>{instruction}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Nutrition Facts */}
        {recipe.nutritional_info && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="nutrition" size={24} color="#f97316" />
              <Text style={styles.sectionTitle}>Nutrition Facts</Text>
            </View>
            
            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionItem}>
                <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.nutritionIcon}>
                  <Ionicons name="flame" size={18} color="white" />
                </LinearGradient>
                <Text style={styles.nutritionValue}>{recipe.nutritional_info.calories}</Text>
                <Text style={styles.nutritionLabel}>Calories</Text>
              </View>
              <View style={styles.nutritionItem}>
                <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.nutritionIcon}>
                  <Ionicons name="fish" size={18} color="white" />
                </LinearGradient>
                <Text style={styles.nutritionValue}>{recipe.nutritional_info.protein}g</Text>
                <Text style={styles.nutritionLabel}>Protein</Text>
              </View>
              <View style={styles.nutritionItem}>
                <LinearGradient colors={['#f97316', '#ea580c']} style={styles.nutritionIcon}>
                  <Ionicons name="fast-food" size={18} color="white" />
                </LinearGradient>
                <Text style={styles.nutritionValue}>{recipe.nutritional_info.carbs}g</Text>
                <Text style={styles.nutritionLabel}>Carbs</Text>
              </View>
              <View style={styles.nutritionItem}>
                <LinearGradient colors={['#eab308', '#ca8a04']} style={styles.nutritionIcon}>
                  <Ionicons name="water" size={18} color="white" />
                </LinearGradient>
                <Text style={styles.nutritionValue}>{recipe.nutritional_info.fat}g</Text>
                <Text style={styles.nutritionLabel}>Fat</Text>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Start Cooking Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.cookButton} activeOpacity={0.9}>
          <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.cookGradient}>
            <Ionicons name="restaurant" size={22} color="white" />
            <Text style={styles.cookButtonText}>Start Cooking</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  // Loading & Error
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  backButton: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  // Hero
  heroSection: {
    height: 320,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContent: {},
  difficultyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
    textTransform: 'capitalize',
  },
  recipeName: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    marginBottom: 4,
  },
  cuisineType: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  // Content
  content: {
    flex: 1,
    marginTop: -24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#f8fafc',
  },
  // Stats
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  statItem: {
    alignItems: 'center',
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  // Tags
  tagsSection: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16a34a',
    textTransform: 'capitalize',
  },
  // Sections
  section: {
    backgroundColor: 'white',
    margin: 16,
    marginBottom: 0,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  sectionCount: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '500',
  },
  // Ingredients
  ingredientsList: {
    gap: 12,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ingredientBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  ingredientQuantity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    minWidth: 60,
  },
  ingredientName: {
    flex: 1,
    fontSize: 15,
    color: '#1f2937',
    textTransform: 'capitalize',
  },
  // Instructions
  instructionsList: {
    gap: 20,
  },
  instructionItem: {
    flexDirection: 'row',
    gap: 14,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
  },
  instructionText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
  },
  // Nutrition
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1f2937',
  },
  nutritionLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  cookButton: {
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  cookGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  cookButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: 'white',
  },
});
