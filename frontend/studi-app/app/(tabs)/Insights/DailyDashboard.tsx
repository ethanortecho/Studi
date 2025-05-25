import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { parseCategoryDurations } from '@/utils/parseData';
import { format_Duration } from '@/utils/parseData';
import CustomPieChart from '@/components/charts/CustomPieChart';
import SessionBreakdown from '@/components/charts/SessionBreakdown';
import { DailyInsightsResponse } from '@/types/api';
import { ScrollView, View, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import TotalHours from '@/components/TotalHoursLayout';
import Legend from '@/components/ui/DashboardLegend';
import { dashboardStyles as styles } from '@/styles/dashboard';
import useAggregateData from '@/utils/fetchApi';
import DebugDataViewer from '@/components/ui/DebugDataViewer';

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
    <ScrollView contentContainerStyle={localStyles.scrollContent}>
      <ThemedView style={styles.container}>
        {/* Main Dashboard Content */}
        <ThemedView style={styles.dashboardContainer}>
          {/* Study Time */}
          <View className="bg-white rounded-lg p-4">
            {parsedDailyMetrics?.total_daily_hours && (
              <TotalHours
                StudyTime={parsedDailyMetrics.total_daily_hours}
              />
            )}
          </View>

          {/* Subject Distribution and Colors Side by Side */}
          <View className="flex-row gap-2.5">
            {/* Subject Distribution */}
            <View className="flex-1 items-center justify-center bg-white rounded-lg p-2 min-h-[180px]">
              {parsedDailyMetrics?.pie_chart_durations && (
                <CustomPieChart 
                  data={parsedDailyMetrics.pie_chart_durations}
                  size={150}
                />
              )}
            </View>

            {/* Colors Legend */}
            <View className="flex-1 bg-white rounded-lg p-4">
              {parsedDailyMetrics?.category_durations && parsedDailyMetrics?.category_metadata && (
                <Legend
                  category_durations={parsedDailyMetrics.category_durations}
                  category_metadata={parsedDailyMetrics.category_metadata}
                />
              )}
            </View>
          </View>

          {/* Session Breakdown */}
          <View className="bg-white rounded-lg p-4">
            {parsedDailyMetrics?.timeline_data && (
              <SessionBreakdown 
                timelineData={parsedDailyMetrics.timeline_data}
                categoryMetadata={parsedDailyMetrics.category_metadata}
                width={300}
              />
            )}
          </View>
          
          {/* Debug Data Viewer */}
          <View className="mt-2.5 mb-5 w-full">
            {dailyData && (
              <DebugDataViewer 
                data={dailyData} 
                label="Daily Dashboard Raw Data" 
              />
            )}
          </View>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const localStyles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  }
});

