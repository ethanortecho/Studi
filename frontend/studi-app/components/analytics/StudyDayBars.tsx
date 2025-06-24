import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DashboardCard from '@/components/insights/DashboardContainer';


interface SessionTime {
  start_time: string;
  end_time: string;
  total_duration: number;
}

interface StudyDayBarsProps {
  sessionTimes: SessionTime[];
}

interface DaySession {
  startHour: number;
  endHour: number;
  startMinute: number;
  endMinute: number;
}

interface ProcessedDayData {
  day: string;
  sessions: DaySession[];
}

interface TimeWindow {
  startHour: number;
  endHour: number;
  totalHours: number;
  timeLabels: string[];
}

const StudyDayBars: React.FC<StudyDayBarsProps> = ({ sessionTimes }) => {
  
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
  
  const renderDayBar = (dayData: ProcessedDayData, index: number) => {
    const barHeight = 32;
    const barWidth = 280;
    
    // Merge overlapping sessions to avoid stacking
    const mergedSessions = dayData.sessions.reduce((acc: DaySession[], session) => {
      const sessionStart = session.startHour + session.startMinute / 60;
      const sessionEnd = session.endHour + session.endMinute / 60;
      
      // Check if this session overlaps with any existing session
      const overlapping = acc.find(existing => {
        const existingStart = existing.startHour + existing.startMinute / 60;
        const existingEnd = existing.endHour + existing.endMinute / 60;
        return (sessionStart < existingEnd && sessionEnd > existingStart);
      });
      
      if (overlapping) {
        // Merge with existing session
        const existingStart = overlapping.startHour + overlapping.startMinute / 60;
        const existingEnd = overlapping.endHour + overlapping.endMinute / 60;
        const newStart = Math.min(sessionStart, existingStart);
        const newEnd = Math.max(sessionEnd, existingEnd);
        
        overlapping.startHour = Math.floor(newStart);
        overlapping.startMinute = Math.round((newStart % 1) * 60);
        overlapping.endHour = Math.floor(newEnd);
        overlapping.endMinute = Math.round((newEnd % 1) * 60);
      } else {
        // Add as new session
        acc.push(session);
      }
      
      return acc;
    }, []);
    
    return (
      <View key={dayData.day} className="mb-3 bg-surface">
        <View className="flex-row items-center">
          {/* Day label */}
          <Text className="text-sm font-medium text-gray-600 w-10 text-right mr-3">
            {dayData.day}
          </Text>
          
          {/* Bar container */}
          <View className="relative" style={{ width: barWidth, height: barHeight }}>
            {/* Base background */}
            <View className="absolute inset-0 rounded-md bg-layout-off-white" />
            
            {/* Smooth morning-to-evening gradient */}
            <LinearGradient
              colors={[
                'rgba(243,196,75,0.3)',  // yellow 30%
                'rgba(243,196,75,0)',    // fade → transparent
                'rgba(90,79,207,0)',     // transparent
                'rgba(90,79,207,0.3)',   // purple 30%
              ]}
              locations={[0, 0.35, 0.65, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ ...StyleSheet.absoluteFillObject, borderRadius: 6 }}
            />
            
            {/* Session overlays */}
            {mergedSessions.map((session, sessionIndex) => {
              // Calculate position and width based on time window
              const sessionStart = session.startHour + session.startMinute / 60;
              const sessionEnd = session.endHour + session.endMinute / 60;
              
              const startPercent = ((sessionStart - timeWindow.startHour) / timeWindow.totalHours) * 100;
              const widthPercent = ((sessionEnd - sessionStart) / timeWindow.totalHours) * 100;
              
              return (
                <View
                  key={sessionIndex}
                  className="bg-accent rounded-md"
                  style={{
                    position: 'absolute',
                    left: `${Math.max(0, startPercent)}%`,
                    width: `${Math.min(100 - Math.max(0, startPercent), widthPercent)}%`,
                    height: '100%',
                    zIndex: 10,
                  }}
                />
              );
            })}
            
            {/* Morning/Evening icons */}
            <View
              style={{
                position: 'absolute',
                left: 8,
                top: '50%',
                transform: [{ translateY: -6 }],
                zIndex: 5,
              }}
            >
              <Text style={{ fontSize: 12, opacity: 0.6 }}>☀️</Text>
            </View>
            
            <View
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: [{ translateY: -6 }],
                zIndex: 5,
              }}
            >
              <Text style={{ fontSize: 12, opacity: 0.6 }}>🌙</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };
  
  return (
    <DashboardCard className="bg-surface rounded-[35px]">
      <Text className="text-xl font-semibold text-white py-10 px-8 text-center">
        Your sessions throughout the day
      </Text>
      
      {/* Content wrapper with extra left padding */}
      <View className="px-10">
        {/* Time axis labels */}
        <View className="mb-4 ml-3 w-[280px]">
          <View className="flex-row justify-between">
            {timeWindow.timeLabels.map((label, index) => (
              <Text key={index} className="text-xs text-layout-faded-grey">
                {label}
              </Text>
            ))}
          </View>
        </View>
        
        {/* Day bars */}
        <View>
          {processedDays.map((dayData, index) => renderDayBar(dayData, index))}
        </View>
      </View>
    </DashboardCard>
  );
};

export default StudyDayBars; 