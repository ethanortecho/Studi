import React from 'react';
import { View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { ThemedView } from '../ThemedView';
import { dashboardStyles as styles } from '@/styles/dashboard';

interface LegendProps {
    category_durations: { [key: string]: number };
    category_metadata: { [key: string]: { name: string; color: string } };
}

export default function Legend({ category_durations, category_metadata }: LegendProps) {
    return (
        <ThemedView style={[styles.section, { backgroundColor: Colors.light.surface }]}>
            <ThemedText style={styles.title}>
                Your Colors
            </ThemedText>
            {Object.entries(category_metadata).map(([id, { name, color }]) => {
                if (category_durations?.[name]) {
                    return (
                        <ThemedView key={id} style={[styles.legendItem, { backgroundColor: Colors.light.surface }]}>
                            <ThemedView
                                style={[
                                    styles.legendColor,
                                    { backgroundColor: color }
                                ]}
                            />
                            <ThemedText style={[styles.legendText, { backgroundColor: Colors.light.surface }]}>{name}</ThemedText>
                        </ThemedView>
                    );
                }
                return null;
            })}
        </ThemedView>
    );
}





  

