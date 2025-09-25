import React, { useState, useEffect, useRef } from 'react';
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
import { useStudiIAP, loadSubscriptionProducts, purchaseSubscription, testConnection, SUBSCRIPTION_ID } from '../../services/IAPService';
import { useAuth } from '../../contexts/AuthContext';

// Define premium features to display
const PREMIUM_FEATURES = [
  {
    title: 'Full study history',
    description: 'so you never lose progress',
  },
  {
    title: 'Flow score analytics',
    description: 'to measure session quality and performance',
  },
  {
    title: 'Study Timelines',
    description: 'To reveal your study patterns',
  },
  {
    title: 'Monthly Dashboard',
    description: 'to keep you motivated all semester',
  },
];

// Dynamic messaging based on trigger
const getTriggerMessage = (trigger?: string): { title: string; subtitle: string } => {
  switch (trigger) {
    case TriggerType.FIRST_SESSION_COMPLETE:
      return {
        title: 'Study With Purpose',
        subtitle: 'Premium features for serious learners.',
      };
    case TriggerType.THREE_SESSIONS_COMPLETE:
      return {
        title: 'Study With Purpose',
        subtitle: 'Premium features for serious learners.',
      };
    case TriggerType.DAY_7_NON_CONVERTER:
      return {
        title: 'Study With Purpose',
        subtitle: 'Premium features for serious learners.',
      };
    case TriggerType.UPGRADE_BUTTON_CLICK:
    default:
      return {
        title: 'Study With Purpose',
        subtitle: 'Get the analytics that help students level up their habits.',
      };
  }
};

export default function UpgradeScreen() {
  const { trigger } = useLocalSearchParams<{ trigger?: string }>();
  const message = getTriggerMessage(trigger);
  const [isLoading, setIsLoading] = useState(false);

  // Get setPremiumStatus function from AuthContext
  const { setPremiumStatus } = useAuth();

  // Use the modern IAP hook
  const {
    connected,
    subscriptions,
    availablePurchases,
    activeSubscriptions,
    fetchProducts,
    getAvailablePurchases,
    getActiveSubscriptions,
    requestPurchase,
  } = useStudiIAP(setPremiumStatus);

  const fetchedProductsOnceRef = useRef(false);

  // Load subscription products when connected
  useEffect(() => {
    if (connected && !fetchedProductsOnceRef.current) {
      console.log('Connected to store, loading subscription products...');
      loadSubscriptionProducts(fetchProducts)
        .then(() => {
          console.log('Products loaded successfully');
          fetchedProductsOnceRef.current = true;
        })
        .catch((error) => {
          console.error('Failed to load products:', error);
        });
    }
  }, [connected, fetchProducts]);

  // Debug subscription products state
  useEffect(() => {
    if (__DEV__) {
      console.log('🔍 Subscriptions state changed:', {
        count: subscriptions.length,
        products: subscriptions.map(sub => ({
          id: sub.productId,
          price: sub.localizedPrice || sub.displayPrice
        }))
      });
    }
  }, [subscriptions]);

  const handleDismiss = () => {
    router.back();
  };

  const handleTestConnection = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      console.log('🔧 Testing IAP connection...');

      // Try loading products directly first
      console.log('🔧 Attempting direct product load...');
      await loadSubscriptionProducts(fetchProducts);

      // Wait a moment for state to update
      await new Promise(resolve => setTimeout(resolve, 1000));

      const result = await testConnection(connected, fetchProducts, subscriptions);

      let message = `Connection: ${result.connected ? '✅ Success' : '❌ Failed'}\n`;
      message += `Products found: ${result.products.length}\n`;
      message += `Subscriptions state: ${subscriptions.length}\n`;

      if (result.errors.length > 0) {
        message += `\nErrors:\n${result.errors.join('\n')}`;
      }

      if (result.products.length > 0) {
        const product = result.products[0];
        message += `\nProduct: ${product.productId}\nPrice: ${product.localizedPrice || product.displayPrice || 'N/A'}`;
      }

      // Additional diagnostic info
      message += `\nDiagnostics:\n`;
      message += `- Connected: ${connected}\n`;
      message += `- Bundle ID: Check if matches App Store Connect\n`;
      message += `- Sandbox Account: Must be signed in to device\n`;
      message += `- Product Status: Must be approved in App Store Connect`;

      alert(message);
      setIsLoading(false);

    } catch (error: any) {
      console.error('❌ Connection test failed:', error);
      setIsLoading(false);
      alert(`Connection test failed: ${error.message}`);
    }
  };

  const handleUpgrade = async () => {
    if (isLoading) return; // Prevent double-clicks

    try {
      setIsLoading(true);
      if (__DEV__) {
        console.log('🚀 Starting subscription purchase...');
        console.log('🔍 Available subscriptions at purchase time:', {
          count: subscriptions.length,
          products: subscriptions.map(sub => sub.productId)
        });
      }

      // Add visual feedback
      alert('Starting IAP process...');

      await purchaseSubscription(requestPurchase, subscriptions);

      // Note: Success will be handled by the onPurchaseSuccess callback in useStudiIAP
      // The purchase result will be logged automatically
      alert('Purchase request completed - check for Apple dialog');

    } catch (error: any) {
      console.error('❌ Purchase failed:', error);
      setIsLoading(false);
      alert(`Purchase failed: ${error.message}`);
    }
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
            <Text className="text-lg text-white/90 text-center mb-6">
              {message.subtitle}
            </Text>

            {/* Social Proof Tag */}
            <View style={{
              alignSelf: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 8,
              marginBottom: 16,
            }}>
              <Text className="text-white/90 text-sm font-medium text-center">
                ✨ Designed by students, for students
              </Text>
            </View>
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
            {/* Test Connection Button - Commented out for production */}
            {/* <TouchableOpacity
              onPress={handleTestConnection}
              disabled={isLoading}
              style={{
                backgroundColor: isLoading ? '#888888' : 'rgba(255, 255, 255, 0.2)',
                borderRadius: 16,
                paddingVertical: 12,
                paddingHorizontal: 24,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.3)',
              }}
            >
              <Text style={{
                color: isLoading ? '#CCCCCC' : '#FFFFFF',
                textAlign: 'center',
                fontSize: 16,
                fontWeight: '500',
              }}>
                {isLoading ? 'Testing...' : '🔧 Test IAP Connection'}
              </Text>
            </TouchableOpacity> */}

            {/* Main Purchase Button */}
            <TouchableOpacity
              onPress={handleUpgrade}
              disabled={isLoading}
              style={{
                backgroundColor: isLoading ? '#CCCCCC' : '#FFFFFF',
                borderRadius: 16,
                paddingVertical: 16,
                paddingHorizontal: 24,
                marginBottom: 12,
              }}
            >
              <Text style={{
                color: isLoading ? '#666666' : '#000000',
                textAlign: 'center',
                fontSize: 18,
                fontWeight: '600',
              }}>
                {isLoading ? 'Processing...' : 'Start Free Trial'}
              </Text>
            </TouchableOpacity>

            <Text className="text-center text-white/80 text-base">
              Then $4.99 billed monthly, cancel anytime
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}