import React, { useContext, useEffect, useRef, useState } from 'react';
import { View, Text, Modal, Pressable, ScrollView, Animated, Dimensions } from 'react-native';
import { StudySessionContext } from '@/context/StudySessionContext';

interface CategorySelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onCategorySelect: (categoryId: string | number) => void;
  onImmediateColorChange?: (color: string) => void;
  isInitialSelection?: boolean;
}

const { height: screenHeight } = Dimensions.get('window');

export default function CategorySelectionModal({ 
  visible, 
  onClose, 
  onCategorySelect, 
  onImmediateColorChange,
  isInitialSelection = false 
}: CategorySelectionModalProps) {
  const { categories, currentCategoryId } = useContext(StudySessionContext);
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const [previewColor, setPreviewColor] = useState<string | null>(null);
  
  useEffect(() => {
    if (visible) {
      // Slide up animation
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Slide down animation
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);
  
  const handleCategoryPress = (categoryId: string | number) => {
    console.log('CategorySelectionModal: Category selected:', categoryId);
    onCategorySelect(categoryId);
  };
  
  const handleCategoryPreview = (categoryId: string | number) => {
    if (onImmediateColorChange) {
      onImmediateColorChange(categoryId);
    }
  };
  
  const handleModalClose = () => {
    // Reset preview color when closing without selection
    setPreviewColor(null);
    // Don't call onImmediateColorChange - let useTimerBackground handle default logic
    onClose();
  };
  
  const getHeaderText = () => {
    if (isInitialSelection) {
      return 'Select your first subject to begin studying';
    }
    return 'Switch to a different subject';
  };
  
  const getSubHeaderText = () => {
    if (isInitialSelection) {
      return 'You can change this anytime during your session';
    }
    return 'Your study time will be tracked separately for each subject';
  };
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleModalClose}
    >
      {/* Backdrop */}
      <Pressable 
        className="flex-1 bg-black bg-opacity-50"
        onPress={handleModalClose}
      >
        {/* Modal Content */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: 'white',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: screenHeight * 0.7,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          {/* Handle Bar */}
          <View className="items-center py-3">
            <View className="w-12 h-1 bg-gray-300 rounded-full" />
          </View>
          
          {/* Header */}
          <View className="px-6 pb-4">
            <Text className="text-xl font-bold text-gray-900 mb-2">
              {getHeaderText()}
            </Text>
            <Text className="text-sm text-gray-600">
              {getSubHeaderText()}
            </Text>
          </View>
          
          {/* Category List */}
          <ScrollView 
            className="px-6 pb-6"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 32 }}
          >
            {categories.map((category) => {
              const isSelected = String(category.id) === String(currentCategoryId);
              
              return (
                <Pressable
                  key={category.id}
                  onPress={() => handleCategoryPress(category.id)}
                  onPressIn={() => handleCategoryPreview(category.id)}
                  className={`p-4 rounded-xl mb-3 flex-row items-center justify-between ${isSelected ? 'border-2' : 'border border-gray-200'}`}
                  style={{ 
                    backgroundColor: isSelected ? `${category.color}20` : 'white',
                    borderColor: isSelected ? category.color : '#E5E7EB',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                    elevation: 2
                  }}
                >
                  <View className="flex-row items-center">
                    {/* Category Color Indicator */}
                    <View 
                      className="w-4 h-4 rounded-full mr-3"
                      style={{ backgroundColor: category.color }}
                    />
                    
                    {/* Category Name */}
                    <Text className={`font-medium ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                      {category.name}
                    </Text>
                  </View>
                  
                  {/* Selected Indicator */}
                  {isSelected && (
                    <View className="w-5 h-5 rounded-full items-center justify-center" style={{ backgroundColor: category.color }}>
                      <Text className="text-white text-xs font-bold">✓</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}