import React, { useEffect } from 'react';
import { router, usePathname } from 'expo-router';
import { useWeeklyGoal } from '../hooks/useWeeklyGoal';

/**
 * This component handles the weekly goal redirect logic.
 * It must be used INSIDE the AuthProvider to have access to auth context.
 */
export function GoalRedirectWrapper({ children }: { children: React.ReactNode }) {
  const { missing: goalMissing, loading: goalLoading, refetch } = useWeeklyGoal();
  const pathname = usePathname();

  // Refetch when navigating away from goal screen (in case goal was just created)
  useEffect(() => {
    if (!pathname.startsWith('/screens/set-weekly-goal') && goalMissing) {
      refetch();
    }
  }, [pathname, goalMissing, refetch]);

  useEffect(() => {
    // Avoid redirect loop: if we are already on the goal screen, do not replace again
    const onGoalScreen = pathname.startsWith('/screens/set-weekly-goal');

    console.log('🎯 GoalRedirectWrapper: State check', {
      goalLoading,
      goalMissing,
      onGoalScreen,
      pathname
    });

    // Redirect when we're certain a goal is missing and not already on goal screen
    if (!goalLoading && goalMissing && !onGoalScreen) {
      console.log('🚀 GoalRedirectWrapper: Redirecting to goal setup');
      router.replace('/screens/set-weekly-goal' as any);
    }
  }, [goalMissing, goalLoading, pathname]);

  return <>{children}</>;
}