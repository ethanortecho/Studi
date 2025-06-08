import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';

interface CountdownConfigProps {
  onConfigChange: (config: { duration: number }) => void;
}

export default function CountdownConfig({ onConfigChange }: CountdownConfigProps) {
  const [selectedPreset, setSelectedPreset] = useState<number | null>(40);
  const [customMinutes, setCustomMinutes] = useState('');

  const presets = [
    { label: '40 minutes', value: 40 },
    { label: '45 minutes', value: 45 },
    { label: '60 minutes', value: 60 },
  ];

  const handlePresetSelect = (minutes: number) => {
    setSelectedPreset(minutes);
    setCustomMinutes('');
    onConfigChange({ duration: minutes * 60 * 1000 }); // Convert to milliseconds
  };

  const handleCustomChange = (text: string) => {
    setCustomMinutes(text);
    setSelectedPreset(null);
    const minutes = parseInt(text);
    if (!isNaN(minutes) && minutes > 0) {
      onConfigChange({ duration: minutes * 60 * 1000 });
    }
  };

  return (
    <View className="space-y-4">
      <Text className="text-base font-medium text-gray-900 mb-3">
        Choose study duration
      </Text>

      {/* Preset Options */}
      <View className="space-y-2">
        {presets.map((preset) => (
          <TouchableOpacity
            key={preset.value}
            onPress={() => handlePresetSelect(preset.value)}
            className={`p-3 rounded-lg border ${
              selectedPreset === preset.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <Text className={`text-center font-medium ${
              selectedPreset === preset.value ? 'text-blue-700' : 'text-gray-700'
            }`}>
              {preset.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Custom Input */}
      <View className="mt-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">
          Or set custom duration
        </Text>
        <View className="flex-row items-center space-x-2">
          <TextInput
            value={customMinutes}
            onChangeText={handleCustomChange}
            placeholder="30"
            keyboardType="numeric"
            className="flex-1 p-3 border border-gray-300 rounded-lg bg-white text-gray-900"
          />
          <Text className="text-gray-600 font-medium">minutes</Text>
        </View>
      </View>
    </View>
  );
} 