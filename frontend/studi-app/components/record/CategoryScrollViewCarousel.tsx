import React, { useRef, useContext, useMemo, useEffect } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { StudySessionContext } from '../../context/StudySessionContext';

const CONTAINER_HEIGHT = 180;
const ITEM_HEIGHT = 50;
const ITEM_SPACING = 15;

// Category type (extended to support "No Category" option)
type Category = {
  id: string | number;
  name: string;
  color: string;
  isNone?: boolean; // For "No Category" option
};

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export default function CategoryScrollViewCarousel({ 
    sessionStarted = false, 
    onFirstCategorySelect,
    onImmediateColorChange 
}: { 
    sessionStarted?: boolean; 
    onFirstCategorySelect?: (categoryId: string | number) => void;
    onImmediateColorChange?: (categoryId: string | number) => void;
}) {
  const context = useContext(StudySessionContext);
  const scrollViewRef = useRef<ScrollView>(null);

  // Get categories and state from context
  const categories: Category[] = context?.categories || [];
  const isSessionPaused = context?.isSessionPaused || false;

  // Simple carousel data with "No Category" option
  const carouselData = useMemo(() => {
    if (!sessionStarted) {
      const noCategory = {
        id: 'none',
        name: 'No Category',
        color: '#E5E7EB',
        isNone: true
      };
      return [noCategory, ...categories];
    }
    return categories;
  }, [categories, sessionStarted]);

  const itemSize = ITEM_HEIGHT + ITEM_SPACING;
  const contentOffset = (CONTAINER_HEIGHT - ITEM_HEIGHT) / 2;

  // Animated scroll value
  const scrollY = useSharedValue(0);

  // Track last selected index to detect transition from 'No Category' to real category
  const lastSelectedIndexRef = useRef(0);

  // Only handle initial positioning when component mounts or data changes
  useEffect(() => {
    if (carouselData.length > 0) {
      // Always start at index 0 (either "No Category" or first real category)
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: 0,
          animated: false,
        });
      }, 0);
    }
  }, [carouselData.length]); // Removed currentCategoryId dependency to break feedback loop

  // Simplified category selection handler
  async function handleCategoryChange(scrollOffset: number) {
    const categoryIndex = Math.round(scrollOffset / itemSize);
    
    if (isSessionPaused || carouselData.length === 0 || categoryIndex < 0 || categoryIndex >= carouselData.length) {
      return;
    }

    const selectedItem = carouselData[categoryIndex];

    // INSTANT COLOR CHANGE - Call immediately before any async operations
    if (onImmediateColorChange && selectedItem && !selectedItem.isNone) {
      onImmediateColorChange(selectedItem.id);
    }

    // If session hasn't started and user selects a real category, trigger onFirstCategorySelect
    if (!sessionStarted && !selectedItem?.isNone && typeof onFirstCategorySelect === 'function') {
      if (lastSelectedIndexRef.current === 0) {
        onFirstCategorySelect(selectedItem.id);
        lastSelectedIndexRef.current = categoryIndex;
        return;
      }
    }

    // Update last selected index
    lastSelectedIndexRef.current = categoryIndex;

    // Skip if "No Category" is selected
    if (selectedItem?.isNone) {
      return;
    }

    // For subsequent category changes when session is running, call switchCategory
    if (sessionStarted && selectedItem && context?.switchCategory && context?.sessionId) {
      try {
        await context.switchCategory(Number(selectedItem.id));
      } catch (error) {
        console.error("CategoryScrollViewCarousel: Error switching category:", error);
      }
    }
  }

  // Simple scroll handler - let React Native handle the snapping
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
    onMomentumEnd: (event) => {
      runOnJS(handleCategoryChange)(event.contentOffset.y);
    },
  });

  // Simplified animated item component
  function AnimatedCategoryItem({ item, index }: { item: Category; index: number }) {
    const animatedStyle = useAnimatedStyle(() => {
      const itemOffset = index * itemSize;
      const inputRange = [
        itemOffset - itemSize,
        itemOffset,
        itemOffset + itemSize,
      ];
      
      const scale = interpolate(
        scrollY.value,
        inputRange,
        [0.8, 1, 0.8],
        Extrapolation.CLAMP
      );
      
      const opacity = interpolate(
        scrollY.value,
        inputRange,
        [0.4, 1, 0.4],
        Extrapolation.CLAMP
      );

      return {
        opacity: isSessionPaused ? opacity * 0.5 : opacity,
        transform: [{ scale: isSessionPaused ? scale * 0.9 : scale }],
      };
    });

    const textStyle = useAnimatedStyle(() => {
      const itemOffset = index * itemSize;
      const inputRange = [
        itemOffset - itemSize * 0.5,
        itemOffset,
        itemOffset + itemSize * 0.5,
      ];
      
      const fontSize = interpolate(
        scrollY.value,
        inputRange,
        [20, 28, 20],
        Extrapolation.CLAMP
      );

      const isActive = Math.abs(scrollY.value - itemOffset) < itemSize * 0.5;
      
      return {
        color: isActive ? item.color : '#9CA3AF',
        fontSize,
        fontWeight: isActive ? '700' : '500',
      };
    });

    return (
      <Animated.View
        key={`${item.id}-${index}`}
        style={[
          {
            height: ITEM_HEIGHT,
            marginVertical: ITEM_SPACING / 2,
            alignItems: 'center',
            justifyContent: 'center',
          },
          animatedStyle,
        ]}
      >
        <Animated.Text
          style={[
            { textAlign: 'center' },
            textStyle,
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.8}
        >
          {item.name}
        </Animated.Text>
      </Animated.View>
    );
  }

  return (
    <View style={{ width: '100%', height: CONTAINER_HEIGHT + 20, paddingVertical: 10 }}>
      {/* Empty categories */}
      {categories.length === 0 && (
        <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <Text style={{ color: '#888' }}>No categories available</Text>
        </View>
      )}
      {/* Carousel */}
      {carouselData.length > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          {/* Left arrow visual cue */}
          <View style={{ marginRight: 16 }}>
            <Text style={{ color: '#9CA3AF', fontSize: 16 }}>◀</Text>
          </View>
          
          <AnimatedScrollView
            ref={scrollViewRef}
            style={{ height: CONTAINER_HEIGHT }}
            contentContainerStyle={{ 
              paddingVertical: contentOffset,
            }}
            showsVerticalScrollIndicator={false}
            decelerationRate="fast"
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            scrollEnabled={!isSessionPaused}
            snapToInterval={itemSize}
            snapToAlignment="center"
          >
            {carouselData.map((item, index) => (
              <AnimatedCategoryItem key={`${item.id}-${index}`} item={item} index={index} />
            ))}
          </AnimatedScrollView>
          
          {/* Right arrow visual cue */}
          <View style={{ marginLeft: 16 }}>
            <Text style={{ color: '#9CA3AF', fontSize: 16 }}>▶</Text>
          </View>
        </View>
      )}
      {/* Paused state indicator */}
      {isSessionPaused && (
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center' }}>
          <Text style={{ color: '#9CA3AF', fontSize: 12 }}>
            Resume session to switch categories
          </Text>
        </View>
      )}
    </View>
  );
} 