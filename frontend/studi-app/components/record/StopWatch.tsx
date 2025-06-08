import React from 'react';
import { Text, View, Pressable } from 'react-native';
import { useStopwatch } from '@/hooks/timer';
import { useEffect, useState, useContext } from 'react';
import { StudySessionContext } from '@/context/StudySessionContext';
import { CancelSessionModal } from '@/components/modals/CancelSessionModal';
import { router } from 'expo-router';

export function Timer() {
    const { startTimer, pauseTimer, resumeTimer, stopTimer, cancelTimer, elapsed, status, formatTime } = useStopwatch();
    const { sessionId, currentCategoryId, categories } = useContext(StudySessionContext);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // Check if session is already running (from modal)
    const isSessionActive = sessionId !== null;
    const currentCategory = categories.find(cat => cat.id === String(currentCategoryId));
    
    // Auto-start timer if session was started from modal and timer is still idle
    useEffect(() => {
        if (isSessionActive && status === 'idle') {
            console.log("Timer component: Session already active, starting timer automatically");
            startTimer();
        }
    }, [isSessionActive, status, startTimer]);
    
    const handlePlayPause = () => {
        if (status === 'running') {
            pauseTimer();
        } else if (status === 'paused') {
            resumeTimer();
        } else {
            startTimer();
        }
    };

    const handleStopSession = async () => {
        try {
            await stopTimer();
            // Navigate back to home after stopping
            router.push('/(tabs)/home');
        } catch (error) {
            console.error("Timer component: stopTimer error:", error);
        }
    };
    
    const handleCancel = async () => {
        setIsLoading(true);
        try {
            await cancelTimer();
            setShowCancelModal(false);
            router.push('/(tabs)/home');
        } catch (error) {
            console.error("Timer component: cancelTimer error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View className="items-center p-6 bg-white rounded-xl">
            {/* Session Status Indicator */}
            {isSessionActive && currentCategory && (
                <View className="w-full mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Text className="text-center text-sm text-blue-700 font-medium mb-1">
                        Active Study Session
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
            
            <View className="mb-4">
                <Text className="text-4xl font-bold text-gray-800">{formatTime()}</Text>
            </View>
            
            <View className="w-full">
                <Pressable 
                    onPress={handlePlayPause}
                    className="bg-green-500 py-3 px-6 rounded-full items-center"
                >
                    <Text className="text-white font-medium text-lg">
                        {status === 'running' ? 'Pause' : (status === 'paused' ? 'Resume' : 'Start')}
                    </Text>
                </Pressable>
            </View>
            
            {(status === 'running' || status === 'paused') && (
                <View className="w-full mt-4">
                    <Pressable 
                        onPress={handleStopSession}
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
                onConfirm={handleCancel}
                isLoading={isLoading}
            />
        </View>
    );
}