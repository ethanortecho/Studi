import React, { useMemo } from 'react';
import {
  View,
  Dimensions,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  Pressable,
} from 'react-native';
import {
  getWeekStart,
  navigateWeek,
  canNavigate,
} from '@/utils/dateUtils';
import PagedCarousel from '@/components/navigation/PagedCarousel';
import WeekCard from './WeekCard';
import { Ionicons } from '@expo/vector-icons';

interface WeeklyNavigatorProps {
  /** Sunday of the currently-selected week */
  selectedWeekStart: Date;
  /** Fired when a new week is selected via tap or swipe */
  onSelect: (weekStart: Date) => void;
}

/**
 * A minimal weekly navigator that mirrors DailyNavigator:
 * – Shows exactly one WeekCard centred on the screen.
 * – Detects horizontal swipes (> 40 px) to move to the prev/next week.
 * – Tapping the card re-fires `onSelect`.
 */
export default function WeeklyNavigator({
  selectedWeekStart,
  onSelect,
}: WeeklyNavigatorProps) {
  // Ensure we're always aligned to the Sunday of the week
  const weekStart = useMemo(() => getWeekStart(selectedWeekStart), [selectedWeekStart]);

  if (weekStart.getTime() !== selectedWeekStart.getTime()) {
    throw new Error('WeeklyNavigator: selectedWeekStart must be the Sunday (start) of the week');
  }

  const canGoPrev = canNavigate(weekStart, 'prev', 'weekly');
  const canGoNext = canNavigate(weekStart, 'next', 'weekly');

  // Swipe detection: mirror DailyNavigator thresholds
  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (
          _: GestureResponderEvent,
          g: PanResponderGestureState
        ) => Math.abs(g.dx) > 15,
        onPanResponderRelease: (
          _: GestureResponderEvent,
          g: PanResponderGestureState
        ) => {
          if (g.dx > 40 && canGoPrev) {
            onSelect(navigateWeek(weekStart, 'prev'));
          } else if (g.dx < -40 && canGoNext) {
            onSelect(navigateWeek(weekStart, 'next'));
          }
        },
      }),
    [canGoPrev, canGoNext, weekStart, onSelect]
  );

  // Single-item array for the carousel (keeps sizing consistent with DailyNavigator)
  const items = useMemo(() => [weekStart], [weekStart]);

  const renderItem = ({ item }: { item: Date }) => (
    <WeekCard
      weekStart={item}
      isSelected
      onPress={() => onSelect(item)}
    />
  );

  return (
    <View className="mb-0 px-4 mt-3" {...panResponder.panHandlers}>
      <View className="relative items-center justify-center">
        {/* Week card carousel */}
        <PagedCarousel
          items={items}
          itemsPerPage={1}
          pageWidth={Dimensions.get('window').width - 32}
          renderItem={renderItem}
          keyExtractor={(d) => d.toISOString()}
          contentContainerStyle={{ height: 80 }}
          flatListProps={{ style: { height: 80 } }}
        />

        {/* Left arrow */}
        {canGoPrev && (
          <Pressable
            onPress={() => onSelect(navigateWeek(weekStart, 'prev'))}
            className="absolute left-2 p-1"
            hitSlop={6}
            style={{ top: '50%', transform: [{ translateY: -20 }] }}
          >
            <Ionicons name="chevron-back" size={24} color="white" style={{ opacity: 0.6 }} />
          </Pressable>
        )}

        {/* Right arrow */}
        {canGoNext && (
          <Pressable
            onPress={() => onSelect(navigateWeek(weekStart, 'next'))}
            className="absolute right-2 p-1"
            hitSlop={6}
            style={{ top: '50%', transform: [{ translateY: -20 }] }}
          >
            <Ionicons name="chevron-forward" size={24} color="white" style={{ opacity: 0.6 }} />
          </Pressable>
        )}
      </View>
    </View>
  );
} 