import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function Logo({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) {
  const sizes = {
    small: { container: 32, icon: 18, text: 14 },
    medium: { container: 48, icon: 28, text: 20 },
    large: { container: 80, icon: 48, text: 32 }
  };

  const { container, icon, text } = sizes[size];

  return (
    <View style={styles.logoContainer}>
      <LinearGradient
        colors={['#8b5cf6', '#ec4899']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.logoCircle, { width: container, height: container, borderRadius: container / 2 }]}
      >
        <Ionicons name="restaurant" size={icon} color="white" />
      </LinearGradient>
      <Text style={[styles.logoText, { fontSize: text }]}>Stock2Table</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  logoText: {
    fontWeight: '800',
    color: '#1f2937',
  },
});
