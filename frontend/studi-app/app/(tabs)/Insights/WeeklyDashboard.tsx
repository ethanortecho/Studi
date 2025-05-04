import React from 'react';
import { ThemedText } from '../../../components/ThemedText';
import { ThemedView } from '../../../components/ThemedView';
import { StyleSheet } from 'react-native';
import { ScrollView } from 'react-native';
import TotalHours from '@/components/TotalHoursLayout';
import GoalChart from '@/components/charts/GoalChart';
import { Colors } from '@/constants/Colors';
import CustomPieChart from '@/components/charts/CustomPieChart';
import { useEffect, useMemo, useState } from 'react';
import Insights from '@/app/Insights';
import { WeeklyInsightsResponse } from '@/types/api';
import { parseCategoryDurations } from '@/utils/parseData';
import { format_Duration } from '@/utils/parseData';
import { dashboardStyles as styles } from '@/styles/dashboard';
import Legend from '@/components/ui/DashboardLegend';
import useAggregateData from '@/utils/fetchApi';






export default function WeeklyDashboard() {
    const [weeklyData, setWeeklyData] = useState<WeeklyInsightsResponse | null>(null);

    const { data, loading } = useAggregateData('weekly', '2025-01-13', '2025-01-19');
    useEffect(() => {
      if (data) {
        setWeeklyData(data);
      }
    }, [data]);

    


    const parsedWeeklyMetrics = useMemo(() => {
        if (!weeklyData) return null;

        return {
           category_durations: weeklyData.aggregate.category_durations,

            pie_chart_durations: parseCategoryDurations(weeklyData),
            total_weekly_hours: format_Duration(weeklyData),
            category_metadata: weeklyData.category_metadata,
        };
    }, [weeklyData]);
    return (
        <ScrollView>
            <ThemedView style={styles.container}>
        {/* Main Dashboard Content */}
        <ThemedView style={styles.dashboardContainer}>
          {/* Study Time */}
          <ThemedView style={[styles.summarySection, { backgroundColor: Colors.light.surface }]}>
            {parsedWeeklyMetrics?.total_weekly_hours && (
              <TotalHours
                StudyTime={parsedWeeklyMetrics.total_weekly_hours}
              />
            )}
          </ThemedView>

          {/* Subject Distribution and Colors Side by Side */}
          <ThemedView style={styles.row}>
            {/* Subject Distribution */}
            <ThemedView style={[styles.subjectSection, { backgroundColor: Colors.light.surface }]}>
              {parsedWeeklyMetrics?.pie_chart_durations && (
                <CustomPieChart 
                  data={parsedWeeklyMetrics.pie_chart_durations}
                  size={100}
                />
              )}
            </ThemedView>

            {/* Colors Legend */}
            <ThemedView style={[styles.summarySection, { backgroundColor: Colors.light.surface, flex: 1 }]}>
              {parsedWeeklyMetrics?.category_durations && parsedWeeklyMetrics?.category_metadata && (
                <Legend
                  category_durations={parsedWeeklyMetrics.category_durations}
                  category_metadata={parsedWeeklyMetrics.category_metadata}
                />
              )}
               </ThemedView>
              </ThemedView>
            </ThemedView>
            </ThemedView>
        </ScrollView>
    )
}









  