import React, { useMemo, useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, Animated } from 'react-native';
import { CartesianChart, StackedBar, Bar } from 'victory-native';
import { ThemedText } from '@/components/ThemedText';
import { useFont } from '@shopify/react-native-skia';

// Map short day codes to full day names
const DAY_MAP: Record<string, string> = {
  'MO': 'Mo',
  'TU': 'Tu',
  'WE': 'We',
  'TH': 'Th',
  'FR': 'Fr',
  'SA': 'Sa',
  'SU': 'Su'
};

interface DailyBreakdownData {
  [date: string]: {
    total: number;
    categories?: { [key: string]: number };
  };
}

interface CategoryMetadata {
  name: string;
  color: string;
}

interface WeeklyBarchartProps {
  data?: DailyBreakdownData;
  categoryMetadata?: { [key: string]: CategoryMetadata };
  width?: number;
  height?: number;
}

const WeeklyBarchart: React.FC<WeeklyBarchartProps> = ({ 
  data,
  categoryMetadata,
  width = 350,
  height = 150
}) => {
  const [showCategories, setShowCategories] = useState(true);
  const switchAnim = useRef(new Animated.Value(1)).current;
  const font = useFont(require('@/assets/fonts/Poppins-Regular.ttf'), 12);

  useEffect(() => {
    Animated.spring(switchAnim, {
      toValue: showCategories ? 1 : 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8
    }).start();
  }, [showCategories]);

  const { chartData, categories, colors, maxTotal, simpleChartData } = useMemo(() => {
    if (!data || !categoryMetadata) return { 
      chartData: [], 
      categories: [], 
      colors: [], 
      maxTotal: 0, 
      simpleChartData: []
    };

    const dayOrder = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
    const sortedDays = Object.keys(data).sort((a, b) => 
      dayOrder.indexOf(a) - dayOrder.indexOf(b)
    );

    // Simple chart data with just total hours
    const simpleData = sortedDays.map(day => {
      const totalSeconds = data[day]?.total || 0;
      return {
        day: DAY_MAP[day] || day,
        total: Math.round(totalSeconds / 3600 * 10) / 10
      };
    });

    const allCategories = new Set<string>();
    Object.values(data).forEach(dayData => {
      if (dayData.categories) {
        Object.keys(dayData.categories).forEach(cat => allCategories.add(cat));
      }
    });
    // Note: Break category is now filtered at the data processing level
    const categoryList = Array.from(allCategories);

    const transformedData = sortedDays.map(day => {
      const dayData: any = {
        day: DAY_MAP[day] || day,
      };
      
      categoryList.forEach(category => {
        const seconds = data[day]?.categories?.[category] || 0;
        const hours = Math.round(seconds / 3600 * 100) / 100;
        dayData[category] = hours;
      });
      
      return dayData;
    });

    const categoryColors = categoryList.map(category => {
      const metadataEntry = Object.values(categoryMetadata).find(meta => meta.name === category);
      return metadataEntry?.color || '#CCCCCC';
    });

    const maxTotalHours = Math.max(...sortedDays.map(day => {
      const totalSeconds = data[day]?.total || 0;
      return Math.round(totalSeconds / 3600 * 100) / 100;
    }));

    return {
      chartData: transformedData,
      categories: categoryList,
      colors: categoryColors,
      maxTotal: maxTotalHours,
      simpleChartData: simpleData
    };
  }, [data, categoryMetadata]);

  if (!data || !categoryMetadata || categories.length === 0) {
    return (
      <View className="p-4">
        <ThemedText className="text-gray-500">No data available</ThemedText>
      </View>
    );
  }

  return (
    <View>
      {/* Chart Container */}
      <View style={{ height: height }} className="mb-4">
        <CartesianChart
          data={showCategories ? chartData : simpleChartData}
          xKey="day"
          yKeys={showCategories ? categories : ['total']}
          domain={{ y: [0, Math.ceil(maxTotal * 1.2)] }}
          domainPadding={{ left: 15, right: 15 }}
          padding={{ left: 0, top: 0, right: 0, bottom: 25 }}
          xAxis={{
            font: font,
            tickCount: 7,
            lineColor: '#d4d4d8',
            labelColor: '#71717a',
            formatXLabel: (value) => String(value)
          }}
          yAxis={[{
            font: font,
            tickCount: 6,
            lineColor: '#d4d4d8',
            labelColor: '#71717a',
            formatYLabel: (value) => `${value}h`
          }]}
        >
          {({ points, chartBounds }) => {
            if (showCategories) {
              const pointsArray = categories.map(category => points[category]);
              return (
                <StackedBar
                  chartBounds={chartBounds}
                  points={pointsArray}
                  colors={colors}
                  animate={{ type: "spring" }}
                  innerPadding={0.3}
                  barWidth={15}
                  barOptions={({ isBottom, isTop }) => ({
                    roundedCorners: isTop
                      ? { topLeft: 4, topRight: 4 }
                      : isBottom
                      ? { bottomLeft: 0, bottomRight: 0 }
                      : undefined,
                  })}
                />
              );
            } else {
              return (
                <Bar
                  chartBounds={chartBounds}
                  points={points.total}
                  color="#5A4FCF"
                  animate={{ type: "spring" }}
                  barWidth={20}
                  roundedCorners={{ topLeft: 6, topRight: 6, bottomLeft: 6, bottomRight: 6 }}
                />
              );
            }
          }}
        </CartesianChart>
      </View>

      {/* Horizontal Toggle Below Chart */}
      <View className="flex-row justify-center items-center">
        <TouchableOpacity 
          onPress={() => setShowCategories(!showCategories)}
          className="w-16 h-4 bg-gray-200 rounded-full relative"
        >
          <Animated.View 
            style={{
              width: 28,
              height: 16,
              borderRadius: 999,
              backgroundColor: 'black',
              position: 'absolute',
              top: 0,
              transform: [{
                translateX: switchAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [32, 2]
                })
              }]
            }}
          />
        </TouchableOpacity>
        <ThemedText className="ml-3 text-sm text-gray-600">
          {showCategories ? 'Categories' : 'Total'}
        </ThemedText>
      </View>
    </View>
  );
};

export default WeeklyBarchart; 