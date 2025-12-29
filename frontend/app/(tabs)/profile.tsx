import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useAppStore } from '../../store/appStore';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { familyMembers } = useAppStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <ScrollView style={styles.container}>
      {/* User Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          {user?.picture ? (
            <Image source={{ uri: user.picture }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={48} color="white" />
            </View>
          )}
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        
        <View style={styles.subscriptionBadge}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.subscriptionText}>
            {user?.subscription_tier.toUpperCase()}
          </Text>
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
            <Ionicons name="add" size={20} color="#4CAF50" />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
        
        {familyMembers.length === 0 ? (
          <Text style={styles.emptyText}>No family members added</Text>
        ) : (
          familyMembers.map((member) => (
            <View key={member.member_id} style={styles.familyCard}>
              <Ionicons name="person-circle" size={40} color="#4CAF50" />
              <View style={styles.familyInfo}>
                <Text style={styles.familyName}>{member.name}</Text>
                {member.age && (
                  <Text style={styles.familyDetail}>Age: {member.age}</Text>
                )}
                {member.dietary_restrictions.length > 0 && (
                  <Text style={styles.familyDetail}>
                    {member.dietary_restrictions.join(', ')}
                  </Text>
                )}
              </View>
            </View>
          ))
        )}
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        
        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="notifications-outline" size={24} color="#666" />
          <Text style={styles.settingText}>Notifications</Text>
          <Switch value={true} onValueChange={() => {}} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="language-outline" size={24} color="#666" />
          <Text style={styles.settingText}>Language</Text>
          <Text style={styles.settingValue}>English</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="help-circle-outline" size={24} color="#666" />
          <Text style={styles.settingText}>Help & Support</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="information-circle-outline" size={24} color="#666" />
          <Text style={styles.settingText}>About</Text>
          <Text style={styles.settingValue}>v1.0.0</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={24} color="#FF5252" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Made with ❤️ for healthy eating
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileSection: {
    backgroundColor: 'white',
    alignItems: 'center',
    padding: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  subscriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9C4',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  subscriptionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#F57F17',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 16,
  },
  familyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  familyInfo: {
    flex: 1,
  },
  familyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  familyDetail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  settingValue: {
    fontSize: 14,
    color: '#666',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF5252',
  },
  footer: {
    padding: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});
