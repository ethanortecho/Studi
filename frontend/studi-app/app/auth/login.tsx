import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../utils/apiClient';

/**
 * LOGIN SCREEN EXPLANATION
 * 
 * This is what users see when they need to log in to your app.
 * It's a simple form with email and password fields.
 * 
 * Key UX principles:
 * - Clear error messages
 * - Loading states (disable button while logging in)
 * - Keyboard handling (form doesn't get hidden by keyboard)
 * - Easy navigation to registration
 */

export default function LoginScreen() {
  // ==================
  // STATE MANAGEMENT
  // ==================
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Get login function from our AuthContext
  const { login } = useAuth();

  // ==================
  // FORM HANDLING
  // ==================
  
  /**
   * EXPLANATION: handleLogin()
   * 
   * This runs when user taps the "Login" button:
   * 1. Validate form (basic checks)
   * 2. Call AuthContext.login() with credentials
   * 3. Handle success/failure
   * 4. Show user-friendly error messages
   */
  const handleLogin = async () => {
    // Basic validation
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔐 LoginScreen: Attempting login for:', email);
      
      // Call our AuthContext login function
      const result = await login(email.trim().toLowerCase(), password);

      if (result.success) {
        console.log('✅ LoginScreen: Login successful, checking for goals...');
        // Small delay to ensure AuthContext state is updated
        setTimeout(async () => {
          try {
            // Check if user needs goal setup
            const response = await apiClient.get<{ has_goals: boolean }>('/goals/has-goals/');
            if (response.data && !response.data.has_goals) {
              console.log('🎯 LoginScreen: User needs goal setup, redirecting...');
              router.replace('/screens/set-weekly-goal' as any);
            } else {
              console.log('🏠 LoginScreen: User has goals, redirecting to home');
              router.replace('/(tabs)/home');
            }
          } catch (error) {
            console.error('Error checking goals:', error);
            // If we can't check, go to home
            router.replace('/(tabs)/home');
          }
        }, 100);
      } else {
        console.log('❌ LoginScreen: Login failed:', result.error);
        // Show user-friendly error message
        Alert.alert('Login Failed', result.error || 'Invalid email or password');
      }
    } catch (error) {
      console.error('❌ LoginScreen: Unexpected error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ==================
  // NAVIGATION HELPERS
  // ==================
  
  const goToRegister = () => {
    router.push('/auth/register');
  };

  // ==================
  // RENDER UI
  // ==================
  
  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* KeyboardAvoidingView ensures form stays visible when keyboard opens */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          className="px-6"
        >
          {/* Header Section */}
          <View className="flex-1 justify-center min-h-[400px]">
            <View className="mb-8">
              <Text className="text-3xl font-bold text-gray-900 text-center mb-2">
                Welcome Back
              </Text>
              <Text className="text-lg text-gray-600 text-center">
                Sign in to continue studying
              </Text>
            </View>

            {/* Login Form */}
            <View className="space-y-4 mb-6">
              {/* Email Input */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
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
                  Password
                </Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
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
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              className={`w-full py-4 rounded-lg mb-4 ${
                isLoading 
                  ? 'bg-blue-300' 
                  : 'bg-blue-600'
              }`}
            >
              <Text className="text-white text-center text-lg font-semibold">
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            {/* Register Link */}
            <View className="flex-row justify-center">
              <Text className="text-gray-600">
                Don't have an account?{' '}
              </Text>
              <TouchableOpacity onPress={goToRegister} disabled={isLoading}>
                <Text className="text-blue-600 font-semibold">
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}