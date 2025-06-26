import React from 'react';
import { View, Text } from 'react-native';

interface LegendProps {
    category_durations: { [key: string]: number };
    category_metadata: { [key: string]: { name: string; color: string } };
}

export default function Legend({ category_durations, category_metadata }: LegendProps) {
    // Only show categories that have actual duration data
    // Note: Break category is now filtered at the data processing level
    const categoriesWithData = Object.entries(category_durations)
        .filter(([_, duration]) => duration > 0)
        .map(([categoryName, _]) => categoryName);

    // Helper to format seconds into "Xh Ym" or "Xm"
    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
    };

    return (
        <View>
            <View className="flex-row flex-wrap items-center justify-center gap-4">
                {categoriesWithData.map((categoryName) => {
                    // Find the metadata for this category by name
                    const categoryMeta = Object.values(category_metadata).find(
                        meta => meta.name === categoryName
                    );

                    if (!categoryMeta) return null;

                    const durationSeconds = category_durations[categoryName] || 0;

                    return (
                        <View key={categoryName} className="flex-row items-center">
                            {/* Color indicator */}
                            <View
                                style={{ backgroundColor: categoryMeta.color }}
                                className="w-3 h-3 rounded-sm mr-2"
                            />

                            {/* Name + Time */}
                            <View>
                                <Text className="text-white text-sm font-medium">
                                    {categoryMeta.name}
                                </Text>
                                <Text className="text-gray-400 text-xs">
                                    {formatTime(durationSeconds)}
                                </Text>
                            </View>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}





  

