import React, { useState } from 'react';
import { Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeMode } from '@/app/_layout';
import { dark } from '@/theme/dark';
import { light } from '@/theme/light';
import { ThemedView } from '@/components/ThemedView';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import TimerConfigModal, { TimerConfig } from '@/components/timerconfig/TimerConfigModal';
import { useAuth } from '@/contexts/AuthContext';

export default function HomeScreen() {
    const [modalVisible, setModalVisible] = useState(false);
    
    const { user } = useAuth();
    const { mode: themeMode, toggle: toggleTheme } = useThemeMode();

    const handleStartStudying = () => {
        setModalVisible(true);
    };

    const handleCloseModal = () => {
        setModalVisible(false);
    };

    const handleStartSession = (config: TimerConfig) => {
        setModalVisible(false);
        
        // Navigate to appropriate timer screen based on config
        // Pass selectedCategoryId as route parameter
        const categoryParam = config.selectedCategoryId ? `&selectedCategoryId=${config.selectedCategoryId}` : '';
        
        switch (config.mode) {
            case 'free':
                router.replace(`/screens/timer/stopwatch?${categoryParam.substring(1)}`); // Remove leading &
                break;
            case 'timer':
                // Navigate to countdown screen with duration and category parameters
                const duration = config.duration || 25; // Default to 25 minutes if not specified
                router.replace(`/screens/timer/countdown?duration=${duration}${categoryParam}`);
                break;
            case 'pomo':
                // Navigate to pomodoro screen with pomodoro parameters
                const blocks = config.pomodoroBlocks || 4;
                const workDuration = config.pomodoroWorkDuration || 25;
                const breakDuration = config.pomodoroBreakDuration || 5;
                router.replace(`/screens/timer/pomo?pomodoroBlocks=${blocks}&pomodoroWorkDuration=${workDuration}&pomodoroBreakDuration=${breakDuration}${categoryParam}`);
                break;
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-background">
            <View className="p-6 flex-row justify-between items-center">
                <Text className="text-3xl font-medium text-indigo-800 mb-2">
                    Welcome Back,
                </Text>
            </View>
            <View className="px-6 mb-4">
                <Text className="text-3xl font-bold text-indigo-600">
                    {user?.first_name || 'User'}
                </Text>
            </View>
            
            <View style={{ flex: 1 }} className="px-6 justify-center">
                <Pressable 
                    onPress={handleStartStudying}
                    className="bg-accent py-6 px-8 rounded-2xl shadow-lg"
                >
                    <Text className="text-white font-semibold text-xl text-center">
                        Start Studying
                    </Text>
                </Pressable>
            </View>

            <TimerConfigModal
                visible={modalVisible}
                onClose={handleCloseModal}
                onStartSession={handleStartSession}
            />
        </SafeAreaView>
    );
}