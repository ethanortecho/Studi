import React from 'react';
import { View, Text } from 'react-native';

interface LegendProps {
    category_durations: { [key: string]: number };
    category_metadata: { [key: string]: { name: string; color: string } };
}

export default function Legend({ category_durations, category_metadata }: LegendProps) {
    return (
        <View>
            <Text className="text-primary text-lg font-semibold mb-4">
                Your Colors
            </Text>
            <View className="flex-row flex-wrap items-center gap-4">
                {Object.entries(category_metadata).map(([id, { name, color }]) => (
                    <View key={id} className="flex-row items-center">
                        <View 
                            style={{ backgroundColor: color }}
                            className="w-3 h-3 rounded-sm mr-2"
                        />
                        <Text className="text-layout-dark-grey text-sm">
                            {name}
                        </Text>
                    </View>
                ))}
            </View>
        </View>
    );
}





  

