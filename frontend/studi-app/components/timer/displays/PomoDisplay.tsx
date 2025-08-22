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
      <View className="mb-6">
        <Text className={`text-center text-xl font-medium ${pomoBlockStatus === 'work' ? 'text-white/60' : 'text-white/60'}`}>
          {pomoBlockStatus === 'work' ? 'Focus Time' : 'Break Time'}
        </Text>
        <Text className="text-center text-sm text-white/50 mt-1">
          {pomoBlocksRemaining} blocks remaining
        </Text>
      </View>
      
      {/* Timer Display - Much larger with Inter font */}
      <Text 
        className="text-white font-bold tracking-tight"
        style={{ 
          fontSize: 96,
          fontFamily: 'Inter',
          fontWeight: '700',
          letterSpacing: -2
        }}
      >
        {formatTime()}
      </Text>
    </View>
  );
}