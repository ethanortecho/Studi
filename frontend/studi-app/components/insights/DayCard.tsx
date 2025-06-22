import React from 'react';
import { View, Text, Pressable } from 'react-native';

interface DayCardProps {
  date: Date;
  isSelected: boolean;
  showDot?: boolean;
  onPress: () => void;
}

/**
 * A small card representing a single day (Sun-Sat) in the daily navigator.
 * Displays an optional dot when `showDot` is true and highlights itself when selected.
 */
export default function DayCard({ date, isSelected, showDot = false, onPress }: DayCardProps) {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' }); // Sun, Mon …
  const dayNum = date.getDate();

  return (
      <Pressable
      onPress={onPress}
      className={`flex-2 h-20  rounded-3xl items-center justify-center ${isSelected ? 'bg-primary' : 'bg-surface border border-transparent'}`}
    >
      {/* Dot */}
      <View className={`w-2 h-2 rounded-full mb-1 ${showDot ? 'bg-white' : 'bg-transparent'}`} />
      {/* Weekday label */}
      <Text className="text-xs text-white font-medium mb-1">{weekday}</Text>
      {/* Day number */}
      <Text className="text-base text-white font-bold">{dayNum}</Text>
    </Pressable>

    
  );
} 