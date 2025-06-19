import React from 'react';
import { View, Pressable, Text } from 'react-native';

interface TimerControlsProps {
  status: 'idle' | 'running' | 'paused';
  onPauseResume: () => void;
  onStop: () => void;
}

export default function TimerControls({ status, onPauseResume, onStop }: TimerControlsProps) {
  return (
    <View className="flex-row" style={{ gap: 16 }}>
      <Pressable 
        onPress={onPauseResume}
        className="flex-1 bg-blue-500 py-4 rounded-2xl items-center justify-center"
        style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}
      >
        <Text className="text-white font-bold text-3xl" style={{ letterSpacing: 2 }}>
          {status === 'running' ? '||' : '▶'}
        </Text>
      </Pressable>
      
      {(status === 'running' || status === 'paused') && (
        <Pressable 
          onPress={onStop}
          className="flex-1 bg-red-500 py-4 rounded-2xl items-center justify-center"
          style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}
        >
          <Text className="text-white font-semibold text-lg">
            End Session
          </Text>
        </Pressable>
      )}
    </View>
  );
} 