import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { ThemedView } from '@/components/ThemedView';
import { dashboardStyles } from '@/styles/dashboard';
import { formatDuration } from '@/utils/parseData';

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

interface StudyTrendItem {
  day: string;
  total_time?: number;
  time?: number;
}

interface WeeklyTrendsGraphProps {
  data: StudyTrendItem[];
  width?: number;
  height?: number;
}

const WeeklyTrendsGraph: React.FC<WeeklyTrendsGraphProps> = ({ 
  data,
  width = 300,
  height = 175  // Reduced from 240 to 200 for a shorter graph
}) => {
  // Sort days in correct order (Monday to Sunday)
  const sortedData = useMemo(() => {
    const dayOrder = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
    return [...data].sort((a, b) => 
      dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day)
    );
  }, [data]);

  // Get time values for each day
  const timeValues = useMemo(() => {
    return sortedData.map(item => 
      item.total_time !== undefined ? item.total_time : (item.time || 0)
    );
  }, [sortedData]);

  // Find max hour (rounded up to nearest hour)
  const maxHour = useMemo(() => {
    const maxSeconds = Math.max(...timeValues);
    return Math.ceil(maxSeconds / 3600);
  }, [timeValues]);

  // Define chart dimensions and constants
  const CHART_PADDING_TOP = 25; // Slightly reduced padding for smaller height
  const CHART_PADDING_BOTTOM = 30; // Slightly reduced padding for smaller height
  const Y_AXIS_WIDTH = 30;
  const BAR_WIDTH = 25;
  
  // Calculate available height for bar scaling
  const availableHeight = height - CHART_PADDING_TOP - CHART_PADDING_BOTTOM;
  
  // Calculate pixels per hour for consistent scaling
  const pixelsPerHour = availableHeight / maxHour;
  
  // Generate hour ticks (ensure we include all hours from 0 to maxHour)
  const hourTicks = useMemo(() => {
    return Array.from({ length: maxHour + 1 }, (_, i) => i);
  }, [maxHour]);

  // Format seconds to hours:minutes
  const formatTimeLabel = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 
      ? `${hours}h${minutes > 0 ? minutes + 'm' : ''}` 
      : `${minutes}m`;
  };

  return (
    <ThemedView style={[dashboardStyles.section, { backgroundColor: Colors.light.surface }]}>
      <ThemedText style={dashboardStyles.title}>Weekly Study Trends</ThemedText>
      
      <View style={{ height, width, flexDirection: 'row' }}>
        {/* Y-axis with hour labels */}
        <View style={{ width: Y_AXIS_WIDTH, height: '100%', position: 'relative' }}>
          {hourTicks.map(hour => (
            <ThemedText 
              key={hour} 
              style={{
                position: 'absolute',
                bottom: CHART_PADDING_BOTTOM + (hour * pixelsPerHour) - 6, // Centered on grid line
                right: 5,
                fontSize: 10,
                color: Colors.light.muted,
              }}
            >
              {hour}h
            </ThemedText>
          ))}
        </View>
        
        {/* Chart area */}
        <View style={{ 
          flex: 1, 
          height: '100%', 
          borderLeftWidth: 1, 
          borderBottomWidth: 1,
          borderColor: Colors.light.border,
          position: 'relative',
        }}>
          {/* Grid lines */}
          {hourTicks.map(hour => (
            <View 
              key={hour}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: CHART_PADDING_BOTTOM + (hour * pixelsPerHour),
                height: 1,
                backgroundColor: Colors.light.border,
                opacity: 0.5,
              }}
            />
          ))}
          
          {/* Bars */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: CHART_PADDING_BOTTOM, // Align with bottom grid line
            height: availableHeight,
          }}>
            {sortedData.map((item, index) => {
              const timeValue = timeValues[index];
              const hours = timeValue / 3600;
              const barHeight = Math.max(hours * pixelsPerHour, 2); // Ensure minimum visibility
              
              return (
                <View key={index} style={{ 
                  alignItems: 'center',
                  height: availableHeight,
                  justifyContent: 'flex-end'
                }}>
                  {/* Time label above bar */}
                  <ThemedText style={{ 
                    fontSize: 8, 
                    color: Colors.light.muted,
                    position: 'absolute',
                    bottom: barHeight + 4,
                    textAlign: 'center',
                    width: BAR_WIDTH + 10,
                  }}>
                    {formatTimeLabel(timeValue)}
                  </ThemedText>
                  
                  {/* Bar */}
                  <View style={{
                    width: BAR_WIDTH,
                    height: barHeight,
                    backgroundColor: '#3A4A8C',
                    borderTopLeftRadius: 4,
                    borderTopRightRadius: 4,
                  }} />
                  
                  {/* Day label */}
                  <ThemedText style={{ 
                    fontSize: 10, 
                    marginTop: 4,
                    position: 'absolute',
                    bottom: -20,
                    textAlign: 'center',
                    width: BAR_WIDTH,
                  }}>
                    {DAY_MAP[item.day]}
                  </ThemedText>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </ThemedView>
  );
};

export default WeeklyTrendsGraph; 