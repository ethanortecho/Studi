import React from 'react';
import { Text } from 'react-native';

interface StopwatchDisplayProps {
  formatTime: () => string;
}

export default function StopwatchDisplay({ formatTime }: StopwatchDisplayProps) {
  return (
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
  );
}