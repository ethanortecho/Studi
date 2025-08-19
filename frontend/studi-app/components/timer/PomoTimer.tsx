import React from 'react';
import { Text, View, Pressable } from 'react-native';
import { usePomo, PomoConfig } from '../../hooks/timer';
import { useState, useContext, useEffect } from 'react';
import { StudySessionContext } from '../../context/StudySessionContext';
import { CancelSessionModal } from '../modals/CancelSessionModal';
import { router } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';

interface PomoTimerProps {
    config: PomoConfig;
}

export default function PomoTimer({ config }: PomoTimerProps) {
    // Get category from route params (passed from modal)
    const { selectedCategoryId } = useLocalSearchParams();
    
    // Create config with category info
    const pomoConfig: PomoConfig = {
        ...config,
        selectedCategoryId: selectedCategoryId as string
    };
    
    const { startTimer, pauseTimer, resumeTimer, stopTimer, cancelTimer, timeRemaining, status, formatTime, isFinished, pomoBlocksRemaining, pomoBlockStatus } = usePomo(pomoConfig);
    const { sessionId, currentCategoryId, categories } = useContext(StudySessionContext);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // Check if session is already running
    const isSessionActive = sessionId !== null;
    const currentCategory = categories.find(cat => cat.id === String(currentCategoryId));

    // Auto-start timer when component mounts (this creates session + starts timer atomically)
    useEffect(() => {
        if (selectedCategoryId && status === 'idle') {
            console.log("PomoTimer: Auto-starting timer with category:", selectedCategoryId);
            startTimer();
        }
    }, []); // Run once on mount

    return (
        <View className="items-center p-6 bg-white rounded-xl">
            {/* Session Status Indicator */}
            {isSessionActive && currentCategory && (
                <View className="w-full mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Text className="text-center text-sm text-blue-700 font-medium mb-1">
                        Active Study Session - Pomodoro
                    </Text>
                    <View className="flex-row items-center justify-center">
                        <View 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: currentCategory.color }}
                        />
                        <Text className="text-blue-800 font-medium">
                            {currentCategory.name}
                        </Text>
                    </View>
                </View>
            )}

            {(status === 'running' || status === 'paused') && (
                <Pressable 
                    onPress={() => setShowCancelModal(true)}
                    className="absolute top-2 right-2 p-2"
                >
                    <Text className="text-red-500 text-lg font-bold">✕</Text>
                </Pressable>
            )}
            
            {/* Pomodoro Status */}
            <View className="mb-2">
                <Text className={`text-center text-lg font-medium ${pomoBlockStatus === 'work' ? 'text-red-600' : 'text-green-600'}`}>
                    {pomoBlockStatus === 'work' ? '🍅 Focus Time' : '☕ Break Time'}
                </Text>
                <Text className="text-center text-sm text-gray-600">
                    {pomoBlocksRemaining} blocks remaining
                </Text>
            </View>
            
            <View className="mb-4">
                <Text className="text-4xl font-bold text-gray-800">{formatTime()}</Text>
                <Text className="text-center text-sm text-gray-600 mt-2">
                    {pomoBlockStatus === 'work' ? `${config.pomodoroWorkDuration} min work` : `${config.pomodoroBreakDuration} min break`}
                </Text>
            </View>
            
            <View className="w-full">
                <Pressable 
                    onPress={() => {
                        if (status === 'running') {
                            pauseTimer();
                        } else if (status === 'paused') {
                            resumeTimer();
                        }
                    }}
                    className="bg-green-500 py-3 px-6 rounded-full items-center"
                >
                    <Text className="text-white font-medium text-lg">
                        {status === 'running' ? 'Pause' : 'Resume'}
                    </Text>
                </Pressable>
            </View>
            
            {(status === 'running' || status === 'paused') && (
                <View className="w-full mt-4">
                    <Pressable 
                        onPress={async () => {
                            try {
                                await stopTimer();
                                // Note: Navigation to home is handled by SessionStatsModal after showing completion stats
                            } catch (error) {
                                console.error("PomoTimer stop error:", error);
                            }
                        }}
                        className="bg-red-500 py-3 px-6 rounded-full items-center mt-2"
                    >
                        <Text className="text-white font-medium text-lg">
                            End Session
                        </Text>
                    </Pressable>
                </View>
            )}
            
            <CancelSessionModal
                visible={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                onConfirm={async () => {
                    setIsLoading(true);
                    try {
                        await cancelTimer();
                        setShowCancelModal(false);
                        router.replace('/(tabs)/home'); // Cancel immediately navigates (no stats modal)
                    } catch (error) {
                        console.error("PomoTimer cancel error:", error);
                    } finally {
                        setIsLoading(false);
                    }
                }}
                isLoading={isLoading}
            />
        </View>
    );
} 