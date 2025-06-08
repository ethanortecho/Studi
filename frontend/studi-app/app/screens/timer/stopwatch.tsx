import React from 'react';
import { Text, View } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Timer } from '@/components/record/StopWatch';
import { CategoryCarousel } from '@/components/record/CategoryCarousel';

export default function RecordSessionScreen() {
    return (
        <SafeAreaView className="flex-1">
            <View className="p-4">
                <Text className="text-2xl font-bold text-gray-800">Free Timer</Text>
                <Text className="text-sm text-gray-600 mt-1">
                    Open-ended study session
                </Text>
            </View>
            
            <ThemedView style={{ flex: 1 }}>
                <View className="flex-1 p-4 gap-6">
                    <Timer />
                    <CategoryCarousel />
                </View>
            </ThemedView>
        </SafeAreaView>
    );
}