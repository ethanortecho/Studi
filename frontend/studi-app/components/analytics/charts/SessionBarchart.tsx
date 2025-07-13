import React from 'react';
import { View, Text, ScrollView } from 'react-native';

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
  breakdowns: {
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
  width = 320,
  rightPadding = 16,
}: SessionBarchartProps) {
  // Debug logs removed

  // Step 1: Data Processing Layer
  const processSessionData = (): { sessions: ProcessedSession[], axisDurationMinutes: number, timeMarkers: number[] } => {
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
      return (end - start) / (1000 * 60); // Convert to minutes
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
      const breakdowns = session.breakdowns || session.category_blocks || [];
      const segments = breakdowns.map(breakdown => {
        const categoryId = breakdown.category.toString();
        const categoryInfo = categoryMetadata[categoryId];
        const segmentDurationMinutes = breakdown.duration / 60; // Convert seconds to minutes
        
        // Override color for Break category to be very light grey
        let color = categoryInfo?.color || '#E8E8E8';
        if (categoryInfo?.name === 'Break') {
          color = '#E8E8E8'; // Light grey
        }
        
        return {
          categoryId,
          categoryName: categoryInfo?.name || 'Unknown',
          color,
          durationMinutes: segmentDurationMinutes,
          widthPercent: (segmentDurationMinutes / sessionDuration) * 100
        };
      });

      return {
        index: index + 1,
        durationMinutes: sessionDuration,
        segments,
        barWidthPercent: (sessionDuration / axisDurationMinutes) * 100
      };
    });
    // Debug logs removed

    const end = performance.now();
    // Debug logs removed
    
    return { sessions: processedSessions, axisDurationMinutes, timeMarkers: limitedMarkers };
  };

  const { sessions, axisDurationMinutes, timeMarkers } = processSessionData();

  // Helper function to format duration
  const formatDuration = (minutes: number): string => {
    if (minutes < 1) {
      return `${Math.round(minutes * 60)}s`;
    }
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  // Debug logs removed

  const axisPadding = rightPadding; // alias for clarity

  return (
    <View
      className="self-start pl-10"
      style={{ width, alignSelf: 'flex-start' }}
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
                    <Text className="text-xs text-secondaryText">{formatDuration(session.durationMinutes)}</Text>
                  </View>

                  {/* Session Bar Container */}
                  <View
                    className="flex-1 ml-2"
                    style={{ paddingRight: axisPadding }}
                  >
                    <View 
                      className="h-5 flex-row rounded overflow-hidden items-center"
                      style={{ 
                        width: `${session.barWidthPercent}%`,
                        minWidth: 20 // Ensure very short sessions are still visible
                      }}
                    >
                      {session.segments.map((segment, segmentIndex) => (
                        <View
                          key={segmentIndex}
                          className={segment.categoryName === 'Break' ? 'h-3' : 'h-full'}
                          style={{
                            width: `${segment.widthPercent}%`,
                            backgroundColor: segment.color,
                          }}
                        />
                      ))}
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