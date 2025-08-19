import React, { useContext, useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Category } from '../../utils/studySession';
import { StudySessionContext } from '../../context/StudySessionContext';
import EditCategoryModal from './EditCategoryModal';
import AddCategoryModal from './AddCategoryModal';

export default function CategoryList() {
    const { categories, refreshCategories } = useContext(StudySessionContext);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

    // Fetch categories when the component mounts if not already loaded
    useEffect(() => {
        if (categories.length === 0) {
            console.log("CategoryList: No categories loaded, fetching...");
            refreshCategories();
        }
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

    const usedColors = categories.map((cat) => cat.color);

    /** Row component */
    const Row = ({ onPress, children, isLast = false }: { onPress: () => void; children: React.ReactNode; isLast?: boolean }) => (
        <Pressable onPress={onPress} className={`border-b ${isLast ? '' : 'border-border'}`}>
            {({ pressed }) => (
                <View className={`flex-row items-center px-4 py-4 ${pressed ? 'bg-surface' : 'bg-transparent'}`}>
                    {children}
                </View>
            )}
        </Pressable>
    );

    return (
        <View className="flex-1">
            {/* Add Category Row */}
            <Row onPress={handleAddPress} isLast={categories.length === 0}>
                <Ionicons name="add" size={24} color="rgb(var(--color-accent))" style={{ marginRight: 12 }} />
                <Text className="text-primaryText font-medium flex-1">
                    Add New Category ({categories.length}/5)
                </Text>
            </Row>

            {/* Existing Categories */}
            {categories.length > 0 && (
                <ScrollView className="flex-1">
                    {categories.map((category, idx) => (
                        <Row
                            key={category.id}
                            onPress={() => handleCategoryPress(category)}
                            isLast={idx === categories.length - 1}
                        >
                            <View
                                className="w-6 h-6 rounded-full mr-3"
                                style={{ backgroundColor: category.color }}
                            />
                            <Text className="text-primaryText flex-1">{category.name}</Text>
                            <Text className="text-secondaryText">Tap to edit</Text>
                        </Row>
                    ))}
                </ScrollView>
            )}

            {/* Modals */}
            <AddCategoryModal
                visible={addModalVisible}
                onClose={() => setAddModalVisible(false)}
                onCategoryAdded={refreshCategories}
                usedColors={usedColors}
            />

            {selectedCategory && (
                <EditCategoryModal
                    visible={editModalVisible}
                    onClose={() => setEditModalVisible(false)}
                    category={selectedCategory}
                    onCategoryUpdated={refreshCategories}
                    usedColors={usedColors}
                />
            )}
        </View>
    );
}


