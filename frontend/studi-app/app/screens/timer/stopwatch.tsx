import React, { useState } from 'react';
import { Text, View, Pressable } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Timer } from '@/components/timer/StopWatch';
import CategoryFlatListCarousel from '@/components/record/CategoryFlatListCarousel';
import CategoryFlatListCarouselHorizontal from '@/components/record/CategoryFlatListCarouselHorizontal';

export default function RecordSessionScreen() {
    const [isHorizontal, setIsHorizontal] = useState(false);
    return (
        <SafeAreaView className="flex-1">
            <View className="p-4">
                <Text className="text-2xl font-bold text-gray-800">Free Timer</Text>
                <Text className="text-sm text-gray-600 mt-1">
                    Open-ended study session
                </Text>
                <Pressable
                    onPress={() => setIsHorizontal((prev) => !prev)}
                    style={{ marginTop: 12, alignSelf: 'flex-end', padding: 8, backgroundColor: '#e5e7eb', borderRadius: 8 }}
                >
                    <Text style={{ color: '#374151', fontWeight: '600' }}>
                        {isHorizontal ? 'Show Vertical Picker' : 'Show Horizontal Picker'}
                    </Text>
                </Pressable>
            </View>
            
            <ThemedView style={{ flex: 1 }}>
                <View className="flex-1 p-4 gap-6">
                    <Timer />
                    {isHorizontal ? <CategoryFlatListCarouselHorizontal /> : <CategoryFlatListCarousel />}
                </View>
            </ThemedView>
        </SafeAreaView>
    );
}