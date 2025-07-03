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
    <View>

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
     
    </View>
  );
} 