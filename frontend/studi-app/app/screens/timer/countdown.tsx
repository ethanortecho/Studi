import React from 'react';
import { Text, View } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { SafeAreaView } from 'react-native-safe-area-context';
import CountdownTimer from '@/components/timer/CountdownTimer';
import { CategoryCarousel } from '@/components/record/CategoryCarousel';
import { useLocalSearchParams } from 'expo-router';

export default function CountdownSessionScreen() {
    // Get countdown duration from route params (passed from modal)
    const { duration } = useLocalSearchParams();
    const countdownDuration = duration ? parseInt(duration as string) : 25; // Default to 25 minutes

    return (
        <SafeAreaView className="flex-1">
            <View className="p-4">
                <Text className="text-2xl font-bold text-gray-800">Countdown Timer</Text>
                <Text className="text-sm text-gray-600 mt-1">
                    Focused study session with time limit
                </Text>
            </View>
            
            <ThemedView style={{ flex: 1 }}>
                <View className="flex-1 p-4 gap-6">
                    <CountdownTimer config={{ duration: countdownDuration }} />
                    <CategoryCarousel />
                </View>
            </ThemedView>
        </SafeAreaView>
    );
} 