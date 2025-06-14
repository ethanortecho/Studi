import React from 'react';
import { Text, View } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { SafeAreaView } from 'react-native-safe-area-context';
import PomoTimer from '@/components/timer/PomoTimer';
import { CategoryCarousel } from '@/components/record/CategoryCarousel';
import { useLocalSearchParams } from 'expo-router';

export default function PomoSessionScreen() {
    // Get pomodoro config from route params (passed from modal)
    const { pomodoroBlocks, pomodoroWorkDuration, pomodoroBreakDuration } = useLocalSearchParams();
    
    console.log('Pomo screen received params:', { pomodoroBlocks, pomodoroWorkDuration, pomodoroBreakDuration });
    
    const pomoConfig = {
        pomodoroBlocks: pomodoroBlocks ? parseInt(pomodoroBlocks as string) : 4, // Default to 4 blocks
        pomodoroWorkDuration: pomodoroWorkDuration ? parseInt(pomodoroWorkDuration as string) : 25, // Default to 25 minutes
        pomodoroBreakDuration: pomodoroBreakDuration ? parseInt(pomodoroBreakDuration as string) : 5, // Default to 5 minutes
    };

    console.log('Pomo screen final config:', pomoConfig);

    return (
        <SafeAreaView className="flex-1">
            <View className="p-4">
                <Text className="text-2xl font-bold text-gray-800">Pomodoro Timer</Text>
                <Text className="text-sm text-gray-600 mt-1">
                    {pomoConfig.pomodoroBlocks} blocks × {pomoConfig.pomodoroWorkDuration}min work + {pomoConfig.pomodoroBreakDuration}min break
                </Text>
            </View>
            
            <ThemedView style={{ flex: 1 }}>
                <View className="flex-1 p-4 gap-6">
                    <PomoTimer config={pomoConfig} />
                    <CategoryCarousel />
                </View>
            </ThemedView>
        </SafeAreaView>
    );
}
