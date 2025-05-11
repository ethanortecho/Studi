import React, { useMemo } from 'react';
import { View, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { dashboardStyles } from '@/styles/dashboard';
import { parseSessionTimesForHeatmap } from '@/utils/parseData';

interface SessionTime {
  start_time: string;
  end_time: string;
  total_duration: number;
}

interface StudyHeatmapProps {
  sessionTimes: SessionTime[];
  width?: number;
  height?: number;
}

const StudyHeatmap: React.FC<StudyHeatmapProps> = ({
  sessionTimes,
  width = 300,
  height = 200
}) => {
  // Time labels (every 4 hours)
  const timeLabels = ['12', '4', '8', '12', '4', '8', '12'];
  
  // Day labels
  const dayLabels = [
    { code: 'MO', label: 'MO' },
    { code: 'TU', label: 'TU' },
    { code: 'WE', label: 'WE' },
    { code: 'TH', label: 'TH' },
    { code: 'FR', label: 'FR' },
    { code: 'SA', label: 'SA' },
    { code: 'SU', label: 'SU' }
  ];
  
  // Parse session times data for heatmap
  const { days, hours, heatmapData } = useMemo(() => {
    return parseSessionTimesForHeatmap(sessionTimes);
  }, [sessionTimes]);
  
  // Calculate dimensions
  const cellHeight = 30;
  const cellWidth = 40;
  const timeAxisWidth = 30;
  const totalGridHeight = height - 50; // Leave space for day labels
  
  // Convert hour to y position in the grid
  const hourToGridPosition = (hour: number) => {
    return ((hour % 12 === 0 ? 12 : hour % 12) / 12) * (totalGridHeight / 2);
  };
  
  // Group hours for 4-hour intervals
  const getHourGroup = (hour: number) => {
    if (hour >= 0 && hour < 4) return 0;   // 12am-4am
    if (hour >= 4 && hour < 8) return 1;   // 4am-8am
    if (hour >= 8 && hour < 12) return 2;  // 8am-12pm
    if (hour >= 12 && hour < 16) return 3; // 12pm-4pm
    if (hour >= 16 && hour < 20) return 4; // 4pm-8pm
    return 5;                             // 8pm-12am
  };

  return (
    <ThemedView style={[dashboardStyles.section, { backgroundColor: Colors.light.surface }]}>
      <ThemedText style={dashboardStyles.title}>Study Time Heatmap</ThemedText>
      
      <View style={{ marginTop: 15, flexDirection: 'row' }}>
        {/* Time labels (y-axis) */}
        <View style={{ width: timeAxisWidth }}>
          {timeLabels.map((label, index) => (
            <View 
              key={`time-${index}`}
              style={{
                position: 'absolute',
                top: index * (totalGridHeight / 6),
                right: 5,
                height: 20,
                justifyContent: 'center'
              }}
            >
              <ThemedText style={{ fontSize: 10, color: Colors.light.muted }}>
                {label}
              </ThemedText>
            </View>
          ))}
        </View>
        
        {/* Main grid area */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'column' }}>
            {/* Day labels (x-axis) */}
            <View style={{ 
              flexDirection: 'row', 
              marginLeft: 0, 
              height: 20, 
              marginBottom: 5 
            }}>
              {dayLabels.map((day, index) => (
                <ThemedText 
                  key={`day-${index}`}
                  style={{ 
                    width: cellWidth, 
                    textAlign: 'center',
                    fontSize: 12,
                    fontWeight: '500'
                  }}
                >
                  {day.label}
                </ThemedText>
              ))}
            </View>
            
            {/* Grid with hour rows and day columns */}
            <View style={{ 
              width: dayLabels.length * cellWidth,
              height: totalGridHeight,
              position: 'relative'
            }}>
              {/* Horizontal grid lines (for hours) */}
              {timeLabels.map((_, index) => (
                <View
                  key={`h-grid-${index}`}
                  style={{
                    position: 'absolute',
                    top: index * (totalGridHeight / 6),
                    left: 0,
                    right: 0,
                    height: 1,
                    backgroundColor: 'rgba(200, 220, 220, 0.5)'
                  }}
                />
              ))}
              
              {/* Vertical grid lines (for days) */}
              {dayLabels.map((_, index) => (
                <View
                  key={`v-grid-${index}`}
                  style={{
                    position: 'absolute',
                    left: index * cellWidth,
                    top: 0,
                    bottom: 0,
                    width: 1,
                    backgroundColor: 'rgba(200, 220, 220, 0.5)'
                  }}
                />
              ))}
              
              {/* Activity blocks */}
              {days.map((day, dayIndex) => {
                const activeTimes = hours.filter(hour => heatmapData[day][hour]);
                // Group consecutive hours together
                const activeTimeRanges: { start: number, end: number }[] = [];
                
                if (activeTimes.length > 0) {
                  let currentRange = { start: activeTimes[0], end: activeTimes[0] };
                  
                  for (let i = 1; i < activeTimes.length; i++) {
                    if (activeTimes[i] === currentRange.end + 1) {
                      // Continue the current range
                      currentRange.end = activeTimes[i];
                    } else {
                      // Start a new range
                      activeTimeRanges.push({ ...currentRange });
                      currentRange = { start: activeTimes[i], end: activeTimes[i] };
                    }
                  }
                  
                  // Add the final range
                  activeTimeRanges.push(currentRange);
                }
                
                return activeTimeRanges.map((range, rangeIndex) => {
                  const startHour = range.start;
                  const endHour = range.end + 1; // +1 because end hour is exclusive
                  const startPos = (startHour / 24) * totalGridHeight;
                  const endPos = (endHour / 24) * totalGridHeight;
                  const height = endPos - startPos;
                  
                  return (
                    <View
                      key={`activity-${day}-${rangeIndex}`}
                      style={{
                        position: 'absolute',
                        left: dayLabels.findIndex(d => d.code === day) * cellWidth + 1, // +1 for border offset
                        top: startPos,
                        height: height,
                        width: cellWidth - 2, // -2 for borders
                        backgroundColor: '#394A8C',
                      }}
                    />
                  );
                });
              })}
            </View>
          </View>
        </ScrollView>
      </View>
    </ThemedView>
  );
};

export default StudyHeatmap; 