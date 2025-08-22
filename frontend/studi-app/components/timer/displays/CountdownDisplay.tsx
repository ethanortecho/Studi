import React from 'react';
import { Text } from 'react-native';

interface CountdownDisplayProps {
  formatTime: () => string;
}

export default function CountdownDisplay({ formatTime }: CountdownDisplayProps) {
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