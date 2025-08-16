import React, { useMemo, useContext } from 'react';
import { View, Text, Dimensions } from 'react-native';
import DayTimeline, { DaySession, TimeWindow } from '../DayTimeline';
import { StudySessionContext } from '@/context/StudySessionContext';
import { getLocalDateComponents } from '@/utils/timezoneUtils';

interface SessionTime {
  start_time: string;
  end_time: string;
  total_duration: number;
}

interface Props {
  sessionTimes: SessionTime[];
  isEmpty?: boolean;
}

interface ProcessedDayData {
  day: string;
  sessions: DaySession[];
}

/**
 * WeeklySessionTimelineInner - Inner component without DashboardCard wrapper
 * Used inside MultiChartContainer
 */
const WeeklySessionTimelineInner: React.FC<Props> = ({ sessionTimes, isEmpty = false }) => {
  const { userTimezone } = useContext(StudySessionContext);
  
  if (isEmpty) {
    return null;
  }
  
  const processedData = useMemo(() => {
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayMappings = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
    
    const sessionsByDay: { [key: string]: DaySession[] } = {};
    let earliestHour = 6;
    let latestHour = 24;
    
    sessionTimes.forEach((session) => {
      const startComponents = getLocalDateComponents(session.start_time, userTimezone);
      const endComponents = getLocalDateComponents(session.end_time, userTimezone);
      
      const startDate = new Date(startComponents.year, startComponents.month, startComponents.day);
      const endDate = new Date(endComponents.year, endComponents.month, endComponents.day);
      
      const dayOfWeek = dayMappings[startDate.getDay() === 0 ? 6 : startDate.getDay() - 1];
      
      const startHour = startComponents.hour;
      const endHour = endComponents.hour;
      const startMinute = startComponents.minute;
      const endMinute = endComponents.minute;
      
      earliestHour = Math.min(earliestHour, startHour);
      
      const sessionSpansToNextDay = (startHour !== 0 && endHour === 0) || 
                                   (startDate.getTime() !== endDate.getTime() && endHour === 0);
      const normalizedEndHour = sessionSpansToNextDay ? 24 : endHour;
      latestHour = Math.max(latestHour, normalizedEndHour);
      
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
    
    const timeWindow: TimeWindow = (() => {
      let startHour = 6;
      let endHour = 24;
      
      if (earliestHour < 6) {
        startHour = earliestHour;
      }
      if (latestHour > 24) {
        endHour = latestHour;
      }
      
      const totalHours = endHour - startHour;
      
      let timeLabels: string[];
      if (startHour <= 3 && endHour >= 21) {
        timeLabels = ['12am', '3am', '6am', '9am', '12pm', '3pm', '6pm', '9pm'];
      } else if (startHour === 6 && endHour === 24) {
        timeLabels = ['6am', '9am', '12pm', '3pm', '6pm', '9pm', '12am'];
      } else {
        const labelHours = [];
        for (let h = startHour; h <= endHour; h += 3) {
          if (h <= endHour) {
            labelHours.push(h);
          }
        }
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
    
    const processedDays: ProcessedDayData[] = dayMappings.map((dayCode, index) => ({
      day: dayLabels[index],
      sessions: sessionsByDay[dayCode] || []
    }));
    
    return { processedDays, timeWindow };
  }, [sessionTimes, userTimezone]);
  
  const { processedDays, timeWindow } = processedData;
  
  const { width: screenWidth } = Dimensions.get('window');
  const containerPadding = 60;
  const labelColumnWidth = 60;
  const availableWidth = screenWidth - containerPadding - labelColumnWidth;
  const timelineWidth = Math.min(availableWidth, 200);
  
  return (
    <View className="px-0 pb-20 pt-20">
      {/* Global header axis */}
      <View
        style={{
          marginBottom: 12,
          marginLeft: labelColumnWidth,
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
              backgroundColor: '#2D2E6F',
              opacity: 1,
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
              bottom: '100%',
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
  );
};

export default WeeklySessionTimelineInner;