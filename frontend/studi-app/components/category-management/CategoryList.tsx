import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Pressable } from 'react-native';
import { Category, fetchCategories } from '@/utils/studySession';
import EditCategoryModal from './EditCategoryModal';

export default function CategoryList() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    
    useEffect(() => {
        fetchCategories().then(setCategories);
    }, []);

    return (
        <View>
            {categories.map((category) => (
                <Pressable 
                    key={category.id}
                    onPress={() => {
                        setSelectedCategory(category);
                        setModalVisible(true);
                    }}
                >
                    <Text>{category.name}</Text>
                </Pressable>
            ))}
            
            {selectedCategory && (
                <EditCategoryModal 
                    visible={modalVisible}
                    onClose={() => setModalVisible(false)}
                    category={selectedCategory}
                />
            )}
        </View>
    );
}


