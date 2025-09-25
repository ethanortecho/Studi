import React, { useContext } from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import CategoryList from '../../components/category-management/CategoryList';
import { StudySessionContext } from '../../context/StudySessionContext';

export default function ManageCategoriesScreen() {
    const params = useLocalSearchParams<{ setup?: string }>();
    const isFirstTimeSetup = params.setup === 'true';
    const { categories } = useContext(StudySessionContext);

    const handleDone = () => {
        if (isFirstTimeSetup) {
            // Navigate to home after setup
            router.replace('/(tabs)/home');
        } else {
            // Go back to previous screen (likely settings)
            router.back();
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-background">
            {/* Header */}
            <View className="items-center px-4 pt-4 mb-3 bg-background">
                <Text className="text-2xl font-bold text-primaryText">
                    {isFirstTimeSetup ? 'Set Up Your Categories' : 'Manage Categories'}
                </Text>
                {isFirstTimeSetup && (
                    <Text className="text-sm text-secondaryText mt-1">
                        Create at least one category to track your study sessions
                    </Text>
                )}
            </View>

            {/* Category List */}
            <View className="flex-1">
                <CategoryList />
            </View>

            {/* Done Button */}
            <View className="px-4 pb-4 pt-2">
                <Pressable
                    onPress={handleDone}
                    className="bg-accent rounded-lg py-3 px-6"
                >
                    <Text className="text-center text-white font-semibold">
                        Done
                    </Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}
