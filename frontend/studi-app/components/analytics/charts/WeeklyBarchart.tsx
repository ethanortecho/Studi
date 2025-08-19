import React, { useMemo, useEffect } from 'react';
import { View, Dimensions } from 'react-native';
import { CartesianChart, StackedBar } from 'victory-native';
import { ThemedText } from '../../ThemedText';
import { useFont } from '@shopify/react-native-skia';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';

// Map short day codes to labels
const DAY_MAP: Record<string, string> = {
  'MO': 'Mo',  // Monday
  'TU': 'Tu',  // Tuesday
  'WE': 'We',  // Wednesday
  'TH': 'Th',  // Thursday
  'FR': 'Fr',  // Friday
  'SA': 'Sa',  // Saturday
  'SU': 'Su'   // Sunday
};

// Map week numbers to display names
const WEEK_MAP: Record<number, string> = {
  1: 'W1',
  2: 'W2',
  3: 'W3',
  4: 'W4'
};

interface DailyBreakdownData {
  [date: string]: {
    total: number;
    categories?: { [key: string]: number };
  };
}

interface MonthlyBreakdownData {
  date: string;
  total_duration: number;
  category_durations: { [key: string]: number };
}

interface CategoryMetadata {
  name: string;
  color: string;
}

interface WeeklyBarchartProps {
  data?: DailyBreakdownData | MonthlyBreakdownData[];
  categoryMetadata?: { [key: string]: CategoryMetadata };
  timeframe?: 'weekly' | 'monthly';
  width?: number;
  height?: number;
  isEmpty?: boolean; // When true, component should not render
}

