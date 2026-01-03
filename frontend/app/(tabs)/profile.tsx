import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, Switch, Modal, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useAppStore } from '../../store/appStore';
import { LinearGradient } from 'expo-linear-gradient';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, sessionToken } = useAuth();
  const { familyMembers, fetchFamilyMembers, pantryItems, recipes, mealPlans } = useAppStore();
  
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
  const [selectedLanguage, setSelectedLanguage] = useState('English (US)');
  
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

  useEffect(() => {
    if (sessionToken) {
      fetchFamilyMembers(sessionToken);
    }
  }, [sessionToken]);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => { await logout(); router.replace('/login'); } }
    ]);
  };

  const toggleDietaryPref = (key: keyof typeof dietaryPrefs) => {
    setDietaryPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const languages = ['English (US)', 'English (UK)', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Hindi', 'Chinese', 'Japanese'];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Image source={{ uri: HERO_IMAGE }} style={styles.heroImage} />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.heroOverlay}>
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
          <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.tierBadge}>
            <Ionicons name="star" size={16} color="white" />
            <Text style={styles.tierText}>FREE</Text>
          </LinearGradient>
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
                <LinearGradient colors={['#f3f4f6', '#e5e7eb']} style={styles.familyAvatar}>
                  <Ionicons name="person" size={28} color="#6b7280" />
                </LinearGradient>
                <Text style={styles.familyName}>{member.name}</Text>
                {member.age && <Text style={styles.familyAge}>Age {member.age}</Text>}
              </View>
            ))}
          </ScrollView>
        )}
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

        <TouchableOpacity style={styles.settingItem} onPress={() => setShowDietaryModal(true)}>
          <View style={[styles.settingIcon, { backgroundColor: '#dcfce7' }]}>
            <Ionicons name="nutrition" size={20} color="#22c55e" />
          </View>
          <View style={styles.settingInfo}>
            <Text style={styles.settingText}>Dietary Preferences</Text>
            <Text style={styles.settingDescription}>Allergies & restrictions</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={() => setShowLanguageModal(true)}>
          <View style={[styles.settingIcon, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="language" size={20} color="#f59e0b" />
          </View>
          <View style={styles.settingInfo}>
            <Text style={styles.settingText}>Language</Text>
            <Text style={styles.settingDescription}>{selectedLanguage}</Text>
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

        <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Contact Us', 'Email: support@stock2table.com\n\nWe typically respond within 24 hours.')}>
          <View style={[styles.settingIcon, { backgroundColor: '#dcfce7' }]}>
            <Ionicons name="mail" size={20} color="#22c55e" />
          </View>
          <View style={styles.settingInfo}>
            <Text style={styles.settingText}>Contact Us</Text>
            <Text style={styles.settingDescription}>Get in touch with support</Text>
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
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color="#ef4444" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Made with ❤️ for healthy eating</Text>
        <Text style={styles.footerVersion}>Stock2Table v1.0.0</Text>
      </View>

      <View style={{ height: 100 }} />

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
            <TouchableOpacity style={styles.modalSaveBtn} onPress={() => { setShowDietaryModal(false); Alert.alert('Saved', 'Dietary preferences updated!'); }}>
              <Text style={styles.modalSaveBtnText}>Save Preferences</Text>
            </TouchableOpacity>
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
              <Text style={styles.aboutCopyright}>© 2026 Stock2Table. All rights reserved.</Text>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  heroSection: { height: 260, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '100%', justifyContent: 'flex-end', padding: 20, paddingBottom: 30 },
  avatarSection: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: 'white' },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'white' },
  userInfo: { flex: 1 },
  userName: { fontSize: 24, fontWeight: '800', color: 'white' },
  userEmail: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  tierBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginTop: 16 },
  tierText: { fontSize: 12, fontWeight: '800', color: 'white' },
  
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: 'white', marginHorizontal: 16, marginTop: -20, borderRadius: 16, padding: 20, elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8 },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: '800', color: '#22c55e' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  statDivider: { width: 1, height: 40, backgroundColor: '#e5e7eb' },
  
  section: { backgroundColor: 'white', margin: 16, marginBottom: 0, borderRadius: 16, padding: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937', marginBottom: 12 },
  addButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#22c55e', justifyContent: 'center', alignItems: 'center' },
  
  emptyFamily: { alignItems: 'center', padding: 24 },
  emptyFamilyText: { fontSize: 14, color: '#9ca3af', marginTop: 12, marginBottom: 16 },
  addFamilyBtn: { backgroundColor: '#f0fdf4', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  addFamilyBtnText: { fontSize: 14, fontWeight: '600', color: '#22c55e' },
  familyCard: { backgroundColor: '#f9fafb', borderRadius: 16, padding: 16, marginRight: 12, alignItems: 'center', minWidth: 100 },
  familyAvatar: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  familyName: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  familyAge: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  
  settingItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', gap: 14 },
  settingIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  settingInfo: { flex: 1 },
  settingText: { fontSize: 15, fontWeight: '600', color: '#1f2937' },
  settingDescription: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fef2f2', marginHorizontal: 16, marginTop: 16, paddingVertical: 16, borderRadius: 14, gap: 8 },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#ef4444' },
  
  footer: { alignItems: 'center', padding: 24 },
  footerText: { fontSize: 13, color: '#9ca3af' },
  footerVersion: { fontSize: 11, color: '#d1d5db', marginTop: 4 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#1f2937' },
  modalBody: { padding: 24, paddingTop: 12 },
  modalSaveBtn: { backgroundColor: '#22c55e', marginHorizontal: 24, marginBottom: 32, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  modalSaveBtnText: { fontSize: 16, fontWeight: '700', color: 'white' },
  
  dietaryItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  checkbox: { width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: '#d1d5db', justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  dietaryText: { fontSize: 16, color: '#1f2937', fontWeight: '500' },
  
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
