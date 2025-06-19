import React from 'react';
import { Text, View, Pressable, StatusBar } from 'react-native';
import { useState, useContext, useEffect } from 'react';
import { StudySessionContext } from '@/context/StudySessionContext';
import { CancelSessionModal } from '@/components/modals/CancelSessionModal';
import { router } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import CategoryScrollViewCarousel from '@/components/record/CategoryScrollViewCarousel';
import { useTimerBackground } from './useTimerBackground';
import TimerControls from './TimerControls';

// Timer type from route
type TimerType = 'stopwatch' | 'countdown' | 'pomo';

interface TimerScreenProps {
  timerType: TimerType;
  timerDisplayComponent: React.ReactNode;
  timerHook: any; // We'll make this more specific later
}

export default function TimerScreen({ 
  timerType, 
  timerDisplayComponent, 
  timerHook 
}: TimerScreenProps) {
  const { selectedCategoryId } = useLocalSearchParams();
  const { sessionId, currentCategoryId, categories, switchCategory } = useContext(StudySessionContext);
  
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [pendingCategoryId, setPendingCategoryId] = useState<string | number | null>(null);
  
  // Extract timer hook methods and state
  const { startTimer, pauseTimer, resumeTimer, stopTimer, cancelTimer, status, formatTime } = timerHook;
  
  // Use shared background color logic
  const { categoryColor, handleInstantColorChange } = useTimerBackground({
    selectedCategoryId,
    categories,
    getCurrentCategoryColor: useContext(StudySessionContext).getCurrentCategoryColor
  });
  
  // Check if session is already running
  const isSessionActive = sessionId !== null;
  const currentCategory = categories.find(cat => cat.id === String(currentCategoryId));
  
  // Handler for first real category selection
  const handleFirstCategorySelect = async (categoryId: string | number) => {
    console.log("TimerScreen: handleFirstCategorySelect called with categoryId:", categoryId);
    setSessionStarted(true);
    setPendingCategoryId(categoryId);
    console.log("TimerScreen: Set sessionStarted=true and pendingCategoryId=", categoryId);
  };
  
  // For countdown and pomo, if there's a selectedCategoryId from route params, 
  // trigger the category selection flow automatically
  useEffect(() => {
    if ((timerType === 'countdown' || timerType === 'pomo') && selectedCategoryId && !sessionStarted && !pendingCategoryId) {
      console.log(`TimerScreen: Setting up ${timerType} with preselected category:`, selectedCategoryId);
      handleFirstCategorySelect(selectedCategoryId);
    }
  }, [timerType, selectedCategoryId, sessionStarted, pendingCategoryId]);
  
  // Auto-start timer when first category is selected (all timer types)
  useEffect(() => {
    if (pendingCategoryId && sessionStarted && !sessionId) {
      console.log(`TimerScreen: Starting ${timerType} timer for first category selection`);
      startTimer(); // This starts session creation but doesn't wait
    }
  }, [pendingCategoryId, sessionStarted, sessionId, timerType]); // Removed startTimer from dependencies

  // Handle category switching after session is created
  useEffect(() => {
    if (sessionId && pendingCategoryId) {
      console.log("TimerScreen: Session created, now switching to category:", pendingCategoryId);
      const doSwitchCategory = async () => {
        try {
          await switchCategory(Number(pendingCategoryId));
          console.log("TimerScreen: Category switch completed after session creation");
          setPendingCategoryId(null);
        } catch (error) {
          console.error("TimerScreen: Error switching category after session creation:", error);
        }
      };
      doSwitchCategory();
    }
  }, [sessionId, pendingCategoryId]); // Removed switchCategory from dependencies

  return (
    <View className="flex-1" style={{ backgroundColor: categoryColor }}>
      <StatusBar backgroundColor={categoryColor} barStyle="light-content" />
      <View className="flex-1">
        {/* Cancel Button */}
        {(status === 'running' || status === 'paused') && (
          <View className="px-10">
            <Pressable 
            onPress={() => setShowCancelModal(true)}
            className=" absolute top-4 right-4 p-3 z-10 bg-black bg-opacity-20 rounded-full"
            style={{ 
              shadowColor: '#000', 
              shadowOffset: { width: 0, height: 2 }, 
              shadowOpacity: 0.3, 
              shadowRadius: 4,
              
              width: 44,
              height: 44,
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Text className="text-white text-xl font-bold">✕</Text>
          </Pressable>

          </View>
          
        )}

        {/* Timer Display - Top 50% */}
        <View className="flex-1 justify-center items-center" style={{ flex: 0.5 }}>
          {timerDisplayComponent}
        </View>

        {/* Bottom Controls - Bottom 50% */}
        <View className="bg-white rounded-[50px] px-6" style={{ flex: 0.7 }}>
          <View className="flex-1">
            {/* Category Carousel */}
            <View style={{ height: 250}}>
              <CategoryScrollViewCarousel 
                sessionStarted={sessionStarted} 
                onFirstCategorySelect={handleFirstCategorySelect}
                onImmediateColorChange={handleInstantColorChange}
              />
            </View>
            
            {/* Control Buttons */}
            {status !== 'idle' ? (
              <TimerControls
                status={status}
                onPauseResume={() => {
                  if (status === 'running') {
                    pauseTimer();
                  } else if (status === 'paused') {
                    resumeTimer();
                  }
                }}
                onStop={async () => {
                  try {
                    await stopTimer();
                  } catch (error) {
                    console.error("Timer stop error:", error);
                  }
                }}
              />
            ) : (
              <View className="items-center mt-4">
                <Text className="text-gray-400 text-sm font-medium">Select a category to start session</Text>
              </View>
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