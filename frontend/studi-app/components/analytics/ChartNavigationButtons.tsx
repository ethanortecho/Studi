import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChartConfig } from '../../types/charts';

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
      {/* Segmented top line - each button gets its own section */}
      <View className="flex-row mx-6 mb-4">
        {charts.map((chart, index) => {
          const isActive = index === activeIndex;
          
          return (
            <View 
              key={`line-${chart.id}`}
              className="flex-1"
            >
              <View 
                className={`h-[1px] ${isActive ? 'bg-primaryText opacity-60' : 'bg-surface'}`}
              />
            </View>
          );
        })}
      </View>
      
      {/* Button container - matches line segment distribution */}
      <View className="flex-row mx-6 pb-4">
        {charts.map((chart, index) => {
          const isActive = index === activeIndex;
          
          return (
            <TouchableOpacity
              key={chart.id}
              onPress={() => onChartSelect(index)}
              className="flex-1 py-2 items-center"
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`View ${chart.label} chart`}
            >
              <View style={{ width: 80 }} className="items-center">
                <Text 
                  className={`text-base font-medium ${
                    isActive ? 'text-primaryText' : 'text-secondaryText'
                  }`}
                >
                  {chart.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );
}