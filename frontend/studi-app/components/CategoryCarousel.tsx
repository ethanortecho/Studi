import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useStudySession } from '@/hooks/useStudySession';
import { StudySessionContext } from '@/context/StudySessionContext';
import { useContext } from 'react';

export function CategoryCarousel() {
  const { categories } = useContext(StudySessionContext);
  const { switchCategory } = useStudySession();
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!categories || categories.length === 0) {
    return (
      <View className="items-center justify-center p-4">
        <Text className="text-gray-600">No categories available</Text>
      </View>
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
    <View className="flex-row items-center justify-center w-full py-2.5">
      <Pressable onPress={handlePrev} className="p-2.5">
        <Text className="text-2xl text-gray-600">←</Text>
      </Pressable>
      
      <View 
        style={{ backgroundColor: currentCategory.color }}
        className="py-3 px-5 rounded-lg mx-2.5 min-w-[150px] items-center"
      >
        <Text className="text-base font-semibold text-white">
          {currentCategory.name}
        </Text>
      </View>
      
      <Pressable onPress={handleNext} className="p-2.5">
        <Text className="text-2xl text-gray-600">→</Text>
      </Pressable>
    </View>
  );
} 