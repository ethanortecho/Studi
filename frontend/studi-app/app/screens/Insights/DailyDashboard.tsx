import React from 'react';
import { useEffect, useState } from 'react';
import CustomPieChart from '@/components/analytics/charts/CustomPieChart';
import { DailyInsightsResponse } from '@/types/api';
import { ScrollView, View, Text } from 'react-native';
import TotalHours from '@/components/analytics/TotalHoursLayout';
import Legend from '@/components/analytics/DashboardLegend';
import useAggregateData from '@/utils/fetchApi';
import DebugDataViewer from '@/components/analytics/DebugDataViewer';
import DashboardCard from '@/components/insights/DashboardCard';
import SubjectBreakdown from '@/components/analytics/layout/SubjectBreakdown';
import SessionBarchart from '@/components/analytics/SessionBarchart';

export default function DailyDashboard() {
  const [dailyData, setDailyData] = useState<DailyInsightsResponse | null>(null);

  const { data, loading } = useAggregateData('daily', '2025-01-23', undefined);
  useEffect(() => {
    if (data) {
      setDailyData(data);
    }
  }, [data]);

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
            {dailyData?.aggregate.category_durations && dailyData?.category_metadata && (
              <Legend
                category_durations={dailyData.aggregate.category_durations}
                category_metadata={dailyData.category_metadata}
              />
            )}
          </DashboardCard>
        </View>

        {/* Second Row: Pie Chart + Total Hours */}
        <View className="flex-row gap-4 px-4 ">
          {/* Subject Breakdown (Pie Chart) */}
          <View className="flex-1">
            <SubjectBreakdown dailyData={dailyData} />
          </View>

          {/* Right Column: Total Hours + Placeholder */}
          <View className="flex-1">
            {/* Total Hours with grey-blue background */}
            <View className="bg-layout-grey-blue rounded-lg p-4 mb-2.5">
              <TotalHours dailyData={dailyData} />
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
            {dailyData?.timeline_data && (
              <SessionBarchart
                timelineData={dailyData.timeline_data}
                categoryMetadata={dailyData.category_metadata}
                width={300}
              />
            )}
          </DashboardCard>
        </View>
      </View>
      
      {/* Debug Data Viewer (outside off-white container) */}
      <View className="mb-5 px-4">
        {dailyData && (
          <DebugDataViewer 
            data={dailyData} 
            label="Daily Dashboard Raw Data" 
          />
        )}
      </View>
    </ScrollView>
  );
}

