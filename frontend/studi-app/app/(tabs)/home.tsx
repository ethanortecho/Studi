import React, { useState } from 'react';
import { Text, View, Pressable } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import TimerConfigModal, { TimerConfig } from '@/components/modals/TimerConfigModal';

export default function HomeScreen() {
    const [modalVisible, setModalVisible] = useState(false);

    const handleStartStudying = () => {
        setModalVisible(true);
    };

    const handleCloseModal = () => {
        setModalVisible(false);
    };

    const handleStartSession = (config: TimerConfig) => {
        setModalVisible(false);
        
        // Navigate to appropriate timer screen based on config
        switch (config.mode) {
            case 'free':
                router.push('/screens/timer/stopwatch');
                break;
            case 'timer':
                // Will navigate to countdown screen in Step 5
                console.log('Countdown timer config:', config);
                router.push('/screens/timer/stopwatch'); // Temporary fallback
                break;
            case 'pomo':
                // Will navigate to pomodoro screen in Step 5
                console.log('Pomodoro timer config:', config);
                router.push('/screens/timer/stopwatch'); // Temporary fallback
                break;
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-purple-50">
            <View className="p-6">
                <Text className="text-3xl font-light text-indigo-800 mb-2">
                    Welcome Back,
                </Text>
                <Text className="text-3xl font-light text-indigo-600">
                    Ethan
                </Text>
            </View>
            
            <ThemedView style={{ flex: 1 }} className="px-6 justify-center">
                <Pressable 
                    onPress={handleStartStudying}
                    className="bg-green-500 py-6 px-8 rounded-2xl shadow-lg"
                >
                    <Text className="text-white font-semibold text-xl text-center">
                        Start Studying
                    </Text>
                </Pressable>
            </ThemedView>

            <TimerConfigModal
                visible={modalVisible}
                onClose={handleCloseModal}
                onStartSession={handleStartSession}
            />
        </SafeAreaView>
    );
}