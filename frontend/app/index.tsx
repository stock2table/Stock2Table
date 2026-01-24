import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [status, setStatus] = useState('Initializing...');

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      console.log('Index: checking auth status', { loading, user: !!user });
      setStatus(`Loading: ${loading}, User: ${user ? 'Yes' : 'No'}`);
      
      if (!loading) {
        try {
          if (user) {
            setStatus('User authenticated, checking onboarding...');
            // Check if user has completed onboarding
            const onboardingComplete = await AsyncStorage.getItem('onboarding_complete');
            console.log('Onboarding complete:', onboardingComplete);
            
            if (onboardingComplete === 'true') {
              setStatus('Navigating to home...');
              console.log('Navigating to tabs');
              router.replace('/(tabs)');
            } else {
              setStatus('Navigating to onboarding...');
              console.log('Navigating to onboarding');
              router.replace('/onboarding');
            }
          } else {
            setStatus('No user, going to login...');
            console.log('No user, navigating to login');
            router.replace('/login');
          }
        } catch (error) {
          console.error('Navigation error:', error);
          setStatus(`Error: ${error}`);
        }
        setCheckingOnboarding(false);
      }
    };

    // Add a small delay to ensure router is ready
    const timer = setTimeout(() => {
      checkOnboardingStatus();
    }, 100);

    return () => clearTimeout(timer);
  }, [user, loading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#22c55e" />
      <Text style={styles.text}>Loading...</Text>
      <Text style={[styles.text, { fontSize: 12, marginTop: 8, color: '#999' }]}>{status}</Text>
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
