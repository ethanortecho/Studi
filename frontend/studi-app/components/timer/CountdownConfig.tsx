import React, { useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';

interface CountdownConfigProps {
  duration?: number;
  onConfigChange: (duration: number) => void;
}

// Flexible preset system - easy to modify later
const COUNTDOWN_PRESETS = [
  { label: '40', value: 40 },
  { label: '45', value: 45 },
  { label: '60', value: 60 },
];

export default function CountdownConfig({ duration, onConfigChange }: CountdownConfigProps) {
  const [customDuration, setCustomDuration] = useState<string>('');
  const [selectedPreset, setSelectedPreset] = useState<number | null>(duration || null);

  const handlePresetSelect = (preset: number) => {
    setSelectedPreset(preset);
    setCustomDuration('');
    onConfigChange(preset);
  };

  const handleCustomDurationChange = (text: string) => {
    setCustomDuration(text);
    setSelectedPreset(null);
    
    const numValue = parseInt(text);
    if (!isNaN(numValue) && numValue > 0) {
      onConfigChange(numValue);
    }
  };

  const formatDurationDisplay = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 
        ? `${hours}h ${remainingMinutes}m`
        : `${hours}h`;
    }
    return `${minutes}m`;
  };

  return (
    <View>
      {/* Custom Duration Input */}
      <View className="mb-6">
        <View className="flex-row items-center justify-center mb-4">
          <TextInput
            value={customDuration}
            onChangeText={handleCustomDurationChange}
            placeholder="0"
            keyboardType="numeric"
            className="text-6xl font-light text-gray-800 text-center min-w-[120px] border-b-2 border-gray-200 focus:border-indigo-500"
            style={{ outlineStyle: 'none' }}
          />
          <Text className="text-2xl text-gray-600 ml-2">Minutes</Text>
        </View>
        
        {selectedPreset && !customDuration && (
          <Text className="text-center text-gray-600">
            {formatDurationDisplay(selectedPreset)}
          </Text>
        )}
      </View>

      {/* Quick Start Presets */}
      <View className="mb-4">
        <Text className="text-sm text-gray-600 mb-3 text-center">Quick Start</Text>
        <View className="flex-row justify-center space-x-4">
          {COUNTDOWN_PRESETS.map((preset) => (
            <Pressable
              key={preset.value}
              onPress={() => handlePresetSelect(preset.value)}
              className={`w-16 h-16 rounded-full items-center justify-center ${
                selectedPreset === preset.value
                  ? 'bg-indigo-600'
                  : 'bg-gray-200'
              }`}
            >
              <Text className={`text-lg font-medium ${
                selectedPreset === preset.value
                  ? 'text-white'
                  : 'text-gray-700'
              }`}>
                {preset.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Duration Info */}
      {(selectedPreset || customDuration) && (
        <View className="bg-gray-50 rounded-lg p-3 mt-4">
          <Text className="text-sm text-gray-600 text-center">
            Timer will count down from{' '}
            <Text className="font-medium">
              {formatDurationDisplay(selectedPreset || parseInt(customDuration) || 0)}
            </Text>
          </Text>
        </View>
      )}
    </View>
  );
} 