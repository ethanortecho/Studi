import React from 'react';
import { Text } from 'react-native';

interface CountdownDisplayProps {
  formatTime: () => string;
}

export default function CountdownDisplay({ formatTime }: CountdownDisplayProps) {
  return (
    <Text className="text-6xl font-bold text-white">{formatTime()}</Text>
  );
} 