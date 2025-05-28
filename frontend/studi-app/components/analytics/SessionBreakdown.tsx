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
  width = 300,
}: SessionBreakdownProps) {
  // Find the duration of each session
  const sessionDurations = timelineData.map(session => {
    const sessionStart = new Date(session.start_time).getTime();
    const sessionEnd = new Date(session.end_time).getTime();
    return sessionEnd - sessionStart; // in milliseconds
  });

  // Find the longest session duration
  const longestSessionDuration = Math.max(...sessionDurations);

  // Convert to total minutes (real max session length)
  const totalMinutes = Math.ceil(longestSessionDuration / (1000 * 60));

  // 🔥 ROUND UP the AXIS length (not the segment width)
  let roundedAxisMinutes;
  if (totalMinutes <= 60) {
    // Round up to nearest 10 mins
    roundedAxisMinutes = Math.ceil(totalMinutes / 10) * 10;
  } else {
    // Round up to nearest full hour
    roundedAxisMinutes = Math.ceil(totalMinutes / 60) * 60;
  }

  // Decide on ticks based on the axis length
  const useMinutes = roundedAxisMinutes <= 60;
  const tickInterval = useMinutes ? 10 : 30; // 10 min ticks or 30 min (0.5 hr)
  const totalTicks = Math.ceil(roundedAxisMinutes / tickInterval) + 1;

  const tickLabels = Array.from({ length: totalTicks }, (_, i) => {
    if (useMinutes) {
      return (i * tickInterval).toString();
    } else {
      return ((i * tickInterval) / 60).toFixed(1).replace(/\.0$/, '');
    }
  });

  // ✅ Calculate true segment width based on real session duration (no rounding)
  const getSegmentWidth = (start: string, end: string) => {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const duration = endTime - startTime;
    return (duration / longestSessionDuration) * (width - 40); // Subtract padding
  };

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Study Split Timeline</ThemedText>

      {/* Timeline */}
      <View style={styles.timelineContainer}>
        {timelineData.map((session, sessionIndex) => (
          <View key={sessionIndex} style={styles.sessionRow}>
            <ThemedText style={[styles.sessionLabel, { color: Colors.light.text }]}>
              S{sessionIndex + 1}
            </ThemedText>
            <View style={styles.timeline}>
              {session.breakdowns.map((breakdown, index) => (
                <View
                  key={index}
                  style={[
                    styles.segment,
                    {
                      width: getSegmentWidth(breakdown.start_time, breakdown.end_time),
                      backgroundColor: categoryMetadata[breakdown.category]?.color || '#E8E8E8',
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        ))}
      </View>

      {/* Time markers */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <ThemedText
          style={{
            fontSize: 10,
            marginRight: 4,
            color: Colors.light.text,
            width: 18,
            textAlign: 'right',
          }}
        >
          {useMinutes ? 'min' : 'hr'}
        </ThemedText>
        <View style={[styles.timeMarkers, { flex: 1 }]}>
          {tickLabels.map((label, i) => {
            // Only show every Nth label depending on total ticks
            let N = 1;
            if (tickLabels.length > 12) N = 3;
            else if (tickLabels.length > 8) N = 2;
            if (i % N !== 0 && i !== tickLabels.length - 1) return null;

            const percent = useMinutes
              ? (parseFloat(label) / roundedAxisMinutes) * 100
              : ((parseFloat(label) * 60) / roundedAxisMinutes) * 100;

            return (
              <ThemedText
                key={i}
                style={[
                  styles.timeText,
                  {
                    left: `${percent}%`,
                    transform: [{ translateX: -10 }],
                    color: Colors.light.text,
                  },
                ]}
              >
                {label}
              </ThemedText>
            );
          })}
        </View>
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