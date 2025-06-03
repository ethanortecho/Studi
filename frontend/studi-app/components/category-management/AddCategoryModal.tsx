import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Modal, Alert } from 'react-native';
import ColorPicker from './ColorPicker';
import { createCategory } from '@/utils/studySession';
import { CATEGORY_COLORS } from '@/constants/Colors';

interface AddCategoryModalProps {
  visible: boolean;
  onClose: () => void;
  onCategoryAdded: () => void;
  usedColors: string[];
}

export default function AddCategoryModal({ visible, onClose, onCategoryAdded, usedColors }: AddCategoryModalProps) {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(CATEGORY_COLORS[0].value);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    setLoading(true);
    try {
      await createCategory(name.trim(), selectedColor);
      setName('');
      setSelectedColor(CATEGORY_COLORS[0].value);
      onCategoryAdded();
      onClose();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setSelectedColor(CATEGORY_COLORS[0].value);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/50 justify-center items-center p-4">
        <View className="bg-white rounded-lg p-6 w-full max-w-sm">
          <Text className="text-xl font-bold mb-4">Add Category</Text>
          
          <Text className="text-gray-700 mb-2">Category Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Enter category name"
            className="border border-gray-300 rounded-lg p-3 mb-4"
            maxLength={50}
          />
          
          <Text className="text-gray-700 mb-3">Color</Text>
          <ColorPicker
            selectedColor={selectedColor}
            onColorSelect={setSelectedColor}
            usedColors={usedColors}
          />
          
          <View className="flex-row gap-3 mt-6">
            <Pressable
              onPress={handleClose}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg"
            >
              <Text className="text-center text-gray-700">Cancel</Text>
            </Pressable>
            
            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              className="flex-1 py-3 px-4 bg-blue-500 rounded-lg"
            >
              <Text className="text-center text-white">
                {loading ? 'Creating...' : 'Create'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
} 