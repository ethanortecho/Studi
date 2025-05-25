import React from 'react';
import { Text, View } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Timer } from '@/components/Timer';
import { CategoryCarousel } from '@/components/CategoryCarousel';
import { StudySessionProvider } from '@/context/StudySessionContext';

export default function RecordSessionScreen() {
    return (
        <StudySessionProvider>
            <SafeAreaView className="flex-1">
                <View className="p-4">
                    <Text className="text-2xl font-bold text-gray-800">Record Session</Text>
                </View>
                
                <ThemedView style={{ flex: 1 }}>
                    <View className="flex-1 p-4 gap-6">
                        <Timer />
                        <CategoryCarousel />
                    </View>
                </ThemedView>
            </SafeAreaView>
        </StudySessionProvider>
    );
}