import React, { useState } from 'react';
import { Modal, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { formatDurationFromMinutes } from '../../utils/timeFormatting';

interface SessionStatsModalProps {
  visible: boolean;
  sessionDuration: number; // in minutes
  onDismiss: () => void;
  onRatingSubmit: (rating: number) => Promise<any>;
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
  const [flowScore, setFlowScore] = useState<number | null>(null);
  const [coachingMessage, setCoachingMessage] = useState<string | null>(null);

  // Rating options - just numbers
  const ratingOptions = [1, 2, 3, 4, 5];
  

  const handleRatingSelect = async (rating: number) => {
    if (isSubmitting) return;
    
    setSelectedRating(rating);
    setIsSubmitting(true);
    
    try {
      const response = await onRatingSubmit(rating);
      
      // Extract flow score from response if available
      if (response?.flow_score !== undefined) {
        setFlowScore(response.flow_score);
      }
      
      // Extract coaching message if available (might be in flow_components)
      if (response?.flow_components?.coaching_message) {
        setCoachingMessage(response.flow_components.coaching_message);
      }
      
      setIsSubmitted(true);
      // Modal stays open - user must tap to dismiss
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
    setFlowScore(null);
    setCoachingMessage(null);
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
        className="flex-1 justify-center items-center px-6"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
        onPress={canDismiss ? handleDismiss : undefined}
      >
        <Pressable 
          className="rounded-3xl p-8 w-full max-w-sm"
          style={{ 
            backgroundColor: 'rgba(33, 32, 48, 0.9)',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(20px)',
          }}
          onPress={() => {}} // Prevent dismiss when tapping modal content
        >
          <View className="items-center">
            {/* Completion Icon - Glassmorphic */}
            <View 
              className="w-16 h-16 rounded-full items-center justify-center mb-4"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.15)',
              }}
            >
              <Text className="text-3xl">{isSubmitted ? '✓' : '🎯'}</Text>
            </View>
            
            {/* Title */}
            <Text className="text-xl font-bold text-white mb-4">
              {isSubmitted ? 'Rating saved!' : 'Session Complete!'}
            </Text>
            
            {/* Rating Section */}
            {!isSubmitted && (
              <View className="mb-6 w-full">
                <Text className="text-lg text-white/80 mb-4 text-center font-medium">
                  Rate your focus:
                </Text>
                
                <View>
                  {/* Number scale */}
                  <View className="flex-row justify-between px-4 mb-2">
                    {ratingOptions.map((rating) => {
                      const isSelected = selectedRating === rating;
                      const isCurrentlySubmitting = isSubmitting && isSelected;
                      
                      return (
                        <Pressable
                          key={rating}
                          onPress={() => handleRatingSelect(rating)}
                          disabled={isSubmitting}
                          className={`items-center justify-center rounded-2xl ${
                            isSubmitting ? 'opacity-70' : ''
                          }`}
                          style={{ 
                            width: 48,
                            height: 48,
                            backgroundColor: isSelected 
                              ? 'rgba(93, 62, 218, 0.3)' 
                              : 'rgba(255, 255, 255, 0.08)',
                            borderWidth: 1,
                            borderColor: isSelected 
                              ? 'rgba(93, 62, 218, 0.5)' 
                              : 'rgba(255, 255, 255, 0.1)',
                          }}
                        >
                          <Text className={`text-xl font-semibold ${
                            isSelected ? 'text-white' : 'text-white/70'
                          }`}>
                            {rating}
                          </Text>
                          {isCurrentlySubmitting && (
                            <Text className="text-xs text-white absolute bottom-1">...</Text>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                  
                  {/* End labels */}
                  <View className="flex-row justify-between px-4">
                    <Text className="text-xs text-white/50">Distracted</Text>
                    <Text className="text-xs text-white/50">Deep Focus</Text>
                  </View>
                </View>
              </View>
            )}
            
            {/* Flow Score and Duration - shown after rating submission */}
            {isSubmitted && (
              <>
                {/* Show flow score if available, or message if session too short */}
                {sessionDuration < 15 ? (
                  <View className="mb-4">
                    <Text className="text-lg text-white/70 text-center px-4 mb-2">
                      Study for 15+ minutes to receive a flow score! 📚
                    </Text>
                    <Text className="text-sm text-white/50 text-center px-4">
                      Longer sessions help us better analyze your study patterns
                    </Text>
                  </View>
                ) : flowScore !== null ? (
                  <View className="mb-4">
                    <Text className="text-2xl text-white font-bold text-center mb-2">
                      Flow Score: {Math.round(flowScore)}
                    </Text>
                    {coachingMessage && (
                      <Text className="text-sm text-white/60 text-center px-4 mb-4">
                        {coachingMessage}
                      </Text>
                    )}
                  </View>
                ) : null}
                
                <Text className="text-lg text-white/70 mb-6 text-center">
                  You studied for{' '}
                  <Text className="font-semibold text-purple-400">
                    {formatDurationFromMinutes(sessionDuration)}
                  </Text>
                </Text>
              </>
            )}
            
            {/* Instructions */}
            <Text className="text-sm text-white/40 text-center">
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