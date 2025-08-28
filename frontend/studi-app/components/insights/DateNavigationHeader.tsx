import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDateForDisplay, canNavigate } from '../../utils/dateUtils';

interface DateNavigationHeaderProps {
  currentDate: Date;
  type: 'daily' | 'weekly';
  onNavigate: (direction: 'prev' | 'next') => void;
}

export default function DateNavigationHeader({ 
  currentDate, 
  type, 
  onNavigate 
}: DateNavigationHeaderProps) {
  const canGoPrev = canNavigate(currentDate, 'prev', type);
  const canGoNext = canNavigate(currentDate, 'next', type);
  const displayText = formatDateForDisplay(currentDate, type);

  return (
    <View className="bg-layout-off-white rounded-3xl mx-4 mb-4 px-4 py-3">
      <View className="flex-row items-center justify-between">
        {/* Previous Button */}
        <Pressable
          onPress={() => onNavigate('prev')}
          disabled={!canGoPrev}
          className={`p-2 rounded-lg ${canGoPrev ? 'bg-white' : 'bg-gray-200'}`}
        >
          <Ionicons 
            name="chevron-back" 
            size={20} 
            color={canGoPrev ? '#5A4FCF' : '#C0C0C0'} 
          />
        </Pressable>

        {/* Date Display */}
        <View className="flex-1 mx-4">
          <Text className="text-center text-lg font-semibold text-layout-dark-grey">
            {displayText}
          </Text>
        </View>

        {/* Next Button */}
        <Pressable
          onPress={() => onNavigate('next')}
          disabled={!canGoNext}
          className={`p-2 rounded-lg ${canGoNext ? 'bg-white' : 'bg-gray-200'}`}
        >
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={canGoNext ? '#5A4FCF' : '#C0C0C0'} 
          />
        </Pressable>
      </View>
    </View>
  );
} 