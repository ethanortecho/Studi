import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Modal, Alert } from 'react-native';
import ColorPicker from './ColorPicker';
import { createCategory } from '../../utils/studySession';
import { CATEGORY_COLORS } from '../../constants/Colors';

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
        <View className="bg-surface rounded-lg p-6 w-full max-w-sm">
          <Text className="text-xl font-bold mb-4 text-primaryText">Add Category</Text>

          <Text className="text-secondaryText mb-2">Category Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Enter category name"
            placeholderTextColor="rgb(var(--color-secondaryText))"
            className="border border-border rounded-lg p-3 mb-4 text-primaryText bg-background"
            maxLength={50}
          />

          <Text className="text-secondaryText mb-3">Color</Text>
          <ColorPicker
            selectedColor={selectedColor}
            onColorSelect={setSelectedColor}
            usedColors={usedColors}
          />

          <View className="flex-row gap-3 mt-6">
            <Pressable
              onPress={handleClose}
              className="flex-1 py-3 px-4 border border-border rounded-lg"
            >
              <Text className="text-center text-secondaryText">Cancel</Text>
            </Pressable>

            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              className="flex-1 py-3 px-4 bg-accent rounded-lg"
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