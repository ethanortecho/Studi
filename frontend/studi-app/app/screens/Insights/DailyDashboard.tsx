import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { parseCategoryDurations } from '@/utils/parseData';
import { format_Duration } from '@/utils/parseData';
import CustomPieChart from '@/components/analytics/CustomPieChart';
import SessionBreakdown from '@/components/analytics/SessionBreakdown';
import { DailyInsightsResponse } from '@/types/api';
import { ScrollView, View, Text } from 'react-native';
import TotalHours from '@/components/analytics/TotalHoursLayout';
import Legend from '@/components/analytics/DashboardLegend';
import useAggregateData from '@/utils/fetchApi';
import DebugDataViewer from '@/components/analytics/DebugDataViewer';
import DashboardCard from '@/components/insights/DashboardCard';

export default function DailyDashboard() {
  const [dailyData, setDailyData] = useState<DailyInsightsResponse | null>(null);

  const { data, loading } = useAggregateData('daily', '2025-01-23', undefined);
  useEffect(() => {
    if (data) {
      setDailyData(data);
    }
  }, [data]);

  const parsedDailyMetrics = useMemo(() => {
    if (!dailyData) return null;

    return {
      category_durations: dailyData.aggregate.category_durations,
      pie_chart_durations: parseCategoryDurations(dailyData),
      total_daily_hours: format_Duration(dailyData),
      timeline_data: dailyData.timeline_data,
      category_metadata: dailyData.category_metadata,
    };
  }, [dailyData]);

  return (
    <ScrollView 
      className="flex-1" 
      contentContainerStyle={{ paddingBottom: 30 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Off-white container for all dashboard content - edge to edge */}
      <View className="bg-layout-off-white rounded-lg mx-4 mb-4">
        
        {/* Top Row: Legend in white card */}
        <View className="p-4 pb-0">
          <DashboardCard className="mb-4">
            {parsedDailyMetrics?.category_durations && parsedDailyMetrics?.category_metadata && (
              <Legend
                category_durations={parsedDailyMetrics.category_durations}
                category_metadata={parsedDailyMetrics.category_metadata}
              />
            )}
          </DashboardCard>
        </View>

        {/* Second Row: Pie Chart + Total Hours */}
        <View className="flex-row gap-2.5 px-4 mb-4">
          {/* Subject Breakdown (Pie Chart) */}
          <View className="flex-1">
            <Text className="text-lg font-semibold text-layout-dark-grey mb-3">Subject Breakdown</Text>
            <DashboardCard className="items-center justify-center min-h-[180px] mb-0">
              {parsedDailyMetrics?.pie_chart_durations && (
                <CustomPieChart 
                  data={parsedDailyMetrics.pie_chart_durations}
                  size={150}
                />
              )}
            </DashboardCard>
          </View>

          {/* Right Column: Total Hours + Placeholder */}
          <View className="flex-1">
            {/* Total Hours with grey-blue background */}
            <View className="bg-layout-grey-blue rounded-lg p-4 mb-2.5">
              <Text className="text-white text-sm font-medium mb-1">You've Studied</Text>
              <Text className="text-white text-3xl font-bold">
                {parsedDailyMetrics?.total_daily_hours || '0 hours'}
              </Text>
            </View>
            
            {/* Placeholder component */}
            <View className="bg-gray-300 rounded-lg p-4 min-h-[100px]">
              {/* Empty placeholder */}
            </View>
          </View>
        </View>

        {/* Bottom Row: Sessions (full width) */}
        <View className="px-4 pb-4">
          <Text className="text-lg font-semibold text-layout-dark-grey mb-3">Sessions</Text>
          <DashboardCard className="mb-0">
            {parsedDailyMetrics?.timeline_data && (
              <SessionBreakdown 
                timelineData={parsedDailyMetrics.timeline_data}
                categoryMetadata={parsedDailyMetrics.category_metadata}
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

