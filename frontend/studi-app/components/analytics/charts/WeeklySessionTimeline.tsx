import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import DayTimeline, { DaySession, TimeWindow } from '../DayTimeline';
import DashboardCard from '@/components/insights/DashboardContainer';

interface SessionTime {
  start_time: string;
  end_time: string;
  total_duration: number;
}

interface StudyDayBarsProps {
  sessionTimes: SessionTime[];
  isEmpty?: boolean; // When true, component should not render
}

interface ProcessedDayData {
  day: string;
  sessions: DaySession[];
}

const StudyDayBars: React.FC<StudyDayBarsProps> = ({ sessionTimes, isEmpty = false }) => {
  // Don't render if no data available
  if (isEmpty) {
    return null;
  }
  
  const processedData = useMemo(() => {
    // Day labels for the week
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayMappings = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
    
    // Parse sessions by day
    const sessionsByDay: { [key: string]: DaySession[] } = {};
    let earliestHour = 6; // Default start
    let latestHour = 24; // Default end (12am next day)
    
    sessionTimes.forEach(session => {
      const startDate = new Date(session.start_time);
      const endDate = new Date(session.end_time);
      
      const dayOfWeek = dayMappings[startDate.getDay() === 0 ? 6 : startDate.getDay() - 1]; // Convert to our format
      
      const startHour = startDate.getHours();
      const endHour = endDate.getHours();
      const startMinute = startDate.getMinutes();
      const endMinute = endDate.getMinutes();
      
      // Track earliest and latest for edge case detection
      earliestHour = Math.min(earliestHour, startHour);
      latestHour = Math.max(latestHour, endHour === 0 ? 24 : endHour); // Handle midnight as 24
      
      if (!sessionsByDay[dayOfWeek]) {
        sessionsByDay[dayOfWeek] = [];
      }
      
      sessionsByDay[dayOfWeek].push({
        startHour,
        endHour: endHour === 0 ? 24 : endHour, // Handle midnight
        startMinute,
        endMinute
      });
    });
    
    // Determine time window based on edge cases
    let timeWindow: TimeWindow;
    if (earliestHour < 6 || latestHour > 24) {
      // Edge case detected - extend window
      const windowStart = Math.min(0, earliestHour);
      const windowEnd = Math.max(24, latestHour);
      timeWindow = {
        startHour: windowStart,
        endHour: windowEnd,
        totalHours: windowEnd - windowStart,
        timeLabels: windowStart === 0 ? ['12am', '3am', '6am', '9am', '12pm', '3pm', '6pm', '9pm', '12am'] 
                                      : ['6am', '9am', '12pm', '3pm', '6pm', '9pm', '12am']
      };
    } else {
      // Default window: 6am - 12am
      timeWindow = {
        startHour: 6,
        endHour: 24,
        totalHours: 18,
        timeLabels: ['6am', '9am', '12pm', '3pm', '6pm', '9pm', '12am']
      };
    }
    
    // Create processed data for each day
    const processedDays: ProcessedDayData[] = dayMappings.map((dayCode, index) => ({
      day: dayLabels[index],
      sessions: sessionsByDay[dayCode] || []
    }));
    
    return { processedDays, timeWindow };
  }, [sessionTimes]);
  
  const { processedDays, timeWindow } = processedData;
  
  /** Fixed timeline width used across header and day rows */
  const TIMELINE_WIDTH = 250;

  /** Label column width (must match DayTimeline) */
  const LABEL_COLUMN_WIDTH = 60; // 48 label + 12 margin
  
  return (
    <DashboardCard className="bg-background border border-surface rounded-[35px]">
      <Text className="text-xl font-semibold text-primaryText py-14 pt-10 px-8 text-center">
        Your sessions throughout the day
      </Text>

      {/* Content wrapper */}
      <View className="px-10 pb-10">
        {/* Global header axis */}
        <View
          style={{
            marginBottom: 24,
            marginLeft: LABEL_COLUMN_WIDTH, // align with day timelines
          }}
        >
          <View style={{ position: 'relative', width: TIMELINE_WIDTH }}>
            {/* Baseline */}
            <View
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: '50%',
                height: 1,
                backgroundColor: '#3A3D4D',
                opacity: 0.6,
              }}
            />

            {/* Tick labels */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}
            >
              {['6am', '12pm', '6pm'].map((label) => (
                <Text key={label} style={{ fontSize: 12, color: '#6C6C6C' }}>
                  {label}
                </Text>
              ))}
            </View>

            {/* Sun & Moon icons above timeline */}
            <Text
              style={{
                position: 'absolute',
                left: 0,
                bottom: '100%', // above baseline container
                marginBottom: 4,
                fontSize: 14,
                textAlign: 'center',
              }}
            >
              ☀️
            </Text>
            <Text
              style={{
                position: 'absolute',
                right: 0,
                bottom: '100%',
                marginBottom: 4,
                fontSize: 14,
                textAlign: 'center',
              }}
            >
              🌙
            </Text>
          </View>
        </View>

        {/* Day timelines */}
        <View>
          {processedDays.map((day) => (
            <DayTimeline
              key={day.day}
              dayLabel={day.day}
              sessions={day.sessions}
              timeWindow={timeWindow}
              timelineWidth={TIMELINE_WIDTH}
            />
          ))}
        </View>
      </View>
    </DashboardCard>
  );
};

export default StudyDayBars; 