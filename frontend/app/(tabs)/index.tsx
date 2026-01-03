import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Image, ActivityIndicator, Dimensions, Linking, StatusBar } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useAppStore } from '../../store/appStore';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';

const { width } = Dimensions.get('window');
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

// Beautiful food images for categories
const CATEGORY_IMAGES = {
  breakfast: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&q=80',
  lunch: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
  dinner: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80',
  dessert: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&q=80',
  snack: 'https://images.unsplash.com/photo-1604152135912-04a022e23696?w=400&q=80',
};

// Fallback trending dishes with beautiful images
const FALLBACK_TRENDING = [
  { id: '1', name: 'Korean Fried Chicken', cuisine: 'Korean', time: 45, calories: 580, rating: 4.9, image_url: 'https://images.unsplash.com/photo-1575932444877-5106bee2a599?w=400&q=80', video_url: 'https://www.youtube.com/results?search_query=korean+fried+chicken+recipe' },
  { id: '2', name: 'Butter Chicken', cuisine: 'Indian', time: 40, calories: 490, rating: 4.8, image_url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&q=80', video_url: 'https://www.youtube.com/results?search_query=butter+chicken+recipe' },
  { id: '3', name: 'Tacos Al Pastor', cuisine: 'Mexican', time: 35, calories: 420, rating: 4.7, image_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&q=80', video_url: 'https://www.youtube.com/results?search_query=tacos+al+pastor+recipe' },
  { id: '4', name: 'Sushi Bowl', cuisine: 'Japanese', time: 30, calories: 380, rating: 4.9, image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80', video_url: 'https://www.youtube.com/results?search_query=sushi+bowl+recipe' },
  { id: '5', name: 'Margherita Pizza', cuisine: 'Italian', time: 25, calories: 450, rating: 4.6, image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80', video_url: 'https://www.youtube.com/results?search_query=margherita+pizza+recipe' },
  { id: '6', name: 'Pad Thai', cuisine: 'Thai', time: 30, calories: 520, rating: 4.8, image_url: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400&q=80', video_url: 'https://www.youtube.com/results?search_query=pad+thai+recipe' },
];

const FALLBACK_SUGGESTION = {
  name: 'Honey Garlic Salmon',
  description: 'A perfectly glazed salmon with sweet honey and aromatic garlic. Quick to make, impressive to serve.',
  cuisine: 'American',
  prep_time: 10,
  cook_time: 20,
  calories: 420,
  rating: 4.9,
  image_url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80',
  video_url: 'https://www.youtube.com/results?search_query=honey+garlic+salmon+recipe',
  reason: 'Quick and nutritious - perfect for a busy weeknight',
};

const FALLBACK_VIDEOS = [
  { id: '1', title: 'Knife Skills Masterclass', duration: '12:45', thumbnail_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80', video_url: 'https://www.youtube.com/results?search_query=knife+skills+cooking', estimated_views: '2.1M' },
  { id: '2', title: 'Perfect Eggs 5 Ways', duration: '8:30', thumbnail_url: 'https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=400&q=80', video_url: 'https://www.youtube.com/results?search_query=how+to+cook+eggs', estimated_views: '1.8M' },
  { id: '3', title: 'Homemade Pasta', duration: '15:20', thumbnail_url: 'https://images.unsplash.com/photo-1556761223-4c4282c73f77?w=400&q=80', video_url: 'https://www.youtube.com/results?search_query=homemade+pasta+recipe', estimated_views: '950K' },
  { id: '4', title: 'Sushi at Home', duration: '18:45', thumbnail_url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&q=80', video_url: 'https://www.youtube.com/results?search_query=how+to+make+sushi', estimated_views: '3.2M' },
];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sessionToken, user } = useAuth();
  const { pantryItems, fetchPantry, recipes, fetchRecipes } = useAppStore();
  
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
        timeout: 15000
      });
      if (response.data.suggestion) {
        setTodaySuggestion(response.data.suggestion);
      } else {
        setTodaySuggestion(FALLBACK_SUGGESTION);
      }
    } catch (error) {
      console.error('Error loading suggestion:', error);
      setTodaySuggestion(FALLBACK_SUGGESTION);
    }
  };

  const loadTrendingDishes = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/discover/trending`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
        timeout: 15000
      });
      if (response.data.trending && response.data.trending.length > 0) {
        setTrendingDishes(response.data.trending);
      } else {
        setTrendingDishes(FALLBACK_TRENDING);
      }
    } catch (error) {
      console.error('Error loading trending:', error);
      setTrendingDishes(FALLBACK_TRENDING);
    }
  };

  const loadVideoTutorials = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/discover/videos`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
        timeout: 15000
      });
      if (response.data.videos && response.data.videos.length > 0) {
        setVideoTutorials(response.data.videos);
      } else {
        setVideoTutorials(FALLBACK_VIDEOS);
      }
    } catch (error) {
      console.error('Error loading videos:', error);
      setVideoTutorials(FALLBACK_VIDEOS);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAllContent();
    setRefreshing(false);
  }, [sessionToken]);

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
      // Silent fail
    }
  };

  const openVideo = (url: string, title: string) => {
    trackActivity('video_view', undefined, title);
    Linking.openURL(url);
  };

  const navigateToRecipe = (recipe: any) => {
    trackActivity('recipe_view', recipe.recipe_id || recipe.id, recipe.name);
    router.push({
      pathname: '/ai-recipe',
      params: { recipe: JSON.stringify(recipe) }
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{getGreeting()}, {user?.name?.split(' ')[0] || 'Chef'}</Text>
            <Text style={styles.subGreeting}>What's cooking today?</Text>
          </View>
          <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/(tabs)/profile')}>
            {user?.picture ? (
              <Image source={{ uri: user.picture }} style={styles.profileImage} />
            ) : (
              <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.profileImage}>
                <Ionicons name="person" size={20} color="white" />
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>

        {/* Today's AI Suggestion - HERO CARD */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionBadge}>
              <Ionicons name="sparkles" size={14} color="white" />
              <Text style={styles.sectionBadgeText}>AI Picked for You</Text>
            </View>
          </View>
          
          {loadingContent && !todaySuggestion ? (
            <View style={styles.loadingHero}>
              <ActivityIndicator size="large" color="#22c55e" />
              <Text style={styles.loadingText}>Creating personalized suggestion...</Text>
            </View>
          ) : todaySuggestion && (
            <TouchableOpacity 
              style={styles.heroCard}
              onPress={() => navigateToRecipe(todaySuggestion)}
              activeOpacity={0.95}
            >
              <Image source={{ uri: todaySuggestion.image_url }} style={styles.heroImage} />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.heroOverlay}>
                <Text style={styles.heroTitle}>{todaySuggestion.name}</Text>
                <Text style={styles.heroDesc} numberOfLines={2}>{todaySuggestion.description || todaySuggestion.reason}</Text>
                
                <View style={styles.heroMeta}>
                  <View style={styles.heroMetaItem}>
                    <Ionicons name="time-outline" size={14} color="white" />
                    <Text style={styles.heroMetaText}>{(todaySuggestion.prep_time || 15) + (todaySuggestion.cook_time || 30)} min</Text>
                  </View>
                  <View style={styles.heroMetaItem}>
                    <Ionicons name="flame-outline" size={14} color="white" />
                    <Text style={styles.heroMetaText}>{todaySuggestion.calories || 400} cal</Text>
                  </View>
                  <View style={styles.heroMetaItem}>
                    <Ionicons name="star" size={14} color="#fbbf24" />
                    <Text style={styles.heroMetaText}>{todaySuggestion.rating || 4.8}</Text>
                  </View>
                </View>
                
                <View style={styles.heroActions}>
                  <TouchableOpacity style={styles.cookNowBtn}>
                    <Text style={styles.cookNowText}>Start Cooking</Text>
                    <Ionicons name="arrow-forward" size={16} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.videoBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      openVideo(todaySuggestion.video_url || `https://www.youtube.com/results?search_query=${encodeURIComponent(todaySuggestion.name + ' recipe')}`, todaySuggestion.name);
                    }}
                  >
                    <Ionicons name="logo-youtube" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/scan')} activeOpacity={0.9}>
            <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.quickActionGradient}>
              <Ionicons name="camera" size={26} color="white" />
            </LinearGradient>
            <Text style={styles.quickActionText}>Scan</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(tabs)/pantry')} activeOpacity={0.9}>
            <LinearGradient colors={['#f97316', '#ea580c']} style={styles.quickActionGradient}>
              <Ionicons name="basket" size={26} color="white" />
            </LinearGradient>
            <Text style={styles.quickActionText}>Pantry</Text>
            {pantryItems.length > 0 && (
              <View style={styles.quickActionBadge}>
                <Text style={styles.quickActionBadgeText}>{pantryItems.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(tabs)/meal-plan')} activeOpacity={0.9}>
            <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.quickActionGradient}>
              <Ionicons name="calendar" size={26} color="white" />
            </LinearGradient>
            <Text style={styles.quickActionText}>Plan</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(tabs)/shopping')} activeOpacity={0.9}>
            <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.quickActionGradient}>
              <Ionicons name="cart" size={26} color="white" />
            </LinearGradient>
            <Text style={styles.quickActionText}>Shop</Text>
          </TouchableOpacity>
        </View>

        {/* Trending Worldwide */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
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
                onPress={() => navigateToRecipe(dish)}
                activeOpacity={0.95}
              >
                <Image source={{ uri: dish.image_url }} style={styles.trendingImage} />
                
                <TouchableOpacity
                  style={styles.trendingYoutube}
                  onPress={(e) => {
                    e.stopPropagation();
                    openVideo(dish.video_url, dish.name);
                  }}
                >
                  <Ionicons name="logo-youtube" size={18} color="#ef4444" />
                </TouchableOpacity>
                
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.trendingOverlay}>
                  <View style={styles.trendingRating}>
                    <Ionicons name="star" size={10} color="#fbbf24" />
                    <Text style={styles.trendingRatingText}>{dish.rating || 4.8}</Text>
                  </View>
                  <Text style={styles.trendingName} numberOfLines={2}>{dish.name}</Text>
                  <Text style={styles.trendingCuisine}>{dish.cuisine}</Text>
                  <View style={styles.trendingMeta}>
                    <Ionicons name="time" size={10} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.trendingMetaText}>{dish.time || 30}m</Text>
                    <Ionicons name="flame" size={10} color="rgba(255,255,255,0.8)" style={{ marginLeft: 6 }} />
                    <Text style={styles.trendingMetaText}>{dish.calories || 400}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Video Tutorials */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="play-circle" size={22} color="#8b5cf6" />
              <Text style={styles.sectionTitle}>Video Tutorials</Text>
            </View>
            <TouchableOpacity onPress={() => Linking.openURL('https://www.youtube.com/results?search_query=cooking+tutorials')}>
              <Text style={styles.seeAllText}>More</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {videoTutorials.map((video, idx) => (
              <TouchableOpacity
                key={video.id || idx}
                style={styles.videoCard}
                onPress={() => openVideo(video.video_url, video.title)}
                activeOpacity={0.95}
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

        {/* AI Recipe Assistant */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.aiCard}
            onPress={getAIRecommendations}
            disabled={loadingRecs}
            activeOpacity={0.95}
          >
            <LinearGradient colors={['#ec4899', '#db2777']} style={styles.aiGradient}>
              <View style={styles.aiContent}>
                <View style={styles.aiIconContainer}>
                  <Ionicons name="sparkles" size={28} color="white" />
                </View>
                <View style={styles.aiTextContent}>
                  <Text style={styles.aiTitle}>AI Recipe Assistant</Text>
                  <Text style={styles.aiSubtitle}>
                    {pantryItems.length > 0 
                      ? `Get recipes from your ${pantryItems.length} pantry items`
                      : 'Add items to pantry to get started'}
                  </Text>
                </View>
                {loadingRecs ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <View style={styles.aiArrow}>
                    <Ionicons name="arrow-forward" size={22} color="white" />
                  </View>
                )}
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* AI Recommendations */}
        {recommendations.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionBadge}>
              <Ionicons name="sparkles" size={14} color="white" />
              <Text style={styles.sectionBadgeText}>AI Generated</Text>
            </View>
            <Text style={styles.sectionTitle2}>Recipes You Can Make</Text>
            
            {recommendations.map((rec, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.recCard}
                onPress={() => navigateToRecipe(rec)}
                activeOpacity={0.9}
              >
                <View style={styles.recContent}>
                  <Text style={styles.recName}>{rec.name}</Text>
                  <Text style={styles.recReason} numberOfLines={2}>{rec.reason}</Text>
                  {rec.missing_ingredients?.length > 0 && (
                    <View style={styles.missingBadge}>
                      <Ionicons name="cart" size={12} color="#f97316" />
                      <Text style={styles.missingText}>Need {rec.missing_ingredients.length} items</Text>
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={22} color="#22c55e" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Nutrition Tracker Card */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.nutritionCard}
            onPress={() => router.push('/(tabs)/meal-plan')}
            activeOpacity={0.95}
          >
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80' }} 
              style={styles.nutritionBg}
            />
            <LinearGradient colors={['rgba(34,197,94,0.85)', 'rgba(22,163,74,0.95)']} style={styles.nutritionOverlay}>
              <View style={styles.nutritionContent}>
                <View style={styles.nutritionIcon}>
                  <Ionicons name="fitness" size={28} color="white" />
                </View>
                <View style={styles.nutritionText}>
                  <Text style={styles.nutritionTitle}>Track Your Nutrition</Text>
                  <Text style={styles.nutritionDesc}>Monitor calories, protein & more</Text>
                </View>
                <Ionicons name="arrow-forward-circle" size={32} color="white" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
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
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  headerLeft: { flex: 1 },
  greeting: { fontSize: 26, fontWeight: '800', color: '#1f2937' },
  subGreeting: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  profileBtn: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4 },
  profileImage: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionHeader: { marginBottom: 12 },
  sectionBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ec4899', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  sectionBadgeText: { fontSize: 12, fontWeight: '700', color: 'white' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#1f2937' },
  sectionTitle2: { fontSize: 18, fontWeight: '700', color: '#1f2937', marginTop: 10, marginBottom: 14 },
  seeAllText: { fontSize: 14, fontWeight: '600', color: '#22c55e' },
  
  loadingHero: { height: 240, borderRadius: 24, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 14, color: '#22c55e', marginTop: 12, fontWeight: '600' },
  
  heroCard: { borderRadius: 24, overflow: 'hidden', height: 260, elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%', justifyContent: 'flex-end', padding: 18 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: 'white', marginBottom: 4 },
  heroDesc: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginBottom: 12, lineHeight: 18 },
  heroMeta: { flexDirection: 'row', gap: 16, marginBottom: 14 },
  heroMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroMetaText: { fontSize: 13, color: 'white', fontWeight: '500' },
  heroActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cookNowBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#22c55e', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12 },
  cookNowText: { fontSize: 14, fontWeight: '700', color: 'white' },
  videoBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
  
  quickActions: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 24 },
  quickAction: { flex: 1, alignItems: 'center', position: 'relative' },
  quickActionGradient: { width: 60, height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 8, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4 },
  quickActionText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  quickActionBadge: { position: 'absolute', top: -2, right: 6, backgroundColor: '#ef4444', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  quickActionBadgeText: { fontSize: 10, fontWeight: '700', color: 'white' },
  
  horizontalScroll: { paddingRight: 20 },
  
  trendingCard: { width: 160, height: 210, borderRadius: 18, overflow: 'hidden', marginRight: 12, backgroundColor: '#e5e7eb' },
  trendingImage: { width: '100%', height: '100%' },
  trendingYoutube: { position: 'absolute', top: 10, right: 10, width: 34, height: 34, borderRadius: 17, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', elevation: 4 },
  trendingOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12, height: '55%', justifyContent: 'flex-end' },
  trendingRating: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 6 },
  trendingRatingText: { fontSize: 11, fontWeight: '700', color: 'white' },
  trendingName: { fontSize: 14, fontWeight: '700', color: 'white', marginBottom: 2 },
  trendingCuisine: { fontSize: 11, color: '#22c55e', fontWeight: '600', marginBottom: 4 },
  trendingMeta: { flexDirection: 'row', alignItems: 'center' },
  trendingMetaText: { fontSize: 10, color: 'rgba(255,255,255,0.9)', marginLeft: 3 },
  
  videoCard: { width: 200, borderRadius: 16, overflow: 'hidden', marginRight: 12, backgroundColor: 'white', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  videoThumbnail: { width: '100%', height: 115 },
  playOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 115, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.25)' },
  playButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  durationBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.75)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  durationText: { fontSize: 11, fontWeight: '600', color: 'white' },
  videoInfo: { padding: 12 },
  videoTitle: { fontSize: 13, fontWeight: '700', color: '#1f2937', marginBottom: 4 },
  videoViews: { fontSize: 11, color: '#6b7280' },
  
  aiCard: { borderRadius: 18, overflow: 'hidden', elevation: 4, shadowColor: '#ec4899', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  aiGradient: { padding: 18 },
  aiContent: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  aiIconContainer: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  aiTextContent: { flex: 1 },
  aiTitle: { fontSize: 16, fontWeight: '700', color: 'white' },
  aiSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  aiArrow: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  
  recCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 16, borderRadius: 16, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  recContent: { flex: 1 },
  recName: { fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 4 },
  recReason: { fontSize: 13, color: '#6b7280', marginBottom: 8, lineHeight: 18 },
  missingBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff7ed', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, alignSelf: 'flex-start' },
  missingText: { fontSize: 11, color: '#f97316', fontWeight: '600' },
  
  nutritionCard: { borderRadius: 18, overflow: 'hidden', height: 100, elevation: 4, shadowColor: '#22c55e', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6 },
  nutritionBg: { width: '100%', height: '100%' },
  nutritionOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center' },
  nutritionContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, gap: 14 },
  nutritionIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  nutritionText: { flex: 1 },
  nutritionTitle: { fontSize: 16, fontWeight: '700', color: 'white' },
  nutritionDesc: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 2 },
});
