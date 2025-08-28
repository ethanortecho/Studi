import React, { useContext } from 'react';
import { View, Pressable, Text } from 'react-native';
import { StudySessionContext } from '../../context/StudySessionContext';

interface FloatingCategoryFABProps {
  onPress: () => void;
  isSessionActive: boolean;
  status: 'idle' | 'running' | 'paused';
}

export default function FloatingCategoryFAB({ onPress, isSessionActive, status }: FloatingCategoryFABProps) {
  const { currentCategoryId, categories, sessionId } = useContext(StudySessionContext);
  
  // Find current category - both are numbers, so compare directly
  const currentCategory = categories.find(cat => Number(cat.id) === Number(currentCategoryId));
  
  // Show text based on status - only show Paused or actual category name
  const getFABText = () => {
    if (status === 'paused') {
      return 'Paused';
    }
    // Always return the category name if available, otherwise empty string
    return currentCategory?.name || '';
  };
  
  // Determine if FAB should be disabled
  const isDisabled = status === 'paused';

  return (
    <View className="items-center pb-20">
      <Pressable
        onPress={!isDisabled ? onPress : undefined}
        disabled={isDisabled}
        className={`h-20  mx-14 rounded-full flex-row items-center justify-center
          ${isDisabled ? 'bg-surface opacity-60' : 'bg-background'}`}
        style={{ 
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 8
        }}
      >
        <Text className={`text-lg font-semibold flex-1 text-center ${
          isDisabled ? 'text-secondaryText' : 'text-primaryText'
        }`} numberOfLines={1} ellipsizeMode="tail">
          {getFABText()}
        </Text>
        {!isDisabled && (
          <Text className="text-primaryText mr-8">↑</Text>
        )}
      </Pressable>

      {/* Always show subtitle text */}
      <Text className="mt-2 text-sm text-primaryText text-center">
        {isDisabled ? 'Resume to continue with your study session' : 'Tap to switch subject'}
      </Text>
    </View>
  );
}