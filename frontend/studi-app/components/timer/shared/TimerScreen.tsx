import React from 'react';
import { Text, View, Pressable, StatusBar } from 'react-native';
import { useState, useContext, useEffect } from 'react';
import { StudySessionContext } from '../../../context/StudySessionContext';
import { CancelSessionModal } from '../../modals/CancelSessionModal';
import { router } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTimerBackground } from './useTimerBackground';
import AnimatedGradientBackground from './AnimatedGradientBackground';
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
  const { sessionId, currentCategoryId, categories, switchCategory, refreshCategories } = useContext(StudySessionContext);
  
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
  const currentCategory = categories.find(cat => 
    cat.id === String(currentCategoryId) || cat.id === currentCategoryId
  );
  
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
  
  // Fetch categories when timer screen loads (if not already loaded)
  useEffect(() => {
    if (categories.length === 0) {
      console.log("TimerScreen: No categories loaded, fetching...");
      refreshCategories();
    }
  }, []);

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
  
  // Show modal automatically for initial category selection (all timer types)
  useEffect(() => {
    // For any timer without preselected category, show modal immediately
    if (!selectedCategoryId && !sessionId && !sessionStarted && !showCategoryModal) {
      console.log("TimerScreen: Auto-showing category modal for initial selection");
      setShowCategoryModal(true);
    }
  }, [timerType, selectedCategoryId, sessionId, sessionStarted, showCategoryModal]);

  return (
    <AnimatedGradientBackground color={categoryColor}>
      <StatusBar backgroundColor="transparent" translucent barStyle="light-content" />
      {/* Main content stacked vertically */}
      <SafeAreaView className="flex-1" edges={['bottom']}>
        
        {/* Switch Subject Button at top */}
        <View className="items-center pt-20 pb-4">
          <Pressable 
            onPress={handleFABPress}
            className="px-6 py-3 rounded-full"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.15)',
            }}
          >
            <Text className="text-white/90 text-base">Switch Subject</Text>
          </Pressable>
        </View>

        {/* Timer Display and Category Indicator */}
        <View className="flex-1 justify-center items-center px-6">
          {/* Category Indicator */}
          <View className="mb-8">
            <Text className="text-white/60 text-lg text-center">
              {currentCategory ? `You're studying ${currentCategory.name}` : 'Select a subject'}
            </Text>
          </View>
          
          {/* Timer Display */}
          {timerDisplayComponent}
        </View>

        {/* Controls row */}
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
              // Navigate back to home after successful stop
              router.back();
            } catch (error) {
              console.error("Timer stop error:", error);
            }
          }}
          onCancel={() => setShowCancelModal(true)}
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
    </AnimatedGradientBackground>
  );
} 