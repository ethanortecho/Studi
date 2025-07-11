import React from 'react';
import { View, ScrollView, Text } from 'react-native';
import DebugDataViewer from '@/components/analytics/DebugDataViewer';
import MultiChartContainer from '@/components/analytics/MultiChartContainer';
import { CategoryMetadata } from '@/types/api';

interface MonthlyDashboardProps {
  totalHours: number;
  totalTime: { hours: number; minutes: number };
  percentGoal: number | null;
  categoryDurations?: { [key: string]: number };
  categoryMetadata?: { [key: string]: CategoryMetadata };
  pieChartData?: Array<{ label: string; value: number; color: string }>;
  dailyBreakdown?: Array<{ date: string; total_duration: number; category_durations: { [key: string]: number } }>;
  heatmapData?: { [date: string]: number };
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

  return (
    <ScrollView 
      className="flex-1" 
      contentContainerStyle={{ paddingBottom: 30 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="mx-4 mb-4">
        <MultiChartContainer 
          timeframe="monthly"
          categoryMetadata={categoryMetadata || {}}
          categoryDurations={categoryDurations || {}}
          pieChartData={pieChartData || []}
          monthlyChartData={dailyBreakdown}
          totalTime={totalTime}
          percentGoal={percentGoal}
          isEmpty={isEmpty}
          showTitle={false}
        />
      </View>
      
      {/* Debug Data Viewer */}
      <View className="mb-5 px-4">
        {rawData && (
          <DebugDataViewer 
            data={rawData} 
            label="Monthly Dashboard Raw Data" 
          />
        )}
      </View>
    </ScrollView>
  );
}

