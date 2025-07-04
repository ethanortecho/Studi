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
      className={`flex-2 h-20  rounded-[15px] items-center justify-center ${isSelected ? 'bg-primary' : 'bg-surface border border-transparent'}`}
    >
      {/* Dot */}
      <View className={`w-2 h-2 rounded-full mb-1 ${showDot ? 'bg-secondaryText' : 'bg-transparent'}`} />
      {/* Weekday label */}
      <Text className="text-xs text-primaryText font-medium mb-1">{weekday}</Text>
      {/* Day number */}
      <Text className="text-base text-primaryText font-bold">{dayNum}</Text>
    </Pressable>

    
  );
} 