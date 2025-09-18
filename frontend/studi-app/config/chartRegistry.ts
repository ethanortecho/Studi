/**
 * Chart Registry Configuration
 * Defines available charts for each timeframe with their configuration
 */

import { 
  ChartConfig, 
  ChartRegistry, 
  DashboardData,
  SubjectsChartData,
  SessionsChartData,
  DailyMapChartData,
  WeeklyMapChartData,
  MonthlyMapChartData
} from '../types/charts';
import {
  SubjectsChart,
  SessionsChart,
  DailyMapChart,
  WeeklyMapChart,
  MonthlyMapChart,
  TrendsChart
} from '../components/analytics/charts/ChartWrappers';

/**
 * Subjects Chart Configuration (Pie Chart)
 * Available for all timeframes
 */
const subjectsChartConfig: ChartConfig<SubjectsChartData> = {
  id: 'subjects',
  label: 'Subjects',
  component: SubjectsChart,
  isAvailable: (data: DashboardData) => {
    // Available if we have pie chart data with at least one category
    return Boolean(
      data.pieChartData && 
      data.pieChartData.length > 0 &&
      !data.isEmpty
    );
  },
  getData: (data: DashboardData): SubjectsChartData | null => {
    if (!data.pieChartData) return null;
    
    return {
      pieChartData: data.pieChartData,
      categoryMetadata: data.categoryMetadata,
      categoryDurations: data.categoryDurations,
      isEmpty: data.isEmpty
    };
  }
};

/**
 * Sessions Chart Configuration (Bar Chart)
 * Only available for daily timeframe
 */
const sessionsChartConfig: ChartConfig<SessionsChartData> = {
  id: 'sessions',
  label: 'Sessions',
  component: SessionsChart,
  isAvailable: (data: DashboardData) => {
    // Only available for daily view with timeline data
    return Boolean(
      data.timeframe === 'daily' &&
      data.timelineData &&
      data.timelineData.length > 0 &&
      !data.isEmpty
    );
  },
  getData: (data: DashboardData): SessionsChartData | null => {
    if (!data.timelineData) return null;
    
    return {
      timelineData: data.timelineData,
      categoryMetadata: data.categoryMetadata,
      categoryDurations: data.categoryDurations,
      isEmpty: data.isEmpty
    };
  }
};

/**
 * Daily Map Chart Configuration (Hour Bars) - PREMIUM
 */
const dailyMapChartConfig: ChartConfig<DailyMapChartData> = {
  id: 'map',
  label: 'Timeline',
  component: DailyMapChart,
  requiresPremium: true,
  isAvailable: (data: DashboardData) => {
    return Boolean(
      data.timeframe === 'daily' &&
      data.timelineData &&
      data.timelineData.length > 0 &&
      !data.isEmpty
    );
  },
  getData: (data: DashboardData): DailyMapChartData | null => {
    if (!data.timelineData) return null;
    
    return {
      timelineData: data.timelineData,
      categoryMetadata: data.categoryMetadata,
      categoryDurations: data.categoryDurations,
      isEmpty: data.isEmpty
    };
  }
};

/**
 * Weekly Map Chart Configuration (Session Timeline) - PREMIUM
 */
const weeklyMapChartConfig: ChartConfig<WeeklyMapChartData> = {
  id: 'map',
  label: 'Timeline',
  component: WeeklyMapChart,
  requiresPremium: true,
  isAvailable: (data: DashboardData) => {
    return Boolean(
      data.timeframe === 'weekly' &&
      data.sessionTimes &&
      data.sessionTimes.length > 0 &&
      !data.isEmpty
    );
  },
  getData: (data: DashboardData): WeeklyMapChartData | null => {
    if (!data.sessionTimes) return null;
    
    return {
      sessionTimes: data.sessionTimes,
      categoryMetadata: data.categoryMetadata,
      categoryDurations: data.categoryDurations,
      isEmpty: data.isEmpty
    };
  }
};

/**
 * Monthly Map Chart Configuration (Heatmap)
 */
const monthlyMapChartConfig: ChartConfig<MonthlyMapChartData> = {
  id: 'map',
  label: 'Timeline',
  component: MonthlyMapChart,
  isAvailable: (data: DashboardData) => {
    return Boolean(
      data.timeframe === 'monthly' &&
      data.heatmapData &&
      data.monthDate &&
      !data.isEmpty
    );
  },
  getData: (data: DashboardData): MonthlyMapChartData | null => {
    if (!data.heatmapData || !data.monthDate) return null;
    
    return {
      heatmapData: data.heatmapData,
      monthDate: data.monthDate,
      categoryMetadata: data.categoryMetadata,
      categoryDurations: data.categoryDurations,
      isEmpty: data.isEmpty
    };
  }
};

/**
 * Chart Registry
 * Maps each timeframe to its available charts
 */
export const chartRegistry: ChartRegistry = {
  daily: [
    subjectsChartConfig,
    sessionsChartConfig,
    dailyMapChartConfig
  ],
  weekly: [
    subjectsChartConfig,
    // Note: No sessions chart for weekly
    // Insert trends bar chart between subjects and map
    {
      id: 'trends',
      label: 'Trends',
      component: TrendsChart,
      isAvailable: (data: DashboardData) => {
        return Boolean(
          data.timeframe === 'weekly' &&
          data.weeklyChartData &&
          Object.keys(data.weeklyChartData).length > 0 &&
          !data.isEmpty
        );
      },
      getData: (data: DashboardData) => ({
        timeframe: 'weekly',
        weeklyChartData: data.weeklyChartData,
        monthlyChartData: undefined,
        categoryMetadata: data.categoryMetadata,
        categoryDurations: data.categoryDurations,
        isEmpty: data.isEmpty
      })
    },
    weeklyMapChartConfig
  ],
  monthly: [
    subjectsChartConfig,
    // Note: No sessions chart for monthly
    // Insert trends bar chart (monthly mode) before heatmap
    {
      id: 'trends',
      label: 'Trends',
      component: TrendsChart,
      isAvailable: (data: DashboardData) => {
        return Boolean(
          data.timeframe === 'monthly' &&
          data.monthlyChartData &&
          data.monthlyChartData.length > 0 &&
          !data.isEmpty
        );
      },
      getData: (data: DashboardData) => ({
        timeframe: 'monthly',
        weeklyChartData: undefined,
        monthlyChartData: data.monthlyChartData,
        categoryMetadata: data.categoryMetadata,
        categoryDurations: data.categoryDurations,
        isEmpty: data.isEmpty
      })
    },
    monthlyMapChartConfig
  ]
};

/**
 * Helper function to get charts for a specific timeframe
 */
export function getChartsForTimeframe(timeframe: DashboardData['timeframe']): ChartConfig[] {
  return chartRegistry[timeframe] || [];
}