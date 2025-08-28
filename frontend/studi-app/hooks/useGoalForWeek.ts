import { useCallback, useEffect, useState } from 'react';
import { getApiUrl } from '../config/api';
import { formatDateForAPI } from '../utils/dateUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Types ----------------------------------------------------
export interface WeeklyGoal {
  id: number;
  week_start: string; // YYYY-MM-DD (Monday)
  total_minutes: number;
  active_weekdays: number[];
  carry_over_enabled: boolean;
  accumulated_minutes: number;
  overtime_bank: number;
  daily_goals?: Array<{
    id: number;
    date: string; // YYYY-MM-DD
    target_minutes: number;
    accumulated_minutes: number;
    status: string;
  }>;
}

interface WeeklyGoalState {
  goal: WeeklyGoal | null;
  loading: boolean;
  missing: boolean; // true if 404 – no goal set for this week
  error: string | null;
  refetch: () => void;
}

// --- Helper ---------------------------------------------------
function ensureMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  // shift so Monday is 0 … Sunday 6
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// --- Authentication Helper -----------------------------------
/**
 * JWT Authentication helper for goal API calls
 * (Same pattern as other API files)
 */
async function makeAuthenticatedGoalRequest(url: string, options: RequestInit = {}): Promise<Response> {
  const accessToken = await AsyncStorage.getItem('accessToken');
  
  if (!accessToken) {
    throw new Error('User not authenticated - please login');
  }

  let response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      ...options.headers,
    },
  });

  // Handle token refresh if needed
  if (response.status === 401) {
    console.log('🔄 useGoalForWeek: Token expired, attempting refresh...');
    
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('Authentication expired - please login again');
    }

    const refreshResponse = await fetch(getApiUrl('/auth/refresh/'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (refreshResponse.ok) {
      const data = await refreshResponse.json();
      await AsyncStorage.setItem('accessToken', data.access);
      
      if (data.refresh) {
        await AsyncStorage.setItem('refreshToken', data.refresh);
      }
      
      // Retry original request
      const newAccessToken = await AsyncStorage.getItem('accessToken');
      response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${newAccessToken}`,
          ...options.headers,
        },
      });
    } else {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
      throw new Error('Authentication expired - please login again');
    }
  }

  return response;
}

// --- Hook -----------------------------------------------------
/**
 * Fetch the WeeklyGoal object for the ISO-week that starts on the provided date.
 *
 * The backend identifies a week via its Monday date (week_start). We normalise
 * any incoming date to Monday and query `/goals/weekly/?week_start=YYYY-MM-DD`.
 * 
 * UPDATED: Now uses JWT authentication instead of hardcoded Basic auth
 */
export function useGoalForWeek(weekStartDate: Date): WeeklyGoalState {
  const [goal, setGoal] = useState<WeeklyGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Normalise to Monday once so the memoised fetch URL stays stable.
  const monday = ensureMonday(weekStartDate);
  const weekStartParam = formatDateForAPI(monday);

  const fetchGoal = useCallback(async () => {
    setLoading(true);
    setMissing(false);
    setError(null);
    
    try {
      console.log('📅 useGoalForWeek: Fetching goal for week:', weekStartParam);
      
      // JWT tokens contain user identity - no need for username parameter
      const url = getApiUrl(`/goals/weekly/?week_start=${weekStartParam}`);
      const response = await makeAuthenticatedGoalRequest(url);
      
      if (response.status === 404) {
        console.log('📅 useGoalForWeek: No goal found for this week');
        setMissing(true);
        setGoal(null);
      } else if (!response.ok) {
        const txt = await response.text();
        throw new Error(`Error ${response.status}: ${txt}`);
      } else {
        const data = (await response.json()) as WeeklyGoal;
        console.log('✅ useGoalForWeek: Goal fetched successfully:', data);
        setGoal(data);
      }
    } catch (err: any) {
      console.error('❌ useGoalForWeek: Failed to fetch weekly goal', err);
      setError(err.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [weekStartParam]);

  // Fetch on mount & when the week changes
  useEffect(() => {
    fetchGoal();
  }, [fetchGoal]);

  return { goal, loading, missing, error, refetch: fetchGoal };
} 