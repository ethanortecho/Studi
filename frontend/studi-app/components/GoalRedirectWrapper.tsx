import React, { useEffect, useState } from 'react';
import { router, usePathname } from 'expo-router';
import { useWeeklyGoal } from '@/hooks/useWeeklyGoal';

/**
 * This component handles the weekly goal redirect logic.
 * It must be used INSIDE the AuthProvider to have access to auth context.
 */
export function GoalRedirectWrapper({ children }: { children: React.ReactNode }) {
  const { missing: goalMissing, loading: goalLoading } = useWeeklyGoal();
  const pathname = usePathname();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // Avoid redirect loop: if we are already on the goal screen, do not replace again
    const onGoalScreen = pathname.startsWith('/screens/set-weekly-goal');
    
    // Only redirect once and when we're certain a goal is missing
    if (!goalLoading && goalMissing && !onGoalScreen && !hasRedirected) {
      setHasRedirected(true);
      router.replace('/screens/set-weekly-goal' as any);
    }
    
    // Reset redirect flag when user navigates away from goal screen and goal exists
    if (!goalMissing && onGoalScreen && hasRedirected) {
      setHasRedirected(false);
    }
  }, [goalMissing, goalLoading, pathname, hasRedirected]);

  return <>{children}</>;
}