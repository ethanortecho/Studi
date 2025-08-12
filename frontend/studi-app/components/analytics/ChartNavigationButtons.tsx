import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChartConfig } from '@/types/charts';

interface ChartNavigationButtonsProps {
  charts: ChartConfig[];
  activeIndex: number;
  onChartSelect: (index: number) => void;
}

export default function ChartNavigationButtons({ 
  charts, 
  activeIndex, 
  onChartSelect 
}: ChartNavigationButtonsProps) {
  return (
    <>
      {/* Divider line */}
      <View className="h-[1px] bg-surface mx-6 mb-4" />
      
      {/* Button container */}
      <View className="flex-row justify-center items-center gap-8 pb-4">
        {charts.map((chart, index) => {
          const isActive = index === activeIndex;
          
          return (
            <TouchableOpacity
              key={chart.id}
              onPress={() => onChartSelect(index)}
              className="py-2"
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`View ${chart.label} chart`}
            >
              <Text 
                className={`text-base font-medium ${
                  isActive ? 'text-primaryText' : 'text-secondaryText'
                }`}
              >
                {chart.label}
              </Text>
              
              {/* Active indicator line */}
              {isActive && (
                <View className="absolute -bottom-2 left-0 right-0 h-[2px] bg-primaryText rounded-full" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );
}