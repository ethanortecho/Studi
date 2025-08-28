import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { usePremium } from '../../contexts/PremiumContext';
import { PREMIUM_FEATURES } from '../../config/premiumFeatures';

interface PremiumGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
}

export const PremiumGate: React.FC<PremiumGateProps> = ({ 
  feature, 
  children, 
  fallback,
  showUpgradePrompt = true 
}) => {
  const { canAccessFeature } = usePremium();
  
  if (canAccessFeature(feature)) {
    return <>{children}</>;
  }

  // If custom fallback provided, use it
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default fallback - simple upgrade prompt
  const featureInfo = Object.values(PREMIUM_FEATURES).find(f => f.id === feature);
  
  return (
    <View className="flex-1 items-center justify-center p-6">
      <View className="bg-surface rounded-2xl p-6 items-center">
        <Text className="text-2xl mb-2">🔒</Text>
        <Text className="text-lg font-semibold text-primaryText mb-2">
          Premium Feature
        </Text>
        {featureInfo && (
          <Text className="text-sm text-secondaryText text-center mb-4">
            {featureInfo.description}
          </Text>
        )}
        {showUpgradePrompt && (
          <TouchableOpacity 
            className="bg-purple-600 px-6 py-3 rounded-full mt-2"
            onPress={() => {
              // TODO: Navigate to upgrade screen
              console.log('Navigate to upgrade screen');
            }}
          >
            <Text className="text-white font-semibold">Upgrade to Premium</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};