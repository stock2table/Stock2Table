import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions, TextInput } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const { width, height } = Dimensions.get('window');
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const CUISINES = [
  { id: 'italian', name: 'Italian', emoji: '🍝', color: '#ef4444' },
  { id: 'mexican', name: 'Mexican', emoji: '🌮', color: '#f97316' },
  { id: 'indian', name: 'Indian', emoji: '🍛', color: '#eab308' },
  { id: 'chinese', name: 'Chinese', emoji: '🥢', color: '#22c55e' },
  { id: 'japanese', name: 'Japanese', emoji: '🍱', color: '#3b82f6' },
  { id: 'thai', name: 'Thai', emoji: '🍜', color: '#8b5cf6' },
  { id: 'american', name: 'American', emoji: '🍔', color: '#ec4899' },
  { id: 'mediterranean', name: 'Mediterranean', emoji: '🥙', color: '#06b6d4' },
  { id: 'korean', name: 'Korean', emoji: '🥘', color: '#f43f5e' },
  { id: 'french', name: 'French', emoji: '🥐', color: '#a855f7' },
];

const DIETARY = [
  { id: 'vegetarian', name: 'Vegetarian', emoji: '🥬' },
  { id: 'vegan', name: 'Vegan', emoji: '🌱' },
  { id: 'gluten-free', name: 'Gluten-Free', emoji: '🌾' },
  { id: 'dairy-free', name: 'Dairy-Free', emoji: '🥛' },
  { id: 'nut-free', name: 'Nut-Free', emoji: '🥜' },
  { id: 'low-carb', name: 'Low Carb', emoji: '🍞' },
  { id: 'keto', name: 'Keto', emoji: '🥑' },
  { id: 'halal', name: 'Halal', emoji: '☪️' },
  { id: 'kosher', name: 'Kosher', emoji: '✡️' },
  { id: 'pescatarian', name: 'Pescatarian', emoji: '🐟' },
];

const GOALS = [
  { id: 'healthy', name: 'Eat Healthier', emoji: '🥗', desc: 'Focus on nutritious meals' },
  { id: 'budget', name: 'Save Money', emoji: '💰', desc: 'Budget-friendly cooking' },
  { id: 'variety', name: 'Try New Recipes', emoji: '🌍', desc: 'Explore world cuisines' },
  { id: 'quick', name: 'Quick Meals', emoji: '⚡', desc: '30 min or less' },
  { id: 'family', name: 'Family Cooking', emoji: '👨‍👩‍👧‍👦', desc: 'Kid-friendly recipes' },
  { id: 'fitness', name: 'Fitness Goals', emoji: '💪', desc: 'High protein, balanced' },
];

