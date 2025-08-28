import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CategoryList from '../../components/category-management/CategoryList';

export default function ManageCategoriesScreen() {
    return (
        <SafeAreaView className="flex-1 bg-background">
            {/* Header */}
            <View className="px-4 pt-4 pb-3 bg-background">
                <Text className="text-2xl font-bold text-primaryText">Manage Categories</Text>
            </View>
            {/* Divider */}
            <View className="border-b border-border" />

            {/* Category List */}
            <CategoryList />
        </SafeAreaView>
    );
}
