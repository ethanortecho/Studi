import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import CustomPieChart from '@/components/analytics/charts/CustomPieChart';
import TotalHours from '@/components/analytics/TotalHoursContainer';
import Legend from '@/components/analytics/DashboardLegend';
import WeeklyBarchartContainer from '@/components/analytics/WeeklyBarchartContainer';
import StudyHeatmap from '@/components/analytics/StudyHeatmap';
import DebugDataViewer from '@/components/analytics/DebugDataViewer';
import DashboardCard from '@/components/insights/DashboardContainer';
import MultiChartContainer from '@/components/analytics/layout/MultiChartContainer';
import { CategoryMetadata } from '@/types/api';

interface WeeklyDashboardProps {
  totalHours: string;
  totalTime?: { hours: number; minutes: number };
  categoryDurations?: { [key: string]: number };
  categoryMetadata?: { [key: string]: CategoryMetadata };
  pieChartData?: Array<{ label: string; value: number; color: string }>;
  trendData?: Array<{ day: string; total_time: number }>;
  sessionTimes?: Array<{ start_time: string; end_time: string; total_duration: number }>;
  dailyBreakdown?: { [date: string]: { total: number; categories: { [key: string]: number } } };
  rawData?: any;
  loading: boolean;
}

export default function WeeklyDashboard({
  totalHours,
  totalTime,
  categoryDurations,
  categoryMetadata,
  pieChartData,
  trendData,
  sessionTimes,
  dailyBreakdown,
  rawData,
  loading
}: WeeklyDashboardProps) {
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      className="flex-1" 
      contentContainerStyle={{ paddingBottom: 30 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-1">
            <MultiChartContainer 
              timeframe="weekly"
              categoryMetadata={categoryMetadata || {}}
              categoryDurations={categoryDurations || {}}
              pieChartData={pieChartData || []}
              timelineData={undefined}
              weeklyChartData={dailyBreakdown}
            />
          </View>
      {/* Off-white container for all dashboard content - edge to edge */}
      <View className="bg-layout-off-white rounded-3xl mx-4 mb-4 px-3 py-4">
        
        {/* Top Row: Legend in white card */}
        
        {/* Second Row: Subject Breakdown + Total Hours */}
       
        {/* Third Row: Weekly Trends + Another Component */}
        

        {/* Study Time Heatmap */}
        <View className="px-4 pb-4">
          <Text className="text-lg font-semibold text-layout-dark-grey mb-3">Study Schedule</Text>
          <DashboardCard className="mb-0">
            {sessionTimes && (
              <StudyHeatmap
                sessionTimes={sessionTimes}
              />
            )}
          </DashboardCard>
        </View>
      </View>
      
      {/* Debug Data Viewer (outside off-white container) */}
      <View className="mb-5 px-4">
        {rawData && (
          <DebugDataViewer 
            data={rawData} 
            label="Weekly Dashboard Raw Data" 
          />
        )}
      </View>
    </ScrollView>
  );
}









  