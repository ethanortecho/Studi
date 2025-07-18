import React from 'react';
import { View, Pressable, Text } from 'react-native';

interface FloatingTimerControlsProps {
  status: 'idle' | 'running' | 'paused';
  onPauseResume: () => void;
  onStop: () => void;
  onCancel: () => void;
}

export default function FloatingTimerControls({ status, onPauseResume, onStop, onCancel }: FloatingTimerControlsProps) {
  // Always show controls
  
  return (
    <View className="flex-row justify-center items-end px-6 mb-14" style={{ gap: 25 }}>
      {/* Cancel Button */}
      <View className="items-center">
        <Pressable 
          onPress={onCancel}
          className="h-20 w-20 bg-surface rounded-full items-center justify-center"
          style={{ 
            shadowColor: '#000', 
            shadowOffset: { width: 0, height: 4 }, 
            shadowOpacity: 0.25, 
            shadowRadius: 8,
            elevation: 8
          }}
        >
          <Text className="text-primaryText font-bold text-xl">✕</Text>
        </Pressable>
        <Text className="text-primaryText text-xs mt-1">Cancel</Text>
      </View>

      {/* Pause/Resume Button */}
      <View className="items-center">
        <Pressable 
          onPress={onPauseResume}
          className="h-20 w-20 bg-surface rounded-full items-center justify-center"
          style={{ 
            shadowColor: '#000', 
            shadowOffset: { width: 0, height: 4 }, 
            shadowOpacity: 0.25, 
            shadowRadius: 8,
            elevation: 8
          }}
        >
          <Text className="text-primaryText font-bold text-xl">
            {status === 'running' ? '||' : '▶'}
          </Text>
        </Pressable>
        <Text className="text-primaryText text-xs mt-1">
          {status === 'running' ? 'Pause' : status === 'paused' ? 'Resume' : 'Start'}
        </Text>
      </View>
      
      {/* Complete Button */}
      <View className="items-center">
        <Pressable 
          onPress={onStop}
          className="h-20 w-20 bg-surface rounded-full items-center justify-center"
          style={{ 
            shadowColor: '#000', 
            shadowOffset: { width: 0, height: 4 }, 
            shadowOpacity: 0.25, 
            shadowRadius: 8,
            elevation: 8
          }}
        >
          <Text className="text-primaryText font-bold text-xl">✓</Text>
        </Pressable>
        <Text className="text-primaryText text-xs mt-1">Complete</Text>
      </View>
    </View>
  );
}