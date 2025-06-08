import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useStudySession } from '@/hooks/useStudySession';
import { CountdownConfig } from '@/hooks/timer';
import TimerModeSelector from './TimerModeSelector';
import CountdownConfig from './CountdownConfig';
import CategorySelectionModal from './CategorySelectionModal';
import CountdownTimer from './CountdownTimer';

type TimerMode = 'timer' | 'free' | 'pomo';
type AppState = 'home' | 'running';

export default function TimerHomeDemo() {
  const [selectedMode, setSelectedMode] = useState<TimerMode>('timer');
  const [appState, setAppState] = useState<AppState>('home');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [countdownConfig, setCountdownConfig] = useState<CountdownConfig>();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  
  const { categories } = useStudySession();

  const handleCountdownConfig = (config: CountdownConfig) => {
    setCountdownConfig(config);
  };

  const handleCountdownStart = () => {
    setShowCategoryModal(true);
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setShowCategoryModal(false);
    setAppState('running');
  };

  const handleTimerFinish = () => {
    setAppState('home');
    setSelectedCategoryId('');
  };

  const handleTimerCancel = () => {
    setAppState('home');
    setSelectedCategoryId('');
  };

  const handleModalClose = () => {
    setShowCategoryModal(false);
  };

  // If timer is running, show the timer screen
  if (appState === 'running' && countdownConfig && selectedCategoryId) {
    return (
      <CountdownTimer
        config={countdownConfig}
        initialCategoryId={selectedCategoryId}
        onFinish={handleTimerFinish}
        onCancel={handleTimerCancel}
      />
    );
  }

  return (
    <View className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <View className="max-w-md mx-auto">
        {/* Header */}
        <View className="text-center mb-8">
          <Text className="text-3xl font-light text-indigo-800 mb-2">
            Welcome Back,
          </Text>
          <Text className="text-3xl font-light text-indigo-600">
            Ethan
          </Text>
        </View>

        {/* Timer Mode Selector */}
        <TimerModeSelector
          selectedMode={selectedMode}
          onModeChange={setSelectedMode}
        />

        {/* Timer Configuration */}
        <View className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {selectedMode === 'timer' && (
            <CountdownConfig
              onConfigChange={handleCountdownConfig}
              onStart={handleCountdownStart}
            />
          )}
          
          {selectedMode === 'free' && (
            <View className="p-6 text-center">
              <Text className="text-lg font-medium text-gray-800 mb-4">
                Free Timer (Stopwatch)
              </Text>
              <Text className="text-gray-600 mb-6">
                Use the existing stopwatch functionality
              </Text>
              <Pressable className="w-full py-4 bg-green-500 rounded-lg">
                <Text className="text-white font-medium text-center text-lg">
                  Start Free Timer
                </Text>
              </Pressable>
            </View>
          )}
          
          {selectedMode === 'pomo' && (
            <View className="p-6 text-center">
              <Text className="text-lg font-medium text-gray-800 mb-4">
                Pomodoro Timer
              </Text>
              <Text className="text-gray-600 mb-6">
                Coming soon! Will include work/break cycles.
              </Text>
              <Pressable 
                disabled
                className="w-full py-4 bg-gray-300 rounded-lg"
              >
                <Text className="text-gray-500 font-medium text-center text-lg">
                  Coming Soon
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>

      {/* Category Selection Modal */}
      <CategorySelectionModal
        isOpen={showCategoryModal}
        categories={categories}
        onSelectCategory={handleCategorySelect}
        onClose={handleModalClose}
        timerType="countdown"
        timerConfig={countdownConfig}
      />
    </View>
  );
} 