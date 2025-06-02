import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { parseCategoryDurations, ParseStudyTrends, secondsToHours } from '@/utils/parseData';
import CustomPieChart from '@/components/analytics/charts/CustomPieChart';
import { WeeklyInsightsResponse } from '@/types/api';
import { ScrollView, View, Text } from 'react-native';
import TotalHours from '@/components/analytics/TotalHoursContainer';
import Legend from '@/components/analytics/DashboardLegend';
import useAggregateData from '@/utils/fetchApi';
import WeeklyTrendsGraph from '@/components/analytics/WeeklyTrendsGraph';
import StudyHeatmap from '@/components/analytics/StudyHeatmap';
import DebugDataViewer from '@/components/analytics/DebugDataViewer';
import DashboardCard from '@/components/insights/DashboardContainer';


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
            total_weekly_hours: secondsToHours(weeklyData),
            category_metadata: weeklyData.category_metadata,
            trend_data: ParseStudyTrends(weeklyData.daily_breakdown, 'all'),
            session_times: weeklyData.session_times,
        };
    }, [weeklyData]);
    
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
                        {parsedWeeklyMetrics?.category_durations && parsedWeeklyMetrics?.category_metadata && (
                            <Legend
                                category_durations={parsedWeeklyMetrics.category_durations}
                                category_metadata={parsedWeeklyMetrics.category_metadata}
                            />
                        )}
                    </DashboardCard>
                </View>

                {/* Second Row: Subject Breakdown + Total Hours */}
                <View className="flex-row gap-4 px-4">
                    {/* Subject Breakdown */}
                    <View className="flex-1">
                        <DashboardCard>
                            <Text className="text-md font-bold text-category-purple mb-3">Subject Breakdown</Text>
                            <View className="items-center justify-center">
                                {parsedWeeklyMetrics?.pie_chart_durations && (
                                    <CustomPieChart 
                                        data={parsedWeeklyMetrics.pie_chart_durations}
                                        size={125}
                                    />
                                )}
                            </View>
                        </DashboardCard>
                    </View>

                    {/* Right Column: Total Hours + Placeholder */}
                    <View className="flex-1">
                        {/* Total Hours with grey-blue background */}
                        <View className="bg-layout-grey-blue rounded-lg p-4 mb-2.5">
                            <TotalHours dailyData={weeklyData} />
                        </View>
                        
                        {/* Placeholder component */}
                        <View className="bg-gray-300 rounded-lg p-4 min-h-[72px]">
                            {/* Empty placeholder */}
                        </View>
                    </View>
                </View>
                
                {/* Weekly Trends Graph */}
                <View className="px-4 pb-4">
                    <Text className="text-lg font-semibold text-layout-dark-grey mb-3">Weekly Trends</Text>
                    <DashboardCard className="mb-0">
                        {weeklyData?.daily_breakdown && weeklyData?.category_metadata && (
                            <WeeklyTrendsGraph
                                data={weeklyData.daily_breakdown}
                                categoryMetadata={weeklyData.category_metadata}
                            />
                        )}
                    </DashboardCard>
                </View>

                {/* Study Time Heatmap */}
                <View className="px-4 pb-4">
                    <Text className="text-lg font-semibold text-layout-dark-grey mb-3">Study Heatmap</Text>
                    <DashboardCard className="mb-0">
                        {parsedWeeklyMetrics?.session_times && (
                            <StudyHeatmap
                                sessionTimes={parsedWeeklyMetrics.session_times}
                            />
                        )}
                    </DashboardCard>
                </View>
            </View>
            
            {/* Debug Data Viewer (outside off-white container) */}
            <View className="mb-5 px-4">
                {weeklyData && (
                    <DebugDataViewer 
                        data={weeklyData} 
                        label="Weekly Dashboard Raw Data" 
                    />
                )}
            </View>
        </ScrollView>
    );
}









  