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
  // New configuration fields
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
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  
  // Get categories from context
  const { categories, startSession, switchCategory } = useContext(StudySessionContext);

  const handleModeChange = (mode: TimerMode) => {
    console.log('Mode changing to:', mode);
    setSelectedMode(mode);
    setCurrentConfig({}); // Reset config when mode changes
  };

  const handleConfigChange = (config: any) => {
    setCurrentConfig(config);
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
  };

  const handleStartSession = async () => {
    if (!selectedCategoryId) {
      // Show error - category is required
      console.error('Please select a category before starting');
      return;
    }

    try {
      // Start the session first and get the session result
      const sessionResult = await startSession();
      console.log('Modal: Session started with ID:', sessionResult.id);
      
      // Switch to the selected category using the fresh session ID
      await switchCategory(Number(selectedCategoryId), sessionResult.id);
      
      // Pass configuration to parent
      onStartSession({ 
        mode: selectedMode,
        selectedCategoryId,
        ...currentConfig
      });
    } catch (error) {
      console.error('Error starting session:', error);
      // Handle error - maybe show alert
    }
  };

  const isStartButtonEnabled = selectedCategoryId !== '' && 
    (selectedMode === 'free' || 
     (selectedMode === 'timer' && currentConfig.duration) ||
     (selectedMode === 'pomo' && currentConfig.workDuration && currentConfig.breakDuration));

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
          {/* Welcome Section */}
          <View style={{ marginBottom: 32 }}>
            <Text style={{ fontSize: 30, fontWeight: '300', color: '#4338ca', marginBottom: 8 }}>
              Welcome Back,
            </Text>
            <Text style={{ fontSize: 30, fontWeight: '300', color: '#5b21b6' }}>
              Ethan
            </Text>
          </View>

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

          {/* Category Selection */}
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
            <Text style={{ fontSize: 16, fontWeight: '500', color: '#1f2937', marginBottom: 16 }}>
              Select Study Category
            </Text>
            
            <View style={{ gap: 12 }}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => handleCategorySelect(category.id)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: selectedCategoryId === category.id ? '#4f46e5' : '#e5e7eb',
                    backgroundColor: selectedCategoryId === category.id ? '#eef2ff' : 'white'
                  }}
                >
                  <View style={{
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: category.color,
                    marginRight: 12
                  }} />
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '500',
                    color: selectedCategoryId === category.id ? '#4f46e5' : '#374151',
                    flex: 1
                  }}>
                    {category.name}
                  </Text>
                  {selectedCategoryId === category.id && (
                    <View style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: '#4f46e5',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {categories.length === 0 && (
              <View style={{
                padding: 20,
                alignItems: 'center',
                backgroundColor: '#fef3c7',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#fbbf24'
              }}>
                <Text style={{ color: '#92400e', fontWeight: '500', marginBottom: 4 }}>
                  No Categories Available
                </Text>
                <Text style={{ color: '#92400e', textAlign: 'center', fontSize: 14 }}>
                  Please create categories in the Settings tab before starting a study session.
                </Text>
              </View>
            )}
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
          
          {!selectedCategoryId && (
            <Text style={{
              textAlign: 'center',
              fontSize: 14,
              color: '#ef4444',
              marginTop: 8
            }}>
              Please select a category to continue
            </Text>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
} 