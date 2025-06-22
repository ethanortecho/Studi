import React, { useMemo } from 'react';
import { View, PanResponder, GestureResponderEvent, PanResponderGestureState, Text, Dimensions } from 'react-native';
import { getWeekDays, isSameDay, canNavigate } from '@/utils/dateUtils';
import PagedCarousel from '@/components/navigation/PagedCarousel';
import DayCard from './DayCard';

interface DailyNavigatorProps {
  weekStart: Date;
  selectedDay: Date;
  onSelect: (date: Date) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  /** Map of ISO date string -> hasData */
  hasData?: { [iso: string]: boolean };
}

/**
 * DailyNavigator renders seven DayCards and lets the user swipe the whole week
 * left/right to navigate to the previous/next week. Internally it relies on a
 * PanResponder (for gesture detection) and the shared PagedCarousel so the code
 * path is aligned with the upcoming WeeklyNavigator.
 */
export default function DailyNavigator({
  weekStart,
  selectedDay,
  onSelect,
  onNavigate,
  hasData,
}: DailyNavigatorProps) {
  // Array of 7 days for the current week
  const days = useMemo(() => getWeekDays(weekStart), [weekStart]);

  const canGoPrev = canNavigate(weekStart, 'prev', 'weekly');
  const canGoNext = canNavigate(weekStart, 'next', 'weekly');

  // Gesture: detect horizontal swipe > 40 px to trigger navigation
  const panResponder = React.useMemo(() => {
    return PanResponder.create({
      onMoveShouldSetPanResponder: (_: GestureResponderEvent, g: PanResponderGestureState) =>
        Math.abs(g.dx) > 15,
      onPanResponderRelease: (_: GestureResponderEvent, g: PanResponderGestureState) => {
        if (g.dx > 40 && canGoPrev) {
          onNavigate('prev');
        } else if (g.dx < -40 && canGoNext) {
          onNavigate('next');
        }
      },
    });
  }, [canGoPrev, canGoNext, onNavigate]);

  // Renderer for each day card
  const renderItem = ({ item }: { item: Date }) => {
    const iso = item.toISOString().split('T')[0];
    const isSelected = isSameDay(item, selectedDay);

    return (
      <DayCard
        date={item}
        isSelected={isSelected}
        showDot={hasData ? !!hasData[iso] : false}
        onPress={() => onSelect(item)}
      />
    );
  };

  // Week range label e.g., "Apr 15-21" or spanning months
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
      <React.Fragment>
        <Text className="text-center text-layout-faded-grey text-xs mb-2 font-medium mt-0 mb-2">
          {weekRangeLabel}
        </Text>
        <PagedCarousel
          items={days}
          itemsPerPage={7}
          pageWidth={Dimensions.get('window').width - 30}
          renderItem={renderItem}
          keyExtractor={(d) => d.toISOString()}
          itemSpacing={7}
          contentContainerStyle={{ height: 80 }}
          flatListProps={{ style: { height: 80 } }}
        />
      </React.Fragment>
    </View>
  );
} 