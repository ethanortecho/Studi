import { useCallback, useEffect, useState } from 'react';
import { getApiUrl } from '@/config/api';
import { formatDateForAPI } from '@/utils/dateUtils';

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

// --- Hook -----------------------------------------------------
/**
 * Fetch the WeeklyGoal object for the ISO-week that starts on the provided date.
 *
 * The backend identifies a week via its Monday date (week_start). We normalise
 * any incoming date to Monday and query `/goals/weekly/?week_start=YYYY-MM-DD`.
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
      const authHeaders = {
        Authorization: `Basic ${btoa('ethanortecho:EthanVer2010!')}`,
      };
      const url = getApiUrl(`/goals/weekly/?week_start=${weekStartParam}&username=ethanortecho`);
      const response = await fetch(url, {
        credentials: 'include',
        headers: authHeaders,
      });
      if (response.status === 404) {
        setMissing(true);
        setGoal(null);
      } else if (!response.ok) {
        const txt = await response.text();
        throw new Error(`Error ${response.status}: ${txt}`);
      } else {
        const data = (await response.json()) as WeeklyGoal;
        setGoal(data);
      }
    } catch (err: any) {
      console.error('Failed to fetch weekly goal', err);
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