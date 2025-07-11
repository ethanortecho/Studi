import React, { useMemo } from 'react';
import { View } from 'react-native';
import { CartesianChart, StackedBar } from 'victory-native';
import { ThemedText } from '@/components/ThemedText';
import { useFont } from '@shopify/react-native-skia';

// Map week numbers to display names
const WEEK_MAP: Record<number, string> = {
  1: 'W1',
  2: 'W2',
  3: 'W3',
  4: 'W4'
};

interface DailyBreakdownData {
  date: string;
  total_duration: number;
  category_durations: { [key: string]: number };
}

interface CategoryMetadata {
  name: string;
  color: string;
}

interface MonthlyBarchartProps {
  data?: DailyBreakdownData[];
  categoryMetadata?: { [key: string]: CategoryMetadata };
  width?: number;
  height?: number;
}

const MonthlyBarchart: React.FC<MonthlyBarchartProps> = ({ 
  data,
  categoryMetadata,
  width = 500,
  height = 150
}) => {
  const font = useFont(require('@/assets/fonts/Poppins-Regular.ttf'), 12);

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

    // Group daily data into 4 weeks
    const weeklyData: { [week: number]: { total: number; categories: { [key: string]: number } } } = {
      1: { total: 0, categories: {} },
      2: { total: 0, categories: {} },
      3: { total: 0, categories: {} },
      4: { total: 0, categories: {} }
    };

    // Sort data by date
    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Group into weeks (7 days each, remainder goes to last week)
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
        week: WEEK_MAP[week] || `W${week}`,
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
        week: WEEK_MAP[week] || `W${week}`,
        total: totalHours
      };
    });

    const categoryColors = categoryList.map(category => {
      const metadataEntry = Object.values(categoryMetadata).find(meta => meta.name === category);
      return metadataEntry?.color || '#CCCCCC';
    });

    const maxTotalHours = Math.max(...Object.values(weeklyData).map(week => week.total));

    return {
      chartData: transformedData,
      simpleChartData: simpleData,
      categories: categoryList,
      colors: categoryColors,
      maxTotal: maxTotalHours
    };
  }, [data, categoryMetadata]);

  if (!data || !categoryMetadata || categories.length === 0) {
    return (
      <View>
        <ThemedText className="text-secondaryText">No data available</ThemedText>
      </View>
    );
  }

  const currentData = chartData;
  const currentYKeys = categories;

  return (
      <View style={{ height: height ,width: 300}}>
        <CartesianChart
          data={currentData}
          xKey="week"
          yKeys={currentYKeys}
          domain={{ y: [0, Math.ceil(maxTotal * 1.2)] }}
          domainPadding={{ left: 15, right: 15 }}
          padding={{ left: 0, top: 0, right: 0, bottom: 0 }}
          xAxis={{
            font: font,
            tickCount: 4,
            lineColor: 'transparent',
            labelColor: '#71717a',
            formatXLabel: (value) => String(value)
          }}
          yAxis={[{
            font: font,
            tickCount: 4,
            lineColor: '#d4d4d8',
            labelColor: '#71717a',
            formatYLabel: (value) => `${value}h`
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
                innerPadding={0.4}
                barOptions={({ isBottom, isTop }) => ({
                  roundedCorners: isTop
                    ? { topLeft: 4, topRight: 4 }
                    : isBottom
                      ? { bottomLeft: 4, bottomRight: 4 }
                      : undefined,
                })}
              />
            );
          }}
        </CartesianChart>
      </View>
  );
};

export default MonthlyBarchart;