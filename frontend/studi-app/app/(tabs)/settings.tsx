import React from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { resetOnboarding } from '../../utils/onboarding';
import { debugConversionState, resetConversionState } from '../../utils/debugConversion';

export default function SettingsScreen() {
  const { user, logout, togglePremiumStatus, deleteAccount } = useAuth();

  /**
   * EXPLANATION: handleLogout()
   * 
   * When user taps logout:
   * 1. Show confirmation dialog (prevent accidental logout)
   * 2. Call AuthContext.logout() which clears tokens and tells backend
   * 3. User gets automatically redirected to login screen
   */
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              // Navigation to login will happen automatically via AuthGuard
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleViewOnboarding = () => {
    Alert.alert(
      'View Onboarding',
      'This will show the app introduction screens again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'View Onboarding',
          onPress: async () => {
            try {
              await resetOnboarding();
              router.push('/onboarding');
            } catch (error) {
              console.error('Error resetting onboarding:', error);
              Alert.alert('Error', 'Failed to reset onboarding. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleTogglePremium = () => {
    if (__DEV__ && togglePremiumStatus && user) {
      const newStatus = !user.is_premium;
      Alert.alert(
        'Toggle Premium Status',
        `Switch to ${newStatus ? 'Premium' : 'Free'} account for testing?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: `Switch to ${newStatus ? 'Premium' : 'Free'}`,
            onPress: () => {
              togglePremiumStatus();
              Alert.alert('Success', `Account is now ${newStatus ? 'Premium' : 'Free'}`);
            },
          },
        ]
      );
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account?\n\nThis will delete all your study data, categories, goals, and cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
              // Navigation will happen automatically via AuthContext
            } catch (error) {
              console.error('Account deletion error:', error);
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            }
          },
        },
      ]
    );
  };

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
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="items-center px-4 pt-4 mb-3 bg-background">
        <Text className="text-2xl font-bold text-primaryText">Settings</Text>

        {/* User info */}
        {user && (
          <Text className="text-sm text-gray-400 mt-1">
            Logged in as {user.first_name} {user.last_name}
          </Text>
        )}
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
        />
        <Row
          label="View Onboarding"
          icon="help-circle"
          onPress={handleViewOnboarding}
        />
        
        {/* Development only: Premium toggle */}
        {__DEV__ && togglePremiumStatus && user && (
          <Row
            label={`Premium Status: ${user.is_premium ? 'ON' : 'OFF'}`}
            icon={user.is_premium ? "checkmark-circle" : "close-circle"}
            onPress={handleTogglePremium}
          />
        )}

        {/* Development only: Conversion debug tools */}
        {__DEV__ && (
          <>
            <Row
              label="Debug Conversion State"
              icon="bug"
              onPress={async () => {
                await debugConversionState();
                Alert.alert('Debug Info', 'Check console logs for conversion state');
              }}
            />
            <Row
              label="Reset Conversion State"
              icon="refresh"
              onPress={() => {
                Alert.alert(
                  'Reset Conversion State',
                  'This will reset session count and trigger history. Continue?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Reset',
                      style: 'destructive',
                      onPress: async () => {
                        await resetConversionState();
                        Alert.alert('Success', 'Conversion state has been reset');
                      },
                    },
                  ]
                );
              }}
            />
          </>
        )}
        
        {/* Account Actions */}
        <View className="mt-8">
          {/* Delete Account Button - Dangerous action */}
          <Row
            label="Delete Account"
            icon="trash"
            onPress={handleDeleteAccount}
          />
          
          {/* Logout Button */}
          <Row
            label="Logout"
            icon="log-out"
            onPress={handleLogout}
            isLast
          />
        </View>
      </View>
    </SafeAreaView>
  );
} 