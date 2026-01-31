import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Image, ActivityIndicator, Dimensions, Linking, StatusBar, Modal, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const CUISINES = ['All', 'Italian', 'Mexican', 'Indian', 'Chinese', 'Japanese', 'American', 'Thai', 'Mediterranean'];
const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];

export default function RecipesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sessionToken } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [recipes, setRecipes] = useState<any[]>([]);
  const [trendingRecipes, setTrendingRecipes] = useState<any[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'trending' | 'saved' | 'all'>('trending');
  
  // Add YouTube recipe modal state
  const [showAddYouTubeModal, setShowAddYouTubeModal] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeName, setYoutubeName] = useState('');
  const [youtubeDescription, setYoutubeDescription] = useState('');
  const [selectedMealTypes, setSelectedMealTypes] = useState<string[]>([]);
  const [savingYoutube, setSavingYoutube] = useState(false);

  const MEAL_TYPE_OPTIONS = [
    { id: 'breakfast', label: 'Breakfast', icon: '🌅', color: '#f97316' },
    { id: 'lunch', label: 'Lunch', icon: '☀️', color: '#eab308' },
    { id: 'dinner', label: 'Dinner', icon: '🌙', color: '#8b5cf6' },
  ];

  const toggleMealType = (mealType: string) => {
    setSelectedMealTypes(prev =>
      prev.includes(mealType)
        ? prev.filter(t => t !== mealType)
        : [...prev, mealType]
    );
  };

  useEffect(() => {
    loadRecipes();
    loadTrendingRecipes();
    loadSavedRecipes();
  }, [sessionToken]);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/recipes`, {
        headers: { Authorization: `Bearer ${sessionToken}` }
      });
      
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

  const loadSavedRecipes = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/saved-recipes`, {
        headers: { Authorization: `Bearer ${sessionToken}` }
      });
      setSavedRecipes(response.data || []);
    } catch (error) {
      console.error('Error loading saved recipes:', error);
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

  // Extract YouTube video ID from URL
  const extractYouTubeId = (url: string) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };

  // Get YouTube thumbnail
  const getYouTubeThumbnail = (url: string) => {
    const videoId = extractYouTubeId(url);
    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
    return 'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=400&q=80';
  };

  // Save YouTube recipe
  const saveYouTubeRecipe = async () => {
    if (!youtubeName.trim()) {
      Alert.alert('Error', 'Please enter a recipe name');
      return;
    }
    if (!youtubeUrl.trim()) {
      Alert.alert('Error', 'Please enter a YouTube URL');
      return;
    }

    try {
      setSavingYoutube(true);
      const thumbnail = getYouTubeThumbnail(youtubeUrl);
      
      const response = await axios.post(`${BACKEND_URL}/api/saved-recipes`, {
        name: youtubeName.trim(),
        description: youtubeDescription.trim() || `Recipe from YouTube`,
        youtube_url: youtubeUrl.trim(),
        thumbnail: thumbnail,
        source: 'youtube',
        meal_types: selectedMealTypes
      }, { headers: { Authorization: `Bearer ${sessionToken}` } });

      setSavedRecipes([response.data, ...savedRecipes]);
      setShowAddYouTubeModal(false);
      setYoutubeName('');
      setYoutubeUrl('');
      setYoutubeDescription('');
      setSelectedMealTypes([]);
      
      const mealTypeText = selectedMealTypes.length > 0 
        ? `It will be suggested for ${selectedMealTypes.join(', ')} in your meal plan.`
        : 'It will be considered when generating your meal plan.';
      Alert.alert('Success', `Recipe saved! ${mealTypeText}`);
    } catch (error) {
      console.error('Error saving recipe:', error);
      Alert.alert('Error', 'Failed to save recipe. Please try again.');
    } finally {
      setSavingYoutube(false);
    }
  };

  // Delete saved recipe
  const deleteSavedRecipe = async (recipeId: string) => {
    Alert.alert(
      'Delete Recipe',
      'Are you sure you want to remove this saved recipe?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${BACKEND_URL}/api/saved-recipes/${recipeId}`, {
                headers: { Authorization: `Bearer ${sessionToken}` }
              });
              setSavedRecipes(savedRecipes.filter(r => r.recipe_id !== recipeId));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete recipe');
            }
          }
        }
      ]
    );
  };

  const openYouTubeVideo = (recipe: any) => {
    trackActivity('video_view', recipe.recipe_id || recipe.id, recipe.name);
    const query = encodeURIComponent(`${recipe.name} recipe tutorial`);
    Linking.openURL(`https://www.youtube.com/results?search_query=${query}`);
  };

  const navigateToRecipe = (recipe: any) => {
    trackActivity('recipe_view', recipe.recipe_id, recipe.name);
    if (recipe.recipe_id) {
      router.push(`/recipe-detail/${recipe.recipe_id}`);
    } else {
      router.push({
        pathname: '/ai-recipe',
        params: { recipe: JSON.stringify(recipe) }
      });
    }
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

  const renderTrendingCard = (recipe: any, idx: number) => (
    <TouchableOpacity
      key={recipe.id || idx}
      style={styles.trendingCard}
      onPress={() => navigateToRecipe(recipe)}
      activeOpacity={0.9}
    >
      <Image 
        source={{ uri: recipe.image_url }} 
        style={styles.trendingImage} 
      />
      
      {/* YouTube Badge */}
      <TouchableOpacity
        style={styles.youtubeBadge}
        onPress={(e) => {
          e.stopPropagation();
          openYouTubeVideo(recipe);
        }}
      >
        <Ionicons name="logo-youtube" size={18} color="#ef4444" />
      </TouchableOpacity>
      
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.trendingOverlay}>
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={12} color="#fbbf24" />
          <Text style={styles.ratingText}>{recipe.rating || '4.8'}</Text>
        </View>
        
        <Text style={styles.trendingName} numberOfLines={2}>{recipe.name}</Text>
        <Text style={styles.trendingCuisine}>{recipe.cuisine}</Text>
        
        <View style={styles.trendingMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="time" size={12} color="rgba(255,255,255,0.9)" />
            <Text style={styles.metaText}>{recipe.time || 30}m</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="flame" size={12} color="rgba(255,255,255,0.9)" />
            <Text style={styles.metaText}>{recipe.calories || 400}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderRecipeCard = (recipe: any, idx: number) => (
    <TouchableOpacity
      key={recipe.recipe_id || idx}
      style={styles.recipeCard}
      onPress={() => navigateToRecipe(recipe)}
      activeOpacity={0.9}
    >
      <Image 
        source={{ uri: recipe.image_url || `https://source.unsplash.com/400x300/?${encodeURIComponent(recipe.name)},food` }} 
        style={styles.recipeImage} 
      />
      
      {/* YouTube Button */}
      <TouchableOpacity
        style={styles.youtubeButton}
        onPress={(e) => {
          e.stopPropagation();
          openYouTubeVideo(recipe);
        }}
      >
        <Ionicons name="logo-youtube" size={16} color="#ef4444" />
      </TouchableOpacity>
      
      {/* Difficulty Badge */}
      <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(recipe.difficulty) }]}>
        <Text style={styles.difficultyText}>{recipe.difficulty || 'Medium'}</Text>
      </View>
      
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.cardGradient}>
        <Text style={styles.recipeName} numberOfLines={2}>{recipe.name}</Text>
        <Text style={styles.recipeCuisine}>{recipe.cuisine_type}</Text>
        <View style={styles.recipeStats}>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={11} color="rgba(255,255,255,0.9)" />
            <Text style={styles.statText}>{(recipe.prep_time || 0) + (recipe.cook_time || 0)}m</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="flame-outline" size={11} color="rgba(255,255,255,0.9)" />
            <Text style={styles.statText}>{recipe.nutritional_info?.calories || 400}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Discover Recipes</Text>
          <Text style={styles.headerSubtitle}>
            {trendingRecipes.length + recipes.length} delicious options
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => { loadRecipes(); loadTrendingRecipes(); }}>
          <Ionicons name="refresh" size={22} color="#22c55e" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search recipes, cuisines..."
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
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'trending' && styles.tabActive]}
          onPress={() => setActiveTab('trending')}
        >
          <Ionicons name="trending-up" size={18} color={activeTab === 'trending' ? '#22c55e' : '#9ca3af'} />
          <Text style={[styles.tabText, activeTab === 'trending' && styles.tabTextActive]}>Trending</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'saved' && styles.tabActive]}
          onPress={() => setActiveTab('saved')}
        >
          <Ionicons name="bookmark" size={18} color={activeTab === 'saved' ? '#22c55e' : '#9ca3af'} />
          <Text style={[styles.tabText, activeTab === 'saved' && styles.tabTextActive]}>My Saved</Text>
          {savedRecipes.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{savedRecipes.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.tabActive]}
          onPress={() => setActiveTab('all')}
        >
          <Ionicons name="restaurant" size={18} color={activeTab === 'all' ? '#22c55e' : '#9ca3af'} />
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>All</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'trending' ? (
          /* Trending Tab */
          <View style={styles.contentSection}>
            {loading && trendingRecipes.length === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#22c55e" />
                <Text style={styles.loadingText}>Loading trending recipes...</Text>
              </View>
            ) : trendingRecipes.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="trending-up-outline" size={64} color="#d1d5db" />
                <Text style={styles.emptyText}>No trending recipes</Text>
                <Text style={styles.emptySubtext}>Check back later for fresh content</Text>
              </View>
            ) : (
              <View style={styles.trendingGrid}>
                {trendingRecipes.map((recipe, idx) => renderTrendingCard(recipe, idx))}
              </View>
            )}
          </View>
        ) : activeTab === 'saved' ? (
          /* Saved Recipes Tab */
          <View style={styles.contentSection}>
            {/* Add YouTube Recipe Button */}
            <TouchableOpacity 
              style={styles.addYouTubeButton}
              onPress={() => setShowAddYouTubeModal(true)}
              activeOpacity={0.9}
            >
              <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.addYouTubeGradient}>
                <Ionicons name="logo-youtube" size={24} color="white" />
                <Text style={styles.addYouTubeText}>Save Recipe from YouTube</Text>
                <Ionicons name="add-circle" size={24} color="white" />
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.savedInfo}>
              Saved recipes will be used when generating your weekly meal plan
            </Text>

            {savedRecipes.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="bookmark-outline" size={64} color="#d1d5db" />
                <Text style={styles.emptyText}>No saved recipes yet</Text>
                <Text style={styles.emptySubtext}>Save your favorite YouTube recipes to use in meal planning</Text>
              </View>
            ) : (
              <View style={styles.savedRecipesGrid}>
                {savedRecipes.map((recipe, idx) => (
                  <View key={recipe.recipe_id || idx} style={styles.savedRecipeCard}>
                    <TouchableOpacity
                      style={styles.savedRecipeContent}
                      onPress={() => recipe.youtube_url && Linking.openURL(recipe.youtube_url)}
                      activeOpacity={0.9}
                    >
                      <Image 
                        source={{ uri: recipe.thumbnail || 'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=400&q=80' }} 
                        style={styles.savedRecipeImage}
                      />
                      <View style={styles.savedYouTubeBadge}>
                        <Ionicons name="logo-youtube" size={16} color="white" />
                      </View>
                      <View style={styles.savedRecipeInfo}>
                        <Text style={styles.savedRecipeName} numberOfLines={2}>{recipe.name}</Text>
                        <Text style={styles.savedRecipeDesc} numberOfLines={1}>
                          {recipe.description || 'YouTube Recipe'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.deleteRecipeBtn}
                      onPress={() => deleteSavedRecipe(recipe.recipe_id)}
                    >
                      <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : (
          /* All Recipes Tab */
          <View style={styles.contentSection}>
            {/* Filters */}
            <View style={styles.filtersContainer}>
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

            {/* Recipe Grid */}
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
                {filteredRecipes.map((recipe, idx) => renderRecipeCard(recipe, idx))}
              </View>
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add YouTube Recipe Modal */}
      <Modal visible={showAddYouTubeModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.youtubeModalContent}>
            <View style={styles.youtubeModalHeader}>
              <Text style={styles.youtubeModalTitle}>Save YouTube Recipe</Text>
              <TouchableOpacity onPress={() => setShowAddYouTubeModal(false)}>
                <Ionicons name="close" size={28} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.youtubeModalBody}>
              <Text style={styles.inputLabel}>Recipe Name *</Text>
              <TextInput
                style={styles.youtubeInput}
                placeholder="e.g., Gordon Ramsay's Beef Wellington"
                placeholderTextColor="#9ca3af"
                value={youtubeName}
                onChangeText={setYoutubeName}
              />

              <Text style={styles.inputLabel}>YouTube URL *</Text>
              <TextInput
                style={styles.youtubeInput}
                placeholder="https://www.youtube.com/watch?v=..."
                placeholderTextColor="#9ca3af"
                value={youtubeUrl}
                onChangeText={setYoutubeUrl}
                autoCapitalize="none"
                keyboardType="url"
              />

              {youtubeUrl && extractYouTubeId(youtubeUrl) && (
                <View style={styles.videoPreview}>
                  <Image 
                    source={{ uri: getYouTubeThumbnail(youtubeUrl) }}
                    style={styles.videoPreviewImage}
                  />
                  <View style={styles.videoPreviewBadge}>
                    <Ionicons name="logo-youtube" size={20} color="white" />
                  </View>
                </View>
              )}

              <Text style={styles.inputLabel}>Best For (Meal Type) *</Text>
              <Text style={styles.mealTypeHint}>Select when this recipe is ideal to eat</Text>
              <View style={styles.mealTypeContainer}>
                {MEAL_TYPE_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.mealTypeChip,
                      selectedMealTypes.includes(option.id) && { backgroundColor: option.color, borderColor: option.color }
                    ]}
                    onPress={() => toggleMealType(option.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.mealTypeIcon}>{option.icon}</Text>
                    <Text style={[
                      styles.mealTypeText,
                      selectedMealTypes.includes(option.id) && styles.mealTypeTextSelected
                    ]}>
                      {option.label}
                    </Text>
                    {selectedMealTypes.includes(option.id) && (
                      <Ionicons name="checkmark-circle" size={18} color="white" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Description (optional)</Text>
              <TextInput
                style={[styles.youtubeInput, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Add notes about this recipe..."
                placeholderTextColor="#9ca3af"
                value={youtubeDescription}
                onChangeText={setYoutubeDescription}
                multiline
              />

              <Text style={styles.youtubeHint}>
                💡 Recipes will be suggested for the selected meal types when generating your meal plan
              </Text>
            </ScrollView>

            <TouchableOpacity
              style={styles.saveYouTubeBtn}
              onPress={saveYouTubeRecipe}
              disabled={savingYoutube}
              activeOpacity={0.9}
            >
              <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.saveYouTubeGradient}>
                {savingYoutube ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="bookmark" size={20} color="white" />
                    <Text style={styles.saveYouTubeBtnText}>Save Recipe</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8fafc' 
  },
  
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingHorizontal: 20, 
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerTitle: { 
    fontSize: 26, 
    fontWeight: '800', 
    color: '#1f2937' 
  },
  headerSubtitle: { 
    fontSize: 13, 
    color: '#6b7280', 
    marginTop: 2 
  },
  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  searchSection: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'white', 
    paddingHorizontal: 16, 
    borderRadius: 14, 
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 4, 
    gap: 10 
  },
  searchInput: { 
    flex: 1, 
    paddingVertical: 14, 
    fontSize: 15, 
    color: '#1f2937' 
  },
  
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
  },
  tabActive: {
    backgroundColor: '#f0fdf4',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  tabTextActive: {
    color: '#22c55e',
  },
  
  scrollView: { 
    flex: 1 
  },
  scrollContent: {
    paddingTop: 8,
  },
  
  contentSection: {
    paddingHorizontal: 20,
  },
  
  filtersContainer: {
    marginBottom: 16,
  },
  filterLabel: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: '#6b7280', 
    marginBottom: 8 
  },
  filterScroll: { 
    flexGrow: 0 
  },
  filterChip: { 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20, 
    backgroundColor: 'white', 
    marginRight: 8, 
    borderWidth: 1.5, 
    borderColor: '#e5e7eb' 
  },
  filterChipActive: { 
    backgroundColor: '#22c55e', 
    borderColor: '#22c55e' 
  },
  filterChipText: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: '#6b7280' 
  },
  filterChipTextActive: { 
    color: 'white' 
  },
  diffChip: { 
    paddingHorizontal: 14, 
    paddingVertical: 7, 
    borderRadius: 12, 
    backgroundColor: '#f3f4f6', 
    marginRight: 8 
  },
  diffChipActive: { 
    backgroundColor: '#1f2937' 
  },
  diffChipText: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: '#6b7280' 
  },
  diffChipTextActive: { 
    color: 'white' 
  },
  
  // Trending Grid
  trendingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  trendingCard: { 
    width: CARD_WIDTH, 
    height: 220, 
    borderRadius: 16, 
    overflow: 'hidden', 
    marginBottom: 14,
    backgroundColor: '#e5e7eb',
  },
  trendingImage: { 
    width: '100%', 
    height: '100%',
  },
  youtubeBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  trendingOverlay: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    padding: 12, 
    height: '55%', 
    justifyContent: 'flex-end' 
  },
  ratingBadge: { 
    position: 'absolute',
    top: -65,
    left: 10,
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 3, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    paddingHorizontal: 8, 
    paddingVertical: 3, 
    borderRadius: 10 
  },
  ratingText: { 
    fontSize: 12, 
    fontWeight: '700', 
    color: 'white' 
  },
  trendingName: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: 'white', 
    marginBottom: 3 
  },
  trendingCuisine: { 
    fontSize: 11, 
    color: '#22c55e', 
    fontWeight: '600', 
    marginBottom: 6 
  },
  trendingMeta: { 
    flexDirection: 'row', 
    gap: 12 
  },
  metaItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 3 
  },
  metaText: { 
    fontSize: 11, 
    color: 'rgba(255,255,255,0.9)' 
  },
  
  // Recipe Grid
  recipesGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between' 
  },
  recipeCard: { 
    width: CARD_WIDTH,
    height: 200,
    borderRadius: 16, 
    overflow: 'hidden', 
    backgroundColor: '#e5e7eb', 
    marginBottom: 14,
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 4 
  },
  recipeImage: { 
    width: '100%', 
    height: '100%',
  },
  youtubeButton: { 
    position: 'absolute', 
    top: 10, 
    right: 10, 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: 'white', 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 2 
  },
  difficultyBadge: { 
    position: 'absolute', 
    top: 10, 
    left: 10, 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 8 
  },
  difficultyText: { 
    fontSize: 10, 
    fontWeight: '700', 
    color: 'white', 
    textTransform: 'capitalize' 
  },
  cardGradient: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    padding: 12, 
    height: '55%', 
    justifyContent: 'flex-end' 
  },
  recipeName: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: 'white', 
    marginBottom: 2 
  },
  recipeCuisine: { 
    fontSize: 10, 
    color: '#22c55e', 
    fontWeight: '600', 
    marginBottom: 6 
  },
  recipeStats: { 
    flexDirection: 'row', 
    gap: 10 
  },
  statItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 3 
  },
  statText: { 
    fontSize: 10, 
    color: 'rgba(255,255,255,0.9)' 
  },
  
  loadingContainer: { 
    padding: 60, 
    alignItems: 'center' 
  },
  loadingText: { 
    fontSize: 14, 
    color: '#6b7280', 
    marginTop: 12 
  },
  emptyState: { 
    alignItems: 'center', 
    paddingVertical: 60 
  },
  emptyText: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#9ca3af', 
    marginTop: 16 
  },
  emptySubtext: { 
    fontSize: 14, 
    color: '#d1d5db', 
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 40
  },

  // Tab badge
  tabBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
  },

  // Saved Recipes
  addYouTubeButton: {
    marginBottom: 16,
    borderRadius: 14,
    overflow: 'hidden',
  },
  addYouTubeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 10,
  },
  addYouTubeText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
  },
  savedInfo: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  savedRecipesGrid: {
    gap: 12,
  },
  savedRecipeCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  savedRecipeContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  savedRecipeImage: {
    width: 80,
    height: 80,
  },
  savedYouTubeBadge: {
    position: 'absolute',
    left: 6,
    top: 6,
    backgroundColor: '#ef4444',
    borderRadius: 6,
    padding: 4,
  },
  savedRecipeInfo: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  savedRecipeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  savedRecipeDesc: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  deleteRecipeBtn: {
    padding: 16,
  },

  // YouTube Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  youtubeModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  youtubeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  youtubeModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  youtubeModalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  youtubeInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    marginBottom: 16,
  },
  videoPreview: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  videoPreviewImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#e5e7eb',
  },
  videoPreviewBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -25,
    marginLeft: -25,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  youtubeHint: {
    fontSize: 13,
    color: '#6b7280',
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 10,
    textAlign: 'center',
    marginBottom: 10,
  },
  saveYouTubeBtn: {
    margin: 20,
    borderRadius: 14,
    overflow: 'hidden',
  },
  saveYouTubeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  saveYouTubeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
});
