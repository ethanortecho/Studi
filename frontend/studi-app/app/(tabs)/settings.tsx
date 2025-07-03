import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  /** Helper to render a single settings row */
  const Row = ({
    label,
    icon,
    onPress,
    isLast = false,
  }: {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    isLast?: boolean;
  }) => (
    <Pressable
      onPress={onPress}
      className={`border-b border-[#34364A] ${isLast ? '' : ''}`}
    >
      {({ pressed }) => (
        <View
          className={`flex-row items-center px-4 py-4 ${pressed ? 'bg-surface' : 'bg-transparent'}`}
        >
          {/* Left icon */}
          <Ionicons name={icon} size={22} color="#FFFFFF" style={{ marginRight: 14 }} />

          {/* Label */}
          <Text className="flex-1 text-primaryText text-base font-semibold">
            {label}
          </Text>

          {/* Chevron */}
          <Ionicons
            name="chevron-forward"
            size={22}
            color="#9BA1A6"
          />
        </View>
      )}
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="items-center px-4 pt-4 mb-3 bg-background">
        <Text className="text-2xl font-bold text-primaryText">Settings</Text>

        {/* Accent underline */}
      </View>

      {/* Options */}
      <View className="flex-col mt-2">
        <Row
          label="Manage Categories"
          icon="pricetag"
          onPress={() => router.push('/screens/manage-categories' as any)}
        />
        <Row
          label="Manage Study Goal"
          icon="calendar"
          onPress={() => router.push('/screens/set-weekly-goal?edit=1' as any)}
          isLast
        />
      </View>
    </SafeAreaView>
  );
} 