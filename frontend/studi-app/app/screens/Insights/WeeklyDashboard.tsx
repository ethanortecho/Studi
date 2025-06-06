import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import CustomPieChart from '@/components/analytics/charts/CustomPieChart';
import TotalHours from '@/components/analytics/TotalHoursContainer';
import Legend from '@/components/analytics/DashboardLegend';
import WeeklyBarchartContainer from '@/components/analytics/WeeklyBarchartContainer';
import StudyHeatmap from '@/components/analytics/StudyHeatmap';
import DebugDataViewer from '@/components/analytics/DebugDataViewer';
import DashboardCard from '@/components/insights/DashboardContainer';
import { CategoryMetadata } from '@/types/api';

interface WeeklyDashboardProps {
  totalHours: string;
  totalTime?: { hours: number; minutes: number };
  categoryDurations?: { [key: string]: number };
  categoryMetadata?: { [key: string]: CategoryMetadata };
  pieChartData?: Array<{ label: string; value: number; color: string }>;
  trendData?: Array<{ day: string; total_time: number }>;
  sessionTimes?: Array<{ start_time: string; end_time: string; total_duration: number }>;
  dailyBreakdown?: { [date: string]: { total: number; categories: { [key: string]: number } } };
  rawData?: any;
  loading: boolean;
}

export default function WeeklyDashboard({
  totalHours,
  totalTime,
  categoryDurations,
  categoryMetadata,
  pieChartData,
  trendData,
  sessionTimes,
  dailyBreakdown,
  rawData,
  loading
}: WeeklyDashboardProps) {
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

        {/* Second Row: Subject Breakdown + Total Hours */}
        <View className="flex-row gap-4 px-4">
          {/* Subject Breakdown */}
          <View className="flex-2">
            <DashboardCard>
              <Text className="text-md font-bold text-category-purple mb-3">Subject Breakdown</Text>
              <View className="items-center justify-center">
                {pieChartData && (
                  <CustomPieChart 
                    data={pieChartData}
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
              <TotalHours totalHours={totalHours} totalTime={totalTime} />
            </View>
            
            {/* Placeholder component */}
            <View className="bg-gray-300 rounded-lg p-4 min-h-[72px]">
              {/* Empty placeholder */}
            </View>
          </View>
        </View>
        
        {/* Third Row: Weekly Trends + Another Component */}
        <View className="flex-row gap-4 px-4 pb-4">
          {/* Weekly Trends Graph */}
          <View className="flex-">
            <DashboardCard className="mb-0">
              {dailyBreakdown && categoryMetadata && Object.keys(dailyBreakdown).length > 0 ? (
                <WeeklyBarchartContainer
                  data={dailyBreakdown}
                  categoryMetadata={categoryMetadata}
                />
              ) : (
                <View className="p-4">
                  <Text className="text-gray-500">Loading weekly trends...</Text>
                </View>
              )}
            </DashboardCard>
          </View>

          {/* Right Component - Placeholder for your new component */}
          <View className="flex-1">
            <DashboardCard className="mb-0">
              <View className="p-4 min-h-[150px] items-center justify-center">
                <Text className="text-gray-500">Your new component goes here</Text>
              </View>
            </DashboardCard>
          </View>
        </View>

        {/* Study Time Heatmap */}
        <View className="px-4 pb-4">
          <Text className="text-lg font-semibold text-layout-dark-grey mb-3">Study Schedule</Text>
          <DashboardCard className="mb-0">
            {sessionTimes && (
              <StudyHeatmap
                sessionTimes={sessionTimes}
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
            label="Weekly Dashboard Raw Data" 
          />
        )}
      </View>
    </ScrollView>
  );
}









  