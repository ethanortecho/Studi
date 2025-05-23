import React, { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useStudySession } from '@/hooks/useStudySession';
import { Category } from '@/utils/studySession';
import { StudySessionContext } from '@/context/StudySessionContext';
import { useContext } from 'react';



export function CategoryCarousel() {
  const { categories } = useContext(StudySessionContext);
  const { switchCategory } = useStudySession();
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!categories || categories.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>No categories available</ThemedText>
      </ThemedView>
    );
  }

  const handleNext = async () => {
    const nextIndex = (currentIndex + 1) % categories.length;
    setCurrentIndex(nextIndex);
    await switchCategory(Number(categories[nextIndex].id));
  };

  const handlePrev = async () => {
    const prevIndex = (currentIndex - 1 + categories.length) % categories.length;
    setCurrentIndex(prevIndex);
    await switchCategory(Number(categories[prevIndex].id));
  };

  const currentCategory = categories[currentIndex];

  return (
    <ThemedView style={styles.container}>
      <Pressable onPress={handlePrev} style={styles.arrow}>
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
      
      <Pressable onPress={handleNext} style={styles.arrow}>
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