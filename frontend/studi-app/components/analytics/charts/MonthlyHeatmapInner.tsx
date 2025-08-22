import React from 'react';
import { View, Text, Dimensions } from 'react-native';

interface Props {
  heatmapData?: { [date: string]: number };
  monthDate: Date;
  isEmpty?: boolean;
}

/**
 * MonthlyHeatmapInner - Inner component without DashboardCard wrapper
 * Used inside MultiChartContainer
 */
const MonthlyHeatmapInner: React.FC<Props> = ({ 
  heatmapData = {}, 
  monthDate,
  isEmpty = false
}) => {
  if (isEmpty) {
    return null;
  }

  const monthName = monthDate.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  const getCalendarData = () => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const firstDayOfWeek = (firstDay.getDay() + 6) % 7;
    const daysInMonth = lastDay.getDate();
    const weeksNeeded = Math.ceil((daysInMonth + firstDayOfWeek) / 7);
    
    const calendar: (number | null)[][] = [];
    
    for (let week = 0; week < weeksNeeded; week++) {
      const weekRow: (number | null)[] = [];
      
      for (let day = 0; day < 7; day++) {
        const dayNumber = (week * 7) + day - firstDayOfWeek + 1;
        
        if (dayNumber > 0 && dayNumber <= daysInMonth) {
          weekRow.push(dayNumber);
        } else {
          weekRow.push(null);
        }
      }
      
      calendar.push(weekRow);
    }
    
    return { calendar, weeksNeeded };
  };

  const { calendar, weeksNeeded } = getCalendarData();

  const containerPadding = 32;
  const weekdayLabelWidth = 48;

  const finalCellSize = React.useMemo(() => {
    const { width: screenWidth } = Dimensions.get('window');
    const availableWidth = screenWidth - containerPadding - weekdayLabelWidth;
    const cellSize = Math.floor(availableWidth / weeksNeeded);
    const maxCellSize = 30;
    const minCellSize = 15;
    return Math.max(minCellSize, Math.min(cellSize, maxCellSize));
  }, [weeksNeeded]);

  const formatDateKey = (dayNumber: number) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const date = new Date(year, month, dayNumber);
    return date.toISOString().split('T')[0];
  };

  const getColorIntensity = (hours: number) => {
    if (hours === 0) return 'rgba(107, 114, 128, 0.1)';
    
    const normalizedHours = Math.min(hours, 3);
    const opacity = Math.max(0.3, normalizedHours / 3);
    
    const r = 90;
    const g = 79;
    const b = 207;
    
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const renderCalendarGrid = () => {
    return (
      <View className="flex-1 items-center">
        {weekdays.map((day, dayIndex) => (
          <View key={day} className="flex-row mb-1">
            <View style={{ width: weekdayLabelWidth }} className="justify-center">
              <Text className="text-xs text-secondaryText">{day}</Text>
            </View>
            
            {calendar.map((week, weekIndex) => {
              const dayNumber = week[dayIndex];
              const dateKey = dayNumber ? formatDateKey(dayNumber) : null;
              const studyHours = dateKey ? heatmapData[dateKey] || 0 : 0;
              const backgroundColor = dayNumber ? getColorIntensity(studyHours) : 'transparent';
              
              return (
                <View key={weekIndex} style={{ width: finalCellSize, paddingHorizontal: 2 }}>
                  <View 
                    className={`rounded-md items-center justify-center ${dayNumber ? 'border border-gray-700' : ''}`}
                    style={{ 
                      width: finalCellSize - 4,
                      height: finalCellSize - 4,
                      backgroundColor: backgroundColor
                    }}
                    accessibilityLabel={dayNumber ? `${dayNumber} ${monthName.split(' ')[0]}, ${studyHours.toFixed(1)} hours studied` : 'Empty day'}
                  >
                    {dayNumber && (
                      <Text 
                        className="font-medium" 
                        style={{ 
                          fontSize: finalCellSize > 35 ? 12 : 10,
                          color: studyHours > 1.5 ? 'white' : studyHours > 0 ? '#374151' : 'rgba(107, 114, 128, 0.6)'
                        }}
                      >
                        {dayNumber}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View className="p-4">
      {/* Calendar Grid */}
      {renderCalendarGrid()}
      
      {/* Intensity Legend */}
      <View className="flex-row items-center justify-center mt-4 gap-2">
        <Text className="text-xs text-secondaryText font-medium">Less</Text>
        {[0, 0.75, 1.5, 2.25, 3].map((hours, index) => {
          const legendCellSize = Math.min(finalCellSize * 0.4, 12);
          return (
            <View
              key={index}
              className="rounded-sm border border-gray-700"
              style={{ 
                width: legendCellSize, 
                height: legendCellSize,
                backgroundColor: getColorIntensity(hours) 
              }}
              accessibilityLabel={`${hours} hours intensity level`}
            />
          );
        })}
        <Text className="text-xs text-secondaryText font-medium">More</Text>
      </View>
      
      {/* Study Hours Summary */}
      <View className="flex-row items-center justify-center mt-2">
        <Text className="text-xs text-secondaryText">
          Study intensity: 0-3+ hours per day
        </Text>
      </View>
    </View>
  );
};

export default MonthlyHeatmapInner;