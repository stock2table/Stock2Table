import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!loading) {
        if (user) {
          // Check if user has completed onboarding
          const onboardingComplete = await AsyncStorage.getItem('onboarding_complete');
          
          if (onboardingComplete === 'true') {
            router.replace('/(tabs)');
          } else {
            // New user - show onboarding
            router.replace('/onboarding');
          }
        } else {
          router.replace('/login');
        }
        setCheckingOnboarding(false);
      }
    };

    checkOnboardingStatus();
  }, [user, loading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#22c55e" />
      <Text style={styles.text}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});
