/**
 * Chart Configuration System
 * This file defines the types and interfaces for our modular chart system
 * Each chart is configured declaratively, making it easy to add/remove charts
 */

import { CategoryMetadata, TimelineSession } from './api';

// Chart IDs - using string literals for type safety
export type ChartId = 'subjects' | 'sessions' | 'map' | 'trends';

// Timeframe types
export type TimeFrame = 'daily' | 'weekly' | 'monthly';

// Base data that all charts might need
export interface BaseChartData {
  categoryMetadata: { [key: string]: CategoryMetadata };
  categoryDurations: { [key: string]: number };
  isEmpty?: boolean;
}

// Specific data shapes for each chart type
export interface SubjectsChartData extends BaseChartData {
  pieChartData: Array<{ label: string; value: number; color: string }>;
}

export interface SessionsChartData extends BaseChartData {
  timelineData: TimelineSession[];
}

export interface DailyMapChartData extends BaseChartData {
  timelineData: TimelineSession[];
}

export interface WeeklyMapChartData extends BaseChartData {
  sessionTimes: Array<{
    start_time: string;
    end_time: string;
    total_duration: number;
  }>;
}

export interface MonthlyMapChartData extends BaseChartData {
  heatmapData: { [date: string]: number };
  monthDate: Date;
}

export interface TrendsChartData extends BaseChartData {
  timeframe: 'weekly' | 'monthly';
  weeklyChartData?: { [date: string]: { total: number; categories: { [key: string]: number } } };
  monthlyChartData?: Array<{ date: string; total_duration: number; category_durations: { [key: string]: number } }>;
}

// Union type for all possible chart data
export type ChartData =
  | SubjectsChartData
  | SessionsChartData
  | DailyMapChartData
  | WeeklyMapChartData
  | MonthlyMapChartData
  | TrendsChartData;

// Chart configuration interface
export interface ChartConfig<T extends ChartData = ChartData> {
  id: ChartId;
  label: string;
  component: React.ComponentType<ChartComponentProps<T>>;
  isAvailable: (data: DashboardData) => boolean;
  getData: (data: DashboardData) => T | null;
  requiresPremium?: boolean;
}

// Dashboard data structure (normalized from API responses)
export interface DashboardData {
  timeframe: TimeFrame;
  totalTime?: { hours: number; minutes: number };
  percentGoal?: number | null;
  categoryMetadata: { [key: string]: CategoryMetadata };
  categoryDurations: { [key: string]: number };
  pieChartData?: Array<{ label: string; value: number; color: string }>;
  
  // Daily specific
  timelineData?: TimelineSession[];
  
  // Weekly specific
  weeklyChartData?: { [date: string]: { total: number; categories: { [key: string]: number } } };
  sessionTimes?: Array<{ start_time: string; end_time: string; total_duration: number }>;
  
  // Monthly specific
  monthlyChartData?: Array<{ date: string; total_duration: number; category_durations: { [key: string]: number } }>;
  heatmapData?: { [date: string]: number };
  monthDate?: Date;
  
  isEmpty?: boolean;
}

// Chart registry type - maps timeframe to available charts
export type ChartRegistry = {
  [key in TimeFrame]: ChartConfig[];
};

// Props for chart components (standardized)
export interface ChartComponentProps<T extends ChartData = ChartData> {
  data: T;
  width?: number;
  height?: number;
}

// Navigation state
export interface ChartNavigationState {
  activeChartIndex: number;
  availableCharts: ChartConfig[];
  setActiveChart: (index: number) => void;
}