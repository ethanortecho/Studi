import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useStudySession } from '@/hooks/useStudySession';
import { StudySessionContext } from '@/context/StudySessionContext';
import { useContext } from 'react';

export function CategoryCarousel() {
  const { categories, isSessionPaused, breakCategory } = useContext(StudySessionContext);
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
    if (isSessionPaused) return; // Prevent action when paused
    
    try {
      const nextIndex = (currentIndex + 1) % categories.length;
      setCurrentIndex(nextIndex);
      await switchCategory(Number(categories[nextIndex].id));
    } catch (error) {
      console.error("CategoryCarousel: Error switching category:", error);
      // Could show a toast/alert here
    }
  };

  const handlePrev = async () => {
    if (isSessionPaused) return; // Prevent action when paused
    
    try {
      const prevIndex = (currentIndex - 1 + categories.length) % categories.length;
      setCurrentIndex(prevIndex);
      await switchCategory(Number(categories[prevIndex].id));
    } catch (error) {
      console.error("CategoryCarousel: Error switching category:", error);
      // Could show a toast/alert here
    }
  };

  // Show break category when session is paused
  if (isSessionPaused && breakCategory) {
    return (
      <View className="items-center justify-center w-full py-2.5">
        <View 
          style={{ backgroundColor: breakCategory.color }}
          className="py-3 px-5 rounded-lg mx-2.5 min-w-[150px] items-center opacity-75"
        >
          <Text className="text-base font-semibold text-white">
            {breakCategory.name}
          </Text>
        </View>
        <Text className="text-sm text-gray-500 mt-2">
          Resume session to switch categories
        </Text>
      </View>
    );
  }

  const currentCategory = categories[currentIndex];
  const isDisabled = isSessionPaused;

  return (
    <View className="flex-row items-center justify-center w-full py-2.5">
      <Pressable 
        onPress={handlePrev} 
        className={`p-2.5 ${isDisabled ? 'opacity-50' : ''}`}
        disabled={isDisabled}
      >
        <Text className="text-2xl text-gray-600">←</Text>
      </Pressable>
      
      <View 
        style={{ backgroundColor: currentCategory.color }}
        className={`py-3 px-5 rounded-lg mx-2.5 min-w-[150px] items-center ${isDisabled ? 'opacity-50' : ''}`}
      >
        <Text className="text-base font-semibold text-white">
          {currentCategory.name}
        </Text>
      </View>
      
      <Pressable 
        onPress={handleNext} 
        className={`p-2.5 ${isDisabled ? 'opacity-50' : ''}`}
        disabled={isDisabled}
      >
        <Text className="text-2xl text-gray-600">→</Text>
      </Pressable>
      
      {isSessionPaused && (
        <View className="absolute -bottom-6 w-full">
          <Text className="text-sm text-gray-500 text-center">
            Resume session to switch categories
          </Text>
        </View>
      )}
    </View>
  );
} 