import React, { useCallback, useRef } from 'react';
import {
  FlatList,
  Dimensions,
  View,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleProp,
  ViewStyle,
  FlatListProps,
} from 'react-native';

// Generic props for the carousel
export interface PagedCarouselProps<T> {
  /** Full data set to be rendered */
  items: T[];
  /** How many items should appear on each "page" (must be >= 1) */
  itemsPerPage: number;
  /** Render a single item (no need to set width) */
  renderItem: ({ item, index }: { item: T; index: number }) => React.ReactElement | null;
  /** Extract a stable key for an item */
  keyExtractor: (item: T, index: number) => string;
  /** Optional callback fired when the page index changes */
  onPageChange?: (pageIdx: number) => void;
  /** Optionally jump to a given starting index */
  initialIndex?: number;
  /** Override the page width used for snapping (defaults to full screen width) */
  pageWidth?: number;
  /** Additional styles for the list's content container */
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Any extra FlatList props you'd like forwarded */
  flatListProps?: Partial<FlatListProps<T>>;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

/**
 * A simple, cross-platform carousel that snaps one "page" at a time.
 * Provide `itemsPerPage` to control how many items are visible in each page.
 */
export default function PagedCarousel<T>({
  items,
  itemsPerPage,
  renderItem,
  keyExtractor,
  onPageChange,
  initialIndex = 0,
  pageWidth,
  contentContainerStyle,
  flatListProps = {},
}: PagedCarouselProps<T>) {
  const effectivePageWidth = pageWidth ?? SCREEN_WIDTH;
  const itemWidth = effectivePageWidth / Math.max(1, itemsPerPage);
  const flatListRef = useRef<FlatList<T>>(null);

  const handleMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const page = Math.round(e.nativeEvent.contentOffset.x / effectivePageWidth);
      if (onPageChange) {
        onPageChange(page);
      }
    },
    [onPageChange]
  );

  const wrappedRenderItem = useCallback(
    ({ item, index }: { item: T; index: number }) => (
      <View style={{ width: itemWidth }}>{renderItem({ item, index })}</View>
    ),
    [itemWidth, renderItem]
  );

  // Jump to the initial index when the component mounts
  React.useEffect(() => {
    if (initialIndex > 0 && flatListRef.current) {
      flatListRef.current.scrollToOffset({
        offset: initialIndex * effectivePageWidth,
        animated: false,
      });
    }
  }, [initialIndex]);

  return (
    <FlatList
      ref={flatListRef}
      data={items}
      horizontal
      pagingEnabled
      snapToInterval={effectivePageWidth}
      decelerationRate="fast"
      showsHorizontalScrollIndicator={false}
      renderItem={wrappedRenderItem}
      keyExtractor={keyExtractor}
      onMomentumScrollEnd={handleMomentumEnd}
      contentContainerStyle={contentContainerStyle}
      {...flatListProps}
    />
  );
} 