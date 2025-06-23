import { useCallback, useEffect, useState } from 'react';
import { getApiUrl } from '@/config/api';
import { formatDateForAPI } from '@/utils/dateUtils';

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

  const fetchGoal = useCallback(async () => {
    setLoading(true);
    setMissing(false);
    setError(null);
    const monday = getCurrentMonday();
    const weekStartParam = formatDateForAPI(monday);
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
  }, []);

  useEffect(() => {
    fetchGoal();
  }, [fetchGoal]);

  return { goal, loading, missing, error, refetch: fetchGoal };
} 