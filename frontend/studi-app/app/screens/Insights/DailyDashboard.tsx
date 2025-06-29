import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import TotalHours from '@/components/analytics/TotalHoursContainer';
import Legend from '@/components/analytics/DashboardLegend';
import DebugDataViewer from '@/components/analytics/DebugDataViewer';
import DashboardCard from '@/components/insights/DashboardContainer';
import SubjectBreakdown from '@/components/analytics/layout/SubjectBreakdown';
import SessionBarchart from '@/components/analytics/SessionBarchart';
import { CategoryMetadata, TimelineSession } from '@/types/api';
import MultiChartContainer from '@/components/analytics/layout/MultiChartContainer';
import DailyHourBars from '@/components/analytics/DailyHourBars';

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
  // 🔍 Debug: Log key day-level data

  return (
    <ScrollView 
      className="flex-1 " 
      contentContainerStyle={{ paddingBottom: 30 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Off-white container for all dashboard content - edge to edge */}
      <View className="mx-4 mb-4">
        <MultiChartContainer 
          timeframe="daily"
          categoryMetadata={categoryMetadata || {}}
          categoryDurations={categoryDurations || {}}
          pieChartData={pieChartData || []}
          timelineData={timelineData}
          weeklyChartData={undefined}
          totalTime={totalTime}
          percentGoal={percentGoal ?? null}
          isEmpty={isEmpty}
          showTitle={false}
        />
      </View>
      {/* Hourly bars below main charts */}
      {timelineData && timelineData.length > 0 && (
        <View className="px-4 pb-4">
          <DailyHourBars 
            timelineData={timelineData}
            categoryMetadata={categoryMetadata || {}}
            width={300}
            height={100}
          />
        </View>
      )}
      

        
      
      {/* Debug Data Viewer (outside off-white container) */}
      <View className="mb-5 px-4">
        {rawData && (
          <DebugDataViewer 
            data={rawData} 
            label="Daily Dashboard Raw Data" 
          />
        )}
      </View>
    </ScrollView>
  );
}

