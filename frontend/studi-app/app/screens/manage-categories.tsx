import React from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CategoryList from '@/components/category-management/CategoryList';

export default function ManageCategoriesScreen() {
    return (
        <SafeAreaView className="flex-1">
            <View className="p-4">
                <Text className="text-2xl font-bold text-gray-800">Manage Categories</Text>
            </View>
            <CategoryList />
        </SafeAreaView>
    );
}
