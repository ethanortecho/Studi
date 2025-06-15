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

const CONTAINER_HEIGHT = 200;
const ITEM_HEIGHT = 60;
const ITEM_SPACING = 10;
const DUPLICATE_COUNT = 100;

// Category type
// { id: string | number, name: string, color: string }
type Category = {
  id: string | number;
  name: string;
  color: string;
};

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<Category>);

export default function CategoryFlatListCarousel() {
  const context = useContext(StudySessionContext);
  const { switchCategory } = useStudySession();
  const flatListRef = useRef<FlatList<Category>>(null);

  // Get categories and state from context
  const categories: Category[] = context?.categories || [];
  const isSessionPaused = context?.isSessionPaused || false;
  const currentCategoryId = context?.currentCategoryId || null;

  // Infinite scroll data
  const infiniteCategories = useMemo(() => {
    if (categories.length === 0) return [];
    const duplicated: Category[] = [];
    for (let i = 0; i < DUPLICATE_COUNT; i++) {
      duplicated.push(...categories);
    }
    return duplicated;
  }, [categories]);

  const itemSize = ITEM_HEIGHT + ITEM_SPACING;
  const contentOffset = (CONTAINER_HEIGHT - ITEM_HEIGHT) / 2;
  const startIndex = Math.floor(DUPLICATE_COUNT / 2) * categories.length;

  // Animated scroll value
  const scrollY = useSharedValue(0);

  // Sync with current category from context
  useEffect(() => {
    if (categories.length > 0 && currentCategoryId) {
      const foundIndex = categories.findIndex(cat => cat.id === String(currentCategoryId));
      if (foundIndex >= 0) {
        const infiniteIndex = startIndex + foundIndex;
        flatListRef.current?.scrollToIndex({
          index: infiniteIndex,
          animated: false,
        });
      }
    } else if (categories.length > 0) {
      // Initial scroll to middle
      flatListRef.current?.scrollToIndex({
        index: startIndex,
        animated: false,
      });
    }
  }, [currentCategoryId, categories.length, startIndex]);

  // Handle category selection
  async function handleCategoryChange(categoryIndex: number) {
    if (isSessionPaused || categories.length === 0) return;
    
    // Don't switch categories if no session is active yet
    if (!context?.sessionId) {
      console.log("CategoryFlatListCarousel: Ignoring category change - no active session");
      return;
    }
    
    try {
      const category = categories[categoryIndex];
      if (category && switchCategory) {
        await switchCategory(Number(category.id));
      }
    } catch (error) {
      console.error("CategoryFlatListCarousel: Error switching category:", error);
    }
  }

  // Animated scroll handler
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
    onMomentumEnd: (event) => {
      const scrollYValue = event.contentOffset.y;
      const infiniteIndex = Math.round(scrollYValue / itemSize);
      const originalIndex = infiniteIndex % categories.length;
      const clampedIndex = Math.max(0, Math.min(categories.length - 1, originalIndex));
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
        [0, itemSize * 1.2],
        [1, 0.7],
        Extrapolation.CLAMP
      );
      const opacity = interpolate(
        distance,
        [0, itemSize * 1.2],
        [1, 0.3],
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
          [32, 24],
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
      {categories.length > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          {/* Left arrow visual cue */}
          <View style={{ marginRight: 16 }}>
            <Text style={{ color: '#9CA3AF', fontSize: 16 }}>◀</Text>
          </View>
          <AnimatedFlatList
            ref={flatListRef}
            data={infiniteCategories}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            getItemLayout={(data: ArrayLike<Category> | null | undefined, index: number) => ({ length: itemSize, offset: itemSize * index, index })}
            showsVerticalScrollIndicator={false}
            snapToInterval={itemSize}
            snapToAlignment="center"
            decelerationRate="fast"
            contentContainerStyle={{ paddingVertical: contentOffset }}
            style={{ height: CONTAINER_HEIGHT }}
            initialScrollIndex={startIndex}
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