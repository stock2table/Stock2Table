import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

const HERO_IMAGE = 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=800&q=80';
const FEATURE_IMAGES = {
  scan: 'https://images.unsplash.com/photo-1620706857370-e1b9770e8bb1?w=400&q=80',
  recipe: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
  plan: 'https://images.unsplash.com/photo-1493770348161-369560ae357d?w=400&q=80',
};

export default function LoginScreen() {
  const { login } = useAuth();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 20, friction: 7, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 20, friction: 7, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Background Image */}
      <Image source={{ uri: HERO_IMAGE }} style={styles.backgroundImage} />
      
      {/* Gradient Overlay */}
      <LinearGradient
        colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.95)']}
        style={styles.gradientOverlay}
        locations={[0, 0.5, 1]}
      />

      <Animated.View 
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}
      >
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.logoGradient}>
              <Ionicons name="leaf" size={32} color="white" />
            </LinearGradient>
          </View>
          <Text style={styles.appName}>Stock2Table</Text>
          <Text style={styles.tagline}>From Pantry to Plate, Perfectly</Text>
        </View>

        {/* Feature Cards */}
        <Animated.View style={[styles.featuresSection, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.featureRow}>
            <View style={styles.featureCard}>
              <Image source={{ uri: FEATURE_IMAGES.scan }} style={styles.featureImage} />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.featureOverlay}>
                <Ionicons name="camera" size={24} color="white" />
                <Text style={styles.featureTitle}>AI Scanner</Text>
              </LinearGradient>
            </View>
            
            <View style={styles.featureCard}>
              <Image source={{ uri: FEATURE_IMAGES.recipe }} style={styles.featureImage} />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.featureOverlay}>
                <Ionicons name="restaurant" size={24} color="white" />
                <Text style={styles.featureTitle}>Smart Recipes</Text>
              </LinearGradient>
            </View>
            
            <View style={styles.featureCard}>
              <Image source={{ uri: FEATURE_IMAGES.plan }} style={styles.featureImage} />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.featureOverlay}>
                <Ionicons name="calendar" size={24} color="white" />
                <Text style={styles.featureTitle}>Meal Plans</Text>
              </LinearGradient>
            </View>
          </View>
        </Animated.View>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>150+</Text>
              <Text style={styles.statLabel}>Recipes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>AI</Text>
              <Text style={styles.statLabel}>Powered</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>10+</Text>
              <Text style={styles.statLabel}>Cuisines</Text>
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={login}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#22c55e', '#16a34a']}
              style={styles.loginGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Image
                source={{ uri: 'https://www.google.com/favicon.ico' }}
                style={styles.googleIcon}
              />
              <Text style={styles.loginText}>Continue with Google</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Terms */}
          <Text style={styles.termsText}>
            By continuing, you agree to our{' '}
            <Text style={styles.termsLink}>Terms</Text> &{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000' 
  },
  backgroundImage: {
    position: 'absolute',
    width: width,
    height: height,
    resizeMode: 'cover',
  },
  gradientOverlay: {
    position: 'absolute',
    width: width,
    height: height,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 80,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  logoSection: {
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoGradient: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
    fontWeight: '500',
  },
  featuresSection: {
    marginVertical: 32,
  },
  featureRow: {
    flexDirection: 'row',
    gap: 12,
  },
  featureCard: {
    flex: 1,
    height: 160,
    borderRadius: 20,
    overflow: 'hidden',
  },
  featureImage: {
    width: '100%',
    height: '100%',
  },
  featureOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
    marginTop: 6,
    textAlign: 'center',
  },
  bottomSection: {
    gap: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingVertical: 16,
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
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  loginButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  loginGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    gap: 12,
  },
  googleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  loginText: {
    fontSize: 17,
    fontWeight: '700',
    color: 'white',
  },
  termsText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
  termsLink: {
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
});
