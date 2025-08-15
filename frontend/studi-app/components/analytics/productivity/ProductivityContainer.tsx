import React from 'react';
import { View, Text } from 'react-native';
import ProductivityGauge from './ProductivityGauge';
import DashboardCard from '@/components/insights/DashboardContainer';

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
    <DashboardCard className="bg-background border border-surface rounded-[35px] mx-4 p-6">
      {/* Header */}
      <View className="mb-4">
        <Text className="text-lg font-semibold text-primaryText">Your Focus Flow</Text>
        <Text className="text-sm text-secondaryText mt-1">How productive were your sessions today?</Text>
      </View>
      
      {/* Gauge Chart */}
      <View className="items-center">
        {loading ? (
          <View className="h-[200px] items-center justify-center">
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
        <View className="mt-4 flex-row justify-center items-center space-x-4">
          <View className="flex-row items-center">
            <View className="w-3 h-3 rounded-full bg-purple-600 mr-2" />
            <Text className="text-xs text-secondaryText">Today's Score</Text>
          </View>
          {allTimeAverage !== null && (
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full bg-gray-700 mr-2" />
              <Text className="text-xs text-secondaryText">Your Average</Text>
            </View>
          )}
        </View>
      )}
    </DashboardCard>
  );
}