import React from 'react';
import { View, Text} from 'react-native';
import WeeklyBarchart from './WeeklyBarchart';

interface DailyBreakdownData {
  [date: string]: {
    total: number;
    categories?: { [key: string]: number };
  };
}

interface CategoryMetadata {
  name: string;
  color: string;
}

interface WeeklyBarchartContainerProps {
  data?: DailyBreakdownData;
  categoryMetadata?: { [key: string]: CategoryMetadata };
  width?: number;
  height?: number;
}

const WeeklyBarchartContainer: React.FC<WeeklyBarchartContainerProps> = ({ 
  data,
  categoryMetadata,
  width = 350,
  height = 150
}) => {
  if (!data || !categoryMetadata) {
    return (
      <View className="bg-white rounded-lg py-4 px-0">
        <Text className="text-md font-bold text-category-purple mb-3">Weekly Activity</Text>
        <Text className="text-secondaryText">Loading weekly data...</Text>
      </View>
    );
  }

  return (
    <View className="bg-white rounded-lg py-4 px-0">
      <Text className="text-md font-bold text-category-purple mb-3">Weekly Activity</Text>
      <WeeklyBarchart 
        data={data}
        categoryMetadata={categoryMetadata}
        width={width}
        height={height}
      />
    </View>
  );
};

export default WeeklyBarchartContainer; 