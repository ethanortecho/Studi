import React, { useState } from 'react';
import { Modal, View, Text, Pressable, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useContext } from 'react';
import { StudySessionContext } from '@/context/StudySessionContext';
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
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#e5e7eb',
          backgroundColor: 'white'
        }}>
          <Pressable onPress={onClose}>
            <Text style={{ color: '#6b7280', fontSize: 18 }}>Cancel</Text>
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: '600', color: '#1f2937' }}>Configure Timer</Text>
          <View style={{ width: 64 }} />
        </View>

        <ScrollView style={{ flex: 1, padding: 24 }}>
          

          {/* Mode Selector */}
          <View style={{
            flexDirection: 'row',
            backgroundColor: '#f3f4f6',
            borderRadius: 9999,
            padding: 4,
            marginBottom: 24
          }}>
            <Pressable
              onPress={() => handleModeChange('free')}
              style={{
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 9999,
                backgroundColor: selectedMode === 'free' ? '#4f46e5' : 'transparent'
              }}
            >
              <Text style={{
                fontSize: 14,
                fontWeight: '500',
                textAlign: 'center',
                color: selectedMode === 'free' ? 'white' : '#6b7280'
              }}>
                FREE
              </Text>
            </Pressable>
            
            <Pressable
              onPress={() => handleModeChange('timer')}
              style={{
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 9999,
                backgroundColor: selectedMode === 'timer' ? '#4f46e5' : 'transparent'
              }}
            >
              <Text style={{
                fontSize: 14,
                fontWeight: '500',
                textAlign: 'center',
                color: selectedMode === 'timer' ? 'white' : '#6b7280'
              }}>
                TIMER
              </Text>
            </Pressable>
            
            <Pressable
              onPress={() => handleModeChange('pomo')}
              style={{
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 9999,
                backgroundColor: selectedMode === 'pomo' ? '#4f46e5' : 'transparent'
              }}
            >
              <Text style={{
                fontSize: 14,
                fontWeight: '500',
                textAlign: 'center',
                color: selectedMode === 'pomo' ? 'white' : '#6b7280'
              }}>
                POMO
              </Text>
            </Pressable>
          </View>

          {/* Configuration Content */}
          <View style={{
            backgroundColor: 'white',
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1
          }}>
            {renderConfiguration()}
          </View>
        </ScrollView>

        {/* Start Button */}
        <View style={{
          padding: 24,
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb'
        }}>
          <Pressable
            onPress={handleStartSession}
            disabled={!isStartButtonEnabled}
            style={{
              width: '100%',
              paddingVertical: 16,
              backgroundColor: isStartButtonEnabled ? '#10b981' : '#d1d5db',
              borderRadius: 16
            }}
          >
            <Text style={{
              textAlign: 'center',
              fontSize: 18,
              fontWeight: '500',
              color: isStartButtonEnabled ? 'white' : '#9ca3af'
            }}>
              Start Studying
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
} 