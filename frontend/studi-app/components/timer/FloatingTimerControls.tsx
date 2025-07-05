import React from 'react';
import { View, Pressable, Text } from 'react-native';

interface FloatingTimerControlsProps {
  status: 'idle' | 'running' | 'paused';
  onPauseResume: () => void;
  onStop: () => void;
}

export default function FloatingTimerControls({ status, onPauseResume, onStop }: FloatingTimerControlsProps) {
  // Don't show controls if timer is idle
  if (status === 'idle') {
    return null;
  }
  
  return (
    <View className="absolute bottom-16 left-6 right-6 flex-row justify-center items-center" style={{ gap: 20 }}>
      {/* Pause/Resume Button */}
      <Pressable 
        onPress={onPauseResume}
        className="h-14 w-14 bg-white rounded-full items-center justify-center"
        style={{ 
          shadowColor: '#000', 
          shadowOffset: { width: 0, height: 4 }, 
          shadowOpacity: 0.25, 
          shadowRadius: 8,
          elevation: 8
        }}
      >
        <Text className="text-primary font-bold text-xl">
          {status === 'running' ? '||' : '▶'}
        </Text>
      </Pressable>
      
      {/* Stop Button */}
      <Pressable 
        onPress={onStop}
        className="h-14 w-20 bg-red-500 rounded-full items-center justify-center"
        style={{ 
          shadowColor: '#000', 
          shadowOffset: { width: 0, height: 4 }, 
          shadowOpacity: 0.25, 
          shadowRadius: 8,
          elevation: 8
        }}
      >
        <Text className="text-white font-semibold text-base">
          Stop
        </Text>
      </Pressable>
    </View>
  );
}