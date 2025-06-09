import React, { useMemo } from 'react';
import { View } from 'react-native';
import { CartesianChart, StackedBar } from 'victory-native';
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

    const dayOrder = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
    const sortedDays = Object.keys(data).sort((a, b) => 
      dayOrder.indexOf(a) - dayOrder.indexOf(b)
    );

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

    const simpleData = sortedDays.map(day => {
      const totalSeconds = data[day]?.total || 0;
      const hours = Math.round(totalSeconds / 3600 * 100) / 100;
      return {
        day: DAY_MAP[day] || day,
        total: hours
      };
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
      simpleChartData: simpleData,
      categories: categoryList,
      colors: categoryColors,
      maxTotal: maxTotalHours
    };
  }, [data, categoryMetadata]);

  if (!data || !categoryMetadata || categories.length === 0) {
    return (
      <View>
        <ThemedText className="text-gray-500">No data available</ThemedText>
      </View>
    );
  }

  const currentData = chartData;
  const currentYKeys = categories;

  return (
      <View style={{ height: height ,width: 300}}>
        <CartesianChart
          data={currentData}
          xKey="day"
          yKeys={currentYKeys}
          domain={{ y: [0, Math.ceil(maxTotal * 1.2)] }}
          domainPadding={{ left: 15, right: 15 }}
          padding={{ left: 0, top: 0, right: 0, bottom: 0 }}
          xAxis={{
            font: font,
            tickCount: 7,
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

export default WeeklyBarchart; 