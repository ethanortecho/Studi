import { useCallback, useEffect, useState } from 'react';
import { formatDateForAPI } from '../utils/dateUtils';
import { apiClient } from '../utils/apiClient';
import { useAuth } from '../contexts/AuthContext';

interface WeeklyGoal {
  id: number;
  week_start: string; // YYYY-MM-DD
  total_minutes: number;
  active_weekdays: number[];
  carry_over_enabled: boolean;
}

interface WeeklyGoalState {
  goal: WeeklyGoal | null;
  loading: boolean;
  missing: boolean;
  error: string | null;
  refetch: () => void;
}


// ISO‐week Monday helper (0=Sun, 1=Mon…)
function getCurrentMonday(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  // shift so that Monday is 0, Sunday 6, then subtract
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export type { WeeklyGoal };

export function useWeeklyGoal(): WeeklyGoalState {
  const [goal, setGoal] = useState<WeeklyGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  
  // Get authentication state
  const { user, isLoading: authLoading } = useAuth();

  const fetchGoal = useCallback(async () => {
    // Don't fetch if not authenticated
    if (!user) {
      console.log('⏸️ useWeeklyGoal: Skipping fetch - user not authenticated');
      setLoading(false);
      setMissing(false);
      setGoal(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Simply fetch the current week's goal - no navigation logic
      const monday = getCurrentMonday();
      const weekStartParam = formatDateForAPI(monday);

      // Use the new API client
      const response = await apiClient.get<WeeklyGoal>(
        `/goals/weekly/?week_start=${weekStartParam}`
      );

      if (response.status === 404) {
        // No goal for this week (but user may have goals for other weeks)
        setMissing(true);
        setGoal(null);
      } else if (response.error) {
        // Handle API errors
        if (response.error.code === 'AUTH_EXPIRED') {
          // Auth expired is handled by API client, just log it
          console.log('🔐 useWeeklyGoal: Authentication expired');
          setError('Please log in again');
        } else {
          throw new Error(response.error.message);
        }
      } else if (response.data) {
        setMissing(false);
        setGoal(response.data);
      }
    } catch (err: any) {
      console.error('❌ useWeeklyGoal: Failed to fetch weekly goal', err);
      setError(err.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Wait for auth to load, then fetch if user exists
    if (!authLoading) {
      if (user) {
        fetchGoal();
      } else {
        // User not authenticated, set appropriate state
        setLoading(false);
        setMissing(false);
        setGoal(null);
      }
    }
  }, [fetchGoal, authLoading, user]);

  return { goal, loading, missing, error, refetch: fetchGoal };
}

// No longer needed - goal setup completion is detected via API 