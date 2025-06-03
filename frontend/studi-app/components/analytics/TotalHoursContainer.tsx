import { View, Text } from 'react-native';

interface TotalHoursProps {
  totalTime?: { hours: number; minutes: number };
  totalHours?: string; // Keep for backward compatibility
}

export default function TotalHours({ totalTime, totalHours }: TotalHoursProps) {
  // Determine text size based on hours - use smaller text only for 12+ hours
  const isLargeHours = totalTime ? totalTime.hours >= 12 : false;
  const hoursTextSize = isLargeHours ? "text-4xl" : "text-5xl";
  const minutesTextSize = isLargeHours ? "text-4xl" : "text-5xl";

  return (
    <View>
      <Text className="text-white text-sm pb-3 font-semibold mb-2">
        You've Studied
      </Text>
      
      {totalTime ? (
        // New format: Xh Ymin
        <View className="flex-row items-end">
          <Text className={`text-white ${hoursTextSize} font-bold`}>
            {totalTime.hours}
          </Text>
          <Text className="text-white text-lg font-semibold ml-1 mb-1">
            h
          </Text>
          <Text className={`text-white ${minutesTextSize} font-bold ml-2`}>
            {totalTime.minutes}
          </Text>
          <Text className="text-white text-lg font-semibold ml-1 mb-1">
            min
          </Text>
        </View>
      ) : (
        // Fallback to old format
        <View className="flex-row items-end">
          <Text className="text-white text-5xl font-bold">
            {totalHours}
          </Text>
          <Text className="text-white text-lg font-semibold ml-1 mb-1">
            hours
          </Text>
        </View>
      )}
    </View>
  );
}

