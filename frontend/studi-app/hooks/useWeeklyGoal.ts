import { useCallback, useEffect, useState } from 'react';
import { getApiUrl } from '@/config/api';
import { formatDateForAPI } from '@/utils/dateUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

/**
 * AUTHENTICATION HELPER FOR GOAL API
 * 
 * Similar to our other API files, this makes authenticated requests
 * with automatic token refresh when needed.
 */
async function makeAuthenticatedGoalRequest(url: string, options: RequestInit = {}): Promise<Response> {
  // Get current access token
  const accessToken = await AsyncStorage.getItem('accessToken');
  
  if (!accessToken) {
    throw new Error('User not authenticated - please login');
  }

  // Make first attempt with current token
  let response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      ...options.headers,
    },
  });

  // If token expired (401), try to refresh and retry
  if (response.status === 401) {
    console.log('🔄 useWeeklyGoal: Access token expired, attempting refresh...');
    
    const refreshSuccessful = await refreshGoalToken();
    
    if (refreshSuccessful) {
      // Get new access token and retry
      const newAccessToken = await AsyncStorage.getItem('accessToken');
      if (newAccessToken) {
        console.log('🔄 useWeeklyGoal: Retrying request with new token...');
        response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${newAccessToken}`,
            ...options.headers,
          },
        });
      }
    } else {
      throw new Error('Authentication expired - please login again');
    }
  }

  return response;
}

/**
 * Token refresh helper for goal API
 */
async function refreshGoalToken(): Promise<boolean> {
  try {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      console.log('❌ useWeeklyGoal: No refresh token available');
      return false;
    }

    const response = await fetch(getApiUrl('/auth/refresh/'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      
      // Store new access token
      await AsyncStorage.setItem('accessToken', data.access);
      
      // Store new refresh token if provided (token rotation)
      if (data.refresh) {
        await AsyncStorage.setItem('refreshToken', data.refresh);
      }
      
      console.log('✅ useWeeklyGoal: Token refresh successful');
      return true;
    } else {
      console.log('❌ useWeeklyGoal: Refresh token expired');
      // Clear all auth data
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
      return false;
    }
  } catch (error) {
    console.error('❌ useWeeklyGoal: Token refresh failed:', error);
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
    return false;
  }
}

export function useWeeklyGoal(): WeeklyGoalState {
  const [goal, setGoal] = useState<WeeklyGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGoal = useCallback(async () => {
    setLoading(true);
    setMissing(false);
    setError(null);
    const monday = getCurrentMonday();
    const weekStartParam = formatDateForAPI(monday);
    
    try {
      console.log('📅 useWeeklyGoal: Fetching goal for week:', weekStartParam);
      
      // JWT tokens contain user identity - no need for username parameter
      const url = getApiUrl(`/goals/weekly/?week_start=${weekStartParam}`);
      const response = await makeAuthenticatedGoalRequest(url);
      
      if (response.status === 404) {
        console.log('📅 useWeeklyGoal: No goal found for this week');
        setMissing(true);
        setGoal(null);
      } else if (!response.ok) {
        const txt = await response.text();
        throw new Error(`Error ${response.status}: ${txt}`);
      } else {
        const data = (await response.json()) as WeeklyGoal;
        console.log('✅ useWeeklyGoal: Goal fetched successfully:', data);
        setGoal(data);
      }
    } catch (err: any) {
      console.error('❌ useWeeklyGoal: Failed to fetch weekly goal', err);
      setError(err.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoal();
  }, [fetchGoal]);

  return { goal, loading, missing, error, refetch: fetchGoal };
} 