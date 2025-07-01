import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function SettingsScreen() {
  /** Helper to render a single row */
  const Row = ({ label, onPress, isLast = false }: { label: string; onPress: () => void; isLast?: boolean }) => (
    <Pressable onPress={onPress} className={`border-b ${isLast ? '' : 'border-border'}`}>
      {({ pressed }) => (
        <View className={`px-4 py-4 ${pressed ? 'bg-surface' : 'bg-transparent'}`}>
          <Text className="text-primaryText font-medium">{label}</Text>
        </View>
      )}
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-4 pt-4 pb-3 bg-background">
        <Text className="text-2xl font-bold text-primaryText">Settings</Text>
      </View>
      {/* Divider under header */}
      <View className="border-b border-border" />

      {/* Options */}
      <View className="flex-col">
        <Row label="Manage Categories" onPress={() => router.push('/screens/manage-categories' as any)} />
        <Row label="Manage Study Goal" onPress={() => router.push('/screens/set-weekly-goal?edit=1' as any)} isLast />
      </View>
    </SafeAreaView>
  );
} 