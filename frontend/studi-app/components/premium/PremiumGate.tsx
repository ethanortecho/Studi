import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ImageSourcePropType, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { usePremium } from '../../contexts/PremiumContext';
import { useConversion } from '../../contexts/ConversionContext';
import { PREMIUM_FEATURES } from '../../config/premiumFeatures';
import { getMockupForFeature } from '../../config/premiumMockups';
import { TriggerType } from '../../services/ConversionTriggerManager';

interface PremiumGateProps {
  feature: string;
  children?: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
  mockupImage?: ImageSourcePropType; // Static mockup image for premium preview
  mockupImageStyle?: object; // Custom styling for mockup image
  blurMode?: boolean; // Enable blur overlay instead of mockup image
  blurIntensity?: number; // Blur intensity (1-100, default 80)
  displayMode?: 'dashboard' | 'chart'; // Context for overlay styling
}

export const PremiumGate: React.FC<PremiumGateProps> = ({ 
  feature, 
  children, 
  fallback,
  showUpgradePrompt = true,
  mockupImage,
  mockupImageStyle,
  blurMode = false,
  blurIntensity = 80,
  displayMode = 'dashboard'
}) => {
  const { canAccessFeature } = usePremium();
  const { showUpgradeScreen } = useConversion();
  
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
    
    // For chart mode, use simple layout without ScrollView
    if (displayMode === 'chart') {
      return (
        <View style={{ position: 'relative', ...mockupImageStyle }}>
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
          
          {/* Overlay Text and CTA */}
          <PremiumOverlayContent 
            feature={feature} 
            showUpgradePrompt={showUpgradePrompt}
            displayMode={displayMode}
          />
        </View>
      );
    }
    
    // For dashboard mode, use ScrollView for full-screen mockups
    return (
      <View style={{ flex: 1, position: 'relative' }}>
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
        
        {/* Overlay Text and CTA */}
        <PremiumOverlayContent 
          feature={feature} 
          showUpgradePrompt={showUpgradePrompt}
          displayMode={displayMode}
        />
      </View>
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
  const { showUpgradeScreen } = useConversion();

  if (!showUpgradePrompt) return <View />;

  return (
    <TouchableOpacity
      className="bg-surface rounded-full p-3 shadow-lg border border-accent"
      onPress={() => {
        if (showUpgradeScreen) {
          showUpgradeScreen(TriggerType.UPGRADE_BUTTON_CLICK);
        } else {
          console.warn('showUpgradeScreen is not available in FloatingPremiumCTA');
        }
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

// Overlay content component for mockup images with center positioning
const PremiumOverlayContent: React.FC<{
  feature: string;
  showUpgradePrompt: boolean;
  displayMode?: 'dashboard' | 'chart';
}> = ({
  feature,
  showUpgradePrompt,
  displayMode = 'dashboard'
}) => {
  const { showUpgradeScreen } = useConversion();

  if (!showUpgradePrompt) return null;
  
  const mockup = getMockupForFeature(feature);
  const overlayConfig = mockup?.overlayConfig;
  
  if (!overlayConfig) return null;
  
  // Different overlay styling for chart vs dashboard mode
  const isChartMode = displayMode === 'chart';
  
  return (
    <View style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <View style={{
        alignItems: 'center',
        paddingHorizontal: isChartMode ? 14 : 20,
        paddingVertical: isChartMode ? 10 : 16,
        maxWidth: isChartMode ? '90%' : '85%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', 
        borderRadius: isChartMode ? 12 : 16,
      }}>
        {/* Primary Title Text */}
        <Text style={{
          fontSize: isChartMode ? 15 : 20,
          fontWeight: '700',
          color: '#FFFFFF',
          textAlign: 'center',
          marginBottom: isChartMode ? 3 : 6,
          textShadowColor: 'rgba(0, 0, 0, 0.8)',
          textShadowOffset: { width: 0, height: 2 },
          textShadowRadius: 4,
        }}>
          {overlayConfig.title}
        </Text>
        
        {/* Secondary Subtitle Text */}
        <Text style={{
          fontSize: isChartMode ? 11 : 13,
          fontWeight: '400',
          color: '#FFFFFF',
          textAlign: 'center',
          marginBottom: isChartMode ? 10 : 16,
          textShadowColor: 'rgba(0, 0, 0, 0.8)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 3,
          lineHeight: isChartMode ? 16 : 20,
        }}>
          {overlayConfig.subtitle}
        </Text>
        
        {/* CTA Button */}
        <TouchableOpacity 
          style={{
            backgroundColor: '#8B5CF6', // Purple accent
            paddingHorizontal: isChartMode ? 18 : 24,
            paddingVertical: isChartMode ? 7 : 10,
            borderRadius: isChartMode ? 16 : 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.25,
            shadowRadius: 6,
            elevation: 5,
            minWidth: isChartMode ? 110 : 140,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={() => {
            if (showUpgradeScreen) {
              showUpgradeScreen(TriggerType.UPGRADE_BUTTON_CLICK);
            } else {
              console.warn('showUpgradeScreen is not available');
            }
          }}
        >
          <Text style={{
            color: '#FFFFFF',
            fontSize: isChartMode ? 11 : 13,
            fontWeight: '600',
            textAlign: 'center',
          }}>
            {overlayConfig.ctaText}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Full overlay component for non-blur mode (fallback)
const PremiumOverlay: React.FC<{ feature: string; showUpgradePrompt: boolean }> = ({
  feature,
  showUpgradePrompt
}) => {
  const { showUpgradeScreen } = useConversion();
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
            if (showUpgradeScreen) {
              showUpgradeScreen(TriggerType.UPGRADE_BUTTON_CLICK);
            } else {
              console.warn('showUpgradeScreen is not available');
            }
          }}
        >
          <Text className="text-primaryText font-semibold">Upgrade to Premium</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};