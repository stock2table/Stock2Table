import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView, Image, ActivityIndicator, Dimensions, Linking } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const CUISINES = ['All', 'Italian', 'Mexican', 'Indian', 'Chinese', 'Japanese', 'American', 'Thai', 'Mediterranean', 'Korean', 'French'];
const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];

export default function RecipesScreen() {
  const router = useRouter();
  const { sessionToken } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [recipes, setRecipes] = useState<any[]>([]);
  const [trendingRecipes, setTrendingRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    loadRecipes();
    loadTrendingRecipes();
  }, [sessionToken]);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      // Fetch recipes from database
      const response = await axios.get(`${BACKEND_URL}/api/recipes`, {
        headers: { Authorization: `Bearer ${sessionToken}` }
      });
      
      // Add YouTube search URLs to each recipe
      const recipesWithVideos = (response.data || []).map((recipe: any) => ({
        ...recipe,
        video_url: `https://www.youtube.com/results?search_query=${encodeURIComponent(recipe.name + ' recipe tutorial')}`
      }));
      
      setRecipes(recipesWithVideos);
    } catch (error) {
      console.error('Error loading recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTrendingRecipes = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/discover/trending`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
        timeout: 30000
      });
      setTrendingRecipes(response.data.trending || []);
    } catch (error) {
      console.error('Error loading trending:', error);
    }
  };

  const trackActivity = async (type: string, itemId?: string, itemName?: string) => {
    try {
      await axios.post(`${BACKEND_URL}/api/activity`, {
        activity_type: type,
        item_id: itemId,
        item_name: itemName
      }, { headers: { Authorization: `Bearer ${sessionToken}` } });
    } catch (error) {
      // Silent fail
    }
  };

  const openYouTubeVideo = (recipe: any) => {
    trackActivity('video_view', recipe.recipe_id || recipe.id, recipe.name);
    const searchQuery = encodeURIComponent(`${recipe.name} recipe tutorial`);
    Linking.openURL(`https://www.youtube.com/results?search_query=${searchQuery}`);
  };

  const navigateToRecipe = (recipe: any) => {
    trackActivity('recipe_view', recipe.recipe_id, recipe.name);
    router.push(`/recipe-detail/${recipe.recipe_id}`);
  };

  const navigateToTrendingRecipe = (recipe: any) => {
    trackActivity('recipe_view', recipe.id, recipe.name);
    router.push({
      pathname: '/ai-recipe',
      params: { recipe: JSON.stringify(recipe) }
    });
  };

  // Filter recipes
  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCuisine = selectedCuisine === 'All' || recipe.cuisine_type?.toLowerCase() === selectedCuisine.toLowerCase();
    const matchesDifficulty = selectedDifficulty === 'All' || recipe.difficulty?.toLowerCase() === selectedDifficulty.toLowerCase();
    return matchesSearch && matchesCuisine && matchesDifficulty;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return '#22c55e';
      case 'medium': return '#f97316';
      case 'hard': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const renderRecipeCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.recipeCard}
      onPress={() => navigateToRecipe(item)}
      activeOpacity={0.9}
    >
      <Image 
        source={{ uri: item.image_url || `https://source.unsplash.com/400x300/?${encodeURIComponent(item.name)},food` }} 
        style={styles.recipeImage} 
      />
      
      {/* YouTube Button */}
      <TouchableOpacity
        style={styles.youtubeButton}
        onPress={() => openYouTubeVideo(item)}
      >
        <Ionicons name="logo-youtube" size={18} color="#ef4444" />
      </TouchableOpacity>
      
      {/* Difficulty Badge */}
      <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty) }]}>
        <Text style={styles.difficultyText}>{item.difficulty}</Text>
      </View>
      
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.cardGradient}>
        <Text style={styles.recipeName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.recipeCuisine}>{item.cuisine_type}</Text>
        <View style={styles.recipeStats}>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.8)" />
            <Text style={styles.statText}>{(item.prep_time || 0) + (item.cook_time || 0)}m</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="flame-outline" size={12} color="rgba(255,255,255,0.8)" />
            <Text style={styles.statText}>{item.nutritional_info?.calories || 400}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recipes</Text>
        <Text style={styles.headerSubtitle}>{recipes.length + trendingRecipes.length} delicious options</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search recipes..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <View style={styles.filtersSection}>
        <Text style={styles.filterLabel}>Cuisine</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {CUISINES.map(cuisine => (
            <TouchableOpacity
              key={cuisine}
              style={[styles.filterChip, selectedCuisine === cuisine && styles.filterChipActive]}
              onPress={() => setSelectedCuisine(cuisine)}
            >
              <Text style={[styles.filterChipText, selectedCuisine === cuisine && styles.filterChipTextActive]}>
                {cuisine}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        <Text style={[styles.filterLabel, { marginTop: 12 }]}>Difficulty</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {DIFFICULTIES.map(diff => (
            <TouchableOpacity
              key={diff}
              style={[styles.diffChip, selectedDifficulty === diff && styles.diffChipActive]}
              onPress={() => setSelectedDifficulty(diff)}
            >
              <Text style={[styles.diffChipText, selectedDifficulty === diff && styles.diffChipTextActive]}>
                {diff}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Trending Section */}
        {trendingRecipes.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="trending-up" size={20} color="#f97316" />
              <Text style={styles.sectionTitle}>Trending Worldwide</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {trendingRecipes.map((recipe, idx) => (
                <TouchableOpacity
                  key={recipe.id || idx}
                  style={styles.trendingCard}
                  onPress={() => navigateToTrendingRecipe(recipe)}
                  activeOpacity={0.9}
                >
                  <Image 
                    source={{ uri: recipe.image_url }} 
                    style={styles.trendingImage} 
                  />
                  <TouchableOpacity
                    style={styles.trendingYoutube}
                    onPress={() => {
                      trackActivity('video_view', recipe.id, recipe.name);
                      Linking.openURL(recipe.video_url);
                    }}
                  >
                    <Ionicons name="logo-youtube" size={16} color="#ef4444" />
                  </TouchableOpacity>
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.trendingOverlay}>
                    <View style={styles.trendingRating}>
                      <Ionicons name="star" size={10} color="#fbbf24" />
                      <Text style={styles.ratingText}>{recipe.rating}</Text>
                    </View>
                    <Text style={styles.trendingName} numberOfLines={1}>{recipe.name}</Text>
                    <Text style={styles.trendingCuisine}>{recipe.cuisine}</Text>
                    <View style={styles.trendingMeta}>
                      <Ionicons name="time" size={10} color="rgba(255,255,255,0.8)" />
                      <Text style={styles.trendingMetaText}>{recipe.time}m</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* All Recipes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="restaurant" size={20} color="#22c55e" />
            <Text style={styles.sectionTitle}>All Recipes</Text>
            <Text style={styles.recipeCount}>{filteredRecipes.length}</Text>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#22c55e" />
              <Text style={styles.loadingText}>Loading recipes...</Text>
            </View>
          ) : filteredRecipes.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="restaurant-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyText}>No recipes found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
            </View>
          ) : (
            <View style={styles.recipesGrid}>
              {filteredRecipes.map((recipe, index) => (
                <View key={recipe.recipe_id || index} style={styles.gridItem}>
                  {renderRecipeCard({ item: recipe })}
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12, backgroundColor: '#22c55e' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: 'white' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', marginHorizontal: 20, marginTop: -20, paddingHorizontal: 16, borderRadius: 14, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, gap: 10 },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 15, color: '#1f2937' },
  
  filtersSection: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, backgroundColor: '#f8fafc' },
  filterLabel: { fontSize: 13, fontWeight: '700', color: '#6b7280', marginBottom: 8 },
  filterScroll: { flexGrow: 0 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'white', marginRight: 8, borderWidth: 1.5, borderColor: '#e5e7eb' },
  filterChipActive: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  filterChipText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  filterChipTextActive: { color: 'white' },
  diffChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 12, backgroundColor: '#f3f4f6', marginRight: 8 },
  diffChipActive: { backgroundColor: '#1f2937' },
  diffChipText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  diffChipTextActive: { color: 'white' },
  
  scrollView: { flex: 1 },
  
  section: { paddingHorizontal: 20, paddingTop: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#1f2937' },
  recipeCount: { fontSize: 13, color: '#9ca3af', fontWeight: '500' },
  
  trendingCard: { width: 140, height: 180, borderRadius: 14, overflow: 'hidden', marginRight: 12 },
  trendingImage: { width: '100%', height: '100%', backgroundColor: '#e5e7eb' },
  trendingYoutube: { position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 16, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
  trendingOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10, height: '50%', justifyContent: 'flex-end' },
  trendingRating: { position: 'absolute', top: -50, left: 8, flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  ratingText: { fontSize: 10, fontWeight: '600', color: 'white' },
  trendingName: { fontSize: 12, fontWeight: '700', color: 'white', marginBottom: 2 },
  trendingCuisine: { fontSize: 10, color: '#22c55e', fontWeight: '600', marginBottom: 4 },
  trendingMeta: { flexDirection: 'row', alignItems: 'center' },
  trendingMetaText: { fontSize: 10, color: 'rgba(255,255,255,0.8)', marginLeft: 3 },
  
  recipesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: CARD_WIDTH, marginBottom: 14 },
  recipeCard: { borderRadius: 16, overflow: 'hidden', backgroundColor: 'white', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6 },
  recipeImage: { width: '100%', height: 150, backgroundColor: '#e5e7eb' },
  youtubeButton: { position: 'absolute', top: 10, right: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', elevation: 2 },
  difficultyBadge: { position: 'absolute', top: 10, left: 10, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  difficultyText: { fontSize: 10, fontWeight: '700', color: 'white', textTransform: 'capitalize' },
  cardGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12, height: '55%', justifyContent: 'flex-end' },
  recipeName: { fontSize: 14, fontWeight: '700', color: 'white', marginBottom: 2 },
  recipeCuisine: { fontSize: 11, color: '#22c55e', fontWeight: '600', marginBottom: 6 },
  recipeStats: { flexDirection: 'row', gap: 12 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 11, color: 'rgba(255,255,255,0.9)' },
  
  loadingContainer: { padding: 40, alignItems: 'center' },
  loadingText: { fontSize: 14, color: '#6b7280', marginTop: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#9ca3af', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#d1d5db', marginTop: 4 },
});
