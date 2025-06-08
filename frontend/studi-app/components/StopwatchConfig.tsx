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
    <View className="space-y-4">
      <Text className="text-base font-medium text-gray-900 mb-3">
        Stopwatch Configuration
      </Text>
      
      <View className="p-4 bg-blue-50 rounded-xl border border-blue-200">
        <Text className="text-blue-800 text-center font-medium mb-2">
          Ready to track your study time! ⏱️
        </Text>
        <Text className="text-blue-600 text-center text-sm">
          The stopwatch will start counting when you begin your study session. Perfect for open-ended study periods where you want to track exactly how much time you spend.
        </Text>
      </View>

      <View className="space-y-2">
        <Text className="text-sm font-medium text-gray-700">Features:</Text>
        <View className="space-y-1">
          <Text className="text-sm text-gray-600">• Start, pause, and resume functionality</Text>
          <Text className="text-sm text-gray-600">• Precise time tracking</Text>
          <Text className="text-sm text-gray-600">• No time limits - study as long as you need</Text>
          <Text className="text-sm text-gray-600">• Automatic session recording when stopped</Text>
        </View>
      </View>
    </View>
  );
} 