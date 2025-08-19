import React from 'react';
import { View, ScrollView, Text } from 'react-native';
import { CategoryMetadata } from '../../../types/api';
import DashboardKPIs from '../../../components/analytics/DashboardKPIs';
import MultiChartContainerV2 from '../../../components/analytics/MultiChartContainerV2';
import { DashboardData } from '../../../types/charts';

interface MonthlyDashboardProps {
  totalHours: number;
  totalTime: { hours: number; minutes: number };
  percentGoal: number | null;
  categoryDurations?: { [key: string]: number };
  categoryMetadata?: { [key: string]: CategoryMetadata };
  pieChartData?: Array<{ label: string; value: number; color: string }>;
  dailyBreakdown?: Array<{ date: string; total_duration: number; category_durations: { [key: string]: number } }>;
  heatmapData?: { [date: string]: number };
  monthDate: Date;
  rawData?: any;
  loading: boolean;
  isEmpty: boolean;
}

export default function MonthlyDashboard({
  totalHours,
  totalTime,
  percentGoal,
  categoryDurations,
  categoryMetadata,
  pieChartData,
  dailyBreakdown,
  heatmapData,
  monthDate,
  rawData,
  loading,
  isEmpty
}: MonthlyDashboardProps) {
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Loading...</Text>
      </View>
    );
  }

  // Prepare dashboard data in the normalized format
  const dashboardData: DashboardData = {
    timeframe: 'monthly',
    totalTime,
    percentGoal,
    categoryMetadata: categoryMetadata || {},
    categoryDurations: categoryDurations || {},
    pieChartData: pieChartData || [],
    monthlyChartData: dailyBreakdown,
    heatmapData: heatmapData || {},
    monthDate,
    isEmpty
  };

  return (
    <ScrollView 
      className="flex-1" 
      contentContainerStyle={{ paddingBottom: 30 }}
      showsVerticalScrollIndicator={false}
    >
      {/* High-level KPIs */}
      {!isEmpty && (
        <DashboardKPIs 
          totalTime={totalTime}
          percentGoal={percentGoal}
          flowScore={7}  // TODO: Replace with actual flow score data
          flowScoreTotal={10}
        />
      )}
      
      {/* Multi-chart container with new architecture */}
      <View className="mx-4 mb-4">
        <MultiChartContainerV2 
          dashboardData={dashboardData}
          showLegend={true}
        />
      </View>
      
    </ScrollView>
  );
}

