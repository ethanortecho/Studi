/**
 * MultiChartContainer V2
 * Refactored version with improved architecture:
 * - Uses chart registry for configuration
 * - Better state management with custom hook
 * - Cleaner separation of concerns
 * - Type-safe chart rendering
 */

import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import DashboardCard from '@/components/insights/DashboardContainer';
import Legend from '@/components/analytics/DashboardLegend';
import ChartNavigationButtons from './ChartNavigationButtons';
import { DashboardData } from '@/types/charts';
import { getChartsForTimeframe } from '@/config/chartRegistry';
import { useChartNavigation } from '@/hooks/useChartNavigation';

interface MultiChartContainerV2Props {
  dashboardData: DashboardData;
  showLegend?: boolean;
}

export default function MultiChartContainerV2({ 
  dashboardData,
  showLegend = true
}: MultiChartContainerV2Props) {
  // Get available charts for the current timeframe
  const chartsForTimeframe = getChartsForTimeframe(dashboardData.timeframe);
  
  // Use chart navigation hook for state management
  const {
    availableCharts,
    activeChartIndex,
    activeChart,
    setActiveChart,
    hasMultipleCharts
  } = useChartNavigation(chartsForTimeframe, dashboardData);

  // Handle empty state
  if (dashboardData.isEmpty || availableCharts.length === 0) {
    return (
      <DashboardCard className="bg-background border border-surface rounded-[35px]">
        <View className="items-center justify-center py-16">
          <Text className="text-md text-secondaryText">
            {`No data available for this ${
              dashboardData.timeframe === 'weekly' ? 'week' : 
              dashboardData.timeframe === 'monthly' ? 'month' : 
              'day'
            }.`}
          </Text>
        </View>
      </DashboardCard>
    );
  }

  // Get chart data for active chart
  const activeChartData = activeChart?.getData(dashboardData);
  
  // Fixed height for consistent container size across all chart types
  const FIXED_CHART_HEIGHT = 175;

  // Calculate page width for chart container
  const PAGE_WIDTH = Dimensions.get('window').width - 32; // Account for margins

  return (
    <DashboardCard className="bg-background border border-surface rounded-[35px]">
      {/* Title */}
      <View className="pt-6 pb-6">
        <Text className="text-lg  text-primaryText text-center">
          Your Study Story
        </Text>
      </View>

      {/* Active Chart Display */}
      <View 
        className="items-center justify-center" 
        style={{ height: FIXED_CHART_HEIGHT, width: PAGE_WIDTH }}
      >
        {activeChart && activeChart.component && activeChartData && (
          <activeChart.component 
            data={activeChartData} 
            width={PAGE_WIDTH - 40} 
            height={FIXED_CHART_HEIGHT}
          />
        )}
      </View>

      {/* Legend - show for charts with category-specific data based on timeframe */}
      {showLegend && activeChart && (
        (dashboardData.timeframe === 'daily' && ['subjects', 'sessions', 'map'].includes(activeChart.id)) ||
        (dashboardData.timeframe !== 'daily' && ['subjects', 'trends'].includes(activeChart.id))
      ) && (
        <View className="items-center justify-center pt-6 pb-6 px-4">
          <Legend 
            category_durations={dashboardData.categoryDurations} 
            category_metadata={dashboardData.categoryMetadata} 
          />
        </View>
      )}

      {/* Navigation Buttons */}
      {hasMultipleCharts && (
        <ChartNavigationButtons
          charts={availableCharts}
          activeIndex={activeChartIndex}
          onChartSelect={setActiveChart}
        />
      )}
    </DashboardCard>
  );
}