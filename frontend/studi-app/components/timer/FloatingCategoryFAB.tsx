import React, { useContext } from 'react';
import { View, Pressable, Text } from 'react-native';
import { StudySessionContext } from '@/context/StudySessionContext';

interface FloatingCategoryFABProps {
  onPress: () => void;
  isSessionActive: boolean;
}

export default function FloatingCategoryFAB({ onPress, isSessionActive }: FloatingCategoryFABProps) {
  const { currentCategoryId, categories, sessionId } = useContext(StudySessionContext);
  
  // Find current category - both are numbers, so compare directly
  const currentCategory = categories.find(cat => Number(cat.id) === Number(currentCategoryId));
  
  // Always show current category name
  const getFABText = () => {
    return currentCategory ? currentCategory.name : 'Select Subject';
  };
  
  return (
    <View>
      <Pressable
      onPress={onPress}
      className="absolute bottom-32 left-14 right-14 h-20 bg-background rounded-full items-center justify-center flex-row"
      style={{ 
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8
      }}
    >
      <Text className="text-primaryText text-lg font-semibold  flex-1 ml-14" numberOfLines={1} ellipsizeMode="tail">
        {getFABText()}
      </Text>
      <Text className="text-primaryText mr-8 ">↑</Text>
    </Pressable>

    </View>
    
  );
}