const WeeklyBarchart: React.FC<WeeklyBarchartProps> = ({ 
  data,
  categoryMetadata,
  timeframe = 'weekly',
  width = 500,
  height = 100, // Shorter like Apple's design
  isEmpty = false
}) => {
  // Don't render if no data available
  if (isEmpty) {
    return null;
  }
  const font = useFont(require('../../../assets/fonts/Poppins-Regular.ttf'), 12);

  // Animation values
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.95);

  // Trigger animation on mount
  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 250,
      easing: Easing.out(Easing.cubic),
    });
    scale.value = withTiming(1, {
      duration: 250,
      easing: Easing.out(Easing.cubic),
    });
  }, []);

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  const { chartData, simpleChartData, categories, colors, maxTotal } = useMemo(() => {
    if (!data || !categoryMetadata) {
      return { 
        chartData: [], 
        simpleChartData: [],
        categories: [], 
        colors: [], 
        maxTotal: 0
      };
    }

    if (timeframe === 'weekly') {
      // Weekly data processing (original logic)
      const weeklyData = data as DailyBreakdownData;
      const dayOrder = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
      const sortedDays = Object.keys(weeklyData).sort((a, b) => 
        dayOrder.indexOf(a) - dayOrder.indexOf(b)
      );

      const allCategories = new Set<string>();
      Object.values(weeklyData).forEach(dayData => {
        if (dayData.categories) {
          Object.keys(dayData.categories).forEach(cat => allCategories.add(cat));
        }
      });
      const categoryList = Array.from(allCategories);

      const transformedData = sortedDays.map(day => {
        const dayData: any = {
          period: DAY_MAP[day] || day,
        };
        
        categoryList.forEach(category => {
          const seconds = weeklyData[day]?.categories?.[category] || 0;
          const hours = Math.round(seconds / 3600 * 100) / 100;
          dayData[category] = hours;
        });
        
        return dayData;
      });

      const simpleData = sortedDays.map(day => {
        const totalSeconds = weeklyData[day]?.total || 0;
        const hours = Math.round(totalSeconds / 3600 * 100) / 100;
        return {
          period: DAY_MAP[day] || day,
          total: hours
        };
      });

      const dayTotals = sortedDays.map(day => {
        const totalSeconds = weeklyData[day]?.total || 0;
        return Math.round(totalSeconds / 3600 * 100) / 100;
      }).filter(total => total > 0);
      const maxTotalHours = dayTotals.length > 0 ? Math.max(...dayTotals) : 0;

      const categoryColors = categoryList.map(category => {
        const metadataEntry = categoryMetadata ? Object.values(categoryMetadata).find(meta => meta.name === category) : null;
        return metadataEntry?.color || '#CCCCCC';
      });

      return {
        chartData: transformedData,
        simpleChartData: simpleData,
        categories: categoryList,
        colors: categoryColors,
        maxTotal: maxTotalHours
      };
    } else {
      // Monthly data processing (group daily data into 4 weeks)
      const monthlyData = data as MonthlyBreakdownData[];
      
      // Group daily data into 4 weeks
      const weeklyData: { [week: number]: { total: number; categories: { [key: string]: number } } } = {
        1: { total: 0, categories: {} },
        2: { total: 0, categories: {} },
        3: { total: 0, categories: {} },
        4: { total: 0, categories: {} }
      };

      // Sort data by date and group into weeks
      const sortedData = monthlyData ? [...monthlyData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) : [];

      sortedData.forEach((dayData, index) => {
        const weekNumber = Math.min(Math.floor(index / 7) + 1, 4);
        
        // Add total duration (convert to hours)
        const hours = Math.round(dayData.total_duration * 100) / 100;
        weeklyData[weekNumber].total += hours;
        
        // Add category durations
        Object.entries(dayData.category_durations).forEach(([category, seconds]) => {
          const categoryHours = Math.round(seconds / 3600 * 100) / 100;
          if (!weeklyData[weekNumber].categories[category]) {
            weeklyData[weekNumber].categories[category] = 0;
          }
          weeklyData[weekNumber].categories[category] += categoryHours;
        });
      });

      // Get all categories
      const allCategories = new Set<string>();
      Object.values(weeklyData).forEach(weekData => {
        Object.keys(weekData.categories).forEach(cat => allCategories.add(cat));
      });
      const categoryList = Array.from(allCategories);

      // Transform data for chart
      const transformedData = [1, 2, 3, 4].map(week => {
        const weekData: any = {
          period: WEEK_MAP[week] || `W${week}`,
        };
        
        categoryList.forEach(category => {
          const hours = weeklyData[week]?.categories?.[category] || 0;
          weekData[category] = hours;
        });
        
        return weekData;
      });

      const simpleData = [1, 2, 3, 4].map(week => {
        const totalHours = weeklyData[week]?.total || 0;
        return {
          period: WEEK_MAP[week] || `W${week}`,
          total: totalHours
        };
      });

      const weeklyTotals = Object.values(weeklyData).map(week => week.total).filter(total => total > 0);
      const maxTotalHours = weeklyTotals.length > 0 ? Math.max(...weeklyTotals) : 0;

      const categoryColors = categoryList.map(category => {
        const metadataEntry = categoryMetadata ? Object.values(categoryMetadata).find(meta => meta.name === category) : null;
        return metadataEntry?.color || '#CCCCCC';
      });

      return {
        chartData: transformedData,
        simpleChartData: simpleData,
        categories: categoryList,
        colors: categoryColors,
        maxTotal: maxTotalHours
      };
    }
  }, [data, categoryMetadata, timeframe]);

  // Data validation is now handled by parent isEmpty prop
  if (!data || !categoryMetadata || categories.length === 0) {
    return null;
  }

  const currentData = chartData;
  const currentYKeys = categories;

  return (
    <Animated.View style={[{ height: height, width: 300 }, animatedStyle]}>
      <CartesianChart
        data={currentData}
        xKey="period"
        yKeys={currentYKeys}
        domain={{ y: [0, Math.ceil(maxTotal * 1.2)] }} // Add 20% padding to accommodate all ticks
        domainPadding={{ left: timeframe === 'weekly' ? 20 : 50, right: timeframe === 'weekly' ? 20 : 50 }}
        padding={{ left: 0, top: 5, right: 0, bottom: 0 }}
        xAxis={{
          font: font,
          tickCount: timeframe === 'weekly' ? 7 : 4,
          lineColor: 'transparent',
          labelColor: '#6B7280',
          formatXLabel: (value) => String(value),
          labelOffset: 2,
        }}
        yAxis={[{
          font: font,
          tickCount: 4, // Fixed tick count for consistent gridlines
          lineColor: '#2D2E6F',
          lineWidth: 1, // Ensure lines are visible
          labelColor: '#6B7280',
          formatYLabel: (value) => value > 0 ? `${value}h` : '0'
        }]}
      >
        {({ points, chartBounds }) => {
          const pointsArray = categories.map(category => points[category]);
          return (
            <StackedBar
              chartBounds={chartBounds}
              points={pointsArray}
              colors={colors}
              animate={{ type: "timing", duration: 300 }}
              innerPadding={ timeframe === 'weekly' ? 0.5 : 0.65} // Thinner bars
              barOptions={({ isBottom, isTop }) => ({
                roundedCorners: isTop
                  ? { topLeft: 3, topRight: 3 } // Smaller radius
                  : isBottom
                    ? { bottomLeft: 0, bottomRight: 0 }
                    : undefined,
              })}
            />
          );
        }}
      </CartesianChart>
    </Animated.View>
  );
};

export default WeeklyBarchart; 