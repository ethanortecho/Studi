import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { parseCategoryDurations, ParseStudyTrends } from '@/utils/parseData';
import { format_Duration } from '@/utils/parseData';
import CustomPieChart from '@/components/charts/CustomPieChart';
import { WeeklyInsightsResponse } from '@/types/api';
import { ScrollView, View, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import TotalHours from '@/components/TotalHoursLayout';
import Legend from '@/components/ui/DashboardLegend';
import { dashboardStyles as styles } from '@/styles/dashboard';
import useAggregateData from '@/utils/fetchApi';
import WeeklyTrendsGraph from '@/components/charts/WeeklyTrendsGraph';
import StudyHeatmap from '@/components/charts/StudyHeatmap';
import DebugDataViewer from '@/components/ui/DebugDataViewer';

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
            trend_data: ParseStudyTrends(weeklyData.daily_breakdown, 'all'),
            session_times: weeklyData.session_times,
        };
    }, [weeklyData]);
    
    return (
        <ScrollView contentContainerStyle={localStyles.scrollContent}>
            <ThemedView style={styles.container}>
                {/* Main Dashboard Content */}
                <ThemedView style={styles.dashboardContainer}>
                    {/* Study Time */}
                    <View className="bg-white rounded-lg p-4">
                        {parsedWeeklyMetrics?.total_weekly_hours && (
                            <TotalHours
                                StudyTime={parsedWeeklyMetrics.total_weekly_hours}
                            />
                        )}
                    </View>

                    {/* Subject Distribution and Colors Side by Side */}
                    <View className="flex-row gap-2.5">
                        {/* Subject Distribution */}
                        <View className="flex-1 items-center justify-center bg-white rounded-lg p-4">
                            {parsedWeeklyMetrics?.pie_chart_durations && (
                                <CustomPieChart 
                                    data={parsedWeeklyMetrics.pie_chart_durations}
                                    size={100}
                                />
                            )}
                        </View>

                        {/* Colors Legend */}
                        <View className="flex-1 bg-white rounded-lg p-4">
                            {parsedWeeklyMetrics?.category_durations && parsedWeeklyMetrics?.category_metadata && (
                                <Legend
                                    category_durations={parsedWeeklyMetrics.category_durations}
                                    category_metadata={parsedWeeklyMetrics.category_metadata}
                                />
                            )}
                        </View>
                    </View>
                    
                    {/* Weekly Trends Graph */}
                    <View className="bg-white rounded-lg p-4">
                        {weeklyData?.daily_breakdown && weeklyData?.category_metadata && (
                            <WeeklyTrendsGraph
                                data={weeklyData.daily_breakdown}
                                categoryMetadata={weeklyData.category_metadata}
                            />
                        )}
                    </View>
                  
                    {/* Study Time Heatmap */}
                    <View className="bg-white rounded-lg p-4">
                        {parsedWeeklyMetrics?.session_times && (
                            <StudyHeatmap
                                sessionTimes={parsedWeeklyMetrics.session_times}
                            />
                        )}
                    </View>
                  
                    {/* Debug Data Viewer */}
                    <View className="mt-2.5 mb-5 w-full">
                        {weeklyData && (
                            <DebugDataViewer 
                                data={weeklyData} 
                                label="Weekly Dashboard Raw Data" 
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
    }
});









  