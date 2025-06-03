import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import TotalHours from '@/components/analytics/TotalHoursContainer';
import Legend from '@/components/analytics/DashboardLegend';
import DebugDataViewer from '@/components/analytics/DebugDataViewer';
import DashboardCard from '@/components/insights/DashboardContainer';
import SubjectBreakdown from '@/components/analytics/layout/SubjectBreakdown';
import SessionBarchart from '@/components/analytics/SessionBarchart';
import { CategoryMetadata, TimelineSession } from '@/types/api';

interface DailyDashboardProps {
  totalHours: string;
  totalTime?: { hours: number; minutes: number };
  categoryDurations?: { [key: string]: number };
  categoryMetadata?: { [key: string]: CategoryMetadata };
  pieChartData?: Array<{ label: string; value: number; color: string }>;
  timelineData?: TimelineSession[];
  rawData?: any;
  loading: boolean;
}

export default function DailyDashboard({
  totalHours,
  totalTime,
  categoryDurations,
  categoryMetadata,
  pieChartData,
  timelineData,
  rawData,
  loading
}: DailyDashboardProps) {
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
      {/* Off-white container for all dashboard content - edge to edge */}
      <View className="bg-layout-off-white rounded-3xl mx-4 mb-4 px-3 py-4">
        
        {/* Top Row: Legend in white card */}
        <View className="p-4 pb-0">
          <DashboardCard>
            {categoryDurations && categoryMetadata && (
              <Legend
                category_durations={categoryDurations}
                category_metadata={categoryMetadata}
              />
            )}
          </DashboardCard>
        </View>

        {/* Second Row: Pie Chart + Total Hours */}
        <View className="flex-row gap-4 px-4 ">
          {/* Subject Breakdown (Pie Chart) */}
          <View className="flex-1">
            <SubjectBreakdown pieChartData={pieChartData} />
          </View>

          {/* Right Column: Total Hours + Placeholder */}
          <View className="flex-1">
            {/* Total Hours with grey-blue background */}
            <View className="bg-layout-grey-blue rounded-lg p-4 mb-2.5">
              <TotalHours totalHours={totalHours} totalTime={totalTime} />
            </View>
            
            {/* Placeholder component */}
            <View className="bg-gray-300 rounded-lg p-4 min-h-[72px]">
              {/* Empty placeholder */}
            </View>
          </View>
        </View>

        {/* Bottom Row: Sessions (full width) */}
        <View className="px-4 pb-4">
          <DashboardCard className="mb-0">
            {timelineData && categoryMetadata && (
              <SessionBarchart
                timelineData={timelineData}
                categoryMetadata={categoryMetadata}
                width={300}
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
            label="Daily Dashboard Raw Data" 
          />
        )}
      </View>
    </ScrollView>
  );
}

