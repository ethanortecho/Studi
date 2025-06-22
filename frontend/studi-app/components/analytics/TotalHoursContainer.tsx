import { View, Text } from 'react-native';

interface TotalHoursProps {
  totalTime?: { hours: number; minutes: number };
  totalHours?: string; // Keep for backward compatibility
}

export default function TotalHours({ totalTime, totalHours }: TotalHoursProps) {
  return (
    <View>
      
      
      {totalTime ? (
        // New format: Xh Ymin
        <View className="flex-row items-baseline">
          <Text className="text-white text-5xl font-bold">
            {totalTime.hours}
          </Text>
          <Text className="text-white text-lg font-semibold ml-1">
            h
          </Text>
          <Text className="text-white text-5xl font-bold ml-2">
            {totalTime.minutes}
          </Text>
          <Text className="text-white text-lg font-semibold ml-1">
            min
          </Text>
        </View>
      ) : (
        // Fallback to old format
        <View className="flex-row items-baseline">
          <Text className="text-white text-5xl font-bold">
            {totalHours}
          </Text>
          <Text className="text-white text-lg font-semibold ml-1">
            hours
          </Text>
        </View>
      )}
    </View>
  );
}

