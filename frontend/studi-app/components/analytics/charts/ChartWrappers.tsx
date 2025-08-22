/**
 * Chart Wrapper Components
 * These components adapt existing charts to work with our standardized chart system
 * They handle data transformation and prop mapping
 */

import React from 'react';
import { View } from 'react-native';
import CustomPieChart from './CustomPieChart';
import SessionBarchart from './SessionBarchart';
import DailyHourBarsInner from './DailyHourBarsInner';
import WeeklySessionTimelineInner from './WeeklySessionTimelineInner';
import MonthlyHeatmapInner from './MonthlyHeatmapInner';
import { 
  SubjectsChartData, 
  SessionsChartData, 
  DailyMapChartData,
  WeeklyMapChartData,
  MonthlyMapChartData,
  TrendsChartData,
  ChartComponentProps 
} from '@/types/charts';
import WeeklyBarchart from './WeeklyBarchart';

/**
 * Subjects Chart Wrapper (Pie Chart)
 */
export const SubjectsChart: React.FC<ChartComponentProps<SubjectsChartData>> = ({ data }) => {
  return (
    <View className="items-center justify-center">
      <CustomPieChart data={data.pieChartData} size={168} />
    </View>
  );
};

/**
 * Sessions Chart Wrapper (Bar Chart)
 */
export const SessionsChart: React.FC<ChartComponentProps<SessionsChartData>> = ({ data, width = 320, height = 150 }) => {
  return (
    <View className="px-2 justify-center" style={{ height }}>
      <SessionBarchart 
        timelineData={data.timelineData} 
        categoryMetadata={data.categoryMetadata} 
        width={width}
      />
    </View>
  );
};

/**
 * Daily Map Chart Wrapper (Hour Bars)
 * Note: This is modified to not show title/legend as per requirements
 */
export const DailyMapChart: React.FC<ChartComponentProps<DailyMapChartData>> = ({ data }) => {
  return (
    <DailyHourBarsInner 
      timelineData={data.timelineData}
      categoryMetadata={data.categoryMetadata}
      categoryDurations={data.categoryDurations}
      width={280}
      height={120} // Taller for 60m scale
      isEmpty={data.isEmpty}
    />
  );
};

/**
 * Weekly Map Chart Wrapper (Session Timeline)
 * Note: This is modified to not show title/legend as per requirements
 */
export const WeeklyMapChart: React.FC<ChartComponentProps<WeeklyMapChartData>> = ({ data }) => {
  return (
    <WeeklySessionTimelineInner 
      sessionTimes={data.sessionTimes}
      isEmpty={data.isEmpty}
    />
  );
};

/**
 * Monthly Map Chart Wrapper (Heatmap)
 * Note: This is modified to not show title/legend as per requirements
 */
export const MonthlyMapChart: React.FC<ChartComponentProps<MonthlyMapChartData>> = ({ data }) => {
  return (
    <MonthlyHeatmapInner 
      heatmapData={data.heatmapData}
      monthDate={data.monthDate}
      isEmpty={data.isEmpty}
    />
  );
};

/**
 * Trends Chart Wrapper (Weekly/Monthly Bar Chart)
 */
export const TrendsChart: React.FC<ChartComponentProps<TrendsChartData>> = ({ data, width = 320, height = 100 }) => {
  const isWeekly = data.timeframe === 'weekly';
  return (
    <View className="items-center justify-end" style={{ height: 100 }}>
      <WeeklyBarchart 
        data={isWeekly ? data.weeklyChartData : data.monthlyChartData}
        categoryMetadata={data.categoryMetadata}
        timeframe={isWeekly ? 'weekly' : 'monthly'}
        width={width}
        height={100} // Shorter like Apple's design
        isEmpty={data.isEmpty}
      />
    </View>
  );
};