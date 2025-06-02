import React from 'react';
import { View, Text } from 'react-native';
import { Colors } from '@/constants/Colors';

/**
 * SessionBarchart - A customizable session timeline visualization
 * 
 * Usage Examples:
 * 
 * // Default styling
 * <SessionBarchart timelineData={data} categoryMetadata={metadata} />
 * 
 * // Custom rounded corners and larger text
 * <SessionBarchart 
 *   timelineData={data} 
 *   categoryMetadata={metadata}
 *   styles={{
 *     containerCorners: 'rounded-3xl',
 *     titleSize: 'text-xl',
 *     timelineCorners: 'rounded-lg'
 *   }}
 * />
 * 
 * // Compact version with smaller spacing
 * <SessionBarchart 
 *   timelineData={data} 
 *   categoryMetadata={metadata}
 *   styles={{
 *     containerPadding: 'p-3',
 *     titleMarginBottom: 'mb-2',
 *     timelineMarginBottom: 'mb-4',
 *     sessionRowMarginBottom: 'mb-1.5'
 *   }}
 * />
 */

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

interface SessionBarchartStyles {
  // Container styles
  containerPadding: string;
  containerBackground: string;
  containerCorners: string;
  
  // Title styles
  titleSize: string;
  titleWeight: string;
  titleColor: string;
  titleMarginBottom: string;
  
  // Timeline styles
  timelineMarginBottom: string;
  sessionRowMarginBottom: string;
  sessionLabelWidth: string;
  sessionLabelSize: string;
  sessionLabelColor: string;
  sessionLabelFormat: 'short' | 'full'; // 'short' = S1, 'full' = Session 1
  timelineHeight: string;
  timelineBackground: string;
  timelineCorners: string;
  
  // Time marker styles
  timeMarkerSize: string;
  timeMarkerColor: string;
  timeMarkerWidth: string;
  timeMarkerHeight: string;
  timeMarkerMarginLeft: string;
  timeMarkerMarginRight: string;
  timeMarkerMarginTop: string;
  timeAxisOffset: string; // Additional offset to align with timeline
}

interface SessionBarchartProps {
  timelineData: TimelineData[];
  categoryMetadata: {
    [key: string]: {
      name: string;
      color: string;
    };
  };
  width?: number;
  styles?: Partial<SessionBarchartStyles>;
}

// Default styling configuration
const defaultStyles: SessionBarchartStyles = {
  // Container
  containerPadding: 'p-3',
  containerBackground: 'bg-white',
  containerCorners: 'rounded-2xl',
  
  // Title
  titleSize: 'text-md',
  titleWeight: 'font-bold',
  titleColor: 'text-category-purple',
  titleMarginBottom: 'mb-4',
  
  // Timeline
  timelineMarginBottom: 'mb-0',
  sessionRowMarginBottom: 'mb-3.5',
  sessionLabelWidth: 'w-16',
  sessionLabelSize: 'text-xs',
  sessionLabelColor: '#6B7280', // gray-500
  sessionLabelFormat: 'full',
  timelineHeight: 'h-5',
  timelineBackground: 'bg-gray-200',
  timelineCorners: 'rounded',
  
  // Time markers
  timeMarkerSize: 'text-xs',
  timeMarkerColor: '#6B7280', // gray-500
  timeMarkerWidth: 'w-5',
  timeMarkerHeight: 'h-5',
  timeMarkerMarginLeft: 'ml-8',
  timeMarkerMarginRight: 'mr-1',
  timeMarkerMarginTop: 'mt-2',
  timeAxisOffset: '-20',
};

export default function SessionBarchart({
  timelineData,
  categoryMetadata,
  width = 300,
  styles: customStyles = {},
}: SessionBarchartProps) {
  // Merge custom styles with defaults
  const styles = { ...defaultStyles, ...customStyles };

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
    <View className={`${styles.containerPadding} ${styles.containerBackground} ${styles.containerCorners}`}>
      <Text className={`${styles.titleSize} ${styles.titleWeight} ${styles.titleMarginBottom} ${styles.titleColor}`}>
        Sessions
      </Text>

      {/* Timeline */}
      <View className={styles.timelineMarginBottom}>
        {timelineData.map((session, sessionIndex) => (
          <View key={sessionIndex} className={`flex-row items-center ${styles.sessionRowMarginBottom}`}>
            <Text 
              className={`${styles.sessionLabelWidth} ${styles.sessionLabelSize}`} 
              style={{ color: styles.sessionLabelColor }}
            >
              {styles.sessionLabelFormat === 'full' ? `Session ${sessionIndex + 1}` : `S${sessionIndex + 1}`}
            </Text>
            <View className={`flex-1 ${styles.timelineHeight} flex-row ${styles.timelineBackground} ${styles.timelineCorners} overflow-hidden`}>
              {session.breakdowns.map((breakdown, index) => (
                <View
                  key={index}
                  className="h-full"
                  style={{
                    width: getSegmentWidth(breakdown.start_time, breakdown.end_time),
                    backgroundColor: categoryMetadata[breakdown.category]?.color || '#E8E8E8',
                  }}
                />
              ))}
            </View>
          </View>
        ))}
      </View>

      {/* Time markers */}
      <View className={`flex-row items-center ${styles.timeMarkerMarginTop}`}>
        <Text
          className={`${styles.timeMarkerSize} ${styles.timeMarkerMarginRight} ${styles.timeMarkerWidth} text-right`}
          style={{ color: styles.timeMarkerColor }}
        >
          {useMinutes ? 'min' : 'hr'}
        </Text>
        <View 
          className={`flex-1 relative ${styles.timeMarkerHeight}`}
          style={{ marginLeft: parseInt(styles.sessionLabelWidth.replace('w-', '')) * 4 + parseInt(styles.timeAxisOffset || '0') }}
        >
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
              <Text
                key={i}
                className={`absolute ${styles.timeMarkerSize}`}
                style={{
                  left: `${percent}%`,
                  transform: [{ translateX: -10 }],
                  color: styles.timeMarkerColor,
                }}
              >
                {label}
              </Text>
            );
          })}
        </View>
      </View>
    </View>
  );
}