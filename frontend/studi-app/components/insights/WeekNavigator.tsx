import React, { useRef } from 'react';
import { View, Text, FlatList, PanResponder, GestureResponderEvent, PanResponderGestureState } from 'react-native';
import { getWeekDays, isSameDay, canNavigate } from '@/utils/dateUtils';

interface WeekNavigatorProps {
  weekStart: Date;
  selectedDay: Date;
  onSelect: (date: Date) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  // Map of ISO date string -> hasData boolean provided by useDashboardData
  hasData?: { [isoDate: string]: boolean };
}

export default function WeekNavigator({
  weekStart,
  selectedDay,
  onSelect,
  onNavigate,
  hasData
}: WeekNavigatorProps) {
  const days = React.useMemo(() => getWeekDays(weekStart), [weekStart]);

  const canGoPrev = canNavigate(weekStart, 'prev', 'weekly');
  const canGoNext = canNavigate(weekStart, 'next', 'weekly');

  // Swipe gesture handling
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState: PanResponderGestureState) => {
        return Math.abs(gestureState.dx) > 15; // start when horizontal movement noticeable
      },
      onPanResponderRelease: (_: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        if (gestureState.dx > 40 && canGoPrev) {
          onNavigate('prev');
        } else if (gestureState.dx < -40 && canGoNext) {
          onNavigate('next');
        }
      }
    })
  ).current;

  const renderDay = ({ item }: { item: Date }) => {
    const isSelected = isSameDay(item, selectedDay);

    const dayLabel = item.toLocaleDateString('en-US', { weekday: 'short' }); // Sun, Mon …
    const dateLabel = item.getDate();

    const iso = item.toISOString().split('T')[0];
    const showDot = hasData ? hasData[iso] : false;

    return (
      <View
        onTouchEnd={() => onSelect(item)}
        className={`flex-1 mx-1 w-14 h-20 rounded-3xl items-center justify-center bg-primary/60 ${isSelected ? 'border-2 border-white' : 'border border-transparent'}`}
      >
        {/* Dot */}
        <View className={`w-2 h-2 rounded-full mb-1 ${showDot ? 'bg-white' : 'bg-transparent'}`} />
        {/* Weekday */}
        <Text className="text-xs text-white font-medium mb-1">{dayLabel}</Text>
        {/* Date number */}
        <Text className="text-base text-white font-bold">{dateLabel}</Text>
      </View>
    );
  };

  // Week range label e.g., "Apr 15-21" or "Apr 28 - May 4"
  const weekRangeLabel = React.useMemo(() => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const startMonth = weekStart.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = weekEnd.toLocaleDateString('en-US', { month: 'short' });

    if (startMonth === endMonth) {
      return `${startMonth} ${weekStart.getDate()}-${weekEnd.getDate()}`;
    }
    return `${startMonth} ${weekStart.getDate()} - ${endMonth} ${weekEnd.getDate()}`;
  }, [weekStart]);

  return (
    <View className="mb-4 px-4" {...panResponder.panHandlers}>
      <Text className="text-center text-layout-faded-grey text-xs mb-2 font-medium">
        {weekRangeLabel}
      </Text>
      <FlatList
        data={days}
        horizontal
        keyExtractor={(item) => item.toISOString()}
        renderItem={renderDay}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ justifyContent: 'space-between', flexGrow: 1 }}
      />
    </View>
  );
} 