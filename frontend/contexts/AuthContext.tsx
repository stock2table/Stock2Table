import React, { createContext, useContext, useState, useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface User {
  user_id: string;
  email: string;
  name: string;
  picture?: string;
  subscription_tier: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  sessionToken: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    checkExistingSession();
  }, []);

  // Handle deep linking for mobile auth
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      await processAuthRedirect(event.url);
    };

    // Check for cold start (app opened from killed state)
    Linking.getInitialURL().then((url) => {
      if (url) {
        processAuthRedirect(url);
      }
    });

    // Listen for deep links when app is running
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, []);

  const checkExistingSession = async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      if (token) {
        setSessionToken(token);
        await fetchUserData(token);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = async (token: string) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
      await AsyncStorage.removeItem('session_token');
      setSessionToken(null);
      setUser(null);
    }
  };

  const processAuthRedirect = async (url: string) => {
    try {
      // Parse session_id from URL (supports both # and ?)
      const sessionId = 
        url.split('#session_id=')[1]?.split('&')[0] ||
        url.split('?session_id=')[1]?.split('&')[0];

      if (!sessionId) return;

      // Exchange session_id for session_token
      const response = await axios.post(
        `${BACKEND_URL}/api/auth/session`,
        {},
        { headers: { 'X-Session-ID': sessionId } }
      );

      const { session_token, email, name, picture, id } = response.data;

      // Store session token
      await AsyncStorage.setItem('session_token', session_token);
      setSessionToken(session_token);

      // Set user data
      await fetchUserData(session_token);

    } catch (error) {
      console.error('Auth redirect error:', error);
    }
  };

  const login = async () => {
    try {
      // Create platform-specific redirect URL
      const redirectUrl = Platform.OS === 'web'
        ? `${BACKEND_URL}/`
        : Linking.createURL('/');

      const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;

      if (Platform.OS === 'web') {
        // Web: direct redirect
        window.location.href = authUrl;
      } else {
        // Mobile: use WebBrowser
        const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
        
        if (result.type === 'success' && result.url) {
          await processAuthRedirect(result.url);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const logout = async () => {
    try {
      if (sessionToken) {
        await axios.post(
          `${BACKEND_URL}/api/auth/logout`,
          {},
          { headers: { Authorization: `Bearer ${sessionToken}` } }
        );
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await AsyncStorage.removeItem('session_token');
      setSessionToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, sessionToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
