import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, Modal, Alert } from 'react-native';
import ColorPicker from './ColorPicker';
import { Category, updateCategory, deleteCategory } from '../../utils/studySession';

interface EditCategoryModalProps {
    visible: boolean;
    onClose: () => void;
    category: Category;
    onCategoryUpdated: () => void;
    usedColors: string[];
}

export default function EditCategoryModal({ 
    visible, 
    onClose, 
    category, 
    onCategoryUpdated, 
    usedColors 
}: EditCategoryModalProps) {
    const [name, setName] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (category) {
            setName(category.name);
            setSelectedColor(category.color);
        }
    }, [category]);

    const handleUpdate = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter a category name');
            return;
        }

        setLoading(true);
        try {
            await updateCategory(category.id, name.trim(), selectedColor);
            onCategoryUpdated();
            onClose();
        } catch (error) {
            Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update category');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Category',
            `Are you sure you want to delete "${category.name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await deleteCategory(category.id);
                            onCategoryUpdated();
                            onClose();
                        } catch (error) {
                            Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete category');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const availableColors = usedColors.filter(color => color !== category.color);

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View className="flex-1 bg-black/50 justify-center items-center p-4">
                <View className="bg-white rounded-lg p-6 w-full max-w-sm">
                    <Text className="text-xl font-bold mb-4">Edit Category</Text>
                    
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
                        usedColors={availableColors}
                    />
                    
                    <View className="gap-3 mt-6">
                        <View className="flex-row gap-3">
                            <Pressable
                                onPress={onClose}
                                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg"
                            >
                                <Text className="text-center text-gray-700">Cancel</Text>
                            </Pressable>
                            
                            <Pressable
                                onPress={handleUpdate}
                                disabled={loading}
                                className="flex-1 py-3 px-4 bg-blue-500 rounded-lg"
                            >
                                <Text className="text-center text-white">
                                    {loading ? 'Updating...' : 'Update'}
                                </Text>
                            </Pressable>
                        </View>
                        
                        <Pressable
                            onPress={handleDelete}
                            disabled={loading}
                            className="py-3 px-4 bg-red-500 rounded-lg"
                        >
                            <Text className="text-center text-white">Delete Category</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}