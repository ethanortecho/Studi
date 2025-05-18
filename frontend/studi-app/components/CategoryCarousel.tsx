import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface Category {
  id: string;
  name: string;
  color: string;
}

interface CategoryCarouselProps {
  currentCategory: Category | undefined;
  onNext: () => void;
  onPrev: () => void;
}

export function CategoryCarousel({ currentCategory, onNext, onPrev }: CategoryCarouselProps) {
  if (!currentCategory) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>No categories available</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Pressable onPress={onPrev} style={styles.arrow}>
        <ThemedText style={styles.arrowText}>←</ThemedText>
      </Pressable>
      
      <ThemedView 
        style={[
          styles.categoryItem,
          { backgroundColor: currentCategory.color }
        ]}
      >
        <ThemedText style={styles.categoryName}>
          {currentCategory.name}
        </ThemedText>
      </ThemedView>
      
      <Pressable onPress={onNext} style={styles.arrow}>
        <ThemedText style={styles.arrowText}>→</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 10,
  },
  arrow: {
    padding: 10,
  },
  arrowText: {
    fontSize: 24,
  },
  categoryItem: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 10,
    minWidth: 150,
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF', // White text for better contrast on colored backgrounds
  },
}); 