import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { View, ActivityIndicator, Text } from 'react-native';
import { hasCompletedOnboarding } from '../utils/onboarding';

/**
 * ROOT APP ENTRY POINT - ONBOARDING & AUTHENTICATION AWARE
 * 
 * This component handles the initial app routing logic:
 * - If user hasn't seen onboarding: redirect to onboarding
 * - If user is authenticated: redirect to main app
 * - If user is not authenticated: redirect to login
 * - Show loading while checking status
 * 
 * Flow: Onboarding → Auth → Main App
 */
export default function Index() {
  const { user, isLoading, accessToken } = useAuth();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  useEffect(() => {
    // Check onboarding status on mount
    const checkOnboardingStatus = async () => {
      try {
        const completed = await hasCompletedOnboarding();
        setOnboardingComplete(completed);
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // Default to not completed if we can't determine
        setOnboardingComplete(false);
      }
    };

    checkOnboardingStatus();
  }, []);

  useEffect(() => {
    // Handle routing once we have all the information we need
    if (onboardingComplete !== null && !isLoading) {
      if (!onboardingComplete) {
        // User hasn't completed onboarding, send them there first
        console.log('📚 Index: Onboarding not completed, redirecting to onboarding');
        router.replace('/onboarding');
      } else if (user && accessToken) {
        // User is authenticated, go to main app
        console.log('🏠 Index: User authenticated, redirecting to main app');
        router.replace('/(tabs)/home');
      } else {
        // User completed onboarding but not authenticated, go to login
        console.log('🔐 Index: User not authenticated, redirecting to login');
        router.replace('/auth/login');
      }
    }
  }, [user, accessToken, isLoading, onboardingComplete]);

  // Show loading while checking statuses
  return (
    <View className="flex-1 justify-center items-center bg-white">
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text className="mt-4 text-lg text-gray-600">
        Loading...
      </Text>
    </View>
  );
} 