import React from 'react';
import { View } from 'react-native';
import GlassmorphicButton from './GlassmorphicButton';

interface FloatingTimerControlsProps {
  status: 'idle' | 'running' | 'paused';
  onPauseResume: () => void;
  onStop: () => void;
  onCancel: () => void;
}

export default function FloatingTimerControls({ 
  status, 
  onPauseResume, 
  onStop, 
  onCancel 
}: FloatingTimerControlsProps) {
  
  return (
    <View className="flex-row justify-center items-end px-6 mb-16">
      {/* Cancel Button - smaller and raised */}
      <View style={{ marginBottom: 20, marginRight: 40 }}>
        <GlassmorphicButton 
          onPress={onCancel}
          icon="✕"
          label="Cancel"
          size="small"
        />
      </View>

      {/* Pause/Resume Button - center large */}
      <GlassmorphicButton 
        onPress={onPauseResume}
        icon={status === 'running' ? '❚❚' : '▶'}
        label={status === 'running' ? 'Pause' : status === 'paused' ? 'Resume' : 'Start'}
        size="large"
      />
      
      {/* Complete Button - smaller and raised */}
      <View style={{ marginBottom: 20, marginLeft: 40 }}>
        <GlassmorphicButton 
          onPress={onStop}
          icon="✓"
          label="Complete"
          size="small"
        />
      </View>
    </View>
  );
}