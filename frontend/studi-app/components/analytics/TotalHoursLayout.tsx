import { View, Text } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { secondsToHours } from '@/utils/parseData';
import { DailyInsightsResponse } from '@/types/api';
import { useMemo } from 'react';

interface TotalHoursProps {
  dailyData: DailyInsightsResponse | null;
}

export default function TotalHours({ dailyData }: TotalHoursProps) {
  const studyTime = useMemo(() => 
    dailyData ? secondsToHours(dailyData) : '0 hours', 
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

