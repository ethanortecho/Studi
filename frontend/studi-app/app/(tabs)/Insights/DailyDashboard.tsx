import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { parseCategoryDurations } from '@/utils/parseData';
import { format_Duration } from '@/utils/parseData';
import CustomPieChart from '@/components/charts/CustomPieChart';
import SessionBreakdown from '@/components/charts/SessionBreakdown';
import { DailyInsightsResponse } from '@/types/api';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import Insights from '@/app/Insights';
import TotalHours from '@/components/TotalHoursLayout';
import { Colors } from '@/constants/Colors';
import GoalChart from '@/components/charts/GoalChart';
import Legend from '@/components/ui/DashboardLegend';
import { dashboardStyles as styles } from '@/styles/dashboard';
import useAggregateData from '@/utils/fetchApi';
import DebugDataViewer from '@/components/ui/DebugDataViewer';

export default function DailyDashboard() {
  const [dailyData, setDailyData] = useState<DailyInsightsResponse | null>(null);

  const { data, loading } = useAggregateData('daily', '2025-01-10', undefined);
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
          <ThemedView style={[styles.summarySection, { backgroundColor: Colors.light.surface }]}>
            {parsedDailyMetrics?.total_daily_hours && (
              <TotalHours
                StudyTime={parsedDailyMetrics.total_daily_hours}
              />
            )}
          </ThemedView>

          {/* Subject Distribution and Colors Side by Side */}
          <ThemedView style={styles.row}>
            {/* Subject Distribution */}
            <ThemedView style={[styles.subjectSection, { backgroundColor: Colors.light.surface }]}>
              {parsedDailyMetrics?.pie_chart_durations && (
                <CustomPieChart 
                  data={parsedDailyMetrics.pie_chart_durations}
                  size={100}
                />
              )}
            </ThemedView>

            {/* Colors Legend */}
            <ThemedView style={[styles.summarySection, { backgroundColor: Colors.light.surface, flex: 1 }]}>
              {parsedDailyMetrics?.category_durations && parsedDailyMetrics?.category_metadata && (
                <Legend
                  category_durations={parsedDailyMetrics.category_durations}
                  category_metadata={parsedDailyMetrics.category_metadata}
                />
              )}
            </ThemedView>
          </ThemedView>

          {/* Session Breakdown */}
          <ThemedView style={[styles.sessionSection, { backgroundColor: Colors.light.surface }]}>
            {parsedDailyMetrics?.timeline_data && (
              <SessionBreakdown 
                timelineData={parsedDailyMetrics.timeline_data}
                categoryMetadata={parsedDailyMetrics.category_metadata}
                width={300}
              />
            )}
          </ThemedView>
          
          {/* Debug Data Viewer */}
          <View style={localStyles.debugContainer}>
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
    paddingBottom: 30, // Add padding at the bottom to ensure visibility
  },
  debugContainer: {
    marginTop: 10,
    marginBottom: 20,
    width: '100%',
  }
});

