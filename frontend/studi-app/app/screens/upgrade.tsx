import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TriggerType } from '../../services/ConversionTriggerManager';
import { LinearGradient } from 'expo-linear-gradient';

// Define premium features to display
const PREMIUM_FEATURES = [
  {
    title: 'Full study history',
    description: '',
  },
  {
    title: 'Performance metrics',
    description: 'to measure learning performance',
  },
  {
    title: 'Detailed Timeline',
    description: 'to visualize exactly when you study',
  },
  {
    title: 'Monthly Insights',
    description: 'to track semester progress',
  },
];

// Dynamic messaging based on trigger
const getTriggerMessage = (trigger?: string): { title: string; subtitle: string } => {
  switch (trigger) {
    case TriggerType.FIRST_SESSION_COMPLETE:
      return {
        title: 'Level Up Your Study Habits',
        subtitle: 'Get the insights top students use to stay focused, track progress, and crush their semester.',
      };
    case TriggerType.THREE_SESSIONS_COMPLETE:
      return {
        title: 'Level Up Your Study Habits',
        subtitle: 'Get the insights top students use to stay focused, track progress, and crush their semester.',
      };
    case TriggerType.DAY_7_NON_CONVERTER:
      return {
        title: 'Level Up Your Study Habits',
        subtitle: 'Get the insights top students use to stay focused, track progress, and crush their semester.',
      };
    case TriggerType.UPGRADE_BUTTON_CLICK:
    default:
      return {
        title: 'Level Up Your Study Habits',
        subtitle: 'Get the insights top students use to stay focused, track progress, and crush their semester.',
      };
  }
};

export default function UpgradeScreen() {
  const { trigger } = useLocalSearchParams<{ trigger?: string }>();
  const message = getTriggerMessage(trigger);

  const handleDismiss = () => {
    router.back();
  };

  const handleUpgrade = () => {
    // TODO: Implement actual upgrade flow (payment integration)
    console.log('Initiating upgrade flow...');
    // For now, just dismiss
    router.back();
  };

  return (
    <LinearGradient
      colors={['#8B5CF6', '#6366F1']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1">
        {/* Header with close button */}
        <View className="flex-row justify-end p-4">
          <TouchableOpacity
            onPress={handleDismiss}
            className="w-10 h-10 rounded-full bg-black/20 items-center justify-center"
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <View className="px-6 pb-8 pt-8">
            <Text className="text-4xl font-bold text-white text-center mb-4">
              {message.title}
            </Text>
            <Text className="text-lg text-white/90 text-center mb-12">
              {message.subtitle}
            </Text>
          </View>

          {/* Features Box */}
          <View className="px-6">
            <View
              style={{
                backgroundColor: 'transparent',
                borderRadius: 24,
                padding: 24,
              }}
            >
              {PREMIUM_FEATURES.map((feature, index) => (
                <View
                  key={index}
                  className="flex-row items-start mb-6"
                  style={{ marginBottom: index === PREMIUM_FEATURES.length - 1 ? 0 : 24 }}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: '#4ADE80',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 16,
                    }}
                  >
                    <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-white mb-1">
                      {feature.title}
                      {feature.description && (
                        <Text className="font-normal text-white/80">
                          {' '}{feature.description}
                        </Text>
                      )}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Fixed Bottom CTA */}
        <View className="absolute bottom-0 left-0 right-0" style={{ paddingBottom: 40 }}>
          <View className="px-6 py-6">
            <TouchableOpacity
              onPress={handleUpgrade}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                paddingVertical: 16,
                paddingHorizontal: 24,
                marginBottom: 12,
              }}
            >
              <Text style={{
                color: '#000000',
                textAlign: 'center',
                fontSize: 18,
                fontWeight: '600',
              }}>
                Start Free Trial
              </Text>
            </TouchableOpacity>

            <Text className="text-center text-white/80 text-base">
              Then $4.99 billed monthly
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}