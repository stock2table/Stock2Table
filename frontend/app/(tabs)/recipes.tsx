import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView, Image, Animated, Dimensions } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../store/appStore';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

const cuisines = ['All', 'Italian', 'Mexican', 'Indian', 'Chinese', 'Japanese', 'American', 'Mediterranean', 'Thai', 'French', 'Korean'];
const difficulties = ['All', 'easy', 'medium', 'hard'];

const CUISINE_IMAGES: any = {
  All: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80',
  Italian: 'https://images.unsplash.com/photo-1498579150354-977475b7ea0b?w=400&q=80',
  Mexican: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&q=80',
  Indian: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80',
  Chinese: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&q=80',
  Japanese: 'https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=400&q=80',
  American: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&q=80',
  Mediterranean: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80',
  Thai: 'https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=400&q=80',
  French: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80',
  Korean: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=400&q=80',
};

export default function RecipesScreen() {
  const router = useRouter();
  const { recipes, fetchRecipes, favorites, toggleFavorite } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadRecipes();
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, [selectedCuisine, selectedDifficulty]);

  const loadRecipes = () => {
    const filters: any = {};
    if (selectedCuisine !== 'All') filters.cuisine = selectedCuisine;
    if (selectedDifficulty !== 'All') filters.difficulty = selectedDifficulty;
    fetchRecipes(filters);
  };

  const filteredRecipes = recipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#22c55e';
      case 'medium': return '#f97316';
      case 'hard': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const renderRecipeCard = ({ item, index }: { item: any; index: number }) => {
    const isFavorite = favorites.includes(item.recipe_id);
    
    return (
      <Animated.View style={[styles.cardWrapper, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.recipeCard}
          onPress={() => router.push(`/recipe-detail/${item.recipe_id}`)}
          activeOpacity={0.9}
        >
          <Image source={{ uri: item.image_url }} style={styles.recipeImage} />
          
          {/* Favorite Button */}
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => toggleFavorite(item.recipe_id)}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={22}
              color={isFavorite ? '#ef4444' : 'white'}
            />
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
                <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.statText}>{item.prep_time + item.cook_time}m</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="flame-outline" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.statText}>{item.nutritional_info?.calories || 0}</Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Image 
          source={{ uri: CUISINE_IMAGES[selectedCuisine] }} 
          style={styles.heroImage} 
        />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.heroOverlay}>
          <Text style={styles.heroTitle}>Discover Recipes</Text>
          <Text style={styles.heroSubtitle}>{recipes.length} delicious recipes to explore</Text>
        </LinearGradient>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
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
      </View>

      {/* Cuisine Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {cuisines.map(cuisine => (
          <TouchableOpacity
            key={cuisine}
            style={[
              styles.filterChip,
              selectedCuisine === cuisine && styles.filterChipActive
            ]}
            onPress={() => setSelectedCuisine(cuisine)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedCuisine === cuisine && styles.filterChipTextActive
              ]}
            >
              {cuisine}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Difficulty Filters */}
      <View style={styles.difficultyFilters}>
        {difficulties.map(diff => (
          <TouchableOpacity
            key={diff}
            style={[
              styles.diffChip,
              selectedDifficulty === diff && styles.diffChipActive
            ]}
            onPress={() => setSelectedDifficulty(diff)}
          >
            <Text
              style={[
                styles.diffChipText,
                selectedDifficulty === diff && styles.diffChipTextActive
              ]}
            >
              {diff === 'All' ? 'All Levels' : diff.charAt(0).toUpperCase() + diff.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recipes Grid */}
      <FlatList
        data={filteredRecipes}
        renderItem={renderRecipeCard}
        keyExtractor={(item) => item.recipe_id}
        numColumns={2}
        contentContainerStyle={styles.recipesList}
        columnWrapperStyle={styles.recipesRow}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="restaurant-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>No recipes found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  // Hero
  heroSection: {
    height: 160,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
    justifyContent: 'flex-end',
    padding: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  // Search
  searchContainer: {
    paddingHorizontal: 16,
    marginTop: -24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1f2937',
  },
  // Filters
  filtersContainer: {
    marginTop: 16,
  },
  filtersContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'white',
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
  },
  filterChipActive: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterChipTextActive: {
    color: 'white',
  },
  // Difficulty
  difficultyFilters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  diffChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  diffChipActive: {
    backgroundColor: '#1f2937',
  },
  diffChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  diffChipTextActive: {
    color: 'white',
  },
  // Recipe Cards
  recipesList: {
    padding: 16,
    paddingBottom: 100,
  },
  recipesRow: {
    justifyContent: 'space-between',
  },
  cardWrapper: {
    width: CARD_WIDTH,
    marginBottom: 16,
  },
  recipeCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'white',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  recipeImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#e5e7eb',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  difficultyBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'white',
    textTransform: 'capitalize',
  },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    height: '60%',
    justifyContent: 'flex-end',
  },
  recipeName: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
    marginBottom: 2,
  },
  recipeCuisine: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '600',
    marginBottom: 8,
  },
  recipeStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9ca3af',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#d1d5db',
    marginTop: 4,
  },
});
