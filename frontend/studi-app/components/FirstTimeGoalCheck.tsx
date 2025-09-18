import React, { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../utils/apiClient';

/**
 * Simple one-time check for first-time users who need goal setup.
 * This runs ONCE when a user logs in and never again.
 */
export function FirstTimeGoalCheck({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [hasChecked, setHasChecked] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Only check once when user is authenticated and we haven't checked yet
    if (!authLoading && user && !hasChecked) {
      checkFirstTimeUser();
    }
  }, [authLoading, user, hasChecked]);

  const checkFirstTimeUser = async () => {
    // Prevent multiple checks
    if (isRedirecting) return;

    try {
      console.log('🎯 FirstTimeGoalCheck: Checking if user needs goal setup...');
      setHasChecked(true); // Mark as checked immediately to prevent re-runs

      const response = await apiClient.get<{ has_goals: boolean }>('/goals/has-goals/');

      if (response.data && !response.data.has_goals) {
        console.log('🚀 FirstTimeGoalCheck: First-time user detected, redirecting to goal setup');
        setIsRedirecting(true);
        router.replace('/screens/set-weekly-goal' as any);
      } else {
        console.log('✅ FirstTimeGoalCheck: User has goals, no redirect needed');
      }
    } catch (error) {
      console.error('❌ FirstTimeGoalCheck: Error checking goals:', error);
    }
  };

  return <>{children}</>;
}