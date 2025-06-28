import React from 'react';
import { View, Text } from 'react-native';

interface StopwatchConfigProps {
  onConfigChange: (config: {}) => void;
}

export default function StopwatchConfig({ onConfigChange }: StopwatchConfigProps) {
  React.useEffect(() => {
    // Stopwatch doesn't need specific configuration, just signal it's ready
    onConfigChange({});
  }, []);

  return (
    <View className="space-y-6">
      <Text className="text-lg font-bold text-gray-100">Stopwatch Configuration</Text>

      {/* Info Card */}
      <View className="p-4 rounded-lg border border-gray-700 bg-gray-800/60">
        <Text className="text-gray-100 text-center font-semibold mb-2">
          Ready to track your study time! ⏱️
        </Text>
        <Text className="text-gray-300 text-center text-sm">
          The stopwatch will start counting when you begin your study session. Perfect for open-ended study periods where you want to track exactly how much time you spend.
        </Text>
      </View>

      {/* Feature List */}
      <View className="space-y-2">
        <Text className="text-sm font-medium text-gray-100">Features:</Text>
        <View className="space-y-1">
          <Text className="text-sm text-gray-300">• Start, pause, and resume functionality</Text>
          <Text className="text-sm text-gray-300">• Precise time tracking</Text>
          <Text className="text-sm text-gray-300">• No time limits – study as long as you need</Text>
          <Text className="text-sm text-gray-300">• Automatic session recording when stopped</Text>
        </View>
      </View>
    </View>
  );
} 