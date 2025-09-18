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
    icon: 'calendar-outline',
    title: 'Unlimited History',
    description: 'Access all your study data, no 14-day limit',
  },
  {
    icon: 'bar-chart-outline',
    title: 'Advanced Analytics',
    description: 'Monthly insights, flow scores & productivity metrics',
  },
  {
    icon: 'map-outline',
    title: 'Session Maps',
    description: 'Visualize when and how you study best',
  },
  {
    icon: 'trending-up-outline',
    title: 'Goal Tracking',
    description: 'Set and track weekly study goals',
  },
];

// Dynamic messaging based on trigger
const getTriggerMessage = (trigger?: string): { title: string; subtitle: string } => {
  switch (trigger) {
    case TriggerType.FIRST_SESSION_COMPLETE:
      return {
        title: 'Great First Session!',
        subtitle: 'Unlock premium features to track your progress and build lasting study habits',
      };
    case TriggerType.THREE_SESSIONS_COMPLETE:
      return {
        title: "You're Building Momentum!",
        subtitle: 'Upgrade to premium to see detailed insights about your study patterns',
      };
    case TriggerType.DAY_7_NON_CONVERTER:
      return {
        title: 'Level Up Your Studies',
        subtitle: "You've been studying for a week! Get premium to unlock your full potential",
      };
    case TriggerType.UPGRADE_BUTTON_CLICK:
    default:
      return {
        title: 'Upgrade to Premium',
        subtitle: 'Unlock powerful features to enhance your study experience',
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
    <SafeAreaView className="flex-1 bg-background">
      {/* Header with close button */}
      <View className="flex-row justify-end p-4">
        <TouchableOpacity
          onPress={handleDismiss}
          className="w-10 h-10 rounded-full bg-surface items-center justify-center"
        >
          <Ionicons name="close" size={24} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View className="px-6 pb-8">
          <LinearGradient
            colors={['#8B5CF6', '#6366F1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: 'center',
              marginBottom: 24,
            }}
          >
            <Ionicons name="diamond" size={40} color="#FFFFFF" />
          </LinearGradient>

          <Text className="text-3xl font-bold text-primaryText text-center mb-3">
            {message.title}
          </Text>
          <Text className="text-base text-secondaryText text-center mb-8">
            {message.subtitle}
          </Text>
        </View>

        {/* Features List */}
        <View className="px-6">
          <Text className="text-lg font-semibold text-primaryText mb-4">
            What's Included
          </Text>

          {PREMIUM_FEATURES.map((feature, index) => (
            <View
              key={index}
              className="flex-row items-start mb-4 p-4 bg-surface rounded-xl"
            >
              <View className="w-10 h-10 rounded-full bg-accent/10 items-center justify-center mr-4">
                <Ionicons
                  name={feature.icon as any}
                  size={20}
                  color="#8B5CF6"
                />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-primaryText mb-1">
                  {feature.title}
                </Text>
                <Text className="text-sm text-secondaryText">
                  {feature.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Pricing Section */}
        <View className="px-6 mt-8">
          <View className="bg-surface rounded-2xl p-6 border border-accent/20">
            <Text className="text-center text-sm text-secondaryText mb-2">
              Monthly Plan
            </Text>
            <View className="flex-row items-end justify-center mb-2">
              <Text className="text-4xl font-bold text-primaryText">$4.99</Text>
              <Text className="text-lg text-secondaryText ml-1 mb-1">/month</Text>
            </View>
            <Text className="text-center text-xs text-secondaryText">
              Cancel anytime
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom CTA */}
      <View className="absolute bottom-0 left-0 right-0 bg-background border-t border-surface">
        <View className="px-6 py-4">
          <TouchableOpacity
            onPress={handleUpgrade}
            className="bg-accent rounded-full py-4 px-6"
            style={{
              shadowColor: '#8B5CF6',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Text className="text-white text-center font-semibold text-lg">
              Start Free Trial
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleDismiss} className="mt-3">
            <Text className="text-center text-secondaryText text-sm">
              Maybe Later
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}