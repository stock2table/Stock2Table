import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, Switch, Modal, StatusBar, Dimensions, Linking, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useAppStore } from '../../store/appStore';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import axios from 'axios';

const { width } = Dimensions.get('window');
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout, sessionToken } = useAuth();
  const { familyMembers, fetchFamilyMembers, pantryItems, recipes, mealPlans } = useAppStore();
  
  // Region
  const [region, setRegion] = useState<string | null>(null);
  const [regionName, setRegionName] = useState('Detecting...');
  
  // Settings states
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [mealReminders, setMealReminders] = useState(true);
  const [expiryAlerts, setExpiryAlerts] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  
  // Modal states
  const [showDietaryModal, setShowDietaryModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showNutritionModal, setShowNutritionModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English (US)');
  const [saving, setSaving] = useState(false);
  
  // Dietary preferences
  const [dietaryPrefs, setDietaryPrefs] = useState({
    vegetarian: false,
    vegan: false,
    glutenFree: false,
    dairyFree: false,
    nutFree: false,
    lowCarb: false,
    keto: false,
    halal: false,
  });
  
  // Nutrition goals
  const [nutritionGoals, setNutritionGoals] = useState({
    dailyCalories: 2000,
    protein: 100,
    carbs: 250,
    fat: 65,
  });

  useEffect(() => {
    if (sessionToken) {
      fetchFamilyMembers(sessionToken);
      detectRegion();
      loadPreferences();
    }
  }, [sessionToken]);

  const detectRegion = async () => {
    try {
      // Try expo-location first (works on mobile)
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          const [address] = await Location.reverseGeocodeAsync(location.coords);
          if (address) {
            setRegion(address.isoCountryCode || null);
            setRegionName(`${address.city || address.region || ''}, ${address.country || ''}`);
            return;
          }
        }
      } catch (locError) {
        console.log('Location API failed, trying IP-based detection');
      }
      
      // Fallback: IP-based geolocation (works on web)
      try {
        const ipResponse = await axios.get('https://ipapi.co/json/', { timeout: 5000 });
        if (ipResponse.data) {
          const city = ipResponse.data.city || '';
          const country = ipResponse.data.country_name || '';
          setRegion(ipResponse.data.country_code || null);
          setRegionName(`${city}${city && country ? ', ' : ''}${country}` || 'Unknown location');
          return;
        }
      } catch (ipError) {
        console.log('IP detection failed');
      }
      
      // Final fallback
      setRegionName('Location unavailable');
    } catch (error) {
      setRegionName('Unable to detect');
    }
  };

  const loadPreferences = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/preferences`, {
        headers: { Authorization: `Bearer ${sessionToken}` }
      });
      if (response.data.dietary_restrictions?.length) {
        const newPrefs = { ...dietaryPrefs };
        response.data.dietary_restrictions.forEach((r: string) => {
          const key = r.replace('-', '') as keyof typeof dietaryPrefs;
          if (key in newPrefs) newPrefs[key] = true;
        });
        setDietaryPrefs(newPrefs);
      }
    } catch (error) {
      console.log('Error loading preferences');
    }
  };

  const saveDietaryPrefs = async () => {
    try {
      setSaving(true);
      const restrictions = Object.entries(dietaryPrefs)
        .filter(([_, v]) => v)
        .map(([k]) => k.replace(/([A-Z])/g, '-$1').toLowerCase());
      
      await axios.put(`${BACKEND_URL}/api/preferences`, {
        dietary_restrictions: restrictions
      }, { headers: { Authorization: `Bearer ${sessionToken}` } });
      
      setShowDietaryModal(false);
      Alert.alert('Saved!', 'Your dietary preferences have been updated.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    // On web, Alert might not work well, so we'll use confirm dialog
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to logout?');
      if (confirmed) {
        try {
          await logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          router.replace('/login');
        }
      }
    } else {
      Alert.alert('Logout', 'Are you sure you want to logout?', [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive', 
          onPress: async () => { 
            try {
              await logout(); 
            } catch (error) {
              console.error('Logout error:', error);
            } finally {
              router.replace('/login'); 
            }
          } 
        }
      ]);
    }
  };

  const toggleDietaryPref = (key: keyof typeof dietaryPrefs) => {
    setDietaryPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const languages = ['English (US)', 'English (UK)', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Hindi', 'Chinese', 'Japanese'];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80' }} 
            style={styles.heroImage} 
          />
          <LinearGradient colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.9)']} style={styles.heroOverlay}>
            <View style={styles.avatarSection}>
              {user?.picture ? (
                <Image source={{ uri: user.picture }} style={styles.avatar} />
              ) : (
                <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={48} color="white" />
                </LinearGradient>
              )}
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user?.name || 'User'}</Text>
                <Text style={styles.userEmail}>{user?.email || ''}</Text>
              </View>
            </View>
            
            {/* Region Badge */}
            <View style={styles.regionRow}>
              <View style={styles.regionBadge}>
                <Ionicons name="location" size={14} color="#22c55e" />
                <Text style={styles.regionText}>{regionName}</Text>
              </View>
              <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.tierBadge}>
                <Ionicons name="star" size={14} color="white" />
                <Text style={styles.tierText}>FREE</Text>
              </LinearGradient>
            </View>
          </LinearGradient>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{pantryItems.length}</Text>
            <Text style={styles.statLabel}>Pantry Items</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{recipes.length}</Text>
            <Text style={styles.statLabel}>Recipes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{mealPlans.length}</Text>
            <Text style={styles.statLabel}>Meal Plans</Text>
          </View>
        </View>

        {/* Family Members */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Family Members</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => router.push('/add-family')}>
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          </View>
          
          {familyMembers.length === 0 ? (
            <View style={styles.emptyFamily}>
              <Ionicons name="people-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyFamilyText}>No family members yet</Text>
              <TouchableOpacity style={styles.addFamilyBtn} onPress={() => router.push('/add-family')}>
                <Text style={styles.addFamilyBtnText}>Add Family Member</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {familyMembers.map((member) => (
                <View key={member.member_id} style={styles.familyCard}>
                  <TouchableOpacity
                    style={styles.familyDeleteBtn}
                    onPress={async () => {
                      const confirmDelete = Platform.OS === 'web' 
                        ? window.confirm(`Remove ${member.name} from your family?`)
                        : await new Promise<boolean>((resolve) => {
                            Alert.alert(
                              'Remove Family Member',
                              `Remove ${member.name} from your family?`,
                              [
                                { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                                { text: 'Remove', style: 'destructive', onPress: () => resolve(true) }
                              ]
                            );
                          });
                      
                      if (confirmDelete) {
                        try {
                          await axios.delete(`${BACKEND_URL}/api/family/${member.member_id}`, {
                            headers: { Authorization: `Bearer ${sessionToken}` }
                          });
                          await fetchFamilyMembers(sessionToken!);
                          if (Platform.OS === 'web') {
                            window.alert(`${member.name} has been removed.`);
                          } else {
                            Alert.alert('Removed', `${member.name} has been removed.`);
                          }
                        } catch (error) {
                          console.error('Delete error:', error);
                          if (Platform.OS === 'web') {
                            window.alert('Failed to remove family member');
                          } else {
                            Alert.alert('Error', 'Failed to remove family member');
                          }
                        }
                      }
                    }}
                  >
                    <Ionicons name="close-circle" size={22} color="#ef4444" />
                  </TouchableOpacity>
                  <LinearGradient colors={['#f3f4f6', '#e5e7eb']} style={styles.familyAvatar}>
                    <Ionicons name="person" size={28} color="#6b7280" />
                  </LinearGradient>
                  <Text style={styles.familyName}>{member.name}</Text>
                  {member.age && <Text style={styles.familyAge}>Age {member.age}</Text>}
                  {member.relationship && <Text style={styles.familyRelation}>{member.relationship}</Text>}
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Health & Nutrition */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health & Nutrition</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={() => setShowNutritionModal(true)}>
            <View style={[styles.settingIcon, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="fitness" size={20} color="#22c55e" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingText}>Nutrition Goals</Text>
              <Text style={styles.settingDescription}>{nutritionGoals.dailyCalories} cal/day target</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={() => setShowDietaryModal(true)}>
            <View style={[styles.settingIcon, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="nutrition" size={20} color="#f59e0b" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingText}>Dietary Preferences</Text>
              <Text style={styles.settingDescription}>
                {Object.values(dietaryPrefs).filter(Boolean).length || 'No'} restrictions set
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Notifications Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.settingItem}>
            <View style={[styles.settingIcon, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="notifications" size={20} color="#3b82f6" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingText}>Push Notifications</Text>
              <Text style={styles.settingDescription}>Enable all notifications</Text>
            </View>
            <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} trackColor={{ true: '#22c55e' }} thumbColor="white" />
          </View>

          <View style={styles.settingItem}>
            <View style={[styles.settingIcon, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="time" size={20} color="#f59e0b" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingText}>Meal Reminders</Text>
              <Text style={styles.settingDescription}>Daily meal time alerts</Text>
            </View>
            <Switch value={mealReminders} onValueChange={setMealReminders} trackColor={{ true: '#22c55e' }} thumbColor="white" />
          </View>

          <View style={styles.settingItem}>
            <View style={[styles.settingIcon, { backgroundColor: '#fee2e2' }]}>
              <Ionicons name="alert-circle" size={20} color="#ef4444" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingText}>Expiry Alerts</Text>
              <Text style={styles.settingDescription}>When items are about to expire</Text>
            </View>
            <Switch value={expiryAlerts} onValueChange={setExpiryAlerts} trackColor={{ true: '#22c55e' }} thumbColor="white" />
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <TouchableOpacity style={styles.settingItem} onPress={() => setShowLanguageModal(true)}>
            <View style={[styles.settingIcon, { backgroundColor: '#e0e7ff' }]}>
              <Ionicons name="language" size={20} color="#6366f1" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingText}>Language</Text>
              <Text style={styles.settingDescription}>{selectedLanguage}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/onboarding')}>
            <View style={[styles.settingIcon, { backgroundColor: '#fce7f3' }]}>
              <Ionicons name="settings" size={20} color="#ec4899" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingText}>Re-run Setup</Text>
              <Text style={styles.settingDescription}>Customize app preferences</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <View style={styles.settingItem}>
            <View style={[styles.settingIcon, { backgroundColor: '#f3e8ff' }]}>
              <Ionicons name="moon" size={20} color="#8b5cf6" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingText}>Dark Mode</Text>
              <Text style={styles.settingDescription}>Reduce eye strain</Text>
            </View>
            <Switch value={darkMode} onValueChange={setDarkMode} trackColor={{ true: '#22c55e' }} thumbColor="white" />
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>

          <TouchableOpacity style={styles.settingItem} onPress={() => setShowHelpModal(true)}>
            <View style={[styles.settingIcon, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="help-circle" size={20} color="#3b82f6" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingText}>Help & FAQ</Text>
              <Text style={styles.settingDescription}>Get answers to common questions</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={() => Linking.openURL('mailto:support@stock2table.com')}>
            <View style={[styles.settingIcon, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="mail" size={20} color="#22c55e" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingText}>Contact Us</Text>
              <Text style={styles.settingDescription}>support@stock2table.com</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={() => setShowAboutModal(true)}>
            <View style={[styles.settingIcon, { backgroundColor: '#f3f4f6' }]}>
              <Ionicons name="information-circle" size={20} color="#6b7280" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingText}>About</Text>
              <Text style={styles.settingDescription}>Version 1.0.0</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.9}>
          <Ionicons name="log-out-outline" size={22} color="#ef4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Made with love for healthy eating</Text>
          <Text style={styles.footerVersion}>Stock2Table v1.0.0</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Dietary Preferences Modal */}
      <Modal visible={showDietaryModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Dietary Preferences</Text>
              <TouchableOpacity onPress={() => setShowDietaryModal(false)}>
                <Ionicons name="close" size={28} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {Object.entries(dietaryPrefs).map(([key, value]) => (
                <TouchableOpacity key={key} style={styles.dietaryItem} onPress={() => toggleDietaryPref(key as keyof typeof dietaryPrefs)}>
                  <View style={[styles.checkbox, value && styles.checkboxActive]}>
                    {value && <Ionicons name="checkmark" size={16} color="white" />}
                  </View>
                  <Text style={styles.dietaryText}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalSaveBtn} onPress={saveDietaryPrefs} disabled={saving}>
              <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.modalSaveGradient}>
                <Text style={styles.modalSaveBtnText}>{saving ? 'Saving...' : 'Save Preferences'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Nutrition Goals Modal */}
      <Modal visible={showNutritionModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nutrition Goals</Text>
              <TouchableOpacity onPress={() => setShowNutritionModal(false)}>
                <Ionicons name="close" size={28} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.nutritionCard}>
                <View style={styles.nutritionRow}>
                  <Text style={styles.nutritionLabel}>Daily Calories</Text>
                  <Text style={styles.nutritionValue}>{nutritionGoals.dailyCalories} cal</Text>
                </View>
                <View style={styles.nutritionBar}>
                  <LinearGradient colors={['#22c55e', '#16a34a']} style={[styles.nutritionFill, { width: '100%' }]} />
                </View>
              </View>
              
              <View style={styles.macrosGrid}>
                <View style={styles.macroCard}>
                  <Text style={styles.macroValue}>{nutritionGoals.protein}g</Text>
                  <Text style={styles.macroLabel}>Protein</Text>
                </View>
                <View style={styles.macroCard}>
                  <Text style={styles.macroValue}>{nutritionGoals.carbs}g</Text>
                  <Text style={styles.macroLabel}>Carbs</Text>
                </View>
                <View style={styles.macroCard}>
                  <Text style={styles.macroValue}>{nutritionGoals.fat}g</Text>
                  <Text style={styles.macroLabel}>Fat</Text>
                </View>
              </View>
              
              <Text style={styles.nutritionTip}>
                Track your meals in the Meal Plan tab to see how you're progressing towards your goals.
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Language Modal */}
      <Modal visible={showLanguageModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Language</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <Ionicons name="close" size={28} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {languages.map((lang) => (
                <TouchableOpacity key={lang} style={styles.languageItem} onPress={() => { setSelectedLanguage(lang); setShowLanguageModal(false); }}>
                  <Text style={[styles.languageText, selectedLanguage === lang && styles.languageTextActive]}>{lang}</Text>
                  {selectedLanguage === lang && <Ionicons name="checkmark-circle" size={24} color="#22c55e" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Help Modal */}
      <Modal visible={showHelpModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Help & FAQ</Text>
              <TouchableOpacity onPress={() => setShowHelpModal(false)}>
                <Ionicons name="close" size={28} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>How do I scan ingredients?</Text>
                <Text style={styles.faqAnswer}>Go to the Home tab and tap "Scan Items". Point your camera at a receipt or grocery items, and our AI will identify them.</Text>
              </View>
              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>How does AI meal planning work?</Text>
                <Text style={styles.faqAnswer}>Our AI analyzes your pantry items and suggests recipes you can make. It also generates weekly meal plans based on your preferences.</Text>
              </View>
              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>Can I share my meal plans?</Text>
                <Text style={styles.faqAnswer}>Yes! You can share meal plans with family members by adding them to your family group in the Profile section.</Text>
              </View>
              <View style={styles.faqItem}>
                <Text style={styles.faqQuestion}>How do I delete items from my pantry?</Text>
                <Text style={styles.faqAnswer}>Tap on any item in your pantry to open the edit modal, then tap "Delete This Item" at the bottom.</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* About Modal */}
      <Modal visible={showAboutModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>About Stock2Table</Text>
              <TouchableOpacity onPress={() => setShowAboutModal(false)}>
                <Ionicons name="close" size={28} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.aboutContent}>
              <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.aboutLogo}>
                <Ionicons name="leaf" size={48} color="white" />
              </LinearGradient>
              <Text style={styles.aboutName}>Stock2Table</Text>
              <Text style={styles.aboutVersion}>Version 1.0.0</Text>
              <Text style={styles.aboutDesc}>AI-powered meal planning app that helps you reduce food waste, discover new recipes, and plan healthy meals for your family.</Text>
              <View style={styles.aboutFeatures}>
                <View style={styles.aboutFeature}><Ionicons name="checkmark-circle" size={18} color="#22c55e" /><Text style={styles.aboutFeatureText}>AI Recipe Recommendations</Text></View>
                <View style={styles.aboutFeature}><Ionicons name="checkmark-circle" size={18} color="#22c55e" /><Text style={styles.aboutFeatureText}>Smart Pantry Management</Text></View>
                <View style={styles.aboutFeature}><Ionicons name="checkmark-circle" size={18} color="#22c55e" /><Text style={styles.aboutFeatureText}>AI Ingredient Scanner</Text></View>
                <View style={styles.aboutFeature}><Ionicons name="checkmark-circle" size={18} color="#22c55e" /><Text style={styles.aboutFeatureText}>Weekly Meal Planning</Text></View>
              </View>
              <Text style={styles.aboutCopyright}>© 2025 Stock2Table. All rights reserved.</Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollView: { flex: 1 },
  
  heroSection: { height: 280, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '100%', justifyContent: 'flex-end', padding: 20, paddingBottom: 30 },
  avatarSection: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: 'white' },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'white' },
  userInfo: { flex: 1 },
  userName: { fontSize: 24, fontWeight: '800', color: 'white' },
  userEmail: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  regionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  regionBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  regionText: { fontSize: 12, fontWeight: '600', color: 'white' },
  tierBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  tierText: { fontSize: 12, fontWeight: '800', color: 'white' },
  
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: 'white', marginHorizontal: 16, marginTop: -20, borderRadius: 18, padding: 20, elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 8 },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 26, fontWeight: '800', color: '#22c55e' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  statDivider: { width: 1, height: 44, backgroundColor: '#e5e7eb' },
  
  section: { backgroundColor: 'white', margin: 16, marginBottom: 0, borderRadius: 18, padding: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937', marginBottom: 12 },
  addButton: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#22c55e', justifyContent: 'center', alignItems: 'center' },
  
  emptyFamily: { alignItems: 'center', padding: 24 },
  emptyFamilyText: { fontSize: 14, color: '#9ca3af', marginTop: 12, marginBottom: 16 },
  addFamilyBtn: { backgroundColor: '#f0fdf4', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  addFamilyBtnText: { fontSize: 14, fontWeight: '600', color: '#22c55e' },
  familyCard: { backgroundColor: '#f9fafb', borderRadius: 16, padding: 16, marginRight: 12, alignItems: 'center', minWidth: 100, position: 'relative' },
  familyDeleteBtn: { position: 'absolute', top: 4, right: 4, zIndex: 10, padding: 4 },
  familyAvatar: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  familyName: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  familyAge: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  familyRelation: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  familyHint: { fontSize: 10, color: '#9ca3af', marginTop: 4, textAlign: 'center' },
  
  settingItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', gap: 14 },
  settingIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  settingInfo: { flex: 1 },
  settingText: { fontSize: 15, fontWeight: '600', color: '#1f2937' },
  settingDescription: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fef2f2', marginHorizontal: 16, marginTop: 16, paddingVertical: 16, borderRadius: 16, gap: 8, borderWidth: 1.5, borderColor: '#fecaca' },
  logoutText: { fontSize: 16, fontWeight: '700', color: '#ef4444' },
  
  footer: { alignItems: 'center', padding: 24 },
  footerText: { fontSize: 13, color: '#9ca3af' },
  footerVersion: { fontSize: 11, color: '#d1d5db', marginTop: 4 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#1f2937' },
  modalBody: { padding: 24, paddingTop: 12 },
  modalSaveBtn: { margin: 24, marginTop: 12, borderRadius: 14, overflow: 'hidden' },
  modalSaveGradient: { paddingVertical: 16, alignItems: 'center' },
  modalSaveBtnText: { fontSize: 16, fontWeight: '700', color: 'white' },
  
  dietaryItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  checkbox: { width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: '#d1d5db', justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  dietaryText: { fontSize: 16, color: '#1f2937', fontWeight: '500' },
  
  nutritionCard: { backgroundColor: '#f9fafb', borderRadius: 16, padding: 18, marginBottom: 20 },
  nutritionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  nutritionLabel: { fontSize: 15, fontWeight: '600', color: '#374151' },
  nutritionValue: { fontSize: 18, fontWeight: '800', color: '#22c55e' },
  nutritionBar: { height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, overflow: 'hidden' },
  nutritionFill: { height: '100%', borderRadius: 4 },
  macrosGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  macroCard: { flex: 1, backgroundColor: '#f9fafb', borderRadius: 14, padding: 16, alignItems: 'center' },
  macroValue: { fontSize: 22, fontWeight: '800', color: '#1f2937' },
  macroLabel: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  nutritionTip: { fontSize: 13, color: '#6b7280', lineHeight: 20, textAlign: 'center', fontStyle: 'italic' },
  
  languageItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  languageText: { fontSize: 16, color: '#1f2937' },
  languageTextActive: { color: '#22c55e', fontWeight: '600' },
  
  faqItem: { marginBottom: 20 },
  faqQuestion: { fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 8 },
  faqAnswer: { fontSize: 14, color: '#6b7280', lineHeight: 22 },
  
  aboutContent: { alignItems: 'center', padding: 24 },
  aboutLogo: { width: 80, height: 80, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  aboutName: { fontSize: 24, fontWeight: '800', color: '#1f2937' },
  aboutVersion: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  aboutDesc: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginTop: 16, lineHeight: 22 },
  aboutFeatures: { marginTop: 24, alignSelf: 'flex-start', width: '100%' },
  aboutFeature: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  aboutFeatureText: { fontSize: 14, color: '#1f2937' },
  aboutCopyright: { fontSize: 12, color: '#9ca3af', marginTop: 24 },
});
