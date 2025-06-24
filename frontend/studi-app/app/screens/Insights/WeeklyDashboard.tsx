import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import CustomPieChart from '@/components/analytics/charts/CustomPieChart';
import TotalHours from '@/components/analytics/TotalHoursContainer';
import Legend from '@/components/analytics/DashboardLegend';
import WeeklyBarchartContainer from '@/components/analytics/WeeklyBarchartContainer';
import StudyDayBars from '@/components/analytics/StudyDayBars';
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
      <View className="mx-4 mb-4">
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
      <View>
        
       
        <View className="px-4 pb-4">
          {sessionTimes && (
            <StudyDayBars
              sessionTimes={sessionTimes}
            />
          )}
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









  