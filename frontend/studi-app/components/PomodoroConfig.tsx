import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export interface PomodoroConfiguration {
  workDuration: number;
  breakDuration: number;
  cycles: number;
}

interface PomodoroConfigProps {
  onConfigChange: (config: PomodoroConfiguration) => void;
}

export default function PomodoroConfig({ onConfigChange }: PomodoroConfigProps) {
  const [selectedPreset, setSelectedPreset] = useState<string | null>('classic');

  const presets = [
    { 
      id: 'classic',
      label: '🍅 Classic: 4 × 25min work / 5min break', 
      work: 25, 
      break: 5, 
      cycles: 4 
    },
    { 
      id: 'focus',
      label: '🎯 Deep Focus: 2 × 45min work / 15min break', 
      work: 45, 
      break: 15, 
      cycles: 2 
    },
    { 
      id: 'extended',
      label: '📚 Extended: 3 × 50min work / 10min break', 
      work: 50, 
      break: 10, 
      cycles: 3 
    },
    { 
      id: 'sprint',
      label: '⚡ Sprint: 6 × 15min work / 3min break', 
      work: 15, 
      break: 3, 
      cycles: 6 
    },
    { 
      id: 'micro',
      label: '🔥 Micro: 8 × 10min work / 2min break', 
      work: 10, 
      break: 2, 
      cycles: 8 
    }
  ];

  const handlePresetSelect = (preset: typeof presets[0]) => {
    setSelectedPreset(preset.id);
    onConfigChange({ 
      workDuration: preset.work * 60 * 1000,
      breakDuration: preset.break * 60 * 1000,
      cycles: preset.cycles
    });
  };

  React.useEffect(() => {
    if (selectedPreset === 'classic') {
      const classicPreset = presets.find(p => p.id === 'classic')!;
      onConfigChange({ 
        workDuration: classicPreset.work * 60 * 1000,
        breakDuration: classicPreset.break * 60 * 1000,
        cycles: classicPreset.cycles
      });
    }
  }, []);

  return (
    <View className="p-4">
      <Text className="text-lg font-bold text-gray-800 mb-4">
        Choose Pomodoro Configuration
      </Text>
      
      {/* Preset Selection */}
      <View className="space-y-2">
        {presets.map((preset) => (
          <TouchableOpacity
            key={preset.id}
            onPress={() => handlePresetSelect(preset)}
            className={`p-3 rounded-lg border ${
              selectedPreset === preset.id 
                ? 'bg-blue-50 border-blue-500' 
                : 'bg-white border-gray-300'
            }`}
          >
            <Text className={`font-medium ${
              selectedPreset === preset.id ? 'text-blue-700' : 'text-gray-700'
            }`}>
              {preset.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
} 