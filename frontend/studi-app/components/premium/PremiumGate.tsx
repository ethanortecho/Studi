import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ImageSourcePropType, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { usePremium } from '../../contexts/PremiumContext';
import { PREMIUM_FEATURES } from '../../config/premiumFeatures';

interface PremiumGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
  mockupImage?: ImageSourcePropType; // Static mockup image for premium preview
  mockupImageStyle?: object; // Custom styling for mockup image
  blurMode?: boolean; // Enable blur overlay instead of mockup image
  blurIntensity?: number; // Blur intensity (1-100, default 80)
}

export const PremiumGate: React.FC<PremiumGateProps> = ({ 
  feature, 
  children, 
  fallback,
  showUpgradePrompt = true,
  mockupImage,
  mockupImageStyle,
  blurMode = false,
  blurIntensity = 80
}) => {
  const { canAccessFeature } = usePremium();
  
  // Debug logging
  console.log('PremiumGate Debug:', {
    feature,
    hasChildren: !!children,
    hasMockupImage: !!mockupImage,
    hasFallback: !!fallback,
    blurMode,
    canAccess: canAccessFeature(feature)
  });
  
  // Priority 1: Check premium access for real content FIRST
  if (canAccessFeature(feature)) {
    console.log('PremiumGate: Showing real content (premium access)');
    return <>{children}</>;
  }
  
  // Priority 2: Show mockup image for non-premium users
  if (mockupImage) {
    console.log('PremiumGate: Showing mockup image (non-premium)');
    return (
      <ScrollView 
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <Image 
          source={mockupImage}
          style={[mockupImageStyle]}
          resizeMode="contain"
          onError={(error) => {
            console.log('PremiumGate: Image loading error:', error);
          }}
          onLoad={() => {
            console.log('PremiumGate: Image loaded successfully');
          }}
        />
      </ScrollView>
    );
  }

  // Priority 3: Custom fallback
  if (fallback) {
    console.log('PremiumGate: Showing custom fallback');
    return <>{fallback}</>;
  }

  // Blur mode - show blurred content with overlay
  if (blurMode) {
    return (
      <View style={{ position: 'relative' }}>
        {children}
        
        {/* Blur overlay */}
        <BlurView 
          intensity={blurIntensity}
          experimentalBlurMethod="dimezisBlurView"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Floating CTA in center */}
          <View style={{
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <FloatingPremiumCTA feature={feature} showUpgradePrompt={showUpgradePrompt} />
          </View>
        </BlurView>
      </View>
    );
  }

  // Default fallback - simple upgrade prompt
  return (
    <View className="flex-1 items-center justify-center p-6">
      <PremiumOverlay feature={feature} showUpgradePrompt={showUpgradePrompt} />
    </View>
  );
};

// Small floating CTA for blur mode
const FloatingPremiumCTA: React.FC<{ feature: string; showUpgradePrompt: boolean }> = ({ 
  feature, 
  showUpgradePrompt 
}) => {
  if (!showUpgradePrompt) return <View />;
  
  return (
    <TouchableOpacity 
      className="bg-surface rounded-full p-3 shadow-lg border border-accent"
      onPress={() => {
        // TODO: Navigate to upgrade screen
        console.log('Navigate to upgrade screen');
      }}
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
      }}
    >
      <Ionicons name="diamond" size={20} color="#FFD700" />
    </TouchableOpacity>
  );
};

// Full overlay component for non-blur mode
const PremiumOverlay: React.FC<{ feature: string; showUpgradePrompt: boolean }> = ({ 
  feature, 
  showUpgradePrompt 
}) => {
  const featureInfo = Object.values(PREMIUM_FEATURES).find(f => f.id === feature);
  
  return (
    <View className="bg-surface rounded-2xl p-6 items-center shadow-lg">
      {/* Gold crown icon */}
      <Ionicons name="diamond" size={32} color="#FFD700" style={{ marginBottom: 8 }} />
      
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
          className="bg-accent px-6 py-3 rounded-full mt-2"
          onPress={() => {
            // TODO: Navigate to upgrade screen
            console.log('Navigate to upgrade screen');
          }}
        >
          <Text className="text-primaryText font-semibold">Upgrade to Premium</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};