import React from 'react';
import { View, Text } from 'react-native';

interface LegendProps {
    category_durations: { [key: string]: number };
    category_metadata: { [key: string]: { name: string; color: string } };
}

export default function Legend({ category_durations, category_metadata }: LegendProps) {
    // Only show categories that have actual duration data
    const categoriesWithData = Object.entries(category_durations)
        .filter(([_, duration]) => duration > 0)
        .map(([categoryName, _]) => categoryName);

    return (
        <View>
            <Text className="text-category-purple text-lg font-bold mb-2.5">
                Your Colors
            </Text>
            <View className="flex-row flex-wrap items-center gap-4">
                {categoriesWithData.map((categoryName) => {
                    // Find the metadata for this category by name
                    const categoryMeta = Object.values(category_metadata).find(
                        meta => meta.name === categoryName
                    );
                    
                    if (!categoryMeta) return null;
                    
                    return (
                        <View key={categoryName} className="flex-row items-center">
                            <View 
                                style={{ backgroundColor: categoryMeta.color }}
                                className="w-3 h-3 rounded-sm mr-2"
                            />
                            <Text className="text-layout-dark-grey text-sm">
                                {categoryMeta.name}
                            </Text>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}





  

