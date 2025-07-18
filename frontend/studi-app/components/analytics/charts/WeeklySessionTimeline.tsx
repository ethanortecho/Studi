import React, { useMemo, useContext } from 'react';
import { View, Text, Dimensions } from 'react-native';
import DayTimeline, { DaySession, TimeWindow } from '../DayTimeline';
import DashboardCard from '@/components/insights/DashboardContainer';
import { StudySessionContext } from '@/context/StudySessionContext';
import { convertUTCToUserTimezone } from '@/utils/timezoneUtils';

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
  const { userTimezone } = useContext(StudySessionContext);
  
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
      // Convert UTC session times to user's local timezone for display
      const startDate = convertUTCToUserTimezone(session.start_time, userTimezone);
      const endDate = convertUTCToUserTimezone(session.end_time, userTimezone);
      
      // 🐛 TIMEZONE DEBUG: Chart display times  
      if (session === sessionTimes[0]) { // Only log first session to avoid spam
        console.log('📊 CHART DEBUG - WeeklySessionTimeline:');
        console.log('  📥 Raw UTC times:', session.start_time, '→', session.end_time);
        console.log('  📤 Converted times:', startDate.toISOString(), '→', endDate.toISOString());
        console.log('  🕐 Display hours:', startDate.getHours(), '→', endDate.getHours());
        console.log('  📅 Day of week:', dayMappings[startDate.getDay() === 0 ? 6 : startDate.getDay() - 1]);
      }
      
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
    
    // Determine time window based on actual session data
    let timeWindow: TimeWindow;
    
    // Calculate dynamic window based on actual data
    const windowStart = Math.max(0, Math.min(6, earliestHour - 1)); // At least 1 hour before earliest, but not before midnight
    const windowEnd = Math.min(24, Math.max(24, latestHour + 1)); // At least 1 hour after latest, but not after midnight next day
    
    // Special case: if we have very early morning sessions (before 6am), extend to show full day
    const needsFullDay = earliestHour < 6 || latestHour >= 23;
    
    if (needsFullDay) {
      // Show full 24-hour timeline
      timeWindow = {
        startHour: 0,
        endHour: 24,
        totalHours: 24,
        timeLabels: ['12am', '3am', '6am', '9am', '12pm', '3pm', '6pm', '9pm', '12am']
      };
    } else {
      // Use dynamic window that includes all sessions with padding
      const finalStart = Math.min(6, earliestHour); // Start at 6am or earlier if needed
      const finalEnd = Math.max(24, latestHour === 0 ? 24 : latestHour); // End at 12am or later if needed
      
      timeWindow = {
        startHour: finalStart,
        endHour: finalEnd,
        totalHours: finalEnd - finalStart,
        timeLabels: finalStart === 0 ? 
          ['12am', '3am', '6am', '9am', '12pm', '3pm', '6pm', '9pm', '12am'] :
          ['6am', '9am', '12pm', '3pm', '6pm', '9pm', '12am']
      };
    }
    
    // Create processed data for each day
    const processedDays: ProcessedDayData[] = dayMappings.map((dayCode, index) => ({
      day: dayLabels[index],
      sessions: sessionsByDay[dayCode] || []
    }));
    
    return { processedDays, timeWindow };
  }, [sessionTimes, userTimezone]);
  
  const { processedDays, timeWindow } = processedData;
  
  // Calculate responsive sizing based on screen width
  const { width: screenWidth } = Dimensions.get('window');
  const containerPadding = 80; // 40px padding on each side (px-10)
  const labelColumnWidth = 60; // Width for day labels (Mon, Tue, etc.)
  const availableWidth = screenWidth - containerPadding - labelColumnWidth;
  const timelineWidth = Math.min(availableWidth, 250); // Cap at 300px for larger screens
  
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
            marginLeft: labelColumnWidth, // align with day timelines
          }}
        >
          <View style={{ position: 'relative', width: timelineWidth }}>
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
              timelineWidth={timelineWidth}
            />
          ))}
        </View>
      </View>
    </DashboardCard>
  );
};

export default StudyDayBars; 