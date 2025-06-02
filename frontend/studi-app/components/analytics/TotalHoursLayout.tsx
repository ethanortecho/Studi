import { View, Text } from 'react-native';
import { secondsToHours } from '@/utils/parseData';
import { useMemo } from 'react';

interface TotalHoursProps {
  dailyData: { aggregate: { total_duration: string } } | null;
}

export default function TotalHours({ dailyData }: TotalHoursProps) {
  const studyTime = useMemo(() => 
    dailyData ? secondsToHours(dailyData) : '0.00', 
    [dailyData]
  );

  return (
    <View>
      <Text className="text-white text-sm pb-3 font-semibold mb-2">
        You've Studied
      </Text>
      <View className="flex-row items-end">
        <Text className="text-white text-5xl font-bold">
          {studyTime}
        </Text>
        <Text className="text-white text-lg font-semibold ml-1 mb-1">
          hours
        </Text>
      </View>
    </View>
  );
}

