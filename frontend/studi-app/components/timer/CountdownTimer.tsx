import { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Svg, Circle } from 'react-native-svg';
import { useCountdown, CountdownConfig } from '@/hooks/timer';
import { useStudySession } from '@/hooks/useStudySession';

interface CountdownTimerProps {
  config: CountdownConfig;
  initialCategoryId: string;
  onFinish: () => void;
  onCancel: () => void;
}

export default function CountdownTimer({ config, initialCategoryId, onFinish, onCancel }: CountdownTimerProps) {
  const countdown = useCountdown(config);
  const { switchCategory, categories } = useStudySession();

  // Start with the selected category when timer begins
  useEffect(() => {
    if (countdown.status === 'running' && initialCategoryId) {
      switchCategory(Number(initialCategoryId));
    }
  }, [countdown.status, initialCategoryId, switchCategory]);

  // Handle timer completion
  useEffect(() => {
    if (countdown.isFinished) {
      onFinish();
    }
  }, [countdown.isFinished, onFinish]);

  const handleStart = () => {
    countdown.startTimer();
  };

  const handlePause = () => {
    if (countdown.status === 'running') {
      countdown.pauseTimer();
    } else if (countdown.status === 'paused') {
      countdown.resumeTimer();
    }
  };

  const handleStop = () => {
    countdown.stopTimer();
    onFinish();
  };

  const handleCancel = () => {
    countdown.cancelTimer();
    onCancel();
  };

  const getButtonText = () => {
    if (countdown.status === 'idle') return 'Start';
    if (countdown.status === 'paused') return 'Resume';
    if (countdown.status === 'running') return 'Pause';
    return 'Start';
  };

  const getProgressPercentage = () => {
    const totalSeconds = config.duration * 60;
    const elapsed = totalSeconds - countdown.timeRemaining;
    return (elapsed / totalSeconds) * 100;
  };

  const progressStrokeDasharray = `${getProgressPercentage() * 2.827} 282.7`;

  return (
    <View className="min-h-screen bg-gradient-to-br from-amber-100 to-orange-200 flex flex-col items-center justify-center p-6">
      {/* Timer Display */}
      <View className="text-center mb-8">
        <Text className="text-8xl font-light text-gray-800 mb-4">
          {countdown.formatTime()}
        </Text>
        
        {/* Progress Ring */}
        <View className="relative w-48 h-48 mx-auto mb-6 items-center justify-center">
          <Svg width={192} height={192} viewBox="0 0 100 100" style={{ transform: [{ rotate: '-90deg' }] }}>
            {/* Background circle */}
            <Circle
              cx="50"
              cy="50"
              r="45"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="6"
              fill="none"
            />
            {/* Progress circle */}
            <Circle
              cx="50"
              cy="50"
              r="45"
              stroke="rgba(59, 130, 246, 0.8)"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={progressStrokeDasharray}
            />
          </Svg>
          
          {/* Status text in center */}
          <View className="absolute inset-0 flex items-center justify-center">
            <View className="text-center">
              <Text className="text-sm text-gray-600 font-medium">
                {countdown.status === 'running' ? 'Studying' : 
                 countdown.status === 'paused' ? 'Paused' : 
                 countdown.isFinished ? 'Complete!' : 'Ready'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Category Selector (Simplified for now) */}
      <View className="bg-white rounded-2xl p-6 mb-8 w-full max-w-md">
        <View className="text-center">
          <Text className="text-sm text-gray-600 mb-2">Current Subject</Text>
          <View className="flex-row items-center justify-center space-x-2">
            <View className="w-3 h-3 rounded-full bg-blue-500" />
            <Text className="font-medium text-gray-800">
              {categories.find(cat => cat.id === initialCategoryId)?.name || 'Study'}
            </Text>
          </View>
          
          {/* Category switching arrows (placeholder) */}
          <View className="flex-row justify-center items-center mt-4 space-x-4">
            <Pressable className="p-2">
              <Text className="text-gray-400 text-xl">←</Text>
            </Pressable>
            <Pressable className="p-2">
              <Text className="text-gray-400 text-xl">→</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Control Buttons */}
      <View className="space-y-4 w-full max-w-md">
        {countdown.status === 'idle' ? (
          <Pressable
            onPress={handleStart}
            className="w-full py-4 bg-green-500 rounded-2xl"
          >
            <Text className="text-white font-medium text-center text-lg">
              Start Countdown
            </Text>
          </Pressable>
        ) : (
          <View className="flex-row space-x-3">
            <Pressable
              onPress={handlePause}
              className={`flex-1 py-4 rounded-2xl ${
                countdown.status === 'paused'
                  ? 'bg-green-500'
                  : 'bg-yellow-500'
              }`}
            >
              <Text className="text-white font-medium text-center text-lg">
                {getButtonText()}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleStop}
              className="flex-1 py-4 bg-blue-500 rounded-2xl"
            >
              <Text className="text-white font-medium text-center text-lg">
                Stop
              </Text>
            </Pressable>
          </View>
        )}
        
        <Pressable
          onPress={handleCancel}
          className="w-full py-3"
        >
          <Text className="text-gray-600 font-medium text-center">
            Cancel Session
          </Text>
        </Pressable>
      </View>

      {/* Timer Info */}
      <View className="mt-8 text-center">
        <Text className="text-sm text-gray-600">
          {config.duration} minute countdown timer
        </Text>
        {config.autoBreak && (
          <Text className="text-sm text-gray-600 mt-1">
            Auto break: {config.breakDuration} minutes
          </Text>
        )}
      </View>
    </View>
  );
} 