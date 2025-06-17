import React, { useRef, useContext, useMemo, useEffect } from 'react';
import { FlatList, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { StudySessionContext } from '@/context/StudySessionContext';
import { useStudySession } from '@/hooks/useStudySession';

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

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<Category>);

export default function CategoryFlatListCarousel({ 
    sessionStarted = false, 
    onFirstCategorySelect,
    onImmediateColorChange 
}: { 
    sessionStarted?: boolean; 
    onFirstCategorySelect?: (categoryId: string | number) => void;
    onImmediateColorChange?: (categoryId: string | number) => void;
}) {
  const context = useContext(StudySessionContext);
  const flatListRef = useRef<FlatList<Category>>(null);

  // Get categories and state from context
  const categories: Category[] = context?.categories || [];
  const isSessionPaused = context?.isSessionPaused || false;
  const currentCategoryId = context?.currentCategoryId || null;

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

  // Sync with current category from context
  useEffect(() => {
    if (carouselData.length > 0 && currentCategoryId) {
      const foundIndex = carouselData.findIndex(cat => Number(cat.id) === Number(currentCategoryId));
      if (foundIndex >= 0) {
        flatListRef.current?.scrollToIndex({
          index: foundIndex,
          animated: false,
        });
      }
    } else if (carouselData.length > 0) {
      // Initial scroll to "No Category" (index 0)
      flatListRef.current?.scrollToIndex({
        index: 0,
        animated: false,
      });
    }
  }, [currentCategoryId, carouselData.length]);

  // Enhanced category selection handler with instant callback
  async function handleCategoryChange(categoryIndex: number) {
    console.log("CategoryFlatListCarousel: handleCategoryChange called with index:", categoryIndex);
    
    if (isSessionPaused || carouselData.length === 0) {
      console.log("CategoryFlatListCarousel: handleCategoryChange early return - session paused or no data");
      return;
    }

    const selectedItem = carouselData[categoryIndex];
    console.log("CategoryFlatListCarousel: Selected item:", selectedItem);

    // INSTANT COLOR CHANGE - Call immediately before any async operations
    if (onImmediateColorChange && selectedItem && !selectedItem.isNone) {
      onImmediateColorChange(selectedItem.id);
    }

    // If session hasn't started and user selects a real category, trigger onFirstCategorySelect
    if (!sessionStarted && !selectedItem?.isNone && typeof onFirstCategorySelect === 'function') {
      if (lastSelectedIndexRef.current === 0) {
        console.log("CategoryFlatListCarousel: Triggering onFirstCategorySelect with categoryId:", selectedItem.id);
        onFirstCategorySelect(selectedItem.id);
        lastSelectedIndexRef.current = categoryIndex;
        return;
      }
    }

    // Update last selected index
    lastSelectedIndexRef.current = categoryIndex;

    // Skip if "No Category" is selected
    if (selectedItem?.isNone) {
      console.log("CategoryFlatListCarousel: No Category selected, skipping");
      return;
    }

    // For subsequent category changes when session is running, call switchCategory
    if (sessionStarted && selectedItem && context?.switchCategory && context?.sessionId) {
      console.log("CategoryFlatListCarousel: Switching to category:", selectedItem.id);
      try {
        await context.switchCategory(Number(selectedItem.id));
        console.log("CategoryFlatListCarousel: Category switch completed");
      } catch (error) {
        console.error("CategoryFlatListCarousel: Error switching category:", error);
      }
    }
  }

  // Animated scroll handler
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
    onMomentumEnd: (event) => {
      const scrollYValue = event.contentOffset.y;
      const selectedIndex = Math.round(scrollYValue / itemSize);
      const clampedIndex = Math.max(0, Math.min(carouselData.length - 1, selectedIndex));
      runOnJS(handleCategoryChange)(clampedIndex);
    },
  });

  // Animated item component (no hooks inside renderItem)
  function AnimatedCategoryItem({ item, index }: { item: Category; index: number }) {
    // Calculate the center position for this item
    const itemCenter = contentOffset + index * itemSize + ITEM_HEIGHT / 2;
    const containerCenter = CONTAINER_HEIGHT / 2;

    // Animated style
    const animatedStyle = useAnimatedStyle(() => {
      const currentContainerCenter = scrollY.value + containerCenter;
      const distance = Math.abs(itemCenter - currentContainerCenter);
      const scale = interpolate(
        distance,
        [0, itemSize * 1.5],
        [1, 0.8],
        Extrapolation.CLAMP
      );
      const opacity = interpolate(
        distance,
        [0, itemSize * 1.5],
        [1, 0.4],
        Extrapolation.CLAMP
      );
      return {
        opacity: isSessionPaused ? opacity * 0.5 : opacity,
        transform: [{ scale: isSessionPaused ? scale * 0.9 : scale }],
      };
    });

    const textStyle = useAnimatedStyle(() => {
      const currentContainerCenter = scrollY.value + containerCenter;
      const distance = Math.abs(itemCenter - currentContainerCenter);
      const isActive = distance < itemSize * 0.5;
      return {
        color: isActive ? item.color : '#9CA3AF',
        fontSize: interpolate(
          distance,
          [0, itemSize * 0.8],
          [28, 20],
          Extrapolation.CLAMP
        ),
        fontWeight: isActive ? '700' : '500',
      };
    });

    return (
      <Animated.View
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

  function renderItem({ item, index }: { item: Category; index: number }) {
    return <AnimatedCategoryItem item={item} index={index} />;
  }

  function keyExtractor(item: Category, index: number) {
    return `${item.id}-${index}`;
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
          <AnimatedFlatList
            ref={flatListRef}
            data={carouselData}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            getItemLayout={(data: ArrayLike<Category> | null | undefined, index: number) => ({ length: itemSize, offset: itemSize * index, index })}
            showsVerticalScrollIndicator={false}
            snapToInterval={itemSize}
            snapToAlignment="center"
            decelerationRate="fast"
            contentContainerStyle={{ paddingVertical: contentOffset }}
            style={{ height: CONTAINER_HEIGHT }}
            initialScrollIndex={0}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            scrollEnabled={!isSessionPaused}
          />
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