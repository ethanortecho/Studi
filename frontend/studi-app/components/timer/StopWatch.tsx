import React from 'react';
import { Text, View, Pressable, StatusBar } from 'react-native';
import { useStopwatch, StopwatchConfig } from '../../hooks/timer';
import { useState, useContext, useEffect } from 'react';
import { StudySessionContext } from '../../context/StudySessionContext';
import { CancelSessionModal } from '../modals/CancelSessionModal';
import { router } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import CategoryScrollViewCarousel from '../record/CategoryScrollViewCarousel';

export function Timer() {
 
    // Only use local state and context for category selection
    const { selectedCategoryId } = useLocalSearchParams();
    
    // Create config with category info
    const stopwatchConfig: StopwatchConfig = {};
    
    const { startTimer, pauseTimer, resumeTimer, stopTimer, cancelTimer, elapsed, status, formatTime } = useStopwatch(stopwatchConfig);
    const { sessionId, currentCategoryId, categories, getCurrentCategoryColor, switchCategory } = useContext(StudySessionContext);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [sessionStarted, setSessionStarted] = useState(false);
    const [pendingCategoryId, setPendingCategoryId] = useState<string | number | null>(null)
    
    // Add immediate color state for zero-delay updates
    const [selectedPreviewColor, setSelectedPreviewColor] = useState<string | null>(null);
    
    // Check if session is already running
    const isSessionActive = sessionId !== null;
    const currentCategory = categories.find(cat => cat.id === String(currentCategoryId));
    
    // Auto-start timer when first category is selected
    useEffect(() => {
        if (pendingCategoryId && sessionStarted && !sessionId) {
            console.log("StopWatch: Starting timer for first category selection");
            startTimer(); // This starts session creation but doesn't wait
        }
    }, [pendingCategoryId, sessionStarted, sessionId]);

    // Handle category switching after session is created
    useEffect(() => {
        if (sessionId && pendingCategoryId) {
            console.log("StopWatch: Session created, now switching to category:", pendingCategoryId);
            const doSwitchCategory = async () => {
                try {
                    await switchCategory(Number(pendingCategoryId));
                    console.log("StopWatch: Category switch completed after session creation");
                    setPendingCategoryId(null);
                } catch (error) {
                    console.error("StopWatch: Error switching category after session creation:", error);
                }
            };
            doSwitchCategory();
        }
    }, [sessionId]); // Only depend on sessionId - we only want this to run when session is created

    // Synchronous color lookup function
    const getCategoryColorById = (categoryId: string | number) => {
        const category = categories.find(cat => Number(cat.id) === Number(categoryId));
        return category?.color || '#E5E7EB';
    };

    // Updated background color logic with instant preview priority
    const getBackgroundColor = () => {
        // 1. Use instant preview color if available
        if (selectedPreviewColor) {
            return selectedPreviewColor;
        }
        
        // 2. Use current session category color
        const currentColor = getCurrentCategoryColor();
        if (currentColor !== '#E5E7EB') {
            return currentColor;
        }
        
        // 3. Fallback: use selected category color from route params
        if (selectedCategoryId) {
            const selectedCategory = categories.find(cat => Number(cat.id) === Number(selectedCategoryId));
            return selectedCategory?.color || '#E5E7EB';
        }
        
        return '#E5E7EB'; // Default gray
    };

    const categoryColor = getBackgroundColor();

    // Instant color change handler (will be passed to carousel)
    const handleInstantColorChange = (categoryId: string | number) => {
        const newColor = getCategoryColorById(categoryId);
        setSelectedPreviewColor(newColor);
    };

    // Handler for first real category selection
    const handleFirstCategorySelect = async (categoryId: string | number) => {
        console.log("StopWatch: handleFirstCategorySelect called with categoryId:", categoryId);
        setSessionStarted(true);
        setPendingCategoryId(categoryId);
        console.log("StopWatch: Set sessionStarted=true and pendingCategoryId=", categoryId);
    };

    return (
        <View className="flex-1" style={{ backgroundColor: categoryColor }}>
            <StatusBar backgroundColor={categoryColor} barStyle="light-content" />
            <SafeAreaView className="flex-1">
                {/* Cancel Button */}
                {(status === 'running' || status === 'paused') && (
                    <Pressable 
                        onPress={() => setShowCancelModal(true)}
                        className="absolute top-2 right-4 p-2 z-10"
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
                            <CategoryScrollViewCarousel 
                                sessionStarted={sessionStarted} 
                                onFirstCategorySelect={handleFirstCategorySelect}
                                onImmediateColorChange={handleInstantColorChange}
                            />
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
            </SafeAreaView>
            
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