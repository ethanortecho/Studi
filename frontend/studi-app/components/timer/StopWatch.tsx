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
        // If session is active, use current category color
        const currentColor = getCurrentCategoryColor();
        if (currentColor !== '#E5E7EB') { // If not default gray
            return currentColor;
        }
        
        // Fallback: use selected category color from route params
        if (selectedCategoryId) {
            const selectedCategory = categories.find(cat => Number(cat.id) === Number(selectedCategoryId));
            return selectedCategory?.color || '#E5E7EB';
        }
        
        return '#E5E7EB'; // Default gray
    };

    const categoryColor = getBackgroundColor();

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
                    <View style={{ height: 200, marginBottom: 20 }}>
                        <CategoryFlatListCarousel />
                    </View>
                    
                    {/* Control Buttons */}
                    <View className="flex-row" style={{ gap: 16 }}>
                        <Pressable 
                            onPress={() => { 
                                if (status === 'running') {
                                    pauseTimer();
                                } else if (status === 'paused') {
                                    resumeTimer();
                                }
                            }}
                            className="flex-1 bg-blue-500 py-4 rounded-2xl items-center justify-center"
                            style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}
                        >
                            <Text className="text-white font-bold text-3xl" style={{ letterSpacing: 2 }}>
                                {status === 'running' ? '||' : '▶'}
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
                                className="flex-1 bg-red-500 py-4 rounded-2xl items-center justify-center"
                                style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}
                            >
                                <Text className="text-white font-semibold text-lg">
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