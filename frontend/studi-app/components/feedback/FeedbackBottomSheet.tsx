import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { getFeedbackTypes, submitFeedback, FeedbackType } from '../../utils/feedbackApi';

interface FeedbackBottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
}

export const FeedbackBottomSheet: React.FC<FeedbackBottomSheetProps> = ({
  isVisible,
  onClose,
}) => {
  const { user } = useAuth();
  const [feedbackTypes, setFeedbackTypes] = useState<FeedbackType[]>([]);
  const [selectedType, setSelectedType] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showTypePicker, setShowTypePicker] = useState<boolean>(false);

  // Load feedback types and user email on mount
  useEffect(() => {
    if (isVisible) {
      loadFeedbackTypes();
      if (user?.email) {
        setUserEmail(user.email);
      }
    }
  }, [isVisible, user]);

  const loadFeedbackTypes = async () => {
    try {
      const types = await getFeedbackTypes();
      setFeedbackTypes(types);
      if (types.length > 0 && !selectedType) {
        setSelectedType(types[0].value);
      }
    } catch (error) {
      console.error('Failed to load feedback types:', error);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!selectedType) {
      Alert.alert('Error', 'Please select a feedback type.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter your feedback description.');
      return;
    }

    if (!userEmail.trim()) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail.trim())) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitFeedback(selectedType, description, userEmail);

      if (result.success) {
        Alert.alert(
          'Feedback Sent',
          'Thank you for your feedback! We\'ll review it and get back to you if needed.',
          [{ text: 'OK', onPress: handleClose }]
        );
      } else {
        Alert.alert(
          'Error',
          result.error || 'Failed to submit feedback. Please try again.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Retry', onPress: handleSubmit },
          ]
        );
      }
    } catch (error) {
      Alert.alert(
        'Network Error',
        'Unable to submit feedback. Please check your connection and try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: handleSubmit },
        ]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setSelectedType(feedbackTypes[0]?.value || '');
    setDescription('');
    setUserEmail(user?.email || '');
    setShowTypePicker(false);
    onClose();
  };

  const selectedTypeLabel = feedbackTypes.find(type => type.value === selectedType)?.label || selectedType;

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="flex-1 bg-background">
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-[#34364A]">
            <Pressable onPress={handleClose}>
              <Text className="text-blue-500 font-semibold">Cancel</Text>
            </Pressable>

            <Text className="text-lg font-bold text-primaryText">Send Feedback</Text>

            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting}
              className={`${isSubmitting ? 'opacity-50' : ''}`}
            >
              <Text className="text-blue-500 font-semibold">
                {isSubmitting ? 'Sending...' : 'Send'}
              </Text>
            </Pressable>
          </View>

          <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
            {/* Feedback Type Picker */}
            <View className="mb-6">
              <Text className="text-primaryText font-semibold mb-2">Feedback Type</Text>
              <Pressable
                onPress={() => setShowTypePicker(!showTypePicker)}
                className="bg-surface border border-[#34364A] rounded-lg px-4 py-3 flex-row items-center justify-between"
              >
                <Text className="text-primaryText">{selectedTypeLabel}</Text>
                <Ionicons
                  name={showTypePicker ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#9BA1A6"
                />
              </Pressable>

              {showTypePicker && (
                <View className="mt-2 bg-surface border border-[#34364A] rounded-lg overflow-hidden">
                  {feedbackTypes.map((type) => (
                    <Pressable
                      key={type.value}
                      onPress={() => {
                        setSelectedType(type.value);
                        setShowTypePicker(false);
                      }}
                      className="px-4 py-3 border-b border-[#34364A] last:border-b-0"
                    >
                      <Text
                        className={`${selectedType === type.value ? 'text-blue-500 font-semibold' : 'text-primaryText'}`}
                      >
                        {type.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Description */}
            <View className="mb-6">
              <Text className="text-primaryText font-semibold mb-2">Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Tell us about your bug report, feature request, or general feedback..."
                placeholderTextColor="#9BA1A6"
                multiline
                numberOfLines={6}
                className="bg-surface border border-[#34364A] rounded-lg px-4 py-3 text-primaryText min-h-[120px] text-base"
                style={{ textAlignVertical: 'top' }}
              />
            </View>

            {/* Email */}
            <View className="mb-6">
              <Text className="text-primaryText font-semibold mb-2">Email (for follow-up)</Text>
              <TextInput
                value={userEmail}
                onChangeText={setUserEmail}
                placeholder="your.email@example.com"
                placeholderTextColor="#9BA1A6"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                className="bg-surface border border-[#34364A] rounded-lg px-4 py-3 text-primaryText text-base"
              />
            </View>

            {/* Info Text */}
            <View className="bg-surface border border-[#34364A] rounded-lg p-4">
              <View className="flex-row items-start">
                <Ionicons name="information-circle" size={20} color="#60A5FA" className="mt-0.5 mr-3" />
                <View className="flex-1">
                  <Text className="text-gray-300 text-sm leading-5">
                    Your feedback helps us improve the app. We'll include basic device info
                    (platform, app version) to help us troubleshoot any issues.
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};