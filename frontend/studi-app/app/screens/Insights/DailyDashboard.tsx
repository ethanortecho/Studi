import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { CategoryMetadata, TimelineSession } from '@/types/api';
import DashboardKPIs from '@/components/analytics/DashboardKPIs';
import MultiChartContainerV2 from '@/components/analytics/MultiChartContainerV2';
import { DashboardData } from '@/types/charts';

interface DailyDashboardProps {
  totalHours: string;
  totalTime?: { hours: number; minutes: number };
  percentGoal?: number | null;
  categoryDurations?: { [key: string]: number };
  categoryMetadata?: { [key: string]: CategoryMetadata };
  pieChartData?: Array<{ label: string; value: number; color: string }>;
  timelineData?: TimelineSession[];
  rawData?: any;
  loading: boolean;
  isEmpty?: boolean;
}

export default function DailyDashboard({
  totalHours,
  totalTime,
  percentGoal,
  categoryDurations,
  categoryMetadata,
  pieChartData,
  timelineData,
  rawData,
  loading,
  isEmpty
}: DailyDashboardProps) {
  // Prepare dashboard data in the normalized format
  const dashboardData: DashboardData = {
    timeframe: 'daily',
    totalTime,
    percentGoal,
    categoryMetadata: categoryMetadata || {},
    categoryDurations: categoryDurations || {},
    pieChartData: pieChartData || [],
    timelineData: timelineData || [],
    isEmpty
  };

  return (
    <ScrollView 
      className="flex-1 " 
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

