import React, { useState, useRef, useEffect } from 'react';
import { ScrollView, Text, View, Dimensions, Animated } from 'react-native';
import { useContext } from 'react';
// import * as Haptics from 'expo-haptics'; // Uncomment when you want haptics
import { StudySessionContext } from '@/context/StudySessionContext';
import { useStudySession } from '@/hooks/useStudySession';

const { width: screenWidth } = Dimensions.get('window');
const ITEM_WIDTH = 150;
const ITEM_SPACING = 20;

export function CategorySnapCarousel() {
  const context = useContext(StudySessionContext);
  const { switchCategory } = useStudySession();
  const scrollViewRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [scrollPosition, setScrollPosition] = useState(0);
  const isUserScrolling = useRef(false);
  const isProgrammaticScroll = useRef(false);

  // Safe destructuring with defaults
  const categories = context?.categories || [];
  const isSessionPaused = context?.isSessionPaused || false;
  const breakCategory = context?.breakCategory || null;
  const currentCategoryId = context?.currentCategoryId || null;

  // Calculate snap positions
  const snapToInterval = ITEM_WIDTH + ITEM_SPACING;
  const contentOffset = (screenWidth - ITEM_WIDTH) / 2;

  // Auto-sync with current category (programmatic scrolling)
  useEffect(() => {
    if (categories.length > 0 && currentCategoryId) {
      const foundIndex = categories.findIndex(cat => cat.id === String(currentCategoryId));
      if (foundIndex >= 0 && foundIndex !== activeIndex) {
        setActiveIndex(foundIndex);
        isProgrammaticScroll.current = true;
        scrollViewRef.current?.scrollTo({
          x: foundIndex * snapToInterval,
          animated: false
        });
      }
    }
  }, [currentCategoryId, categories.length]);

  const handleScroll = (event: any) => {
    const position = event.nativeEvent.contentOffset.x;
    setScrollPosition(position);
    
    // Only set user scrolling flag if this isn't a programmatic scroll
    if (!isProgrammaticScroll.current) {
      isUserScrolling.current = true;
    }
  };

  const handleScrollEnd = async (event: any) => {
    // Reset flags
    isUserScrolling.current = false;
    isProgrammaticScroll.current = false;
    
    if (isSessionPaused) return;
    
    // Simple index calculation based on scroll position
    const scrollX = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollX / snapToInterval);
    const clampedIndex = Math.max(0, Math.min(categories.length - 1, index));
    
    // Only switch category if index actually changed
    if (clampedIndex !== activeIndex && switchCategory) {
      try {
        setActiveIndex(clampedIndex);
        await switchCategory(Number(categories[clampedIndex].id));
      } catch (error) {
        console.error("CategorySnapCarousel: Error switching category:", error);
      }
    }
  };

  const renderItem = (category: any, index: number) => {
    // Calculate smooth animations based on scroll position
    const itemPosition = index * snapToInterval;
    const distance = Math.abs(scrollPosition - itemPosition);
    const normalizedDistance = Math.min(distance / snapToInterval, 1);
    
    // Subtle interpolation for scale and opacity
    const scale = 1 - (normalizedDistance * 0.1); // From 1.0 to 0.9
    const opacity = 1 - (normalizedDistance * 0.3); // From 1.0 to 0.7
    
    // Determine if this is the center/active item
    const isCenter = normalizedDistance < 0.2;
    
    return (
      <Animated.View
        key={category.id}
        style={{
          width: ITEM_WIDTH,
          marginHorizontal: ITEM_SPACING / 2,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isSessionPaused ? 0.4 : opacity,
          transform: [{ scale: isSessionPaused ? 0.9 : scale }],
        }}
      >
        <View style={{
          width: ITEM_WIDTH,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 8,
        }}>
          <Text 
            style={{
              fontSize: isCenter ? 24 : 20,
              fontWeight: isCenter ? '700' : '500',
              color: isCenter ? category.color : '#9CA3AF',
              textAlign: 'center',
              width: '100%',
            }}
            numberOfLines={2}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.8}
          >
            {category.name}
          </Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <View className="w-full py-2.5">
      {/* Empty categories */}
      {categories.length === 0 && (
        <View className="items-center justify-center p-4">
          <Text className="text-gray-600">No categories available</Text>
        </View>
      )}

      {/* Paused state - show break category */}
      {(isSessionPaused && breakCategory) && (
        <View className="items-center justify-center w-full py-2.5">
          <Text 
            style={{
              fontSize: 24,
              fontWeight: '700',
              color: breakCategory.color,
              textAlign: 'center',
              opacity: 0.75,
            }}
          >
            {breakCategory.name}
          </Text>
          <Text className="text-sm text-gray-500 mt-2">
            Resume session to switch categories
          </Text>
        </View>
      )}

      {/* Normal carousel */}
      {(categories.length > 0 && !(isSessionPaused && breakCategory)) && (
        <View className="items-center">
          {/* Up arrow indicator */}
          <View className="mb-2">
            <Text style={{ color: '#9CA3AF', fontSize: 16 }}>▲</Text>
          </View>
          
          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            onMomentumScrollEnd={handleScrollEnd}
            scrollEventThrottle={16}
            snapToInterval={snapToInterval}
            snapToAlignment="center"
            decelerationRate="fast"
            bounces={false}
            contentContainerStyle={{
              paddingHorizontal: contentOffset,
            }}
            style={{ width: screenWidth }}
            scrollEnabled={!isSessionPaused}
          >
            {categories.map((category, index) => renderItem(category, index))}
          </ScrollView>
          
          {/* Down arrow indicator */}
          <View className="mt-2">
            <Text style={{ color: '#9CA3AF', fontSize: 16 }}>▼</Text>
          </View>
        </View>
      )}
    </View>
  );
} 