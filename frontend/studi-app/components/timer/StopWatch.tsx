import React from 'react';
import { Text, View, Pressable } from 'react-native';
import { useStopwatch, StopwatchConfig } from '@/hooks/timer';
import { useState, useContext, useEffect } from 'react';
import { StudySessionContext } from '@/context/StudySessionContext';
import { CancelSessionModal } from '@/components/modals/CancelSessionModal';
import { router } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import CategoryFlatListCarousel from '@/components/record/CategoryFlatListCarousel';

export function Timer() {
    // Get category from route params (passed from modal)
    const { selectedCategoryId } = useLocalSearchParams();
    
    // Create config with category info
    const stopwatchConfig: StopwatchConfig = {
        selectedCategoryId: selectedCategoryId as string
    };
    
    const { startTimer, pauseTimer, resumeTimer, stopTimer, cancelTimer, elapsed, status, formatTime } = useStopwatch(stopwatchConfig);
    const { sessionId, currentCategoryId, categories, getCurrentCategoryColor } = useContext(StudySessionContext);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // Check if session is already running
    const isSessionActive = sessionId !== null;
    const currentCategory = categories.find(cat => cat.id === String(currentCategoryId));
    
    // Auto-start timer when component mounts (this creates session + starts timer atomically)
    useEffect(() => {
        if (selectedCategoryId && status === 'idle') {
            console.log("Timer: Auto-starting timer with category:", selectedCategoryId);
            startTimer();
        }
    }, []); // Run once on mount

    // Get color from current category or from selectedCategoryId as fallback
    const getBackgroundColor = () => {
        console.log("StopWatch: getBackgroundColor called");
        console.log("StopWatch: currentCategoryId:", currentCategoryId);
        console.log("StopWatch: selectedCategoryId:", selectedCategoryId);
        console.log("StopWatch: categories length:", categories.length);
        
        // If session is active, use current category color
        const currentColor = getCurrentCategoryColor();
        console.log("StopWatch: getCurrentCategoryColor returned:", currentColor);
        
        if (currentColor !== '#E5E7EB') { // If not default gray
            console.log("StopWatch: Using current category color:", currentColor);
            return currentColor;
        }
        
        // Fallback: use selected category color from route params
        if (selectedCategoryId) {
            const selectedCategory = categories.find(cat => Number(cat.id) === Number(selectedCategoryId));
            console.log("StopWatch: Found selected category:", selectedCategory);
            const fallbackColor = selectedCategory?.color || '#E5E7EB';
            console.log("StopWatch: Using fallback color:", fallbackColor);
            return fallbackColor;
        }
        
        console.log("StopWatch: Using default gray");
        return '#E5E7EB'; // Default gray
    };

    const categoryColor = getBackgroundColor();
    console.log("StopWatch: Final background color:", categoryColor);

    return (
        <View className="flex-1" style={{ backgroundColor: categoryColor }}>
            {/* Cancel Button */}
            {(status === 'running' || status === 'paused') && (
                <Pressable 
                    onPress={() => setShowCancelModal(true)}
                    className="absolute top-12 right-4 p-2 z-10"
                >
                    <Text className="text-white text-lg font-bold">✕</Text>
                </Pressable>
            )}

            {/* Timer Display - Top 50% */}
            <View className="flex-1 justify-center items-center" style={{ flex: 0.5 }}>
                <Text className="text-6xl font-bold text-white">{formatTime()}</Text>
            </View>

            {/* Bottom Controls - Bottom 50% */}
            <View className="bg-white rounded-t-3xl px-6 pt-8 pb-6" style={{ flex: 0.5 }}>
                <View className="flex-1">
                    {/* Category Carousel */}
                    <View className="flex-1 mb-6">
                        <CategoryFlatListCarousel />
                    </View>
                    
                    {/* Control Buttons */}
                    <View className="space-y-4">
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
                        
                        {(status === 'running' || status === 'paused') && (
                            <Pressable 
                                onPress={async () => {
                                    try {
                                        await stopTimer();
                                        // Note: Navigation to home is handled by SessionStatsModal after showing completion stats
                                    } catch (error) {
                                        console.error("Timer stop error:", error);
                                    }
                                }}
                                className="bg-red-500 py-3 px-6 rounded-full items-center"
                            >
                                <Text className="text-white font-medium text-lg">
                                    End Session
                                </Text>
                            </Pressable>
                        )}
                    </View>
                </View>
            </View>
            
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
                        console.error("Timer cancel error:", error);
                    } finally {
                        setIsLoading(false);
                    }
                }}
                isLoading={isLoading}
            />
        </View>
    );
}