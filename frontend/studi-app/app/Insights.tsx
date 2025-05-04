import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';import {SafeAreaView} from 'react-native-safe-area-context';
import { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { dashboardStyles as styles } from '@/styles/dashboard';


const Insights = ({ children }: { children: ReactNode }) => {
    return (
        <SafeAreaView style = {{ flex: 1}}>
            <ThemedView style={{ padding: 16}}>
                <ThemedText style = {{ fontSize: 24, fontWeight: 'bold'}}>Your Insights</ThemedText>
            </ThemedView>
            <ThemedView style = {{flex: 1}}>
                {children}
            </ThemedView>
        </SafeAreaView>
    )
}
export default Insights


  