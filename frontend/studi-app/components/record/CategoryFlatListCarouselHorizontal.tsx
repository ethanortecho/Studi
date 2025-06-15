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

const CONTAINER_WIDTH = 300;
const ITEM_WIDTH = 100;
const ITEM_SPACING = 16;
const DUPLICATE_COUNT = 100;

// Category type
// { id: string | number, name: string, color: string }
type Category = {
  id: string | number;
  name: string;
  color: string;
};

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<Category>);

export default function CategoryFlatListCarouselHorizontal() {
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

  const itemSize = ITEM_WIDTH + ITEM_SPACING;
  const contentOffset = (CONTAINER_WIDTH - ITEM_WIDTH) / 2;
  const startIndex = Math.floor(DUPLICATE_COUNT / 2) * categories.length;

  // Animated scroll value
  const scrollX = useSharedValue(0);

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
    
    try {
      const category = categories[categoryIndex];
      if (category && switchCategory) {
        await switchCategory(Number(category.id));
      }
    } catch (error) {
      console.error("CategoryFlatListCarouselHorizontal: Error switching category:", error);
    }
  }

  // Animated scroll handler
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
    onMomentumEnd: (event) => {
      const scrollXValue = event.contentOffset.x;
      const infiniteIndex = Math.round(scrollXValue / itemSize);
      const originalIndex = infiniteIndex % categories.length;
      const clampedIndex = Math.max(0, Math.min(categories.length - 1, originalIndex));
      runOnJS(handleCategoryChange)(clampedIndex);
    },
  });

  // Animated item component (no hooks inside renderItem)
  function AnimatedCategoryItem({ item, index }: { item: Category; index: number }) {
    // Calculate the center position for this item
    const itemCenter = contentOffset + index * itemSize + ITEM_WIDTH / 2;
    const containerCenter = CONTAINER_WIDTH / 2;

    // Animated style
    const animatedStyle = useAnimatedStyle(() => {
      const currentContainerCenter = scrollX.value + containerCenter;
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
      const currentContainerCenter = scrollX.value + containerCenter;
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
            width: ITEM_WIDTH,
            marginHorizontal: ITEM_SPACING / 2,
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
    <View style={{ width: CONTAINER_WIDTH + 20, height: 200, alignSelf: 'center', paddingVertical: 10 }}>
      {/* Empty categories */}
      {categories.length === 0 && (
        <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <Text style={{ color: '#888' }}>No categories available</Text>
        </View>
      )}
      {/* Carousel */}
      {categories.length > 0 && (
        <View style={{ alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          {/* Top arrow visual cue */}
          <View style={{ marginBottom: 8 }}>
            <Text style={{ color: '#9CA3AF', fontSize: 16, textAlign: 'center' }}>▲</Text>
          </View>
          <AnimatedFlatList
            ref={flatListRef}
            data={infiniteCategories}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            getItemLayout={(data: ArrayLike<Category> | null | undefined, index: number) => ({ length: itemSize, offset: itemSize * index, index })}
            showsHorizontalScrollIndicator={false}
            horizontal
            snapToInterval={itemSize}
            snapToAlignment="center"
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: contentOffset }}
            style={{ width: CONTAINER_WIDTH, alignSelf: 'center' }}
            initialScrollIndex={startIndex}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            scrollEnabled={!isSessionPaused}
          />
          {/* Bottom arrow visual cue */}
          <View style={{ marginTop: 8 }}>
            <Text style={{ color: '#9CA3AF', fontSize: 16, textAlign: 'center' }}>▼</Text>
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