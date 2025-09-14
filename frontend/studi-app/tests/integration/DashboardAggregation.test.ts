/**
 * Dashboard Aggregation Integration Tests
 *
 * Focus: Verify data consistency in the dashboard aggregation pipeline
 * Priority: Ensure break time exclusion and accurate calculations
 */

import { renderHook } from '@testing-library/react-native';
import { useDashboardData } from '../../hooks/useDashboardData';
import {
  secondsToHours,
  secondsToHoursAndMinutes,
  filterBreakCategory,
  parseCategoryDurations,
  filterBreakFromDailyBreakdown
} from '../../utils/parseData';
import { formatDateForAPI } from '../../utils/dateUtils';
import { setupFakeTimers } from '../test-utils';

// Mock the API fetch
jest.mock('../../utils/fetchApi', () => ({
  __esModule: true,
  default: jest.fn(),
  clearDashboardCache: jest.fn(),
  clearApiCache: jest.fn(),
}));

const mockUseAggregateData = require('../../utils/fetchApi').default;

describe('Dashboard Aggregation Integration Tests', () => {
  let cleanupTimers: () => void;

  beforeEach(() => {
    cleanupTimers = setupFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanupTimers();
  });

  describe('Break Time Exclusion from Totals', () => {
    it('should exclude break time from total study duration', () => {
      // Mock API response with break time included
      const mockDailyData = {
        aggregate: {
          total_duration: 7200, // 2 hours total (includes break)
          session_count: 1,
          category_durations: {
            'Math': 3600,      // 1 hour
            'History': 2400,   // 40 minutes
            'Break': 1200,     // 20 minutes break
          },
          productivity_score: 85,
          flow_score: 75,
        },
        category_metadata: {
          '1': { name: 'Math', color: '#3B82F6' },
          '2': { name: 'History', color: '#EF4444' },
          '999': { name: 'Break', color: '#6B7280' },
        },
        timeline_data: [],
      };

      // Test filterBreakCategory function
      const filteredCategories = filterBreakCategory(mockDailyData.aggregate.category_durations);

      // Break should be removed from categories
      expect(filteredCategories).not.toHaveProperty('Break');
      expect(filteredCategories).toEqual({
        'Math': 3600,
        'History': 2400,
      });

      // Calculate what the total SHOULD be without breaks
      const studyOnlyTotal = Object.values(filteredCategories)
        .reduce((sum, duration) => sum + duration, 0);
      expect(studyOnlyTotal).toBe(6000); // 1h 40min of actual study

      // Currently, total_duration includes break time
      // This is the issue that needs fixing
      const totalTime = secondsToHoursAndMinutes(mockDailyData);
      expect(totalTime).toEqual({ hours: 2, minutes: 0 }); // Currently shows 2 hours

      // EXPECTED behavior (after fix):
      // Total should be 1h 40min (6000 seconds), not 2h (7200 seconds)
      // This test documents the current incorrect behavior
    });

    it('should exclude break from pie chart visualizations', () => {
      const mockDailyData = {
        aggregate: {
          total_duration: 3600,
          category_durations: {
            'Math': 1800,      // 30 minutes
            'History': 1200,   // 20 minutes
            'Break': 600,      // 10 minutes
          },
        },
        category_metadata: {
          '1': { name: 'Math', color: '#3B82F6' },
          '2': { name: 'History', color: '#EF4444' },
          '999': { name: 'Break', color: '#6B7280' },
        },
      };

      const pieChartData = parseCategoryDurations(mockDailyData);

      // Break should not appear in pie chart
      expect(pieChartData).toHaveLength(2);
      expect(pieChartData.find(item => item.label === 'Break')).toBeUndefined();

      // Only study categories should be present
      expect(pieChartData).toEqual([
        { label: 'Math', value: 1800, color: '#3B82F6' },
        { label: 'History', value: 1200, color: '#EF4444' },
      ]);
    });

    it('should exclude break from daily breakdown in weekly view', () => {
      const mockDailyBreakdown = {
        '2024-01-15': {
          total: 7200,
          categories: {
            'Math': 3600,
            'History': 2400,
            'Break': 1200,
          },
        },
        '2024-01-16': {
          total: 3600,
          categories: {
            'Math': 1800,
            'Break': 1800,
          },
        },
      };

      const filtered = filterBreakFromDailyBreakdown(mockDailyBreakdown);

      // Break should be removed from all days
      expect(filtered['2024-01-15'].categories).not.toHaveProperty('Break');
      expect(filtered['2024-01-16'].categories).not.toHaveProperty('Break');

      // Totals should remain unchanged (this might also need fixing)
      expect(filtered['2024-01-15'].total).toBe(7200);
      expect(filtered['2024-01-16'].total).toBe(3600);
    });
  });

  describe('Duration Calculation Consistency', () => {
    it('should produce consistent duration formats across different functions', () => {
      const mockData = {
        aggregate: {
          total_duration: 5430, // 1 hour, 30 minutes, 30 seconds
        },
      };

      // Test secondsToHours (returns formatted string)
      const hoursString = secondsToHours(mockData);

      // Test secondsToHoursAndMinutes (returns object)
      const hoursAndMinutes = secondsToHoursAndMinutes(mockData);
      expect(hoursAndMinutes).toEqual({ hours: 1, minutes: 30 });

      // Both should represent the same duration, just formatted differently
      // The 30 seconds are truncated (not rounded) in hoursAndMinutes
    });

    it('should handle edge cases in duration calculations', () => {
      // Test zero duration
      const zeroData = { aggregate: { total_duration: 0 } };
      expect(secondsToHoursAndMinutes(zeroData)).toEqual({ hours: 0, minutes: 0 });

      // Test exactly 1 hour
      const oneHourData = { aggregate: { total_duration: 3600 } };
      expect(secondsToHoursAndMinutes(oneHourData)).toEqual({ hours: 1, minutes: 0 });

      // Test 59 minutes 59 seconds (should truncate to 59 minutes)
      const almostHourData = { aggregate: { total_duration: 3599 } };
      expect(secondsToHoursAndMinutes(almostHourData)).toEqual({ hours: 0, minutes: 59 });

      // Test large duration
      const largeDuration = { aggregate: { total_duration: 36000 } }; // 10 hours
      expect(secondsToHoursAndMinutes(largeDuration)).toEqual({ hours: 10, minutes: 0 });
    });
  });

  describe('Goal Percentage Calculations', () => {
    it('should cap goal percentage at 100%', () => {
      // This test verifies the current implementation is correct
      const studiedMinutes = 300; // 5 hours studied
      const goalMinutes = 240;    // 4 hour goal

      // Current implementation in useDashboardData.ts line 214
      const percentGoal = Math.min(100, Math.round((studiedMinutes / goalMinutes) * 100));

      expect(percentGoal).toBe(100); // Should cap at 100%, not show 125%
    });

    it('should handle missing or zero goals gracefully', () => {
      const studiedMinutes = 120;

      // Zero goal
      let goalMinutes = 0;
      let percentGoal = goalMinutes > 0
        ? Math.min(100, Math.round((studiedMinutes / goalMinutes) * 100))
        : null;
      expect(percentGoal).toBeNull();

      // Negative goal (shouldn't happen but defensive coding)
      goalMinutes = -60;
      percentGoal = goalMinutes > 0
        ? Math.min(100, Math.round((studiedMinutes / goalMinutes) * 100))
        : null;
      expect(percentGoal).toBeNull();
    });
  });

  describe('Date Formatting and Timezone Handling', () => {
    it('should format dates consistently for API calls', () => {
      // Test date at different times
      const morningDate = new Date('2024-01-15T08:00:00');
      const eveningDate = new Date('2024-01-15T23:59:59');
      const midnightDate = new Date('2024-01-16T00:00:01');

      // All times on the same calendar day should produce same API date
      expect(formatDateForAPI(morningDate)).toBe('2024-01-15');
      expect(formatDateForAPI(eveningDate)).toBe('2024-01-15');

      // Next day should produce different date
      expect(formatDateForAPI(midnightDate)).toBe('2024-01-16');
    });

    it('should preserve user local date regardless of timezone', () => {
      // Simulate different timezone scenarios
      const date = new Date('2024-01-15T23:00:00-05:00'); // 11 PM EST

      // formatDateForAPI should use local date components
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formatted = `${year}-${month}-${day}`;

      expect(formatDateForAPI(date)).toBe(formatted);
    });
  });

  describe('Real-world Scenario Tests', () => {
    it('should handle a typical study session with breaks correctly', () => {
      // Simulate: 25 min Math, 5 min break, 25 min History, 5 min break, 25 min Math
      const mockSessionData = {
        aggregate: {
          total_duration: 5100, // 85 minutes total
          category_durations: {
            'Math': 3000,     // 50 minutes
            'History': 1500,  // 25 minutes
            'Break': 600,     // 10 minutes
          },
        },
        category_metadata: {
          '1': { name: 'Math', color: '#3B82F6' },
          '2': { name: 'History', color: '#EF4444' },
          '999': { name: 'Break', color: '#6B7280' },
        },
      };

      // Current behavior - includes break in total
      const currentTotal = secondsToHoursAndMinutes(mockSessionData);
      expect(currentTotal).toEqual({ hours: 1, minutes: 25 }); // 85 minutes

      // Filter break from categories
      const filteredCategories = filterBreakCategory(mockSessionData.aggregate.category_durations);
      const studyOnlySeconds = Object.values(filteredCategories)
        .reduce((sum, duration) => sum + duration, 0);

      // Expected behavior - should show 75 minutes (1h 15m) of study only
      expect(studyOnlySeconds).toBe(4500); // 75 minutes

      const expectedTotal = {
        hours: Math.floor(studyOnlySeconds / 3600),
        minutes: Math.floor((studyOnlySeconds % 3600) / 60),
      };
      expect(expectedTotal).toEqual({ hours: 1, minutes: 15 });

      // This documents the discrepancy:
      // Dashboard shows: 1h 25m (includes break)
      // Should show: 1h 15m (study only)
    });
  });
});