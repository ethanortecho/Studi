import React from 'react';
import { View, Text, Image } from 'react-native';
import ProductivityGauge from './ProductivityGauge';
import DashboardCard from '../../insights/DashboardContainer';
import { PremiumGate } from '../../premium/PremiumGate';
import { getMockupForFeature } from '../../../config/premiumMockups';

interface ProductivityContainerProps {
  productivityScore: number | null;
  allTimeAverage: number | null;
  loading?: boolean;
  coachingMessage?: string | null;
}

export default function ProductivityContainer({ 
  productivityScore,
  allTimeAverage,
  loading = false,
  coachingMessage
}: ProductivityContainerProps) {
  const mockup = getMockupForFeature('productivity_chart');
  
  // Debug logging
  console.log('ProductivityContainer Debug:', {
    featureId: 'productivity_chart',
    mockupFound: !!mockup,
    mockupId: mockup?.id,
    hasImage: !!mockup?.image,
    defaultStyle: mockup?.defaultStyle
  });
  
  return (
    <DashboardCard className="bg-background border border-accent rounded-[35px] mx-4 p-6">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-lg font-semibold text-primaryText">Your Flow Score</Text>
          <Text className="text-sm text-secondaryText mt-1">Learning quality based on focus, duration, breaks, and deep work</Text>
        </View>
        
        {/* Gauge Chart */}
        <View className="items-center">
          <PremiumGate
            feature="productivity_chart"
            mockupImage={mockup?.image}
            mockupImageStyle={{
              width: 200,
              height: 180,
              ...mockup?.defaultStyle
            }}
            displayMode="chart"
          >
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
          </PremiumGate>
        </View>
      
        {/* Legend (if we have data) */}
        {productivityScore !== null && !loading && (
          <View className="flex-row justify-center items-center gap-6">
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-sm bg-purple-600 mr-2" />
              <Text className="text-sm font-medium text-primaryText">Today's Score</Text>
            </View>
            {allTimeAverage !== null && (
              <View className="flex-row items-center">
                <View className="w-3 h-3 rounded-sm bg-gray-400 mr-2" />
                <Text className="text-sm font-medium text-primaryText">Your Average</Text>
              </View>
            )}
          </View>
        )}
        
        {/* Coaching Message */}
        {coachingMessage && (
          <View className="mt-4 px-4">
            <Text className="text-secondaryText text-sm text-center" numberOfLines={2}>
              {coachingMessage}
            </Text>
          </View>
        )}
      </DashboardCard>
  );
}