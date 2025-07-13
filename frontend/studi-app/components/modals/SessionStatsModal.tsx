import React, { useState } from 'react';
import { Modal, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

interface SessionStatsModalProps {
  visible: boolean;
  sessionDuration: number; // in minutes
  onDismiss: () => void;
  onRatingSubmit: (rating: number) => Promise<void>;
}

export default function SessionStatsModal({ 
  visible, 
  sessionDuration, 
  onDismiss,
  onRatingSubmit
}: SessionStatsModalProps) {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Rating options with emoji and text
  const ratingOptions = [
    { value: 1, emoji: '😞', text: 'Poor' },
    { value: 2, emoji: '😐', text: 'Fair' },
    { value: 3, emoji: '🙂', text: 'Good' },
    { value: 4, emoji: '😊', text: 'Great' },
    { value: 5, emoji: '🤩', text: 'Excellent' },
  ];
  
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

  const handleRatingSelect = async (rating: number) => {
    if (isSubmitting) return;
    
    setSelectedRating(rating);
    setIsSubmitting(true);
    
    try {
      await onRatingSubmit(rating);
      setIsSubmitted(true);
      // Auto-dismiss after brief delay to show success
      setTimeout(() => {
        handleDismiss();
      }, 1000);
    } catch (error) {
      console.error('Failed to submit rating:', error);
      setIsSubmitting(false);
      // Reset to allow retry
      setSelectedRating(null);
    }
  };

  const handleDismiss = () => {
    // Reset state for next time
    setSelectedRating(null);
    setIsSubmitting(false);
    setIsSubmitted(false);
    onDismiss(); // Close the modal first
    router.replace('/(tabs)/home'); // Then navigate to home
  };
  
  const canDismiss = isSubmitted;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <Pressable 
        className="flex-1 bg-black/50 justify-center items-center px-6"
        onPress={canDismiss ? handleDismiss : undefined}
      >
        <Pressable 
          className="bg-white rounded-3xl p-8 w-full max-w-sm"
          onPress={() => {}} // Prevent dismiss when tapping modal content
        >
          <View className="items-center">
            {/* Completion Icon */}
            <View className="w-16 h-16 bg-green-100 rounded-full items-center justify-center mb-4">
              <Text className="text-3xl">{isSubmitted ? '✓' : '🎯'}</Text>
            </View>
            
            {/* Title */}
            <Text className="text-xl font-bold text-gray-900 mb-4">
              {isSubmitted ? 'Thanks for your feedback!' : 'Session Complete!'}
            </Text>
            
            {/* Rating Section */}
            {!isSubmitted && (
              <View className="mb-6 w-full">
                <Text className="text-lg text-gray-700 mb-4 text-center font-medium">
                  Rate your productivity:
                </Text>
                
                <View className="flex-row justify-between px-2">
                  {ratingOptions.map((option) => {
                    const isSelected = selectedRating === option.value;
                    const isCurrentlySubmitting = isSubmitting && isSelected;
                    
                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => handleRatingSelect(option.value)}
                        disabled={isSubmitting}
                        className={`items-center p-3 rounded-2xl border-2 min-w-[60px] ${
                          isSelected 
                            ? 'bg-purple-600 border-purple-600' 
                            : 'border-gray-300 bg-gray-50'
                        } ${isSubmitting ? 'opacity-70' : ''}`}
                      >
                        <Text className="text-2xl mb-1">{option.emoji}</Text>
                        <Text className={`text-xs font-medium ${
                          isSelected ? 'text-white' : 'text-gray-600'
                        }`}>
                          {option.text}
                        </Text>
                        {isCurrentlySubmitting && (
                          <Text className="text-xs text-white mt-1">...</Text>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
            
            {/* Duration - shown after rating submission */}
            {isSubmitted && (
              <Text className="text-lg text-gray-600 mb-6 text-center">
                You studied for{' '}
                <Text className="font-semibold text-purple-600">
                  {formatDuration(sessionDuration)}
                </Text>
              </Text>
            )}
            
            {/* Instructions */}
            <Text className="text-sm text-gray-400 text-center">
              {isSubmitted 
                ? 'Tap anywhere to continue' 
                : 'Select a rating above to continue'
              }
            </Text>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
} 