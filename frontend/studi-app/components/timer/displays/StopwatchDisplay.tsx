import React from 'react';
import { Text } from 'react-native';

interface StopwatchDisplayProps {
  formatTime: () => string;
}

export default function StopwatchDisplay({ formatTime }: StopwatchDisplayProps) {
  return (
    <Text className="text-6xl font-bold text-white">{formatTime()}</Text>
  );
} 