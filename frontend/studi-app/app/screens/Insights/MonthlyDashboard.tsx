import React from 'react';
import { ThemedText } from '../../../components/ThemedText';
import { ThemedView } from '../../../components/ThemedView';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Colors } from '@/constants/Colors';
import DebugDataViewer from '@/components/analytics/DebugDataViewer';

export default function MonthlyDashboard() {
    // Placeholder for when data is available
    const placeholderData = {
        message: "Monthly dashboard is under construction. Real data will be displayed here when available."
    };
    
    return (
        <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.container}>
                <ThemedView style={styles.messageContainer}>
                    <ThemedText style={styles.messageText}>Monthly Dashboard - Under Construction</ThemedText>
                </ThemedView>
                
                {/* Debug Data Viewer */}
                <View style={styles.debugContainer}>
                    <DebugDataViewer 
                        data={placeholderData} 
                        label="Monthly Dashboard Placeholder" 
                    />
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 30,
    },
    container: {
        flex: 1,
        padding: 16,
    },
    messageContainer: {
        backgroundColor: Colors.light.surface,
        padding: 20,
        borderRadius: 8,
        marginBottom: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    messageText: {
        fontSize: 16,
        fontWeight: '500',
    },
    debugContainer: {
        marginTop: 10,
        marginBottom: 20,
        width: '100%',
    }
});