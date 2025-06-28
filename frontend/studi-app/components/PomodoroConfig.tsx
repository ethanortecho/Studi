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
      icon: '🍅',
      name: 'Classic',
      work: 25, 
      break: 5, 
      cycles: 4,
      description: 'The original Pomodoro: four 25-minute focus blocks with quick 5-minute breaks to keep you fresh.'
    },
    { 
      id: 'focus',
      icon: '🎯',
      name: 'Deep Focus',
      work: 45, 
      break: 15, 
      cycles: 2,
      description: 'Two long 45-minute stretches and generous 15-minute breaks—great for tasks that need sustained concentration.'
    },
    { 
      id: 'extended',
      icon: '📚',
      name: 'Extended',
      work: 50, 
      break: 10, 
      cycles: 3,
      description: 'Three 50-minute work sessions with 10-minute pauses—ideal for reading chapters or lengthy problem-solving.'
    },
    { 
      id: 'sprint',
      icon: '⚡',
      name: 'Sprint',
      work: 15, 
      break: 3, 
      cycles: 6,
      description: 'Six fast-paced 15-minute bursts separated by 3-minute breaks—perfect for knocking out small tasks.'
    },
    { 
      id: 'micro',
      icon: '🔥',
      name: 'Micro',
      work: 10, 
      break: 2, 
      cycles: 8,
      description: 'Eight bite-sized 10-minute sessions with 2-minute breaks—great when you only have slivers of time.'
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
      <Text className="text-lg font-bold text-gray-100 mb-4">
        Choose Pomodoro Configuration
      </Text>
      
      {/* Preset Selection – table style similar to weekly-goal list */}
      <View className="rounded-lg overflow-hidden border border-gray-700">
        {presets.map((preset, idx) => {
          const isSelected = selectedPreset === preset.id;
          const isLast = idx === presets.length - 1;
          const spec = `${preset.cycles} × ${preset.work} / ${preset.break} min`;
          return (
            <TouchableOpacity
              key={preset.id}
              onPress={() => handlePresetSelect(preset)}
              className={`px-4 py-3 flex-row items-center justify-between ${
                !isLast ? 'border-b border-gray-700' : ''
              } ${isSelected ? 'bg-blue-600/20' : ''}`}
            >
              <Text
                className={`text-gray-100 ${isSelected ? 'font-semibold' : 'text-gray-300'}`}
                numberOfLines={1}
              >
                {`${preset.icon} ${preset.name}`}
              </Text>
              <Text
                className={`text-gray-400 ml-2 ${isSelected ? 'text-gray-200' : ''}`}
                numberOfLines={1}
              >
                {spec}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected preset description */}
      {(() => {
        const preset = presets.find(p => p.id === selectedPreset);
        if (!preset) return null;
        return (
          <View className="mt-6">
            <Text className="text-gray-100 font-semibold mb-1">
              {`${preset.icon} ${preset.name}`}
            </Text>
            <Text className="text-gray-400 text-sm mb-2">
              {`${preset.cycles} × ${preset.work} min work / ${preset.break} min break`}
            </Text>
            <Text className="text-gray-300 text-sm">
              {preset.description}
            </Text>
          </View>
        );
      })()}
    </View>
  );
} 