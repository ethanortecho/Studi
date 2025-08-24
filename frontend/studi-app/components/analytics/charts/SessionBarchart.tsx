import React from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import { formatDurationFromMinutes } from '../../../utils/timeFormatting';

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
  breaks: any[];
  category_blocks?: {  // This is what the API actually sends
    category: number;
    start_time: string;
    end_time: string;
    duration: number;
  }[];
  breakdowns?: {  // Keep for backwards compatibility
    category: number;
    start_time: string;
    end_time: string;
    duration: number;
  }[];
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
  rightPadding?: number; // Padding on the right side (in px) for axis and bars
  isEmpty?: boolean; // When true, component should not render
}

interface ProcessedSession {
  index: number;
  durationMinutes: number;
  segments: {
    categoryId: string;
    categoryName: string;
    color: string;
    durationMinutes: number;
    widthPercent: number;
  }[];
  barWidthPercent: number;
}

export default function SessionBarchart({
  timelineData,
  categoryMetadata,
  width,
  rightPadding = 16,
  isEmpty = false,
}: SessionBarchartProps) {
  console.log('SessionBarchart raw props:', {
    timelineDataSample: timelineData?.[0],
    categoryMetadataSample: Object.entries(categoryMetadata || {}).slice(0, 2)
  });
  
  // Don't render if no data available
  if (isEmpty) {
    return null;
  }

  // Calculate responsive width
  const screenWidth = Dimensions.get('window').width;
  const responsiveWidth = width || Math.max(280, Math.min(screenWidth - 80, 360));

  // Debug logs removed

  // Step 1: Data Processing Layer
  const processSessionData = (): { sessions: ProcessedSession[], axisDurationMinutes: number, timeMarkers: number[] } => {
    // Create a map of category names to their metadata (same as pie chart)
    const categoryNameToMeta = Object.entries(categoryMetadata).reduce((acc, [id, meta]: [string, any]) => {
      acc[meta.name] = meta;
      return acc;
    }, {} as { [key: string]: { color: string; name: string } });

    // Debug logs removed
    const start = performance.now();
    
    if (!timelineData || timelineData.length === 0) {
      // Debug logs removed
      return { sessions: [], axisDurationMinutes: 10, timeMarkers: [0, 5, 10] };
    }

    // Calculate session durations in minutes
    const durationStart = performance.now();
    // Filter out ongoing sessions (end_time is null) before calculating durations
    const completedSessions = timelineData.filter(session => session.end_time !== null);
    const sessionDurations = completedSessions.map(session => {
      const start = new Date(session.start_time).getTime();
      const end = new Date(session.end_time).getTime();
      const durationMs = end - start;
      // Round to nearest second before converting to minutes for consistency
      const durationSeconds = Math.round(durationMs / 1000);
      return durationSeconds / 60; // Convert to minutes
    });
    // Debug logs removed

    // Step 2: Scaling Engine - use actual max duration, round up to nice interval
    const scalingStart = performance.now();
    const maxSessionDuration = Math.max(...sessionDurations);
    
    // Determine appropriate rounding based on session length
    let axisDurationMinutes;
    if (maxSessionDuration < 1) {
      // For very short sessions (< 1min), round up to nearest 0.5min
      axisDurationMinutes = Math.ceil(maxSessionDuration / 0.5) * 0.5;
    } else if (maxSessionDuration <= 10) {
      // For sessions <= 10min, round up to nearest 2min
      axisDurationMinutes = Math.ceil(maxSessionDuration / 2) * 2;
    } else if (maxSessionDuration <= 60) {
      // For sessions <= 60min, round up to nearest 10min
      axisDurationMinutes = Math.ceil(maxSessionDuration / 10) * 10;
    } else {
      // For longer sessions, round up to nearest 15min
      axisDurationMinutes = Math.ceil(maxSessionDuration / 15) * 15;
    }
    // Debug logs removed

    // Generate time markers (2-5 markers max, but always include start and end)
    const markerStart = performance.now();
    const timeMarkers: number[] = [];
    let markerInterval;
    
    if (axisDurationMinutes < 1) {
      markerInterval = 0.25; // 15 second intervals for very short sessions
    } else if (axisDurationMinutes <= 10) {
      markerInterval = axisDurationMinutes <= 4 ? 1 : 2;
    } else if (axisDurationMinutes <= 60) {
      markerInterval = 10;
    } else {
      // For longer sessions, intelligently space markers to fit within 5 markers max
      // Calculate interval that gives us around 4-5 markers
      if (axisDurationMinutes <= 150) {
        markerInterval = 30; // Every 30 minutes for sessions up to 2.5 hours
      } else if (axisDurationMinutes <= 240) {
        markerInterval = 60; // Every hour for sessions up to 4 hours  
      } else {
        markerInterval = 90; // Every 1.5 hours for longer sessions
      }
    }
    
    // Generate markers from 0 to axisDurationMinutes
    for (let i = 0; i <= axisDurationMinutes; i += markerInterval) {
      timeMarkers.push(i);
    }
    
    // Ensure we always have the endpoint if it's not already included
    if (timeMarkers[timeMarkers.length - 1] !== axisDurationMinutes) {
      timeMarkers.push(axisDurationMinutes);
    }
    
    // Limit to 6 markers max for readability (start, 4 intermediates, end)
    let limitedMarkers = timeMarkers;
    if (timeMarkers.length > 6) {
      // Keep first, last, and evenly space 4 markers in between
      const step = (timeMarkers.length - 1) / 5;
      limitedMarkers = [
        timeMarkers[0],
        timeMarkers[Math.round(step)],
        timeMarkers[Math.round(step * 2)],
        timeMarkers[Math.round(step * 3)],
        timeMarkers[Math.round(step * 4)],
        timeMarkers[timeMarkers.length - 1]
      ];
    }
    // Debug logs removed

    // Step 3: Process each session
    const sessionProcessingStart = performance.now();
    const processedSessions: ProcessedSession[] = completedSessions.map((session, index) => {
      const sessionDuration = sessionDurations[index];
      
      // Process segments within this session
      // API sends 'category_blocks' not 'breakdowns'
      const breakdowns = session.category_blocks || session.breakdowns || [];
      const segments = breakdowns.map(breakdown => {
        const categoryName = breakdown.category; // breakdown.category is already the category name
        const categoryInfo = categoryNameToMeta[categoryName];
        const segmentDurationMinutes = breakdown.duration / 60; // Convert seconds to minutes
        
        // Override color for Break category to be very light grey
        let color = categoryInfo?.color || '#E8E8E8';
        if (categoryInfo?.name === 'Break') {
          color = '#E8E8E8'; // Light grey
        }
        
        return {
          categoryId: String(categoryName),
          categoryName: categoryInfo?.name || 'Unknown',
          color,
          durationMinutes: segmentDurationMinutes,
          widthPercent: Math.round((segmentDurationMinutes / sessionDuration) * 1000) / 10 // Round to 1 decimal place
        };
      });

      return {
        index: index + 1,
        durationMinutes: sessionDuration,
        segments,
        barWidthPercent: Math.round((sessionDuration / axisDurationMinutes) * 1000) / 10 // Round to 1 decimal place for consistency
      };
    });
    // Debug logs removed

    const end = performance.now();
    // Debug logs removed
    
    return { sessions: processedSessions, axisDurationMinutes, timeMarkers: limitedMarkers };
  };

  const { sessions, axisDurationMinutes, timeMarkers } = processSessionData();

  console.log('SessionBarchart processed data:', {
    sessionsCount: sessions.length,
    sessions: sessions.map(s => ({
      index: s.index,
      duration: s.durationMinutes,
      segmentsCount: s.segments.length,
      segments: s.segments.map(seg => ({
        name: seg.categoryName,
        color: seg.color,
        duration: seg.durationMinutes,
        widthPercent: seg.widthPercent
      })),
      barWidthPercent: s.barWidthPercent
    }))
  });

  const axisPadding = rightPadding; // alias for clarity

  return (
    <View
      style={{ width: responsiveWidth }}
    >

      <ScrollView
        className="max-h-56"
        showsVerticalScrollIndicator={false}
        style={{ paddingRight: axisPadding }}
      >
        <View className="items-start">

          {/* Timeline Container */}
          <View className="mb-4 w-full">
            {sessions.map((session) => (
              <View key={session.index} className="mb-3">
                {/* Session Row */}
                <View className="flex-row items-center justify-start">
                  {/* Session Label */}
                  <View className="w-16">
                    <Text className="text-xs text-secondaryText">Session {session.index}</Text>
                    <Text className="text-xs text-secondaryText">{formatDurationFromMinutes(session.durationMinutes)}</Text>
                  </View>

                  {/* Session Bar Container */}
                  <View
                    className="flex-1 ml-2"
                  >
                    <View 
                      className="h-5 flex-row items-center"
                      style={{ 
                        width: `${Math.max(session.barWidthPercent, 2)}%`, // Minimum 2% width for visibility
                        minWidth: 10, // Ensure very short sessions are still visible
                        borderRadius: 2, // Always use consistent border radius
                        overflow: 'hidden'
                      }}
                    >
                      {session.segments.map((segment, segmentIndex) => {
                        const isFirst = segmentIndex === 0;
                        const isLast = segmentIndex === session.segments.length - 1;
                        
                        return (
                          <View
                            key={segmentIndex}
                            className={segment.categoryName === 'Break' ? 'h-3' : 'h-full'}
                            style={{
                              flex: segment.durationMinutes, // Use flex to fill proportionally
                              backgroundColor: segment.color,
                            }}
                          />
                        );
                      })}
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>{/* End Timeline Container */}
      </ScrollView>
    </View>
  );
}