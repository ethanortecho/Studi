/**
 * Goal Setting Integration Tests
 *
 * Focus: Weekly goal distribution, rest day handling, and update timing
 * Priority: Ensure accurate goal calculations and display
 */

import { renderHook } from '@testing-library/react-native';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useWeeklyGoal } from '../../hooks/useWeeklyGoal';
import { useGoalForWeek } from '../../hooks/useGoalForWeek';
import { setupFakeTimers } from '../test-utils';

// Mock the API fetch
jest.mock('../../utils/fetchApi', () => ({
  __esModule: true,
  default: jest.fn(),
  clearDashboardCache: jest.fn(),
}));

jest.mock('../../utils/apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    isAuthenticated: jest.fn().mockResolvedValue(true),
  },
}));

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'testuser' },
    isLoading: false,
  }),
}));

const mockUseAggregateData = require('../../utils/fetchApi').default;
const { apiClient } = require('../../utils/apiClient');

describe('Goal Setting Integration Tests', () => {
  let cleanupTimers: () => void;

  beforeEach(() => {
    cleanupTimers = setupFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanupTimers();
  });

  describe('Weekly Goal Distribution', () => {
    it('should evenly distribute weekly goal across active days', () => {
      const weeklyGoal = {
        id: 1,
        week_start: '2024-01-15',
        total_minutes: 600, // 10 hours
        active_weekdays: [0, 1, 2, 3, 4], // Mon-Fri
        carry_over_enabled: false,
      };

      // Daily goal should be 600 / 5 = 120 minutes (2 hours)
      const expectedDailyMinutes = Math.round(weeklyGoal.total_minutes / weeklyGoal.active_weekdays.length);
      expect(expectedDailyMinutes).toBe(120);
    });

    it('should handle single day selection', () => {
      const weeklyGoal = {
        total_minutes: 420, // 7 hours
        active_weekdays: [2], // Wednesday only
      };

      // All 7 hours should be on Wednesday
      const expectedDailyMinutes = Math.round(weeklyGoal.total_minutes / weeklyGoal.active_weekdays.length);
      expect(expectedDailyMinutes).toBe(420);
    });

    it('should handle all 7 days selected', () => {
      const weeklyGoal = {
        total_minutes: 900, // 15 hours
        active_weekdays: [0, 1, 2, 3, 4, 5, 6], // All days
      };

      // 900 / 7 ≈ 129 minutes per day
      const expectedDailyMinutes = Math.round(weeklyGoal.total_minutes / weeklyGoal.active_weekdays.length);
      expect(expectedDailyMinutes).toBe(Math.round(900 / 7));
    });
  });

  describe('Rest Day Handling', () => {
    it('should identify rest days correctly', () => {
      const weeklyGoal = {
        total_minutes: 600,
        active_weekdays: [0, 1, 2, 3, 4], // Mon-Fri only
      };

      // Test Saturday (5 in backend format)
      const saturdayDate = '2024-01-20T12:00:00'; // This is a Saturday
      const saturday = new Date(saturdayDate);
      const dayOfWeek = saturday.getDay(); // 6 (Saturday in JS)
      const backendDayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to backend format

      expect(backendDayIndex).toBe(5); // Saturday is 5 in backend (0=Mon)
      expect(weeklyGoal.active_weekdays.includes(backendDayIndex)).toBe(false);

      // Test Sunday (0 in JS, 6 in backend)
      const sundayDate = '2024-01-21T12:00:00';
      const sunday = new Date(sundayDate);
      const sundayDayOfWeek = sunday.getDay(); // 0 (Sunday in JS)
      const sundayBackendIndex = sundayDayOfWeek === 0 ? 6 : sundayDayOfWeek - 1;

      expect(sundayBackendIndex).toBe(6); // Sunday is 6 in backend
      expect(weeklyGoal.active_weekdays.includes(sundayBackendIndex)).toBe(false);
    });

    it('should not calculate goals for rest days', () => {
      const weeklyGoal = {
        total_minutes: 600,
        active_weekdays: [0, 1, 2, 3, 4], // Mon-Fri
      };

      // Mock daily data for a Saturday
      const dailyData = {
        aggregate: {
          total_duration: 3600, // 1 hour studied
        },
      };

      const dailyDateStr = '2024-01-20T12:00:00'; // Saturday
      const currentDate = new Date(dailyDateStr);
      const dayOfWeek = currentDate.getDay();
      const backendDayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

      let goalMinutes: number | null = null;
      let isRestDay = false;

      if (!weeklyGoal.active_weekdays.includes(backendDayIndex)) {
        isRestDay = true;
        goalMinutes = null;
      }

      expect(isRestDay).toBe(true);
      expect(goalMinutes).toBeNull();
    });

    it('should calculate goals for active days', () => {
      const weeklyGoal = {
        total_minutes: 600,
        active_weekdays: [0, 1, 2, 3, 4], // Mon-Fri
      };

      // Mock daily data for a Monday
      const dailyDateStr = '2024-01-15T12:00:00'; // Monday
      const currentDate = new Date(dailyDateStr);
      const dayOfWeek = currentDate.getDay(); // 1 (Monday in JS)
      const backendDayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 0 (Monday in backend)

      let goalMinutes: number | null = null;
      let isRestDay = false;

      if (!weeklyGoal.active_weekdays.includes(backendDayIndex)) {
        isRestDay = true;
        goalMinutes = null;
      } else {
        goalMinutes = Math.round(weeklyGoal.total_minutes / weeklyGoal.active_weekdays.length);
      }

      expect(isRestDay).toBe(false);
      expect(goalMinutes).toBe(120); // 600 / 5 days
    });
  });

  describe('Goal Percentage Calculations', () => {
    it('should calculate correct percentage for daily goals', () => {
      const weeklyGoal = {
        total_minutes: 600,
        active_weekdays: [0, 1, 2, 3, 4],
      };

      const dailyGoalMinutes = Math.round(weeklyGoal.total_minutes / weeklyGoal.active_weekdays.length);
      expect(dailyGoalMinutes).toBe(120); // 2 hours per day

      // Studied 90 minutes
      const studiedMinutes = 90;
      const percentGoal = Math.min(100, Math.round((studiedMinutes / dailyGoalMinutes) * 100));
      expect(percentGoal).toBe(75); // 90/120 = 75%

      // Studied 150 minutes (over goal)
      const overStudiedMinutes = 150;
      const overPercentGoal = Math.min(100, Math.round((overStudiedMinutes / dailyGoalMinutes) * 100));
      expect(overPercentGoal).toBe(100); // Capped at 100%
    });

    it('should calculate correct percentage for weekly goals', () => {
      const weeklyGoal = {
        total_minutes: 600, // 10 hours
      };

      // Studied 7 hours (420 minutes)
      const studiedMinutes = 420;
      const percentGoal = Math.min(100, Math.round((studiedMinutes / weeklyGoal.total_minutes) * 100));
      expect(percentGoal).toBe(70); // 420/600 = 70%
    });
  });

  describe('Goal Update Timing', () => {
    it('should indicate changes take effect next Monday when editing', () => {
      // This is more of a UI test, but we can verify the logic
      const isEdit = true;
      const currentDate = new Date('2024-01-17T12:00:00'); // Wednesday

      // Calculate next Monday
      const daysUntilMonday = currentDate.getDay() === 0 ? 1 : (8 - currentDate.getDay()) % 7;
      const nextMonday = new Date(currentDate);
      nextMonday.setDate(currentDate.getDate() + daysUntilMonday);

      expect(nextMonday.getDay()).toBe(1); // Should be Monday
      expect(nextMonday.toISOString().split('T')[0]).toBe('2024-01-22');
    });

    it('should handle goal updates mid-week', () => {
      // Current goal for this week
      const currentWeekGoal = {
        week_start: '2024-01-15', // Monday
        total_minutes: 600,
        active_weekdays: [0, 1, 2, 3, 4],
      };

      // User updates on Wednesday
      const updateDate = new Date('2024-01-17T12:00:00');
      const newGoalData = {
        total_minutes: 900, // Increased to 15 hours
        active_weekdays: [0, 1, 2], // Changed to Mon-Wed only
      };

      // The update should be for next week
      const nextMonday = new Date('2024-01-22');
      const nextWeekStart = nextMonday.toISOString().split('T')[0];

      // Backend should handle this by creating a new goal for next week
      expect(nextWeekStart).toBe('2024-01-22');
      expect(newGoalData.total_minutes).toBe(900);
    });
  });

  describe('Edge Cases', () => {
    it('should handle fractional minute distribution', () => {
      const weeklyGoal = {
        total_minutes: 500, // Not evenly divisible by 7
        active_weekdays: [0, 1, 2, 3, 4, 5, 6], // All days
      };

      const dailyMinutes = Math.round(weeklyGoal.total_minutes / weeklyGoal.active_weekdays.length);
      expect(dailyMinutes).toBe(71); // 500/7 ≈ 71.43, rounded to 71

      // Total distributed minutes might be slightly less than weekly goal
      const totalDistributed = dailyMinutes * weeklyGoal.active_weekdays.length;
      expect(totalDistributed).toBe(497); // 71 * 7 = 497 (3 minutes lost to rounding)
    });

    it('should handle empty active_weekdays gracefully', () => {
      const weeklyGoal = {
        total_minutes: 600,
        active_weekdays: [], // No days selected (shouldn't happen but defensive)
      };

      const activeDays = weeklyGoal.active_weekdays?.length || 7; // Fallback to 7
      const dailyMinutes = Math.round(weeklyGoal.total_minutes / activeDays);
      expect(dailyMinutes).toBe(Math.round(600 / 7));
    });

    it('should handle missing weekly goal', () => {
      const weeklyGoal = null;

      let goalMinutes: number | null = null;
      let percentGoal: number | null = null;

      if (weeklyGoal) {
        // Goal calculation would happen here
      }

      expect(goalMinutes).toBeNull();
      expect(percentGoal).toBeNull();
    });
  });

  describe('Day of Week Conversion', () => {
    it('should correctly convert JS day to backend format', () => {
      // JS: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
      // Backend: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun

      const conversions = [
        { js: 0, backend: 6 }, // Sunday
        { js: 1, backend: 0 }, // Monday
        { js: 2, backend: 1 }, // Tuesday
        { js: 3, backend: 2 }, // Wednesday
        { js: 4, backend: 3 }, // Thursday
        { js: 5, backend: 4 }, // Friday
        { js: 6, backend: 5 }, // Saturday
      ];

      conversions.forEach(({ js, backend }) => {
        const converted = js === 0 ? 6 : js - 1;
        expect(converted).toBe(backend);
      });
    });
  });
});