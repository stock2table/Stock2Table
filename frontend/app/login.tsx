import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const { login } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Logo/Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="restaurant" size={80} color="#4CAF50" />
        </View>
        
        <Text style={styles.title}>Stock2Table</Text>
        <Text style={styles.subtitle}>AI-Powered Meal Planning</Text>
        
        <View style={styles.features}>
          <View style={styles.feature}>
            <Ionicons name="camera" size={24} color="#4CAF50" />
            <Text style={styles.featureText}>Scan Ingredients</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="nutrition" size={24} color="#4CAF50" />
            <Text style={styles.featureText}>Smart Recipes</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="calendar" size={24} color="#4CAF50" />
            <Text style={styles.featureText}>Meal Planning</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.loginButton}
          onPress={login}
          activeOpacity={0.8}
        >
          <Ionicons name="logo-google" size={24} color="white" style={styles.googleIcon} />
          <Text style={styles.loginButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        <Text style={styles.termsText}>
          By continuing, you agree to our Terms of Service
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 48,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 48,
  },
  feature: {
    alignItems: 'center',
  },
  featureText: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
  loginButton: {
    flexDirection: 'row',
    backgroundColor: '#4285F4',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  googleIcon: {
    marginRight: 12,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  termsText: {
    marginTop: 24,
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});
