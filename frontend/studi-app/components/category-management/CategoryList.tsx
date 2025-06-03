import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Category, fetchCategories } from '@/utils/studySession';
import EditCategoryModal from './EditCategoryModal';
import AddCategoryModal from './AddCategoryModal';

export default function CategoryList() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    
    const loadCategories = () => {
        fetchCategories().then(setCategories);
    };

    useEffect(() => {
        loadCategories();
    }, []);

    const handleCategoryPress = (category: Category) => {
        setSelectedCategory(category);
        setEditModalVisible(true);
    };

    const handleAddPress = () => {
        if (categories.length >= 5) {
            alert('Maximum of 5 categories allowed');
            return;
        }
        setAddModalVisible(true);
    };

    const usedColors = categories.map(cat => cat.color);

    return (
        <View className="flex-1 p-4">
            <Pressable 
                onPress={handleAddPress}
                className="bg-green-500 py-3 px-4 rounded-lg mb-4"
            >
                <Text className="text-white font-medium text-center">
                    Add New Category ({categories.length}/5)
                </Text>
            </Pressable>

            <ScrollView className="flex-1">
                {categories.length === 0 ? (
                    <View className="flex-1 justify-center items-center py-8">
                        <Text className="text-gray-500 text-center">
                            No categories yet.{'\n'}Tap "Add New Category" to create your first one.
                        </Text>
                    </View>
                ) : (
                    categories.map((category) => (
                        <Pressable 
                            key={category.id}
                            onPress={() => handleCategoryPress(category)}
                            className="flex-row items-center p-4 bg-white rounded-lg mb-3 border border-gray-200"
                        >
                            <View 
                                className="w-6 h-6 rounded-full mr-3"
                                style={{ backgroundColor: category.color }}
                            />
                            <Text className="text-lg font-medium flex-1">{category.name}</Text>
                            <Text className="text-gray-400">Tap to edit</Text>
                        </Pressable>
                    ))
                )}
            </ScrollView>
            
            <AddCategoryModal 
                visible={addModalVisible}
                onClose={() => setAddModalVisible(false)}
                onCategoryAdded={loadCategories}
                usedColors={usedColors}
            />

            {selectedCategory && (
                <EditCategoryModal 
                    visible={editModalVisible}
                    onClose={() => setEditModalVisible(false)}
                    category={selectedCategory}
                    onCategoryUpdated={loadCategories}
                    usedColors={usedColors}
                />
            )}
        </View>
    );
}


