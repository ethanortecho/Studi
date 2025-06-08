import React, { useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';

interface PomodoroConfigProps {
  pomodoroBlocks?: number;
  pomodoroWorkDuration?: number;
  pomodoroBreakDuration?: number;
  onConfigChange: (config: {
    pomodoroBlocks: number;
    pomodoroWorkDuration: number;
    pomodoroBreakDuration: number;
  }) => void;
}

// Flexible preset system - easy to modify later
const POMODORO_PRESETS = [
  { 
    label: '4 × 25/5',
    blocks: 4, 
    workDuration: 25, 
    breakDuration: 5,
    description: '4 blocks, 25min each, 5min breaks'
  },
  { 
    label: '3 × 50/10',
    blocks: 3, 
    workDuration: 50, 
    breakDuration: 10,
    description: '3 blocks, 50min each, 10min breaks'
  },
];

export default function PomodoroConfig({ 
  pomodoroBlocks, 
  pomodoroWorkDuration, 
  pomodoroBreakDuration, 
  onConfigChange 
}: PomodoroConfigProps) {
  const [customBlocks, setCustomBlocks] = useState<string>(pomodoroBlocks?.toString() || '');
  const [customWorkDuration, setCustomWorkDuration] = useState<string>(pomodoroWorkDuration?.toString() || '');
  const [customBreakDuration, setCustomBreakDuration] = useState<string>(pomodoroBreakDuration?.toString() || '');
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);

  const handlePresetSelect = (presetIndex: number) => {
    const preset = POMODORO_PRESETS[presetIndex];
    setSelectedPreset(presetIndex);
    setCustomBlocks(preset.blocks.toString());
    setCustomWorkDuration(preset.workDuration.toString());
    setCustomBreakDuration(preset.breakDuration.toString());
    
    onConfigChange({
      pomodoroBlocks: preset.blocks,
      pomodoroWorkDuration: preset.workDuration,
      pomodoroBreakDuration: preset.breakDuration,
    });
  };

  const handleCustomChange = () => {
    setSelectedPreset(null);
    
    const blocks = parseInt(customBlocks);
    const workDuration = parseInt(customWorkDuration);
    const breakDuration = parseInt(customBreakDuration);
    
    if (!isNaN(blocks) && !isNaN(workDuration) && !isNaN(breakDuration) && 
        blocks > 0 && workDuration > 0 && breakDuration > 0) {
      onConfigChange({
        pomodoroBlocks: blocks,
        pomodoroWorkDuration: workDuration,
        pomodoroBreakDuration: breakDuration,
      });
    }
  };

  const getTotalDuration = () => {
    const blocks = parseInt(customBlocks) || 0;
    const workDuration = parseInt(customWorkDuration) || 0;
    const breakDuration = parseInt(customBreakDuration) || 0;
    
    if (blocks > 0 && workDuration > 0) {
      const totalWork = blocks * workDuration;
      const totalBreaks = (blocks - 1) * breakDuration; // No break after last block
      return totalWork + totalBreaks;
    }
    return 0;
  };

  const formatDuration = (minutes: number) => {
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
      {/* Custom Configuration */}
      <View className="mb-6">
        <Text className="text-sm text-gray-600 mb-4 text-center">Custom Configuration</Text>
        
        {/* Blocks, Work Duration, Break Duration */}
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-1 items-center">
            <Text className="text-sm text-gray-600 mb-2">Pomo Blocks</Text>
            <TextInput
              value={customBlocks}
              onChangeText={(text) => {
                setCustomBlocks(text);
                handleCustomChange();
              }}
              placeholder="2"
              keyboardType="numeric"
              className="text-3xl font-light text-gray-800 text-center w-16 border-b-2 border-gray-200 focus:border-indigo-500"
              style={{ outlineStyle: 'none' }}
            />
          </View>
          
          <View className="flex-1 items-center">
            <Text className="text-sm text-gray-600 mb-2">Minutes Each</Text>
            <TextInput
              value={customWorkDuration}
              onChangeText={(text) => {
                setCustomWorkDuration(text);
                handleCustomChange();
              }}
              placeholder="45"
              keyboardType="numeric"
              className="text-3xl font-light text-gray-800 text-center w-16 border-b-2 border-gray-200 focus:border-indigo-500"
              style={{ outlineStyle: 'none' }}
            />
          </View>
          
          <View className="flex-1 items-center">
            <Text className="text-sm text-gray-600 mb-2">Minute Breaks</Text>
            <TextInput
              value={customBreakDuration}
              onChangeText={(text) => {
                setCustomBreakDuration(text);
                handleCustomChange();
              }}
              placeholder="10"
              keyboardType="numeric"
              className="text-3xl font-light text-gray-800 text-center w-16 border-b-2 border-gray-200 focus:border-indigo-500"
              style={{ outlineStyle: 'none' }}
            />
          </View>
        </View>
      </View>

      {/* Quick Start Presets */}
      <View className="mb-4">
        <Text className="text-sm text-gray-600 mb-3 text-center">Quick Start</Text>
        <View className="space-y-3">
          {POMODORO_PRESETS.map((preset, index) => (
            <Pressable
              key={index}
              onPress={() => handlePresetSelect(index)}
              className={`py-4 px-6 rounded-2xl border-2 ${
                selectedPreset === index
                  ? 'bg-indigo-50 border-indigo-500'
                  : 'bg-white border-gray-200'
              }`}
            >
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className={`text-lg font-medium ${
                    selectedPreset === index ? 'text-indigo-800' : 'text-gray-800'
                  }`}>
                    {preset.label}
                  </Text>
                  <Text className="text-sm text-gray-600 mt-1">
                    {preset.description}
                  </Text>
                </View>
                <Text className="text-sm text-gray-500">
                  {formatDuration(preset.blocks * preset.workDuration + (preset.blocks - 1) * preset.breakDuration)}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Session Info */}
      {getTotalDuration() > 0 && (
        <View className="bg-gray-50 rounded-lg p-4 mt-4">
          <Text className="text-sm text-gray-600 text-center mb-2">
            Total session duration: <Text className="font-medium">{formatDuration(getTotalDuration())}</Text>
          </Text>
          <Text className="text-xs text-gray-500 text-center">
            {customBlocks} work blocks × {customWorkDuration}min + {parseInt(customBlocks) - 1 || 0} breaks × {customBreakDuration}min
          </Text>
        </View>
      )}
    </View>
  );
} 