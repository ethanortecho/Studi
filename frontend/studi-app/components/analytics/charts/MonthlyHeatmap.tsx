import React from 'react';
import { View, Text, Dimensions } from 'react-native';

interface MonthlyHeatmapProps {
  heatmapData?: { [date: string]: number };
  monthDate: Date;
  isEmpty?: boolean; // When true, component should not render
}

const MonthlyHeatmap: React.FC<MonthlyHeatmapProps> = ({ 
  heatmapData = {}, 
  monthDate,
  isEmpty = false
}) => {
  // Don't render if no data available
  if (isEmpty) {
    return null;
  }
  // Get month name and year
  const monthName = monthDate.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  // Calendar logic
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Calculate calendar data
  const getCalendarData = () => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    
    // First day of month
    const firstDay = new Date(year, month, 1);
    // Last day of month
    const lastDay = new Date(year, month + 1, 0);
    
    // Get day of week for first day (0 = Sunday, 1 = Monday, etc.)
    // Convert to our format (0 = Monday, 6 = Sunday)
    const firstDayOfWeek = (firstDay.getDay() + 6) % 7;
    
    // Total days in month
    const daysInMonth = lastDay.getDate();
    
    // Calculate weeks needed
    const weeksNeeded = Math.ceil((daysInMonth + firstDayOfWeek) / 7);
    
    // Create calendar grid
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

  // Calculate responsive sizing based on screen width
  const { width: screenWidth } = Dimensions.get('window');
  const containerPadding = 32; // 16px padding on each side (p-4)
  const weekdayLabelWidth = 48; // Width for Mon/Tue/Wed labels
  const availableWidth = screenWidth - containerPadding - weekdayLabelWidth;
  const cellSize = Math.floor(availableWidth / weeksNeeded); // Divide by number of weeks
  const maxCellSize = 40; // Cap maximum size for larger screens
  const finalCellSize = Math.min(cellSize, maxCellSize);

  // Format date for heatmap data lookup
  const formatDateKey = (dayNumber: number) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const date = new Date(year, month, dayNumber);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  // Color intensity function - maps study hours to accent purple opacity
  const getColorIntensity = (hours: number) => {
    if (hours === 0) return 'rgba(107, 114, 128, 0.1)'; // Very light gray for empty days
    
    // Linear interpolation: 0-3 hours maps to different opacity levels
    const normalizedHours = Math.min(hours, 3); // Cap at 3 hours for max intensity
    const opacity = Math.max(0.3, normalizedHours / 3); // 0.3 to 1.0 opacity range
    
    // Use accent purple (#5A4FCF) with varying opacity
    const r = 90;  // Red component of #5A4FCF
    const g = 79;  // Green component of #5A4FCF  
    const b = 207; // Blue component of #5A4FCF
    
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // Render calendar grid
  const renderCalendarGrid = () => {
    return (
      <View className="flex-1 items-center">
        {/* Calendar grid */}
        {weekdays.map((day, dayIndex) => (
          <View key={day} className="flex-row mb-1">
            {/* Weekday label */}
            <View style={{ width: weekdayLabelWidth }} className="justify-center">
              <Text className="text-xs text-secondaryText">{day}</Text>
            </View>
            
            {/* Week squares */}
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
                      width: finalCellSize - 4, // Account for padding
                      height: finalCellSize - 4,
                      backgroundColor: backgroundColor
                    }}
                    accessibilityLabel={dayNumber ? `${dayNumber} ${monthName.split(' ')[0]}, ${studyHours.toFixed(1)} hours studied` : 'Empty day'}
                  >
                    {dayNumber && (
                      <Text 
                        className="font-medium" 
                        style={{ 
                          fontSize: finalCellSize > 35 ? 12 : 10, // Responsive font size
                          color: studyHours > 1.5 ? 'white' : studyHours > 0 ? '#374151' : 'rgba(107, 114, 128, 0.6)' // Dynamic text color based on intensity
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
    <View className="bg-background border border-surface rounded-lg p-4">
      {/* Title */}
      <Text className="text-lg font-bold text-primaryText mb-4 text-center">
        {monthName}
      </Text>

      {/* Calendar Grid */}
      {renderCalendarGrid()}
      
      {/* Legend */}
      <View className="flex-row items-center justify-center mt-4 gap-2">
        <Text className="text-xs text-secondaryText font-medium">Less</Text>
        {[0, 0.75, 1.5, 2.25, 3].map((hours, index) => {
          const legendCellSize = Math.min(finalCellSize * 0.4, 12); // Scale with calendar but cap at 12px
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

export default MonthlyHeatmap;