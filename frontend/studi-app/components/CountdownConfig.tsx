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
    onConfigChange({ duration: minutes }); // Pass minutes directly
  };

  const handleCustomChange = (text: string) => {
    setCustomMinutes(text);
    setSelectedPreset(null);
    const minutes = parseInt(text);
    if (!isNaN(minutes) && minutes > 0) {
      onConfigChange({ duration: minutes }); // Pass minutes directly
    }
  };

  return (
    <View>
      <Text className="text-lg font-bold text-gray-100 mb-4">
        Choose Study Duration
      </Text>

      {/* Info card */}
      <View className="p-4 rounded-lg border border-gray-700 bg-gray-800/60 mb-4">
        <Text className="text-gray-100 font-semibold mb-2 text-center">
          Stay on track with a set timer ⏲️
        </Text>
        <Text className="text-gray-300 text-sm text-center">
          Pick a preset or set a custom time and we'll alert you when your session ends so you can take a well-deserved break.
        </Text>
      </View>

      {/* Preset Options – table style */}
      <View className="rounded-lg overflow-hidden border border-gray-700 mb-4">
        {presets.map((preset, idx) => {
          const isSelected = selectedPreset === preset.value;
          const isLast = idx === presets.length - 1;
          return (
            <TouchableOpacity
              key={preset.value}
              onPress={() => handlePresetSelect(preset.value)}
              className={`px-4 py-3 ${!isLast ? 'border-b border-gray-700' : ''} ${
                isSelected ? 'bg-accent' : ''
              }`}
            >
              <Text
                className={`text-gray-100 text-center ${
                  isSelected ? 'font-semibold' : 'text-gray-300'
                }`}
              >
                {preset.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Custom Input */}
      <View>
        <Text className="text-sm font-medium text-secondaryText mb-2">
          Or set custom duration
        </Text>
        <View className="flex-row items-center space-x-2">
          <TextInput
            value={customMinutes}
            onChangeText={handleCustomChange}
            placeholder="30"
            placeholderTextColor="#888"
            keyboardType="numeric"
            className="flex-1 p-3 border border-gray-700 rounded-lg bg-gray-800 text-primaryText"
          />
          <Text className="text-secondaryText font-medium pl-2">minutes</Text>
        </View>
      </View>
    </View>
  );
} 