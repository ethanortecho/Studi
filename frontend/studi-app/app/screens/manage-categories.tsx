import React, { useContext, useEffect } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import CategoryList from '../../components/category-management/CategoryList';
import { StudySessionContext } from '../../context/StudySessionContext';

export default function ManageCategoriesScreen() {
    const params = useLocalSearchParams<{ setup?: string }>();
    const isFirstTimeSetup = params.setup === 'true';
    const { categories } = useContext(StudySessionContext);

    useEffect(() => {
        // If this is first-time setup and user creates at least one category,
        // they can proceed to home
        if (isFirstTimeSetup && categories.length > 0) {
            console.log('✅ ManageCategories: First category created, proceeding to home');
            router.replace('/(tabs)/home');
        }
    }, [categories.length, isFirstTimeSetup]);

    return (
        <SafeAreaView className="flex-1 bg-background">
            {/* Header */}
            <View className="px-4 pt-4 pb-3 bg-background">
                <Text className="text-2xl font-bold text-primaryText">
                    {isFirstTimeSetup ? 'Set Up Your Categories' : 'Manage Categories'}
                </Text>
                {isFirstTimeSetup && (
                    <Text className="text-sm text-secondaryText mt-1">
                        Create at least one category to track your study sessions
                    </Text>
                )}
            </View>
            {/* Divider */}
            <View className="border-b border-border" />

            {/* Category List */}
            <CategoryList />
        </SafeAreaView>
    );
}
