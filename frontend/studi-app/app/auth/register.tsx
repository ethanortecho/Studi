import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../utils/apiClient';

/**
 * REGISTRATION SCREEN EXPLANATION
 * 
 * This screen collects information needed to create a new user account:
 * - Email (for login)
 * - Password (with basic validation)
 * - First & Last Name (for personalization)
 * - Timezone is optional (defaults to UTC in backend)
 * 
 * After successful registration, user is automatically logged in
 * thanks to our backend design.
 */

export default function RegisterScreen() {
  // ==================
  // STATE MANAGEMENT
  // ==================
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  
  // Get register function from our AuthContext
  const { register } = useAuth();

  // ==================
  // FORM HELPERS
  // ==================
  
  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // ==================
  // VALIDATION
  // ==================
  
  /**
   * EXPLANATION: validateForm()
   * 
   * Before sending data to backend, we do basic client-side validation:
   * - Check all required fields are filled
   * - Validate email format
   * - Ensure passwords match
   * - Check password length (backend has more strict validation)
   */
  const validateForm = () => {
    const { email, password, confirmPassword, firstName, lastName } = formData;

    if (!email.trim() || !password.trim() || !firstName.trim() || !lastName.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return false;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return false;
    }

    return true;
  };

  // ==================
  // FORM SUBMISSION
  // ==================
  
  /**
   * EXPLANATION: handleRegister()
   * 
   * This runs when user taps "Create Account":
   * 1. Validate form data
   * 2. Call AuthContext.register() with user data
   * 3. Backend creates account and returns tokens
   * 4. User is automatically logged in
   */
  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const { email, password, firstName, lastName } = formData;
      
      console.log('📝 RegisterScreen: Attempting registration for:', email);
      
      // Call our AuthContext register function
      const result = await register({
        email: email.trim().toLowerCase(),
        password: password,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        // timezone will default to UTC in backend
      });

      if (result.success) {
        console.log('✅ RegisterScreen: Registration successful, checking for goals...');
        // Small delay to ensure AuthContext state is updated
        setTimeout(async () => {
          try {
            // Check if new user needs goal setup
            const response = await apiClient.get<{ has_goals: boolean }>('/goals/has-goals/');
            if (response.data && !response.data.has_goals) {
              console.log('🎯 RegisterScreen: First-time user, redirecting to goal setup');
              router.replace('/screens/set-weekly-goal' as any);
            } else {
              console.log('🏠 RegisterScreen: User has goals, redirecting to home');
              router.replace('/(tabs)/home');
            }
          } catch (error) {
            console.error('Error checking goals:', error);
            // If we can't check, go to home
            router.replace('/(tabs)/home');
          }
        }, 100);
      } else {
        console.log('❌ RegisterScreen: Registration failed:', result.error);
        // Show user-friendly error message
        Alert.alert('Registration Failed', result.error || 'Failed to create account');
      }
    } catch (error) {
      console.error('❌ RegisterScreen: Unexpected error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ==================
  // NAVIGATION HELPERS
  // ==================
  
  const goToLogin = () => {
    router.push('/auth/login');
  };

  // ==================
  // RENDER UI
  // ==================
  
  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          className="px-6"
        >
          <View className="flex-1 justify-center min-h-[600px] py-8">
            {/* Header Section */}
            <View className="mb-8">
              <Text className="text-3xl font-bold text-gray-900 text-center mb-2">
                Create Account
              </Text>
              <Text className="text-lg text-gray-600 text-center">
                Join us and start tracking your study sessions
              </Text>
            </View>

            {/* Registration Form */}
            <View className="space-y-4 mb-6">
              {/* Name Fields */}
              <View className="flex-row space-x-3">
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </Text>
                  <TextInput
                    value={formData.firstName}
                    onChangeText={(value) => updateFormData('firstName', value)}
                    placeholder="First name"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="words"
                    editable={!isLoading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 text-base"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </Text>
                  <TextInput
                    value={formData.lastName}
                    onChangeText={(value) => updateFormData('lastName', value)}
                    placeholder="Last name"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="words"
                    editable={!isLoading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 text-base"
                  />
                </View>
              </View>

              {/* Email Input */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </Text>
                <TextInput
                  value={formData.email}
                  onChangeText={(value) => updateFormData('email', value)}
                  placeholder="Enter your email"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 text-base"
                />
              </View>

              {/* Password Input */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Password *
                </Text>
                <TextInput
                  value={formData.password}
                  onChangeText={(value) => updateFormData('password', value)}
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  editable={!isLoading}
                  autoComplete="off"
                  textContentType="none"
                  autoCorrect={false}
                  spellCheck={false}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 text-base"
                />
                <Text className="text-xs text-gray-500 mt-1">
                  Must be at least 8 characters
                </Text>
              </View>

              {/* Confirm Password Input */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </Text>
                <TextInput
                  value={formData.confirmPassword}
                  onChangeText={(value) => updateFormData('confirmPassword', value)}
                  placeholder="Confirm your password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  editable={!isLoading}
                  autoComplete="off"
                  textContentType="none"
                  autoCorrect={false}
                  spellCheck={false}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 text-base"
                />
              </View>
            </View>

            {/* Register Button */}
            <TouchableOpacity
              onPress={handleRegister}
              disabled={isLoading}
              className={`w-full py-4 rounded-lg mb-4 ${
                isLoading 
                  ? 'bg-blue-300' 
                  : 'bg-blue-600'
              }`}
            >
              <Text className="text-white text-center text-lg font-semibold">
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>

            {/* Login Link */}
            <View className="flex-row justify-center">
              <Text className="text-gray-600">
                Already have an account?{' '}
              </Text>
              <TouchableOpacity onPress={goToLogin} disabled={isLoading}>
                <Text className="text-blue-600 font-semibold">
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}