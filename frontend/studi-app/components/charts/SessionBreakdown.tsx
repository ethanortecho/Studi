import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';

interface TimelineData {
  start_time: string;
  end_time: string;
  breakdowns: {
    category: number;
    start_time: string;
    end_time: string;
    duration: number;
  }[];
}

interface SessionBreakdownProps {
  timelineData: TimelineData[];
  categoryMetadata: {
    [key: string]: {
      name: string;
      color: string;
    };
  };
  width?: number;
}

export default function SessionBreakdown({ 
  timelineData, 
  categoryMetadata,
  width = 300 
}: SessionBreakdownProps) {
  // Find the earliest start time and latest end time across all sessions
  const timeRange = timelineData.reduce((range, session) => {
    const sessionStart = new Date(session.start_time).getTime();
    const sessionEnd = new Date(session.end_time).getTime();
    return {
      start: Math.min(range.start, sessionStart),
      end: Math.max(range.end, sessionEnd)
    };
  }, { start: Infinity, end: -Infinity });

  // Calculate total duration in milliseconds
  const totalDuration = timeRange.end - timeRange.start;
  const totalMinutes = Math.ceil(totalDuration / (1000 * 60));

  // Function to calculate segment width based on duration
  const getSegmentWidth = (start: string, end: string) => {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const duration = endTime - startTime;
    return (duration / totalDuration) * (width - 40); // Subtract padding
  };

  // Generate time markers every 30 minutes
  const timeMarkers = Array.from({ length: Math.ceil(totalMinutes / 30) + 1 }, (_, i) => {
    const minutes = i * 30;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  });

  // Get unique categories for legend
  const uniqueCategories = new Set(
    timelineData.flatMap(session => 
      session.breakdowns.map(breakdown => breakdown.category)
    )
  );

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Today's Session Breakdowns</ThemedText>
      
      {/* Legend */}
      <View style={styles.legend}>
        {Array.from(uniqueCategories).map(categoryId => (
          <View key={categoryId} style={styles.legendItem}>
            <View 
              style={[
                styles.legendColor, 
                { backgroundColor: categoryMetadata[categoryId]?.color || '#E8E8E8' }
              ]} 
            />
            <ThemedText style={[styles.legendText, { color: Colors.light.text }]}>
              {categoryMetadata[categoryId]?.name || 'Unknown'}
            </ThemedText>
          </View>
        ))}
      </View>

      {/* Timeline */}
      <View style={styles.timelineContainer}>
        {timelineData.map((session, sessionIndex) => (
          <View key={sessionIndex} style={styles.sessionRow}>
            <ThemedText style={[styles.sessionLabel, { color: Colors.light.text }]}>S{sessionIndex + 1}</ThemedText>
            <View style={styles.timeline}>
              {session.breakdowns.map((breakdown, index) => (
                <View
                  key={index}
                  style={[
                    styles.segment,
                    {
                      width: getSegmentWidth(breakdown.start_time, breakdown.end_time),
                      backgroundColor: categoryMetadata[breakdown.category]?.color || '#E8E8E8'
                    }
                  ]}
                />
              ))}
            </View>
          </View>
        ))}
      </View>

      {/* Time markers */}
      <View style={styles.timeMarkers}>
        {timeMarkers.map((time, i) => (
          <ThemedText key={i} style={[
            styles.timeText,
            { 
              left: `${(i * 30 / totalMinutes) * 100}%`,
              transform: [{ translateX: -15 }],
              color: Colors.light.text
            }
          ]}>
            {time}
          </ThemedText>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: Colors.light.surface,
    borderRadius: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: Colors.light.text,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 3,
    marginRight: 5,
  },
  legendText: {
    fontSize: 12,
  },
  timelineContainer: {
    marginBottom: 25,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sessionLabel: {
    width: 30,
    fontSize: 12,
  },
  timeline: {
    flex: 1,
    height: 20,
    flexDirection: 'row',
    backgroundColor: Colors.light.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  segment: {
    height: '100%',
  },
  timeMarkers: {
    position: 'relative',
    height: 20,
    marginLeft: 30,
  },
  timeText: {
    position: 'absolute',
    fontSize: 10,
  },
}); 