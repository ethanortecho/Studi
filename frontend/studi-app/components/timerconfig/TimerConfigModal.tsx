import React, { useState } from 'react';
import { Modal, View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CountdownConfig from '../CountdownConfig';
import PomodoroConfig from '../PomodoroConfig';
import StopwatchConfig from '../StopwatchConfig';

export type TimerMode = 'timer' | 'free' | 'pomo';

export interface TimerConfig {
  mode: TimerMode;
  duration?: number;
  pomodoroBlocks?: number;
  pomodoroWorkDuration?: number;
  pomodoroBreakDuration?: number;
  selectedCategoryId?: string;
  // Pomodoro config fields from PomodoroConfig component
  workDuration?: number;
  breakDuration?: number;
  cycles?: number;
}

interface TimerConfigModalProps {
  visible: boolean;
  onClose: () => void;
  onStartSession: (config: TimerConfig) => void;
}

export default function TimerConfigModal({ visible, onClose, onStartSession }: TimerConfigModalProps) {
  const [selectedMode, setSelectedMode] = useState<TimerMode>('free');
  const [currentConfig, setCurrentConfig] = useState<any>({});
  
  const handleModeChange = (mode: TimerMode) => {
    console.log('Mode changing to:', mode);
    setSelectedMode(mode);
    setCurrentConfig({}); // Reset config when mode changes
  };

  const handleConfigChange = (config: any) => {
    console.log('Config change:', config);
    setCurrentConfig(config);
  };

  const handleStartSession = async () => {
    try {
      // Convert pomodoro config to the format expected by our components
      let finalConfig = { 
        mode: selectedMode,
        ...currentConfig
      };

      // For pomodoro mode, convert milliseconds to minutes for navigation
      if (selectedMode === 'pomo' && currentConfig.workDuration) {
        finalConfig = {
          ...finalConfig,
          pomodoroBlocks: currentConfig.cycles,
          pomodoroWorkDuration: Math.round(currentConfig.workDuration / (1000 * 60)), // Convert ms to minutes
          pomodoroBreakDuration: Math.round(currentConfig.breakDuration / (1000 * 60)), // Convert ms to minutes
        };
      }

      console.log('Final config being passed:', finalConfig);
      onStartSession(finalConfig);
    } catch (error) {
      console.error('Error starting session:', error);
      // Handle error - maybe show alert
    }
  };

  const isStartButtonEnabled = selectedMode === 'free' || 
    (selectedMode === 'timer' && currentConfig.duration) ||
    (selectedMode === 'pomo'); // Pomodoro always has valid config now with default preset

  const renderConfiguration = () => {
    switch (selectedMode) {
      case 'timer':
        return <CountdownConfig onConfigChange={handleConfigChange} />;
      case 'pomo':
        return <PomodoroConfig onConfigChange={handleConfigChange} />;
      case 'free':
      default:
        return <StopwatchConfig onConfigChange={handleConfigChange} />;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row justify-between items-center p-4 border-b border-border bg-surface">
          <Pressable onPress={onClose}>
            <Text className="text-secondaryText text-lg">Cancel</Text>
          </Pressable>
          <Text className="text-lg font-semibold text-primaryText">Configure Timer</Text>
          <View className="w-16" />
        </View>

        <ScrollView className="flex-1 p-6">
          

          {/* Mode Selector */}
          <View className="flex-row rounded-full p-1 mb-6 bg-surface">
            <Pressable
              onPress={() => handleModeChange('free')}
              className={`flex-1 py-3 px-4 rounded-full ${selectedMode === 'free' ? 'bg-accent' : ''}`}
            >
              <Text className={`text-sm font-medium text-center ${selectedMode === 'free' ? 'text-white' : 'text-secondaryText'}`}>
                FREE
              </Text>
            </Pressable>
            
            <Pressable
              onPress={() => handleModeChange('timer')}
              className={`flex-1 py-3 px-4 rounded-full ${selectedMode === 'timer' ? 'bg-accent' : ''}`}
            >
              <Text className={`text-sm font-medium text-center ${selectedMode === 'timer' ? 'text-white' : 'text-secondaryText'}`}>
                TIMER
              </Text>
            </Pressable>
            
            <Pressable
              onPress={() => handleModeChange('pomo')}
              className={`flex-1 py-3 px-4 rounded-full ${selectedMode === 'pomo' ? 'bg-accent' : ''}`}
            >
              <Text className={`text-sm font-medium text-center ${selectedMode === 'pomo' ? 'text-white' : 'text-secondaryText'}`}>
                POMO
              </Text>
            </Pressable>
          </View>

          {/* Configuration Content */}
          <View className=" p-6 mb-6 shadow">
            {renderConfiguration()}
          </View>
        </ScrollView>

        {/* Start Button */}
        <View className="p-6">
          <Pressable
            onPress={handleStartSession}
            disabled={!isStartButtonEnabled}
            className={`w-full py-4 rounded-2xl ${isStartButtonEnabled ? 'bg-primary' : 'bg-gray-300'}`}
          >
            <Text className={`text-center text-lg font-medium ${isStartButtonEnabled ? 'text-white' : 'text-gray-400'}`}>
              Start Studying
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
} 