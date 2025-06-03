import React, { useMemo, useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, Animated } from 'react-native';
import { CartesianChart, StackedBar, Bar } from 'victory-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useFont } from '@shopify/react-native-skia';
import { Text as SkiaText } from "@shopify/react-native-skia";

// Map short day codes to full day names
const DAY_MAP: Record<string, string> = {
  'MO': 'Mon',
  'TU': 'Tue',
  'WE': 'Wed',
  'TH': 'Thu',
  'FR': 'Fri',
  'SA': 'Sat',
  'SU': 'Sun'
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

interface WeeklyTrendsGraphProps {
  data?: DailyBreakdownData;
  categoryMetadata?: { [key: string]: CategoryMetadata };
  width?: number;
  height?: number;
}

const WeeklyTrendsGraph: React.FC<WeeklyTrendsGraphProps> = ({ 
  data,
  categoryMetadata,
  width = 350,
  height = 300
}) => {
  // Add safety check for undefined data
  if (!data || !categoryMetadata) {
    return (
      <View className="bg-white rounded-lg p-4">
        <ThemedText className="text-lg font-semibold mb-4">Weekly Study Trends</ThemedText>
        <ThemedText className="text-gray-500">Loading weekly data...</ThemedText>
      </View>
    );
  }

  const [showCategories, setShowCategories] = useState(true);
  const switchAnim = useRef(new Animated.Value(1)).current;
  const font = useFont(require('@/assets/fonts/SpaceMono-Regular.ttf'), 12);

  useEffect(() => {
    Animated.spring(switchAnim, {
      toValue: showCategories ? 1 : 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8
    }).start();
  }, [showCategories]);

  const { chartData, categories, colors, maxTotal, simpleChartData, dailyTotals } = useMemo(() => {
    if (!data || !categoryMetadata) return { 
      chartData: [], 
      categories: [], 
      colors: [], 
      maxTotal: 0, 
      simpleChartData: [], 
      dailyTotals: {} 
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
      // Only process categories if they exist (days with no study time might not have categories field)
      if (dayData.categories) {
        Object.keys(dayData.categories).forEach(cat => allCategories.add(cat));
      }
    });
    const categoryList = Array.from(allCategories);

    // Calculate daily totals in hours
    const totals: Record<string, number> = {};
    sortedDays.forEach(day => {
      const totalSeconds = data[day]?.total || 0;
      totals[DAY_MAP[day] || day] = Math.round(totalSeconds / 3600 * 10) / 10;
    });

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
      simpleChartData: simpleData,
      dailyTotals: totals
    };
  }, [data, categoryMetadata]);

  if (!data || !categoryMetadata || categories.length === 0) {
    return (
      <View className="bg-white rounded-lg p-4">
        <ThemedText className="text-lg font-semibold mb-4">Weekly Study Trends</ThemedText>
        <ThemedText className="text-gray-500">No data available</ThemedText>
      </View>
    );
  }

  return (
    <View className="bg-white rounded-lg p-4">
      <ThemedText className="text-lg font-semibold mb-4">Weekly Study Trends</ThemedText>
      
      <View className="flex-row">
        <View className="flex-col justify-center items-center mr-2">
          <TouchableOpacity 
            onPress={() => setShowCategories(!showCategories)}
            className="w-4 h-16 bg-gray-200 rounded-full relative"
          >
            <Animated.View 
              style={{
                width: 16,
                height: 28,
                borderRadius: 999,
                backgroundColor: 'black',
                position: 'absolute',
                left: 0,
                transform: [{
                  translateY: switchAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [32, 2]
                  })
                }]
              }}
            />
          </TouchableOpacity>
        </View>
        
        <View className="flex-1 h-[300px]">
          <CartesianChart
            data={showCategories ? chartData : simpleChartData}
            xKey="day"
            yKeys={showCategories ? categories : ['total']}
            domain={{ y: [0, Math.ceil(maxTotal * 1.2)] }}
            domainPadding={{ left: 20, right: 20 }}
            padding={{ left: 45, top: 20, right: 20, bottom: 60 }}
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
                    barWidth={30}
                    barOptions={({ isBottom, isTop }) => ({
                      roundedCorners: isTop
                        ? { topLeft: 6, topRight: 6 }
                        : isBottom
                        ? { bottomLeft: 6, bottomRight: 6 }
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
                    barWidth={30}
                    roundedCorners={{ topLeft: 6, topRight: 6, bottomLeft: 6, bottomRight: 6 }}
                  />
                );
              }
            }}
          </CartesianChart>
        </View>
      </View>
    </View>
  );
};

export default WeeklyTrendsGraph;