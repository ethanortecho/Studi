import React from 'react';
import { Modal, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

interface SessionStatsModalProps {
  visible: boolean;
  sessionDuration: number; // in minutes
  onDismiss: () => void;
}

export default function SessionStatsModal({ 
  visible, 
  sessionDuration, 
  onDismiss 
}: SessionStatsModalProps) {
  
  // Format duration to human readable format
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours} hr`;
    }
    
    return `${hours} hr ${remainingMinutes} min`;
  };

  const handleDismiss = () => {
    onDismiss(); // Close the modal first
    router.replace('/(tabs)/home'); // Then navigate to home
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <Pressable 
        className="flex-1 bg-black/50 justify-center items-center px-6"
        onPress={handleDismiss}
      >
        <Pressable 
          className="bg-white rounded-3xl p-8 w-full max-w-sm"
          onPress={() => {}} // Prevent dismiss when tapping modal content
        >
          <View className="items-center">
            {/* Completion Icon */}
            <View className="w-16 h-16 bg-green-100 rounded-full items-center justify-center mb-4">
              <Text className="text-3xl">✓</Text>
            </View>
            
            {/* Title */}
            <Text className="text-xl font-bold text-gray-900 mb-2">
              Session Complete!
            </Text>
            
            {/* Duration */}
            <Text className="text-lg text-gray-600 mb-6 text-center">
              You studied for{' '}
              <Text className="font-semibold text-category-purple">
                {formatDuration(sessionDuration)}
              </Text>
            </Text>
            
            {/* Dismiss hint */}
            <Text className="text-sm text-gray-400 text-center">
              Tap anywhere to dismiss
            </Text>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
} 