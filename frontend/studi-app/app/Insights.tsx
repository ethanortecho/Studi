import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ReactNode } from 'react';
import { ThemedView } from '@/components/ThemedView';

const Insights = ({ children }: { children: ReactNode }) => {
    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View className="p-4">
                <Text className="text-2xl font-bold text-gray-800">Your Insights</Text>
            </View>
            <ThemedView style={{ flex: 1 }}>
                {children}
            </ThemedView>
        </SafeAreaView>
    )
}

export default Insights


  