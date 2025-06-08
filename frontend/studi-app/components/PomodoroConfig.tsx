import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';

interface PomodoroConfigProps {
  onConfigChange: (config: { 
    workDuration: number; 
    breakDuration: number; 
    cycles: number;
  }) => void;
}

export default function PomodoroConfig({ onConfigChange }: PomodoroConfigProps) {
  const [selectedPreset, setSelectedPreset] = useState<string | null>('4x25/5');
  const [customWork, setCustomWork] = useState('');
  const [customBreak, setCustomBreak] = useState('');
  const [customCycles, setCustomCycles] = useState('');

  const presets = [
    { 
      id: '4x25/5',
      label: '4 × 25min work / 5min break', 
      work: 25, 
      break: 5, 
      cycles: 4 
    },
    { 
      id: '3x50/10',
      label: '3 × 50min work / 10min break', 
      work: 50, 
      break: 10, 
      cycles: 3 
    },
  ];

  const handlePresetSelect = (preset: typeof presets[0]) => {
    setSelectedPreset(preset.id);
    setCustomWork('');
    setCustomBreak('');
    setCustomCycles('');
    onConfigChange({ 
      workDuration: preset.work * 60 * 1000,
      breakDuration: preset.break * 60 * 1000,
      cycles: preset.cycles
    });
  };

  const handleCustomChange = () => {
    setSelectedPreset(null);
    const work = parseInt(customWork);
    const breakTime = parseInt(customBreak);
    const cycles = parseInt(customCycles);
    
    if (!isNaN(work) && !isNaN(breakTime) && !isNaN(cycles) && 
        work > 0 && breakTime > 0 && cycles > 0) {
      onConfigChange({
        workDuration: work * 60 * 1000,
        breakDuration: breakTime * 60 * 1000,
        cycles: cycles
      });
    }
  };

  React.useEffect(() => {
    if (selectedPreset === '4x25/5') {
      onConfigChange({ 
        workDuration: 25 * 60 * 1000,
        breakDuration: 5 * 60 * 1000,
        cycles: 4
      });
    }
  }, []);

  return (
    <View className="space-y-4">
      <Text className="text-base font-medium text-gray-900 mb-3">
        Choose Pomodoro configuration
      </Text>

      {/* Preset Options */}
      <View className="space-y-2">
        {presets.map((preset) => (
          <TouchableOpacity
            key={preset.id}
            onPress={() => handlePresetSelect(preset)}
            className={`p-3 rounded-lg border ${
              selectedPreset === preset.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <Text className={`text-center font-medium ${
              selectedPreset === preset.id ? 'text-blue-700' : 'text-gray-700'
            }`}>
              {preset.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Custom Configuration */}
      <View className="mt-4">
        <Text className="text-sm font-medium text-gray-700 mb-3">
          Or create custom configuration
        </Text>
        
        <View className="space-y-3">
          {/* Work Duration */}
          <View className="flex-row items-center space-x-2">
            <Text className="w-20 text-sm text-gray-600">Work:</Text>
            <TextInput
              value={customWork}
              onChangeText={(text) => {
                setCustomWork(text);
                handleCustomChange();
              }}
              placeholder="25"
              keyboardType="numeric"
              className="flex-1 p-2 border border-gray-300 rounded-lg bg-white text-gray-900"
            />
            <Text className="text-gray-600 text-sm">minutes</Text>
          </View>

          {/* Break Duration */}
          <View className="flex-row items-center space-x-2">
            <Text className="w-20 text-sm text-gray-600">Break:</Text>
            <TextInput
              value={customBreak}
              onChangeText={(text) => {
                setCustomBreak(text);
                handleCustomChange();
              }}
              placeholder="5"
              keyboardType="numeric"
              className="flex-1 p-2 border border-gray-300 rounded-lg bg-white text-gray-900"
            />
            <Text className="text-gray-600 text-sm">minutes</Text>
          </View>

          {/* Cycles */}
          <View className="flex-row items-center space-x-2">
            <Text className="w-20 text-sm text-gray-600">Cycles:</Text>
            <TextInput
              value={customCycles}
              onChangeText={(text) => {
                setCustomCycles(text);
                handleCustomChange();
              }}
              placeholder="4"
              keyboardType="numeric"
              className="flex-1 p-2 border border-gray-300 rounded-lg bg-white text-gray-900"
            />
            <Text className="text-gray-600 text-sm">cycles</Text>
          </View>
        </View>
      </View>
    </View>
  );
} 