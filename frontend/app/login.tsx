import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Logo from '../components/Logo';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const { login } = useAuth();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#8b5cf6', '#6366f1', '#ec4899']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Decorative circles */}
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />

        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoSection}>
            <Logo size="large" />
            <Text style={styles.tagline}>AI-Powered Meal Planning</Text>
          </View>

          {/* Hero Image */}
          <View style={styles.heroSection}>
            <View style={styles.featureCard}>
              <View style={styles.featureIconCircle}>
                <Ionicons name="camera" size={32} color="#8b5cf6" />
              </View>
              <Text style={styles.featureTitle}>Smart Scanner</Text>
              <Text style={styles.featureDesc}>AI identifies ingredients instantly</Text>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.featureIconCircle}>
                <Ionicons name="sparkles" size={32} color="#ec4899" />
              </View>
              <Text style={styles.featureTitle}>Recipe Magic</Text>
              <Text style={styles.featureDesc}>Get personalized meal ideas</Text>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.featureIconCircle}>
                <Ionicons name="calendar" size={32} color="#f59e0b" />
              </View>
              <Text style={styles.featureTitle}>Meal Planning</Text>
              <Text style={styles.featureDesc}>Plan your week effortlessly</Text>
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={login}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#ffffff', '#f9fafb']}
              style={styles.loginGradient}
            >
              <Image
                source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg' }}
                style={styles.googleIcon}
              />
              <Text style={styles.loginText}>Continue with Google</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.termsText}>
            By continuing, you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text>
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  circle1: { width: 300, height: 300, top: -100, right: -50 },
  circle2: { width: 200, height: 200, bottom: 100, left: -50 },
  circle3: { width: 150, height: 150, top: 200, left: 50 },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 32,
    paddingTop: 80,
    paddingBottom: 48,
  },
  logoSection: {
    alignItems: 'center',
  },
  tagline: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.95)',
    marginTop: 16,
    fontWeight: '600',
  },
  heroSection: {
    gap: 16,
  },
  featureCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  featureIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    flex: 1,
  },
  featureDesc: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
    position: 'absolute',
    left: 104,
    bottom: 24,
  },
  loginButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  loginGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  googleIcon: {
    width: 24,
    height: 24,
  },
  loginText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  termsText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 16,
  },
  termsLink: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
