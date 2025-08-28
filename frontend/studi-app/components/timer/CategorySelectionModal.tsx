import React, { useContext } from 'react';
import { View, Text, Modal, Pressable, ScrollView } from 'react-native';
import { StudySessionContext } from '../../context/StudySessionContext';
import { router } from 'expo-router';

interface CategorySelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onCategorySelect: (categoryId: string | number) => void;
  onImmediateColorChange?: (color: string) => void;
  isInitialSelection?: boolean;
}

export default function CategorySelectionModal({ 
  visible, 
  onClose, 
  onCategorySelect, 
  onImmediateColorChange,
  isInitialSelection = false 
}: CategorySelectionModalProps) {
  const { categories, currentCategoryId } = useContext(StudySessionContext);
  
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
    onClose();
  };

  const handleCreateCategories = () => {
    onClose(); // Close this modal first
    router.push('/screens/manage-categories');
  };

  const handleCancelSession = () => {
    onClose(); // Close this modal
    router.back(); // Go back to home screen
  };
  
  const getHeaderText = () => {
    if (categories.length === 0) {
      return 'Ready to start studying?';
    }
    if (isInitialSelection) {
      return 'Select your first subject to begin studying';
    }
    return 'Switch to a different subject';
  };
  
  const getSubHeaderText = () => {
    if (categories.length === 0) {
      return 'First, you\'ll need to create some subjects to track your time';
    }
    if (isInitialSelection) {
      return 'You can change this anytime during your session';
    }
    return 'Your study time will be tracked separately for each subject';
  };
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleModalClose}
    >
      {/* Backdrop */}
      <Pressable 
        className="flex-1 justify-end"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        onPress={handleModalClose}
      >
        {/* Modal Content - Glassmorphic */}
        <Pressable
          className="rounded-t-3xl max-h-[70vh]"
          style={{ 
            backgroundColor: 'rgba(33, 32, 48, 0.85)',
            borderTopWidth: 1,
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
          }}
          onPress={() => {}} // Prevent modal close when tapping content
        >
          {/* Handle Bar */}
          <View className="items-center py-3">
            <View className="w-12 h-1 bg-gray-300 rounded-full" />
          </View>
          
          {/* Header */}
          <View className="px-6 pb-4">
            <Text className="text-xl font-bold text-primaryText mb-2">
              {getHeaderText()}
            </Text>
            <Text className="text-sm text-secondaryText">
              {getSubHeaderText()}
            </Text>
          </View>
          
          {/* Category List or Empty State */}
          <ScrollView 
            className="px-6 pb-6"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 32 }}
          >
            {categories.length === 0 ? (
              /* Empty State - No Categories Available */
              <View className="py-8">
                <View className="items-center mb-6">
                  <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
                    <Text className="text-2xl">📚</Text>
                  </View>
                  <Text className="text-lg font-semibold text-primaryText text-center mb-2">
                    No subjects yet
                  </Text>
                  <Text className="text-sm text-secondaryText text-center mb-6">
                    Create your first subject to start tracking your study time
                  </Text>
                </View>
                
                {/* Action Buttons */}
                <View className="space-y-3">
                  {/* Create Categories Button - Glassmorphic */}
                  <Pressable
                    onPress={handleCreateCategories}
                    className="py-4 px-6 rounded-xl mb-3"
                    style={{ 
                      backgroundColor: 'rgba(93, 62, 218, 0.2)',
                      borderWidth: 1,
                      borderColor: 'rgba(93, 62, 218, 0.3)',
                    }}
                  >
                    <Text className="text-white font-semibold text-center text-base">
                      Create My First Subject
                    </Text>
                  </Pressable>
                  
                  {/* Cancel Session Button - Glassmorphic */}
                  <Pressable
                    onPress={handleCancelSession}
                    className="py-4 px-6 rounded-xl"
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      borderWidth: 1,
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <Text className="text-white/70 font-semibold text-center text-base">
                      Cancel & Go Back
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              /* Normal Category List */
              categories.map((category) => {
                const isSelected = String(category.id) === String(currentCategoryId);
                
                return (
                  <Pressable
                    key={category.id}
                    onPress={() => handleCategoryPress(category.id)}
                    onPressIn={() => handleCategoryPreview(category.id)}
                    className={`p-4 rounded-xl mb-3 flex-row items-center justify-between`}
                    style={{ 
                      backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                      borderWidth: 1,
                      borderColor: isSelected ? category.color : 'rgba(255, 255, 255, 0.1)',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.15,
                      shadowRadius: 4,
                      elevation: 3
                    }}
                  >
                    <View className="flex-row items-center">
                      {/* Category Color Indicator */}
                      <View 
                        className="w-4 h-4 rounded-full mr-3"
                        style={{ backgroundColor: category.color }}
                      />
                      
                      {/* Category Name */}
                      <Text className={`font-medium ${isSelected ? 'text-primaryText' : 'text-secondaryText'}`}>
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
              })
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}