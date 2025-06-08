import { View, Text, Pressable } from 'react-native';

interface TimerModeSelectorProps {
  selectedMode: 'timer' | 'free' | 'pomo';
  onModeChange: (mode: 'timer' | 'free' | 'pomo') => void;
}

export default function TimerModeSelector({ selectedMode, onModeChange }: TimerModeSelectorProps) {
  return (
    <View className="flex-row bg-gray-100 rounded-full p-1 mb-6">
      <Pressable
        onPress={() => onModeChange('timer')}
        className={`flex-1 py-3 px-4 rounded-full ${
          selectedMode === 'timer'
            ? 'bg-indigo-600 shadow-sm'
            : ''
        }`}
      >
        <Text className={`text-sm font-medium text-center ${
          selectedMode === 'timer'
            ? 'text-white'
            : 'text-gray-600'
        }`}>
          TIMER
        </Text>
      </Pressable>
      <Pressable
        onPress={() => onModeChange('free')}
        className={`flex-1 py-3 px-4 rounded-full ${
          selectedMode === 'free'
            ? 'bg-indigo-600 shadow-sm'
            : ''
        }`}
      >
        <Text className={`text-sm font-medium text-center ${
          selectedMode === 'free'
            ? 'text-white'
            : 'text-gray-600'
        }`}>
          FREE
        </Text>
      </Pressable>
      <Pressable
        onPress={() => onModeChange('pomo')}
        className={`flex-1 py-3 px-4 rounded-full ${
          selectedMode === 'pomo'
            ? 'bg-indigo-600 shadow-sm'
            : ''
        }`}
      >
        <Text className={`text-sm font-medium text-center ${
          selectedMode === 'pomo'
            ? 'text-white'
            : 'text-gray-600'
        }`}>
          POMO
        </Text>
      </Pressable>
    </View>
  );
} 