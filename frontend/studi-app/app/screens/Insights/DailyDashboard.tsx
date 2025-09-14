import React, { useState, useCallback } from 'react';
import { ScrollView, View, Text, RefreshControl } from 'react-native';
import { CategoryMetadata, TimelineSession } from '../../../types/api';
import DashboardKPIs from '../../../components/analytics/DashboardKPIs';
import MultiChartContainerV2 from '../../../components/analytics/MultiChartContainerV2';
import ProductivityContainer from '../../../components/analytics/productivity/ProductivityContainer';
import { DashboardData } from '../../../types/charts';

interface DailyDashboardProps {
  totalHours: string;
  totalTime?: { hours: number; minutes: number };
  percentGoal?: number | null;
  isRestDay?: boolean;
  categoryDurations?: { [key: string]: number };
  categoryMetadata?: { [key: string]: CategoryMetadata };
  pieChartData?: Array<{ label: string; value: number; color: string }>;
  timelineData?: TimelineSession[];
  rawData?: any;
  loading: boolean;
  isEmpty?: boolean;
  productivityScore?: number | null;
  allTimeAvgProductivity?: number | null;
  flowScore?: number | null;
  flowScoreDetails?: any;
  flowCoachingMessage?: string | null;
  isPremium?: boolean;
}

export default function DailyDashboard({
  totalHours,
  totalTime,
  percentGoal,
  isRestDay,
  categoryDurations,
  categoryMetadata,
  pieChartData,
  timelineData,
  rawData,
  loading,
  isEmpty,
  productivityScore,
  allTimeAvgProductivity,
  flowScore,
  flowScoreDetails,
  flowCoachingMessage,
  isPremium = false
}: DailyDashboardProps) {
  const [refreshing, setRefreshing] = useState(false);
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Clear cache for current data to force refresh
    const { clearDashboardCache } = await import('../../../utils/fetchApi');
    clearDashboardCache();
    
    // Wait a bit for data to reload
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);
  // Prepare dashboard data in the normalized format
  const dashboardData: DashboardData = {
    timeframe: 'daily',
    totalTime,
    percentGoal,
    categoryMetadata: categoryMetadata || {},
    categoryDurations: categoryDurations || {},
    pieChartData: pieChartData || [],
    timelineData: timelineData || [],
    isEmpty
  };

  return (
    <ScrollView 
      className="flex-1 " 
      contentContainerStyle={{ paddingBottom: 30 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#9333ea"
          colors={['#9333ea']}
          progressBackgroundColor="#1f1f2e"
        />
      }
    >
      {/* High-level KPIs */}
      {!isEmpty && (
        <DashboardKPIs
          totalTime={totalTime}
          percentGoal={isRestDay ? null : percentGoal}
          flowScore={flowScore !== null ? flowScore : undefined}
          isRestDay={isRestDay}
        />
      )}
      
      {/* Multi-chart container with new architecture */}
      <View className="mx-4 mb-4">
        <MultiChartContainerV2 
          dashboardData={dashboardData}
          showLegend={true}
        />
      </View>
      
      {/* Flow Score Gauge Container */}
      {!isEmpty && (
        <View className="mb-4">
          <ProductivityContainer 
            productivityScore={flowScore ?? null}
            allTimeAverage={allTimeAvgProductivity ?? null}
            loading={loading}
            coachingMessage={isPremium ? flowCoachingMessage : null}
          />
        </View>
      )}
      
    </ScrollView>
  );
}

