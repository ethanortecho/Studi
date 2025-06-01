import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ReactNode } from 'react';
import { ThemedView } from '@/components/ThemedView';

const Insights = ({ children }: { children: ReactNode }) => {
    return (
        <SafeAreaView style={{ flex: 1 }}className="bg-primary">
            <View className="pt-20 pb-8 pl-5">
                <Text className="text-5xl font-bold text-white">Your insights</Text>
            </View>
            <ThemedView style={{ flex: 1 }}>
                {children}
            </ThemedView>
        </SafeAreaView>
    )
}

export default Insights


  