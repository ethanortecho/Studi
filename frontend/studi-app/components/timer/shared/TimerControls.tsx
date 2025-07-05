import React from 'react';
import { View, Pressable, Text } from 'react-native';

interface TimerControlsProps {
  status: 'idle' | 'running' | 'paused';
  onPauseResume: () => void;
  onStop: () => void;
}

export default function TimerControls({ status, onPauseResume, onStop }: TimerControlsProps) {
  return (
    <View className="flex-row justify-around items-center" style={{ gap: 16 }}>
      <Pressable 
        onPress={onPauseResume}
        className="h-12 w-12 bg-transparent border-2 border-primary rounded-full items-center justify-center"
        style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}
      >
        <Text className="text-primary font-bold text-xl">
          {status === 'running' ? '||' : '▶'}
        </Text>
      </Pressable>
      
      {(status === 'running' || status === 'paused') && (
        <Pressable 
          onPress={onStop}
          className="h-12 w-24 bg-primary rounded-full items-center justify-center"
          style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}
        >
          <Text className="text-white font-semibold text-base">
            Stop
          </Text>
        </Pressable>
      )}

      <Pressable 1
        onPress={onPauseResume}
        className="h-12 w-12 bg-transparent border-2 border-primary rounded-full items-center justify-center"
        style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}
      >
        <Text className="text-primary font-bold text-xl">
          ↻
        </Text>
      </Pressable>
    </View>
  );
} 