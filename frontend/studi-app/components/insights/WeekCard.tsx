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
  // Calculate the end-of-week date (Saturday)
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  /**
   * Returns the day number with an ordinal suffix (1st, 2nd, 3rd, etc.).
   */
  const formatOrdinal = (day: number) => {
    const v = day % 100;
    const suffix = ['th', 'st', 'nd', 'rd'][(v - 20) % 10] ?? (['th', 'st', 'nd', 'rd'][v] ?? 'th');
    return `${day}${suffix}`;
  };

  const startMonth = weekStart.toLocaleDateString('en-US', { month: 'long' });
  const endMonth = weekEnd.toLocaleDateString('en-US', { month: 'long' });

  const rangeLabel = startMonth === endMonth
    ? `${startMonth} ${formatOrdinal(weekStart.getDate())} - ${formatOrdinal(weekEnd.getDate())}`
    : `${startMonth} ${formatOrdinal(weekStart.getDate())} - ${endMonth} ${formatOrdinal(weekEnd.getDate())}`;

  return (
    <Pressable onPress={onPress} className="w-full ">
      <View
        className={`w-full h-20 rounded-3xl items-center justify-center bg-surface`}
      >
        <Text className="text-lg font-bold text-primaryText">{rangeLabel}</Text>
      </View>
    </Pressable>
  );
} 