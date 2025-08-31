import React, { useState, useCallback } from 'react';
import { View, ScrollView, Text, RefreshControl } from 'react-native';
import { CategoryMetadata } from '../../../types/api';
import DashboardKPIs from '../../../components/analytics/DashboardKPIs';
import MultiChartContainerV2 from '../../../components/analytics/MultiChartContainerV2';
import { DashboardData } from '../../../types/charts';
import { PremiumGate } from '../../../components/premium/PremiumGate';

interface MonthlyDashboardProps {
  totalHours: number;
  totalTime: { hours: number; minutes: number };
  percentGoal: number | null;
  categoryDurations?: { [key: string]: number };
  categoryMetadata?: { [key: string]: CategoryMetadata };
  pieChartData?: Array<{ label: string; value: number; color: string }>;
  dailyBreakdown?: Array<{ date: string; total_duration: number; category_durations: { [key: string]: number } }>;
  heatmapData?: { [date: string]: number };
  monthDate: Date;
  rawData?: any;
  loading: boolean;
  isEmpty: boolean;
  flowScore?: number | null;
  flowCoachingMessage?: string | null;
  isPremium?: boolean;
}

export default function MonthlyDashboard({
  totalHours,
  totalTime,
  percentGoal,
  categoryDurations,
  categoryMetadata,
  pieChartData,
  dailyBreakdown,
  heatmapData,
  monthDate,
  rawData,
  loading,
  isEmpty,
  flowScore,
  flowCoachingMessage,
  isPremium = false
}: MonthlyDashboardProps) {
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
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Loading...</Text>
      </View>
    );
  }

  // Prepare dashboard data in the normalized format
  const dashboardData: DashboardData = {
    timeframe: 'monthly',
    totalTime,
    percentGoal,
    categoryMetadata: categoryMetadata || {},
    categoryDurations: categoryDurations || {},
    pieChartData: pieChartData || [],
    monthlyChartData: dailyBreakdown,
    heatmapData: heatmapData || {},
    monthDate,
    isEmpty
  };

  return (
    <PremiumGate
      feature="monthly_dashboard"
      showUpgradePrompt={true}
    >
      <ScrollView 
        className="flex-1" 
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
            percentGoal={percentGoal}
            flowScore={flowScore ?? undefined}
          />
        )}
        
        {/* Multi-chart container with new architecture */}
        <View className="mx-4 mb-4">
          <MultiChartContainerV2 
            dashboardData={dashboardData}
            showLegend={true}
          />
        </View>
        
      </ScrollView>
    </PremiumGate>
  );
}

