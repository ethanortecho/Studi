import { View, Text } from 'react-native';

interface TotalHoursProps {
  totalHours: string;
}

export default function TotalHours({ totalHours }: TotalHoursProps) {
  return (
    <View>
      <Text className="text-white text-sm pb-3 font-semibold mb-2">
        You've Studied
      </Text>
      <View className="flex-row items-end">
        <Text className="text-white text-5xl font-bold">
          {totalHours}
        </Text>
        <Text className="text-white text-lg font-semibold ml-1 mb-1">
          hours
        </Text>
      </View>
    </View>
  );
}

