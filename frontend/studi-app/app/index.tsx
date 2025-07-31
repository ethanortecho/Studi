import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { View, ActivityIndicator, Text } from 'react-native';

/**
 * ROOT APP ENTRY POINT - AUTHENTICATION AWARE
 * 
 * This component handles the initial app routing logic:
 * - If user is authenticated: redirect to main app
 * - If user is not authenticated: redirect to login
 * - Show loading while checking authentication status
 * 
 * This fixes the "unmatched route" issue by ensuring proper
 * authentication-based routing from app startup.
 */
export default function Index() {
  const { user, isLoading, accessToken } = useAuth();

  useEffect(() => {
    // Auth state change

    if (!isLoading) {
      if (user && accessToken) {
        // User is authenticated, go to main app
        console.log('🏠 Index: User authenticated, redirecting to main app');
        router.replace('/(tabs)/home');
      } else {
        // User is not authenticated, go to login
        console.log('🔐 Index: User not authenticated, redirecting to login');
        router.replace('/auth/login');
      }
    }
  }, [user, accessToken, isLoading]);

  // Show loading while checking authentication
  return (
    <View className="flex-1 justify-center items-center bg-white">
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text className="mt-4 text-lg text-gray-600">
        Checking authentication...
      </Text>
    </View>
  );
} 