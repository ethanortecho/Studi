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
import DashboardCard from '../insights/DashboardContainer';
import Legend from './DashboardLegend';
import ChartNavigationButtons from './ChartNavigationButtons';
import { DashboardData } from '../../types/charts';
import { getChartsForTimeframe } from '../../config/chartRegistry';
import { useChartNavigation } from '../../hooks/useChartNavigation';
import { usePremium } from '../../contexts/PremiumContext';
import { PremiumGate } from '../premium/PremiumGate';
import { getMockupForFeature } from '../../config/premiumMockups';

interface MultiChartContainerV2Props {
  dashboardData: DashboardData;
  showLegend?: boolean;
}

export default function MultiChartContainerV2({ 
  dashboardData,
  showLegend = true
}: MultiChartContainerV2Props) {
  const { isPremium } = usePremium();
  
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
  
  // Dynamic height based on whether chart shows legend
  const FIXED_CHART_HEIGHT = 210;
  const LEGEND_HEIGHT = 80; // Approximate height of legend space
  
  // Calculate if current chart should show legend
  const isShowingPremiumMockup = activeChart && activeChart.requiresPremium && !isPremium;
  const shouldShowLegend = showLegend && activeChart && !isShowingPremiumMockup && (
    (dashboardData.timeframe === 'daily' && ['subjects', 'sessions', 'map'].includes(activeChart.id)) ||
    (dashboardData.timeframe !== 'daily' && ['subjects', 'trends'].includes(activeChart.id))
  );
  
  // Use larger height for charts without legends (like map in weekly/monthly)
  const chartHeight = shouldShowLegend ? FIXED_CHART_HEIGHT : FIXED_CHART_HEIGHT + LEGEND_HEIGHT;

  // Calculate page width for chart container
  const PAGE_WIDTH = Dimensions.get('window').width - 32; // Account for margins

  return (
    <DashboardCard className="bg-background border border-surface rounded-[35px]">
      {/* Header */}
      <View className="p-6 pb-2">
        <Text className="text-lg font-semibold text-primaryText">Your Study Story</Text>
        <Text className="text-sm text-secondaryText mt-1">Charts describing the what and when</Text>
      </View>

      {/* Active Chart Display */}
      <View 
        className="items-center justify-center" 
        style={{ height: chartHeight, width: PAGE_WIDTH }}
      >
        {(() => {
          if (activeChart?.id === 'sessions') {
            console.log('Sessions chart debug:', {
              hasActiveChart: !!activeChart,
              hasComponent: !!activeChart?.component,
              hasData: !!activeChartData,
              dataKeys: activeChartData ? Object.keys(activeChartData) : null,
              timelineLength: activeChartData?.timelineData?.length
            });
          }
          
          if (activeChart && activeChart.requiresPremium && !isPremium) {
            // Get mockup image for this chart type
            const mockup = getMockupForFeature(`${activeChart.id}_chart_${dashboardData.timeframe}`) || 
                          getMockupForFeature(`${activeChart.id}_chart`) ||
                          getMockupForFeature('map_chart_' + dashboardData.timeframe);
            
            return (
              <PremiumGate 
                feature={`${activeChart.id}_chart_${dashboardData.timeframe}`}
                showUpgradePrompt={true}
                mockupImage={mockup?.image}
                mockupImageStyle={{
                  width: PAGE_WIDTH - 40,
                  height: chartHeight,
                  ...mockup?.defaultStyle
                }}
              />
            );
          }
          
          if (activeChart && activeChart.component && activeChartData) {
            const ChartComponent = activeChart.component;
            return (
              <ChartComponent 
                data={activeChartData} 
                width={PAGE_WIDTH - 40} 
                height={chartHeight}
              />
            );
          }
          
          return null;
        })()}
      </View>

      {/* Legend - show for charts with category-specific data based on timeframe */}
      {shouldShowLegend && (
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