const SKILL_LEVELS = [
  { id: 'beginner', name: 'Beginner', desc: 'Just starting out', emoji: '🌱' },
  { id: 'intermediate', name: 'Home Cook', desc: 'Comfortable in kitchen', emoji: '👨‍🍳' },
  { id: 'advanced', name: 'Experienced', desc: 'Love complex recipes', emoji: '⭐' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { sessionToken } = useAuth();
  const [step, setStep] = useState(0);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [skillLevel, setSkillLevel] = useState('intermediate');
  const [householdSize, setHouseholdSize] = useState('2');
  const [saving, setSaving] = useState(false);

  const toggleCuisine = (id: string) => {
    setSelectedCuisines(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const toggleDietary = (id: string) => {
    setSelectedDietary(prev => 
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const toggleGoal = (id: string) => {
    setSelectedGoals(prev => 
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      await axios.put(`${BACKEND_URL}/api/preferences`, {
        favorite_cuisines: selectedCuisines,
        dietary_restrictions: selectedDietary,
        cooking_skill: skillLevel,
        serving_size: parseInt(householdSize) || 2,
      }, { headers: { Authorization: `Bearer ${sessionToken}` } });
      
      await AsyncStorage.setItem('onboarding_complete', 'true');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error saving preferences:', error);
      router.replace('/(tabs)');
    } finally {
      setSaving(false);
    }
  };

  const skipOnboarding = async () => {
    await AsyncStorage.setItem('onboarding_complete', 'true');
    router.replace('/(tabs)');
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <View style={styles.welcomeHeader}>
              <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.welcomeIcon}>
                <Ionicons name="leaf" size={48} color="white" />
              </LinearGradient>
              <Text style={styles.welcomeTitle}>Welcome to Stock2Table!</Text>
              <Text style={styles.welcomeSubtitle}>
                Let's personalize your experience. This takes about 1 minute.
              </Text>
            </View>
            
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80' }}
              style={styles.welcomeImage}
            />
            
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: '#dcfce7' }]}>
                  <Ionicons name="sparkles" size={20} color="#22c55e" />
                </View>
                <Text style={styles.featureText}>AI-powered recipe recommendations</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: '#dbeafe' }]}>
                  <Ionicons name="camera" size={20} color="#3b82f6" />
                </View>
                <Text style={styles.featureText}>Smart ingredient scanning</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: '#fef3c7' }]}>
                  <Ionicons name="calendar" size={20} color="#f59e0b" />
                </View>
                <Text style={styles.featureText}>Weekly meal planning</Text>
              </View>
            </View>
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>What cuisines do you love?</Text>
            <Text style={styles.stepSubtitle}>Select all that apply</Text>
            
            <View style={styles.optionsGrid}>
              {CUISINES.map(cuisine => (
                <TouchableOpacity
                  key={cuisine.id}
                  style={[
                    styles.cuisineCard,
                    selectedCuisines.includes(cuisine.id) && styles.cuisineCardActive
                  ]}
                  onPress={() => toggleCuisine(cuisine.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cuisineEmoji}>{cuisine.emoji}</Text>
                  <Text style={[
                    styles.cuisineName,
                    selectedCuisines.includes(cuisine.id) && styles.cuisineNameActive
                  ]}>{cuisine.name}</Text>
                  {selectedCuisines.includes(cuisine.id) && (
                    <View style={styles.checkBadge}>
                      <Ionicons name="checkmark" size={12} color="white" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Any dietary preferences?</Text>
            <Text style={styles.stepSubtitle}>We'll customize recipes for you</Text>
            
            <View style={styles.dietaryGrid}>
              {DIETARY.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.dietaryCard,
                    selectedDietary.includes(item.id) && styles.dietaryCardActive
                  ]}
                  onPress={() => toggleDietary(item.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dietaryEmoji}>{item.emoji}</Text>
                  <Text style={[
                    styles.dietaryName,
                    selectedDietary.includes(item.id) && styles.dietaryNameActive
                  ]}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>What's your cooking skill?</Text>
            <Text style={styles.stepSubtitle}>We'll suggest appropriate recipes</Text>
            
            <View style={styles.skillGrid}>
              {SKILL_LEVELS.map(skill => (
                <TouchableOpacity
                  key={skill.id}
                  style={[
                    styles.skillCard,
                    skillLevel === skill.id && styles.skillCardActive
                  ]}
                  onPress={() => setSkillLevel(skill.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.skillEmoji}>{skill.emoji}</Text>
                  <Text style={[
                    styles.skillName,
                    skillLevel === skill.id && styles.skillNameActive
                  ]}>{skill.name}</Text>
                  <Text style={styles.skillDesc}>{skill.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.householdSection}>
              <Text style={styles.householdLabel}>Household Size</Text>
              <View style={styles.householdRow}>
                {['1', '2', '3', '4', '5', '6+'].map(size => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.householdBtn,
                      householdSize === size && styles.householdBtnActive
                    ]}
                    onPress={() => setHouseholdSize(size)}
                  >
                    <Text style={[
                      styles.householdText,
                      householdSize === size && styles.householdTextActive
                    ]}>{size}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>What are your goals?</Text>
            <Text style={styles.stepSubtitle}>We'll tailor suggestions accordingly</Text>
            
            <View style={styles.goalsGrid}>
              {GOALS.map(goal => (
                <TouchableOpacity
                  key={goal.id}
                  style={[
                    styles.goalCard,
                    selectedGoals.includes(goal.id) && styles.goalCardActive
                  ]}
                  onPress={() => toggleGoal(goal.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.goalEmoji}>{goal.emoji}</Text>
                  <Text style={[
                    styles.goalName,
                    selectedGoals.includes(goal.id) && styles.goalNameActive
                  ]}>{goal.name}</Text>
                  <Text style={styles.goalDesc}>{goal.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <LinearGradient
            colors={['#22c55e', '#16a34a']}
            style={[styles.progressFill, { width: `${((step + 1) / 5) * 100}%` }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </View>
        <Text style={styles.progressText}>{step + 1} of 5</Text>
      </View>

      {/* Skip Button */}
      {step < 4 && (
        <TouchableOpacity style={styles.skipBtn} onPress={skipOnboarding}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Content */}
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderStep()}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        {step > 0 && (
          <TouchableOpacity style={styles.backBtn} onPress={() => setStep(step - 1)}>
            <Ionicons name="arrow-back" size={22} color="#6b7280" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.nextBtn, step === 0 && { flex: 1 }]}
          onPress={() => step < 4 ? setStep(step + 1) : savePreferences()}
          disabled={saving}
          activeOpacity={0.9}
        >
          <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.nextGradient}>
            <Text style={styles.nextText}>
              {step === 0 ? "Let's Go!" : step === 4 ? (saving ? 'Saving...' : 'Finish Setup') : 'Continue'}
            </Text>
            <Ionicons name={step === 4 ? 'checkmark' : 'arrow-forward'} size={20} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  
  progressContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, gap: 12 },
  progressBar: { flex: 1, height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  
  skipBtn: { position: 'absolute', top: 56, right: 20, padding: 8 },
  skipText: { fontSize: 15, fontWeight: '600', color: '#9ca3af' },
  
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 20 },
  
  stepContent: { flex: 1 },
  
  welcomeHeader: { alignItems: 'center', marginBottom: 24 },
  welcomeIcon: { width: 88, height: 88, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  welcomeTitle: { fontSize: 28, fontWeight: '800', color: '#1f2937', textAlign: 'center' },
  welcomeSubtitle: { fontSize: 15, color: '#6b7280', textAlign: 'center', marginTop: 8, lineHeight: 22 },
  welcomeImage: { width: '100%', height: 180, borderRadius: 20, marginBottom: 24 },
  featureList: { gap: 12 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'white', padding: 16, borderRadius: 14 },
  featureIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  featureText: { fontSize: 15, fontWeight: '600', color: '#1f2937' },
  
  stepTitle: { fontSize: 26, fontWeight: '800', color: '#1f2937', marginBottom: 8 },
  stepSubtitle: { fontSize: 15, color: '#6b7280', marginBottom: 24 },
  
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cuisineCard: { width: (width - 64) / 3, backgroundColor: 'white', borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  cuisineCardActive: { borderColor: '#22c55e', backgroundColor: '#f0fdf4' },
  cuisineEmoji: { fontSize: 32, marginBottom: 8 },
  cuisineName: { fontSize: 12, fontWeight: '600', color: '#6b7280', textAlign: 'center' },
  cuisineNameActive: { color: '#22c55e' },
  checkBadge: { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, backgroundColor: '#22c55e', justifyContent: 'center', alignItems: 'center' },
  
  dietaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  dietaryCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'white', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 24, borderWidth: 2, borderColor: 'transparent' },
  dietaryCardActive: { borderColor: '#22c55e', backgroundColor: '#f0fdf4' },
  dietaryEmoji: { fontSize: 18 },
  dietaryName: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  dietaryNameActive: { color: '#22c55e' },
  
  skillGrid: { gap: 12, marginBottom: 24 },
  skillCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 18, borderRadius: 16, gap: 14, borderWidth: 2, borderColor: 'transparent' },
  skillCardActive: { borderColor: '#22c55e', backgroundColor: '#f0fdf4' },
  skillEmoji: { fontSize: 32 },
  skillName: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
  skillNameActive: { color: '#22c55e' },
  skillDesc: { fontSize: 13, color: '#6b7280', marginLeft: 'auto' },
  
  householdSection: { backgroundColor: 'white', padding: 18, borderRadius: 16 },
  householdLabel: { fontSize: 15, fontWeight: '700', color: '#1f2937', marginBottom: 14 },
  householdRow: { flexDirection: 'row', gap: 10 },
  householdBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#f3f4f6', alignItems: 'center' },
  householdBtnActive: { backgroundColor: '#22c55e' },
  householdText: { fontSize: 15, fontWeight: '700', color: '#6b7280' },
  householdTextActive: { color: 'white' },
  
  goalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  goalCard: { width: (width - 52) / 2, backgroundColor: 'white', borderRadius: 16, padding: 18, borderWidth: 2, borderColor: 'transparent' },
  goalCardActive: { borderColor: '#22c55e', backgroundColor: '#f0fdf4' },
  goalEmoji: { fontSize: 32, marginBottom: 10 },
  goalName: { fontSize: 15, fontWeight: '700', color: '#1f2937', marginBottom: 4 },
  goalNameActive: { color: '#22c55e' },
  goalDesc: { fontSize: 12, color: '#6b7280' },
  
  navigation: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 34, paddingTop: 16, gap: 12, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 14 },
  backText: { fontSize: 15, fontWeight: '600', color: '#6b7280' },
  nextBtn: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  nextGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  nextText: { fontSize: 16, fontWeight: '700', color: 'white' },
});
