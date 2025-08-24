import React from 'react';
import { View, Text } from 'react-native';
import ProductivityGauge from './ProductivityGauge';
import DashboardCard from '../../insights/DashboardContainer';
import { PremiumGate } from '../../premium/PremiumGate';

interface ProductivityContainerProps {
  productivityScore: number | null;
  allTimeAverage: number | null;
  loading?: boolean;
}

export default function ProductivityContainer({ 
  productivityScore,
  allTimeAverage,
  loading = false
}: ProductivityContainerProps) {
  return (
    <PremiumGate
      feature="productivity_chart"
      fallback={
        <DashboardCard className="bg-background border border-accent rounded-[35px] mx-4 p-6">
          <View className="mb-8">
            <Text className="text-lg font-semibold text-primaryText">Your Flow Score</Text>
            <Text className="text-sm text-secondaryText mt-1">Learning quality based on session focus and duration</Text>
          </View>
          <PremiumGate feature="productivity_chart" showUpgradePrompt={true}>
            <View />
          </PremiumGate>
        </DashboardCard>
      }
    >
      <DashboardCard className="bg-background border border-accent rounded-[35px] mx-4 p-6">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-lg font-semibold text-primaryText">Your Flow Score</Text>
          <Text className="text-sm text-secondaryText mt-1">Learning quality based on session focus and duration</Text>
        </View>
        
        {/* Gauge Chart */}
        <View className="items-center">
          {loading ? (
            <View className="h-[180px] items-center justify-center">
              <Text className="text-secondaryText">Loading...</Text>
            </View>
          ) : (
            <ProductivityGauge 
              score={productivityScore}
              allTimeAverage={allTimeAverage}
              size={200}
            />
          )}
        </View>
      
      {/* Legend (if we have data) */}
      {productivityScore !== null && !loading && (
        <View className=" flex-row justify-center items-center gap-6">
          <View className="flex-row items-center">
            <View className="w-3 h-3 rounded-sm bg-purple-600 mr-2" />
            <Text className="text-sm font-medium text-primaryText">Today's Score</Text>
          </View>
          {allTimeAverage !== null && (
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-sm bg-gray-700 mr-2" />
              <Text className="text-sm font-medium text-primaryText">Your Average</Text>
            </View>
          )}
        </View>
      )}
    </DashboardCard>
    </PremiumGate>
  );
}