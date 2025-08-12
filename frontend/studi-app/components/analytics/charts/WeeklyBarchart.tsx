import React, { useMemo } from 'react';
import { View, Dimensions, Text } from 'react-native';

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
  width,
  height = 150,
  isEmpty = false
}) => {
  // Don't render if no data available
  if (isEmpty) {
    return null;
  }
  
  // Calculate responsive width with proper margins
  const screenWidth = Dimensions.get('window').width;
  const responsiveWidth = width || Math.max(280, Math.min(screenWidth - 80, 360));

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

  // Calculate proper Y-axis domain to avoid negative values and handle small data
  const yAxisMax = Math.max(1, Math.ceil(maxTotal * 1.2));

  // Layout constants for simple custom bars
  const chartHeight = Math.max(120, (height ?? 150));
  const labelAreaHeight = 18; // space for x-axis labels
  const drawableHeight = chartHeight - labelAreaHeight;
  const numBars = timeframe === 'weekly' ? 7 : 4;
  const barGap = timeframe === 'weekly' ? 8 : 16;
  const totalGap = barGap * (numBars - 1);
  const barWidth = (responsiveWidth - totalGap) / numBars;

  return (
    <View style={{ width: responsiveWidth, height: chartHeight, justifyContent: 'flex-end' }}>
      {/* Bars */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: drawableHeight }}>
        {chartData.map((periodData: any, idx: number) => {
          const totalForPeriod = categories.reduce((sum, cat) => sum + (periodData[cat] || 0), 0);
          const barTotalHeight = yAxisMax === 0 ? 0 : (totalForPeriod / yAxisMax) * (drawableHeight - 6);

          return (
            <View key={idx} style={{ width: barWidth, marginRight: idx === chartData.length - 1 ? 0 : barGap, justifyContent: 'flex-end' }}>
              <View style={{ width: '100%', height: barTotalHeight, justifyContent: 'flex-end', overflow: 'hidden', borderTopLeftRadius: 4, borderTopRightRadius: 4 }}>
                {categories.map((cat) => {
                  const hours = periodData[cat] || 0;
                  if (hours <= 0) return null;
                  const segHeight = (hours / yAxisMax) * (drawableHeight - 6);
                  const colorIndex = categories.indexOf(cat);
                  const color = colors[colorIndex] || '#CCCCCC';
                  return (
                    <View key={`${idx}-${cat}`} style={{ width: '100%', height: segHeight, backgroundColor: color }} />
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>

      {/* X-axis labels */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
        {simpleChartData.map((d) => (
          <Text key={d.period} style={{ fontSize: 10, color: '#71717a', width: barWidth, textAlign: 'center' }}>{String(d.period)}</Text>
        ))}
      </View>
    </View>
  );
};

export default WeeklyBarchart; 