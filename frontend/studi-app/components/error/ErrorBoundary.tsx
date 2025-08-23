import React, { Component, ReactNode } from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log error to console in development
    if (__DEV__) {
      console.error('ErrorBoundary caught:', error, errorInfo);
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Simple error UI
      return (
        <SafeAreaView className="flex-1 bg-background">
          <View className="flex-1 px-6 items-center justify-center">
            {/* Error icon */}
            <Text className="text-5xl mb-4">⚠️</Text>

            {/* Error message */}
            <Text className="text-xl font-semibold text-primaryText mb-2 text-center">
              Something went wrong
            </Text>
            
            <Text className="text-base text-secondaryText text-center mb-8 px-4">
              The app encountered an unexpected error. Please try again.
            </Text>

            {/* Retry button */}
            <Pressable
              onPress={this.reset}
              className="bg-purple-600 px-8 py-3 rounded-2xl"
            >
              <Text className="text-white font-semibold text-base">
                Try Again
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}