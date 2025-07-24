import React, { useMemo, useContext } from 'react';
import { View, Text, Dimensions } from 'react-native';
import DayTimeline, { DaySession, TimeWindow } from '../DayTimeline';
import DashboardCard from '@/components/insights/DashboardContainer';
import { StudySessionContext } from '@/context/StudySessionContext';
import { getLocalDateComponents } from '@/utils/timezoneUtils';

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
    let earliestHour = 6; // Default start at 6am
    let latestHour = 24; // Default end at 12am (midnight)
    
    console.log('🔍 TIMELINE DEBUG: Processing sessions for timeline...');
    console.log('📅 User timezone:', userTimezone);
    console.log('📊 Total sessions to process:', sessionTimes.length);
    
    sessionTimes.forEach((session, index) => {
      console.log(`\n📍 Session ${index + 1}:`);
      console.log('  Raw times:', { start: session.start_time, end: session.end_time, duration: session.total_duration });
      
      // Get start and end components in user's timezone
      const startComponents = getLocalDateComponents(session.start_time, userTimezone);
      const endComponents = getLocalDateComponents(session.end_time, userTimezone);
      
      console.log('  Start components:', startComponents);
      console.log('  End components:', endComponents);
      
      // Create Date objects for day calculation
      const startDate = new Date(startComponents.year, startComponents.month, startComponents.day);
      const endDate = new Date(endComponents.year, endComponents.month, endComponents.day);
      
      const dayOfWeek = dayMappings[startDate.getDay() === 0 ? 6 : startDate.getDay() - 1]; // Convert to our format
      
      console.log('  Day mapping:', {
        startDateGetDay: startDate.getDay(),
        calculatedIndex: startDate.getDay() === 0 ? 6 : startDate.getDay() - 1,
        dayOfWeek: dayOfWeek
      });
      
      const startHour = startComponents.hour;
      const endHour = endComponents.hour;
      const startMinute = startComponents.minute;
      const endMinute = endComponents.minute;
      
      // Track earliest and latest hours for minimal extension
      earliestHour = Math.min(earliestHour, startHour);
      
      // Handle sessions that end at midnight (hour 0)  
      // Only convert to 24 if the session actually spans to the next day
      // If start and end are both at hour 0 on the same day, keep it as 0
      const sessionSpansToNextDay = (startHour !== 0 && endHour === 0) || 
                                   (startDate.getTime() !== endDate.getTime() && endHour === 0);
      const normalizedEndHour = sessionSpansToNextDay ? 24 : endHour;
      latestHour = Math.max(latestHour, normalizedEndHour);
      
      console.log('  Processed time:', {
        startHour, startMinute,
        endHour, normalizedEndHour, endMinute,
        assignedToDay: dayOfWeek
      });
      
      if (!sessionsByDay[dayOfWeek]) {
        sessionsByDay[dayOfWeek] = [];
      }
      
      sessionsByDay[dayOfWeek].push({
        startHour,
        endHour: normalizedEndHour,
        startMinute,
        endMinute
      });
    });
    
    console.log('\n📋 FINAL SESSIONS BY DAY:');
    Object.entries(sessionsByDay).forEach(([day, sessions]) => {
      console.log(`  ${day}:`, sessions.map(s => 
        `${s.startHour}:${s.startMinute.toString().padStart(2, '0')}-${s.endHour}:${s.endMinute.toString().padStart(2, '0')}`
      ));
    });
    
    // Fixed 6am-12am timeline with minimal extension
    const timeWindow: TimeWindow = (() => {
      // Default window: 6am to 12am (midnight)
      let startHour = 6;
      let endHour = 24;
      
      // Minimal extension: only extend if sessions exist outside default range
      if (earliestHour < 6) {
        startHour = earliestHour;
      }
      if (latestHour > 24) {
        endHour = latestHour;
      }
      
      const totalHours = endHour - startHour;
      
      // Generate appropriate time labels based on the window
      let timeLabels: string[];
      if (startHour <= 3 && endHour >= 21) {
        // Wide window spanning most of day
        timeLabels = ['12am', '3am', '6am', '9am', '12pm', '3pm', '6pm', '9pm'];
      } else if (startHour === 6 && endHour === 24) {
        // Default window
        timeLabels = ['6am', '9am', '12pm', '3pm', '6pm', '9pm', '12am'];
      } else {
        // Custom window - generate labels dynamically
        const labelHours = [];
        for (let h = startHour; h <= endHour; h += 3) {
          if (h <= endHour) {
            labelHours.push(h);
          }
        }
        // Ensure we include the end hour if it's not already included
        if (labelHours[labelHours.length - 1] !== endHour) {
          labelHours.push(endHour);
        }
        
        timeLabels = labelHours.map(h => {
          if (h === 0 || h === 24) return '12am';
          if (h < 12) return `${h}am`;
          if (h === 12) return '12pm';
          return `${h - 12}pm`;
        });
      }
      
      return {
        startHour,
        endHour,
        totalHours,
        timeLabels
      };
    })();
    
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
              {(() => {
                // Always show meaningful labels based on the actual time window
                const formatHour = (hour: number) => {
                  if (hour === 0 || hour === 24) return '12am';
                  if (hour < 12) return `${hour}am`;
                  if (hour === 12) return '12pm';
                  return `${hour - 12}pm`;
                };
                
                const startLabel = formatHour(timeWindow.startHour);
                const middleHour = Math.floor((timeWindow.startHour + timeWindow.endHour) / 2);
                const middleLabel = formatHour(middleHour);
                const endLabel = formatHour(timeWindow.endHour);
                
                // Use unique keys to avoid duplicate key warnings
                return [
                  { label: startLabel, key: `start-${timeWindow.startHour}` },
                  { label: middleLabel, key: `middle-${middleHour}` },
                  { label: endLabel, key: `end-${timeWindow.endHour}` }
                ].map(({ label, key }) => (
                  <Text key={key} style={{ fontSize: 12, color: '#6C6C6C' }}>
                    {label}
                  </Text>
                ));
              })()}
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