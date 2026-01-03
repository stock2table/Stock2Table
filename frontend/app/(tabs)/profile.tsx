import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useAppStore } from '../../store/appStore';
import { LinearGradient } from 'expo-linear-gradient';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, sessionToken } = useAuth();
  const { familyMembers, fetchFamilyMembers, pantryItems, recipes, mealPlans } = useAppStore();

  useEffect(() => {
    if (sessionToken) {
      fetchFamilyMembers(sessionToken);
    }
  }, [sessionToken]);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          }
        }
      ]
    );
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'pro': return ['#f59e0b', '#d97706'];
      case 'premium': return ['#8b5cf6', '#7c3aed'];
      default: return ['#22c55e', '#16a34a'];
    }
  };

  const getDietaryIcon = (restriction: string) => {
    if (restriction.includes('vegetarian')) return 'leaf';
    if (restriction.includes('vegan')) return 'leaf';
    if (restriction.includes('gluten')) return 'warning';
    if (restriction.includes('lactose') || restriction.includes('dairy')) return 'water';
    if (restriction.includes('nut')) return 'alert-circle';
    return 'nutrition';
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Image source={{ uri: HERO_IMAGE }} style={styles.heroImage} />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.heroOverlay}>
          {/* Avatar */}
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
          
          {/* Subscription Badge */}
          <LinearGradient
            colors={getTierColor(user?.subscription_tier || 'free')}
            style={styles.tierBadge}
          >
            <Ionicons name="star" size={16} color="white" />
            <Text style={styles.tierText}>
              {(user?.subscription_tier || 'free').toUpperCase()}
            </Text>
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
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/add-family')}
          >
            <Ionicons name="add" size={20} color="white" />
          </TouchableOpacity>
        </View>
        
        {familyMembers.length === 0 ? (
          <View style={styles.emptyFamily}>
            <Ionicons name="people-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyFamilyText}>No family members yet</Text>
            <TouchableOpacity
              style={styles.addFamilyBtn}
              onPress={() => router.push('/add-family')}
            >
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
                
                {/* Dietary Icons */}
                {member.dietary_restrictions.length > 0 && (
                  <View style={styles.dietaryIcons}>
                    {member.dietary_restrictions.slice(0, 3).map((restriction, idx) => (
                      <View key={idx} style={styles.dietaryIcon}>
                        <Ionicons name={getDietaryIcon(restriction)} size={12} color="#6b7280" />
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        
        <TouchableOpacity style={styles.settingItem}>
          <View style={[styles.settingIcon, { backgroundColor: '#dbeafe' }]}>
            <Ionicons name="notifications" size={20} color="#3b82f6" />
          </View>
          <View style={styles.settingInfo}>
            <Text style={styles.settingText}>Notifications</Text>
            <Text style={styles.settingDescription}>Meal reminders & updates</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={[styles.settingIcon, { backgroundColor: '#dcfce7' }]}>
            <Ionicons name="nutrition" size={20} color="#22c55e" />
          </View>
          <View style={styles.settingInfo}>
            <Text style={styles.settingText}>Dietary Preferences</Text>
            <Text style={styles.settingDescription}>Allergies & restrictions</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={[styles.settingIcon, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="language" size={20} color="#f59e0b" />
          </View>
          <View style={styles.settingInfo}>
            <Text style={styles.settingText}>Language</Text>
            <Text style={styles.settingDescription}>English (US)</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={[styles.settingIcon, { backgroundColor: '#f3e8ff' }]}>
            <Ionicons name="help-circle" size={20} color="#8b5cf6" />
          </View>
          <View style={styles.settingInfo}>
            <Text style={styles.settingText}>Help & Support</Text>
            <Text style={styles.settingDescription}>FAQs & Contact us</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
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

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Made with ❤️ for healthy eating</Text>
        <Text style={styles.footerVersion}>Stock2Table v1.0.0</Text>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  // Hero
  heroSection: {
    height: 260,
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
    paddingBottom: 30,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'white',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
  },
  tierText: {
    fontSize: 12,
    fontWeight: '800',
    color: 'white',
  },
  // Stats
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 16,
    padding: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#22c55e',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e5e7eb',
  },
  // Section
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Family
  emptyFamily: {
    alignItems: 'center',
    padding: 24,
  },
  emptyFamilyText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 12,
    marginBottom: 16,
  },
  addFamilyBtn: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addFamilyBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22c55e',
  },
  familyCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 100,
  },
  familyAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  familyName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  familyAge: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  dietaryIcons: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 8,
  },
  dietaryIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Settings
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 14,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
  },
  settingText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  settingDescription: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  // Footer
  footer: {
    alignItems: 'center',
    padding: 24,
  },
  footerText: {
    fontSize: 13,
    color: '#9ca3af',
  },
  footerVersion: {
    fontSize: 11,
    color: '#d1d5db',
    marginTop: 4,
  },
});
