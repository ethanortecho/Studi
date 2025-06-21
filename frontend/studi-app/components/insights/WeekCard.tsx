import React from 'react';
import { View, Text, Pressable } from 'react-native';

interface WeekCardProps {
  weekStart: Date;
  isSelected: boolean;
  onPress: () => void;
}

/**
 * A full-width card representing an ISO week (Sun-Sat).
 * Displays the date range like "Jun 15-21" or spanning two months.
 */
export default function WeekCard({ weekStart, isSelected, onPress }: WeekCardProps) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const startMonth = weekStart.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = weekEnd.toLocaleDateString('en-US', { month: 'short' });

  const rangeLabel = startMonth === endMonth
    ? `${startMonth} ${weekStart.getDate()}-${weekEnd.getDate()}`
    : `${startMonth} ${weekStart.getDate()}-${endMonth} ${weekEnd.getDate()}`;

  return (
    <Pressable onPress={onPress} className="w-full">
      <View
        className={`w-full h-20 rounded-3xl items-center justify-center ${isSelected ? 'bg-primary' : 'bg-primary/60'} ${isSelected ? 'border-2 border-white' : ''}`}
      >
        <Text className="text-lg font-bold text-white">{rangeLabel}</Text>
      </View>
    </Pressable>
  );
} 