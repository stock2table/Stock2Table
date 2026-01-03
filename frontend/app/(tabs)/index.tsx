import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Image, ActivityIndicator, Dimensions, Linking } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useAppStore } from '../../store/appStore';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

const { width } = Dimensions.get('window');
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function HomeScreen() {
  const router = useRouter();
  const { sessionToken, user } = useAuth();
  const { pantryItems, fetchPantry, recipes, fetchRecipes } = useAppStore();
  
  // Dynamic content states
  const [refreshing, setRefreshing] = useState(false);
  const [todaySuggestion, setTodaySuggestion] = useState<any>(null);
  const [trendingDishes, setTrendingDishes] = useState<any[]>([]);
  const [videoTutorials, setVideoTutorials] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingContent, setLoadingContent] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(false);

  useEffect(() => {
    if (sessionToken) {
      loadAllContent();
    }
  }, [sessionToken]);

  const loadAllContent = async () => {
    setLoadingContent(true);
    try {
      await Promise.all([
        fetchPantry(sessionToken!),
        fetchRecipes(),
        loadDailySuggestion(),
        loadTrendingDishes(),
        loadVideoTutorials(),
      ]);
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoadingContent(false);
    }
  };

  const loadDailySuggestion = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/discover/suggestion`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
        timeout: 30000
      });
      setTodaySuggestion(response.data.suggestion);
    } catch (error) {
      console.error('Error loading suggestion:', error);
      // Fallback to random recipe from database
      if (recipes.length > 0) {
        setTodaySuggestion(recipes[Math.floor(Math.random() * recipes.length)]);
      }
    }
  };

  const loadTrendingDishes = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/discover/trending`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
        timeout: 30000
      });
      setTrendingDishes(response.data.trending || []);
    } catch (error) {
      console.error('Error loading trending:', error);
    }
  };

  const loadVideoTutorials = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/discover/videos`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
        timeout: 30000
      });
      setVideoTutorials(response.data.videos || []);
    } catch (error) {
      console.error('Error loading videos:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllContent();
    setRefreshing(false);
  };

  const getAIRecommendations = async () => {
    if (pantryItems.length === 0) {
      router.push('/(tabs)/pantry');
      return;
    }
    try {
      setLoadingRecs(true);
      const response = await axios.post(
        `${BACKEND_URL}/api/recipes/recommend`,
        {},
        { headers: { Authorization: `Bearer ${sessionToken}` }, timeout: 30000 }
      );
      setRecommendations(response.data.recommendations || []);
    } catch (error) {
      console.error('Error getting recommendations:', error);
    } finally {
      setLoadingRecs(false);
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
      // Silent fail for tracking
    }
  };

  const openVideo = (url: string, title: string) => {
    trackActivity('video_view', undefined, title);
    Linking.openURL(url);
  };

  const navigateToRecipe = (recipe: any) => {
    trackActivity('recipe_view', recipe.recipe_id || recipe.id, recipe.name);
    if (recipe.recipe_id) {
      router.push(`/recipe-detail/${recipe.recipe_id}`);
    } else {
      router.push({
        pathname: '/ai-recipe',
        params: { recipe: JSON.stringify(recipe) }
      });
    }
  };

  const navigateToAIRecipe = (rec: any) => {
    trackActivity('recipe_view', undefined, rec.name);
    router.push({
      pathname: '/ai-recipe',
      params: { recipe: JSON.stringify(rec) }
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] || 'Chef'}! 👋</Text>
            <Text style={styles.subGreeting}>What would you like to cook today?</Text>
          </View>
          <TouchableOpacity style={styles.notificationBtn} onPress={() => router.push('/(tabs)/profile')}>
            <Ionicons name="notifications-outline" size={24} color="#1f2937" />
          </TouchableOpacity>
        </View>

        {/* Today's AI-Powered Suggestion */}
        {loadingContent && !todaySuggestion ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#22c55e" />
            <Text style={styles.loadingText}>Creating your personalized suggestion...</Text>
          </View>
        ) : todaySuggestion && (
          <TouchableOpacity 
            style={styles.suggestionCard}
            onPress={() => navigateToRecipe(todaySuggestion)}
            activeOpacity={0.9}
          >
            <Image source={{ uri: todaySuggestion.image_url }} style={styles.suggestionImage} />
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.suggestionOverlay}>
              <View style={styles.suggestionBadge}>
                <Ionicons name="sparkles" size={14} color="#ec4899" />
                <Text style={styles.suggestionBadgeText}>AI Picked for You</Text>
              </View>
              <Text style={styles.suggestionTitle}>{todaySuggestion.name}</Text>
              <Text style={styles.suggestionDesc} numberOfLines={2}>{todaySuggestion.description || todaySuggestion.reason}</Text>
              <View style={styles.suggestionMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={16} color="white" />
                  <Text style={styles.metaText}>{(todaySuggestion.prep_time || 15) + (todaySuggestion.cook_time || 30)} min</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="flame-outline" size={16} color="white" />
                  <Text style={styles.metaText}>{todaySuggestion.calories || todaySuggestion.nutritional_info?.calories || 400} cal</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="star" size={16} color="#fbbf24" />
                  <Text style={styles.metaText}>{todaySuggestion.rating || 4.8}</Text>
                </View>
              </View>
              <View style={styles.cookNowBtn}>
                <Text style={styles.cookNowText}>Cook Now</Text>
                <Ionicons name="arrow-forward" size={18} color="white" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Quick Feature Cards */}
        <View style={styles.featureCards}>
          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => router.push('/(tabs)/recipes')}
            activeOpacity={0.8}
          >
            <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.featureGradient}>
              <View style={styles.featureIconBg}>
                <Ionicons name="play-circle" size={26} color="#8b5cf6" />
              </View>
              <Text style={styles.featureTitle}>Video Tutorials</Text>
              <Text style={styles.featureSubtitle}>{videoTutorials.length || 'New'} videos</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => router.push('/(tabs)/meal-plan')}
            activeOpacity={0.8}
          >
            <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.featureGradient}>
              <View style={styles.featureIconBg}>
                <Ionicons name="calendar" size={26} color="#22c55e" />
              </View>
              <Text style={styles.featureTitle}>Weekly Plan</Text>
              <Text style={styles.featureSubtitle}>AI Powered</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Video Tutorials - Dynamic */}
        {videoTutorials.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="play-circle" size={22} color="#8b5cf6" />
                <Text style={styles.sectionTitle}>Video Tutorials</Text>
              </View>
              <TouchableOpacity onPress={() => Linking.openURL('https://www.youtube.com/results?search_query=cooking+tutorials')}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {videoTutorials.map((video, idx) => (
                <TouchableOpacity
                  key={video.id || idx}
                  style={styles.videoCard}
                  onPress={() => openVideo(video.video_url, video.title)}
                  activeOpacity={0.9}
                >
                  <Image source={{ uri: video.thumbnail_url }} style={styles.videoThumbnail} />
                  <View style={styles.playOverlay}>
                    <View style={styles.playButton}>
                      <Ionicons name="play" size={24} color="white" />
                    </View>
                  </View>
                  <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>{video.duration}</Text>
                  </View>
                  <View style={styles.videoInfo}>
                    <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>
                    <Text style={styles.videoViews}>{video.estimated_views} views</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Trending Worldwide - Dynamic */}
        {trendingDishes.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="trending-up" size={22} color="#f97316" />
                <Text style={styles.sectionTitle}>Trending Worldwide</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(tabs)/recipes')}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {trendingDishes.map((dish, idx) => (
                <TouchableOpacity
                  key={dish.id || idx}
                  style={styles.trendingCard}
                  onPress={() => openVideo(dish.video_url, dish.name)}
                  activeOpacity={0.9}
                >
                  <Image source={{ uri: dish.image_url }} style={styles.trendingImage} />
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.trendingOverlay}>
                    <View style={styles.trendingRating}>
                      <Ionicons name="star" size={12} color="#fbbf24" />
                      <Text style={styles.ratingText}>{dish.rating}</Text>
                    </View>
                    <Text style={styles.trendingName} numberOfLines={1}>{dish.name}</Text>
                    <Text style={styles.trendingCuisine}>{dish.cuisine}</Text>
                    <View style={styles.trendingMeta}>
                      <Ionicons name="time" size={12} color="rgba(255,255,255,0.8)" />
                      <Text style={styles.trendingMetaText}>{dish.time}m</Text>
                      <Ionicons name="flame" size={12} color="rgba(255,255,255,0.8)" style={{ marginLeft: 8 }} />
                      <Text style={styles.trendingMetaText}>{dish.calories}</Text>
                    </View>
                  </LinearGradient>
                  <View style={styles.videoIconBadge}>
                    <Ionicons name="logo-youtube" size={16} color="#ef4444" />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* AI Recipe Assistant */}
        <View style={styles.section}>
          <View style={styles.aiCard}>
            <LinearGradient colors={['#ec4899', '#db2777']} style={styles.aiGradient}>
              <View style={styles.aiContent}>
                <Ionicons name="sparkles" size={32} color="white" />
                <View style={styles.aiTextContent}>
                  <Text style={styles.aiTitle}>AI Recipe Assistant</Text>
                  <Text style={styles.aiSubtitle}>Get personalized recipes from your pantry ({pantryItems.length} items)</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.aiButton}
                onPress={getAIRecommendations}
                disabled={loadingRecs}
              >
                {loadingRecs ? (
                  <ActivityIndicator color="#ec4899" size="small" />
                ) : (
                  <>
                    <Text style={styles.aiButtonText}>Get Ideas</Text>
                    <Ionicons name="arrow-forward" size={18} color="#ec4899" />
                  </>
                )}
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>

        {/* AI Recommendations */}
        {recommendations.length > 0 && (
          <View style={styles.section}>
            <View style={styles.aiBadge}>
              <Ionicons name="sparkles" size={16} color="white" />
              <Text style={styles.aiBadgeText}>AI Generated for You</Text>
            </View>
            <Text style={[styles.sectionTitle, { marginTop: 8, marginBottom: 12 }]}>Recipes You Can Make</Text>
            {recommendations.map((rec, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.aiRecipeCard}
                onPress={() => navigateToAIRecipe(rec)}
                activeOpacity={0.8}
              >
                <View style={styles.aiRecipeContent}>
                  <Text style={styles.aiRecipeName}>{rec.name}</Text>
                  <Text style={styles.aiRecipeReason} numberOfLines={2}>{rec.reason}</Text>
                  {rec.missing_ingredients?.length > 0 && (
                    <View style={styles.missingBadge}>
                      <Ionicons name="cart" size={14} color="#f97316" />
                      <Text style={styles.missingText}>Need {rec.missing_ingredients.length} more items</Text>
                    </View>
                  )}
                </View>
                <View style={styles.aiRecipeArrow}>
                  <Ionicons name="chevron-forward" size={24} color="#22c55e" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/scan')} activeOpacity={0.8}>
              <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.actionIcon}>
                <Ionicons name="camera" size={24} color="white" />
              </LinearGradient>
              <Text style={styles.actionLabel}>Scan Items</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/(tabs)/pantry')} activeOpacity={0.8}>
              <LinearGradient colors={['#f97316', '#ea580c']} style={styles.actionIcon}>
                <Ionicons name="basket" size={24} color="white" />
              </LinearGradient>
              <Text style={styles.actionLabel}>My Pantry</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/(tabs)/shopping')} activeOpacity={0.8}>
              <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.actionIcon}>
                <Ionicons name="cart" size={24} color="white" />
              </LinearGradient>
              <Text style={styles.actionLabel}>Shopping</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/(tabs)/recipes')} activeOpacity={0.8}>
              <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.actionIcon}>
                <Ionicons name="book" size={24} color="white" />
              </LinearGradient>
              <Text style={styles.actionLabel}>Recipes</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  greeting: { fontSize: 24, fontWeight: '800', color: '#1f2937' },
  subGreeting: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  notificationBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  
  loadingCard: { marginHorizontal: 20, height: 200, borderRadius: 20, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  loadingText: { fontSize: 14, color: '#22c55e', marginTop: 12, fontWeight: '600' },
  
  suggestionCard: { marginHorizontal: 20, height: 200, borderRadius: 20, overflow: 'hidden', marginBottom: 20 },
  suggestionImage: { width: '100%', height: '100%' },
  suggestionOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '100%', justifyContent: 'flex-end', padding: 16 },
  suggestionBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(236,72,153,0.2)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, marginBottom: 8 },
  suggestionBadgeText: { fontSize: 11, fontWeight: '700', color: '#ec4899' },
  suggestionTitle: { fontSize: 20, fontWeight: '800', color: 'white', marginBottom: 4 },
  suggestionDesc: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 10 },
  suggestionMeta: { flexDirection: 'row', gap: 14, marginBottom: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: 'white', fontWeight: '500' },
  cookNowBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f97316', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  cookNowText: { fontSize: 14, fontWeight: '700', color: 'white' },
  
  featureCards: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 20 },
  featureCard: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  featureGradient: { padding: 14, alignItems: 'center' },
  featureIconBg: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  featureTitle: { fontSize: 13, fontWeight: '700', color: 'white' },
  featureSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937' },
  seeAllText: { fontSize: 13, fontWeight: '600', color: '#22c55e' },
  horizontalScroll: { paddingRight: 20 },
  
  videoCard: { width: 200, marginRight: 12, borderRadius: 14, overflow: 'hidden', backgroundColor: 'white', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
  videoThumbnail: { width: '100%', height: 110 },
  playOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 110, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' },
  playButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  durationBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  durationText: { fontSize: 11, fontWeight: '600', color: 'white' },
  videoInfo: { padding: 10 },
  videoTitle: { fontSize: 13, fontWeight: '600', color: '#1f2937', marginBottom: 4 },
  videoViews: { fontSize: 11, color: '#6b7280' },
  
  trendingCard: { width: 150, height: 190, marginRight: 12, borderRadius: 14, overflow: 'hidden' },
  trendingImage: { width: '100%', height: '100%' },
  trendingOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10, height: '55%', justifyContent: 'flex-end' },
  trendingRating: { position: 'absolute', top: -60, right: 8, flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  ratingText: { fontSize: 11, fontWeight: '600', color: 'white' },
  trendingName: { fontSize: 13, fontWeight: '700', color: 'white', marginBottom: 2 },
  trendingCuisine: { fontSize: 11, color: '#22c55e', fontWeight: '600', marginBottom: 4 },
  trendingMeta: { flexDirection: 'row', alignItems: 'center' },
  trendingMetaText: { fontSize: 10, color: 'rgba(255,255,255,0.8)', marginLeft: 3 },
  videoIconBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: 'white', padding: 4, borderRadius: 6 },
  
  aiCard: { borderRadius: 16, overflow: 'hidden' },
  aiGradient: { padding: 16 },
  aiContent: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  aiTextContent: { flex: 1 },
  aiTitle: { fontSize: 16, fontWeight: '700', color: 'white' },
  aiSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  aiButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'white', paddingVertical: 12, borderRadius: 10 },
  aiButtonText: { fontSize: 14, fontWeight: '700', color: '#ec4899' },
  
  aiBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ec4899', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  aiBadgeText: { fontSize: 12, fontWeight: '700', color: 'white' },
  aiRecipeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 14, borderRadius: 14, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
  aiRecipeContent: { flex: 1 },
  aiRecipeName: { fontSize: 15, fontWeight: '700', color: '#1f2937', marginBottom: 4 },
  aiRecipeReason: { fontSize: 12, color: '#6b7280', marginBottom: 6 },
  missingBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff7ed', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, alignSelf: 'flex-start' },
  missingText: { fontSize: 11, color: '#f97316', fontWeight: '600' },
  aiRecipeArrow: { marginLeft: 12 },
  
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  actionItem: { width: (width - 64) / 4, alignItems: 'center' },
  actionIcon: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  actionLabel: { fontSize: 11, fontWeight: '600', color: '#6b7280', textAlign: 'center' },
});
