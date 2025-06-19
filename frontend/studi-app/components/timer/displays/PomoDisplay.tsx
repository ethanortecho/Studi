import React from 'react';
import { Text, View } from 'react-native';

interface PomoDisplayProps {
  formatTime: () => string;
  pomoBlockStatus: 'work' | 'break';
  pomoBlocksRemaining: number;
}

export default function PomoDisplay({ formatTime, pomoBlockStatus, pomoBlocksRemaining }: PomoDisplayProps) {
  return (
    <View className="items-center">
      {/* Pomodoro Status */}
      <View className="mb-4">
        <Text className={`text-center text-xl font-medium ${pomoBlockStatus === 'work' ? 'text-red-200' : 'text-green-200'}`}>
          {pomoBlockStatus === 'work' ? '🍅 Focus Time' : '☕ Break Time'}
        </Text>
        <Text className="text-center text-sm text-white opacity-80">
          {pomoBlocksRemaining} blocks remaining
        </Text>
      </View>
      
      {/* Timer Display */}
      <Text className="text-6xl font-bold text-white">{formatTime()}</Text>
    </View>
  );
} 