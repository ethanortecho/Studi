import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface CollapsibleProps {
    title: string;
    children: React.ReactNode;
}

export function Collapsible({ title, children }: CollapsibleProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <ThemedView style={styles.container}>
            <TouchableOpacity onPress={() => setIsOpen(!isOpen)}>
                <View style={styles.header}>
                    <ThemedText style={styles.title}>{title}</ThemedText>
                    <ThemedText>{isOpen ? '▼' : '▶'}</ThemedText>
                </View>
            </TouchableOpacity>
            {isOpen && (
                <View style={styles.content}>
                    {children}
                </View>
            )}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 8,
        borderRadius: 8,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    content: {
        padding: 16,
    },
}); 