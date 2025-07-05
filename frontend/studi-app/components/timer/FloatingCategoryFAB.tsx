import React, { useContext } from 'react';
import { View, Pressable, Text } from 'react-native';
import { StudySessionContext } from '@/context/StudySessionContext';

interface FloatingCategoryFABProps {
  onPress: () => void;
  isSessionActive: boolean;
}

export default function FloatingCategoryFAB({ onPress, isSessionActive }: FloatingCategoryFABProps) {
  const { currentCategoryId, categories, sessionId } = useContext(StudySessionContext);
  
  // Find current category
  const currentCategory = categories.find(cat => cat.id === String(currentCategoryId));
  
  // Determine FAB text
  const getFABText = () => {
    if (!isSessionActive || !currentCategory) {
      return 'Select Subject';
    }
    return currentCategory.name;
  };
  
  // Determine FAB color - use current category color or default
  const getFABColor = () => {
    if (currentCategory) {
      return currentCategory.color;
    }
    return '#5A4FCF'; // Default purple from theme
  };
  
  return (
    <Pressable
      onPress={onPress}
      className="absolute bottom-32 left-6 right-6 h-14 rounded-full items-center justify-center"
      style={{ 
        backgroundColor: getFABColor(),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8
      }}
      android_ripple={{ color: '#ffffff30' }}
    >
      <Text className="text-white font-semibold text-base" numberOfLines={1} ellipsizeMode="tail">
        {getFABText()}
      </Text>
    </Pressable>
  );
}