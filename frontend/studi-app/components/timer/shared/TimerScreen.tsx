import React from 'react';
import { Text, View, Pressable, StatusBar } from 'react-native';
import { useState, useContext, useEffect } from 'react';
import { StudySessionContext } from '@/context/StudySessionContext';
import { CancelSessionModal } from '@/components/modals/CancelSessionModal';
import { router } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTimerBackground } from './useTimerBackground';
import FloatingCategoryFAB from '../FloatingCategoryFAB';
import FloatingTimerControls from '../FloatingTimerControls';
import CategorySelectionModal from '../CategorySelectionModal';

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
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  
  // Extract timer hook methods and state
  const { startTimer, pauseTimer, resumeTimer, stopTimer, cancelTimer, status, formatTime } = timerHook;
  
  // Use shared background color logic
  const { categoryColor, handleInstantColorChange, resetPreviewColor } = useTimerBackground({
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
    setShowCategoryModal(false); // Close modal after selection
    console.log("TimerScreen: Set sessionStarted=true and pendingCategoryId=", categoryId);
  };
  
  // Handler for category switch during session
  const handleCategorySwitchDuringSession = async (categoryId: string | number) => {
    console.log("TimerScreen: handleCategorySwitchDuringSession called with categoryId:", categoryId);
    try {
      await switchCategory(Number(categoryId));
      setShowCategoryModal(false);
      console.log("TimerScreen: Category switch completed during session");
    } catch (error) {
      console.error("TimerScreen: Error switching category during session:", error);
    }
  };
  
  // Handler for FAB press
  const handleFABPress = () => {
    setShowCategoryModal(true);
  };
  
  // For countdown and pomo, if there's a selectedCategoryId from route params, 
  // trigger the category selection flow automatically
  useEffect(() => {
    if ((timerType === 'countdown' || timerType === 'pomo') && selectedCategoryId && !sessionStarted && !pendingCategoryId) {
      // Ensure we pass a single string or number, not an array, to the handler
      const categoryId = Array.isArray(selectedCategoryId) ? selectedCategoryId[0] : selectedCategoryId;
      console.log(`TimerScreen: Setting up ${timerType} with preselected category:`, categoryId);
      handleFirstCategorySelect(categoryId);
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
  
  // Show modal automatically for initial category selection (stopwatch only)
  useEffect(() => {
    // For stopwatch timer without preselected category, show modal immediately
    if (timerType === 'stopwatch' && !selectedCategoryId && !sessionId && !sessionStarted && !showCategoryModal) {
      console.log("TimerScreen: Auto-showing category modal for initial selection");
      setShowCategoryModal(true);
    }
  }, [timerType, selectedCategoryId, sessionId, sessionStarted, showCategoryModal]);

  return (
    <View className="flex-1" style={{ backgroundColor: categoryColor }}>
      <StatusBar backgroundColor={categoryColor} barStyle="light-content" />
      <View className="flex-1">
        {/* Cancel Button */}
        {(status === 'running' || status === 'paused') && (
          <Pressable 
            onPress={() => setShowCancelModal(true)}
            className="absolute top-12 right-6 p-3 z-10 bg-black bg-opacity-20 rounded-full"
            style={{ 
              shadowColor: '#000', 
              shadowOffset: { width: 0, height: 4 }, 
              shadowOpacity: 0.25, 
              shadowRadius: 8,
              width: 44,
              height: 44,
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Text className="text-white text-xl font-bold">✕</Text>
          </Pressable>
        )}

        {/* Timer Display - Full Screen */}
        <View className="flex-1 justify-center items-center">
          {timerDisplayComponent}
        </View>
        
        {/* Floating Category FAB */}
        <FloatingCategoryFAB 
          onPress={handleFABPress}
          isSessionActive={isSessionActive}
        />
        
        {/* Floating Timer Controls */}
        <FloatingTimerControls
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
        
        {/* Category Selection Modal */}
        <CategorySelectionModal
          visible={showCategoryModal}
          onClose={() => {
            resetPreviewColor();
            setShowCategoryModal(false);
          }}
          onCategorySelect={isSessionActive ? handleCategorySwitchDuringSession : handleFirstCategorySelect}
          onImmediateColorChange={handleInstantColorChange}
          isInitialSelection={!isSessionActive}
        />
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