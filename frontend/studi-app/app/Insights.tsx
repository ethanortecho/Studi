import {View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import { ReactNode } from 'react';
import { ThemedText } from '@/components/ThemedText';

const Insights = ({ children }: { children: ReactNode }) => {
    return (
        <SafeAreaView style = {{ flex: 1}}>
            <View style={{ padding: 16}}>
                <ThemedText style = {{ fontSize: 24, fontWeight: 'bold'}}>Your Insights</ThemedText>
            </View>
            <View style = {{flex: 1}}>
                {children}
            </View>
        </SafeAreaView>
    )
}
export default Insights