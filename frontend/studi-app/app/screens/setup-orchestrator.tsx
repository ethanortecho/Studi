import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { router } from 'expo-router';
import { apiClient } from '../../utils/apiClient';

/**
 * Setup Orchestrator
 *
 * This component handles the sequential setup flow for new users.
 * It checks what setup steps are needed and redirects accordingly.
 *
 * Setup order:
 * 1. Weekly Goals (required)
 * 2. Categories/Subjects (required)
 * 3. Home (when all setup is complete)
 */
export default function SetupOrchestrator() {
  const [loading, setLoading] = useState(true);
  const [checkingRequirements, setCheckingRequirements] = useState('Checking setup requirements...');

  useEffect(() => {
    checkSetupRequirements();
  }, []);

  const checkSetupRequirements = async () => {
    try {
      // Step 1: Check if user has goals
      setCheckingRequirements('Checking goals...');
      const goalsResponse = await apiClient.get<{ has_goals: boolean }>('/goals/has-goals/');

      if (goalsResponse.data && !goalsResponse.data.has_goals) {
        console.log('🎯 SetupOrchestrator: User needs goal setup');
        router.replace('/screens/set-weekly-goal' as any);
        return;
      }

      // Step 2: Check if user has categories (only if goals exist)
      setCheckingRequirements('Checking categories...');
      const categoriesResponse = await apiClient.get<any[]>('/category-list/');

      if (categoriesResponse.data && categoriesResponse.data.length === 0) {
        console.log('📚 SetupOrchestrator: User needs category setup');
        router.replace('/screens/manage-categories?setup=true' as any);
        return;
      }

      // Step 3: All setup complete - go to home
      console.log('✅ SetupOrchestrator: All setup complete, going to home');
      router.replace('/(tabs)/home');

    } catch (error) {
      console.error('❌ SetupOrchestrator: Error checking requirements:', error);
      // On error, go to home and let individual screens handle their requirements
      router.replace('/(tabs)/home');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking
  return (
    <View className="flex-1 justify-center items-center bg-background">
      <ActivityIndicator size="large" color="#5D3EDA" />
      <Text className="mt-4 text-lg text-secondaryText">
        {checkingRequirements}
      </Text>
    </View>
  );
}