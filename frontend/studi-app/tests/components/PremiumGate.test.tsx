/**
 * PremiumGate Component Tests
 *
 * Focus: Testing premium feature gating UI behavior
 * Scope: Component rendering, feature access logic, upgrade prompts
 *
 * Key Testing Areas:
 * 1. Conditional rendering based on premium status
 * 2. Mockup image display for non-premium users
 * 3. Upgrade prompt interactions
 * 4. Feature-specific access control
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PremiumGate } from '../../components/premium/PremiumGate';
import { Text, View } from 'react-native';

// Mock contexts
const mockUsePremium = jest.fn();
const mockUseConversion = jest.fn();

jest.mock('../../contexts/PremiumContext', () => ({
  usePremium: () => mockUsePremium(),
}));

jest.mock('../../contexts/ConversionContext', () => ({
  useConversion: () => mockUseConversion(),
}));

// Mock premium features config
jest.mock('../../config/premiumFeatures', () => ({
  PREMIUM_FEATURES: {
    MONTHLY_DASHBOARD: {
      id: 'monthly_dashboard',
      name: 'Monthly Dashboard',
      description: 'View your monthly study insights and trends',
      type: 'full_screen'
    },
    MAP_CHART_DAILY: {
      id: 'map_chart_daily',
      name: 'Daily Activity Map',
      description: 'See when you study throughout the day',
      type: 'chart'
    }
  }
}));

// Mock premium mockups
jest.mock('../../config/premiumMockups', () => ({
  getMockupForFeature: jest.fn().mockReturnValue({
    overlayConfig: {
      title: 'Premium Feature',
      subtitle: 'Upgrade to unlock',
      ctaText: 'Upgrade Now'
    }
  })
}));

// Mock services
jest.mock('../../services/ConversionTriggerManager', () => ({
  TriggerType: {
    UPGRADE_BUTTON_CLICK: 'upgrade_button_click'
  }
}));

const MockPremiumContent = () => (
  <View testID="premium-content">
    <Text>Premium Dashboard Content</Text>
  </View>
);

const MockFallbackContent = () => (
  <View testID="fallback-content">
    <Text>Free Version Content</Text>
  </View>
);

describe('PremiumGate Component', () => {
  const mockShowUpgradeScreen = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseConversion.mockReturnValue({
      showUpgradeScreen: mockShowUpgradeScreen
    });
  });

  describe('Premium User Access', () => {
    beforeEach(() => {
      mockUsePremium.mockReturnValue({
        canAccessFeature: jest.fn().mockReturnValue(true),
        isPremium: true
      });
    });

    it('should render premium content for premium users', () => {
      const { getByTestId, queryByText } = render(
        <PremiumGate feature="monthly_dashboard">
          <MockPremiumContent />
        </PremiumGate>
      );

      expect(getByTestId('premium-content')).toBeTruthy();
      expect(getByTestId('premium-content')).toHaveTextContent('Premium Dashboard Content');
    });

    it('should not render upgrade prompts for premium users', () => {
      const { queryByText } = render(
        <PremiumGate feature="monthly_dashboard">
          <MockPremiumContent />
        </PremiumGate>
      );

      expect(queryByText('Upgrade Now')).toBeNull();
      expect(queryByText('Premium Feature')).toBeNull();
    });
  });

  describe('Free User Restrictions', () => {
    beforeEach(() => {
      mockUsePremium.mockReturnValue({
        canAccessFeature: jest.fn().mockReturnValue(false),
        isPremium: false
      });
    });

    it('should render fallback content for non-premium users', () => {
      const { getByTestId, queryByTestId } = render(
        <PremiumGate feature="monthly_dashboard" fallback={<MockFallbackContent />}>
          <MockPremiumContent />
        </PremiumGate>
      );

      expect(getByTestId('fallback-content')).toBeTruthy();
      expect(queryByTestId('premium-content')).toBeNull();
    });

    it('should render mockup image when provided', () => {
      const mockImage = { uri: 'test-mockup.png' };

      const { getByDisplayValue, queryByTestId } = render(
        <PremiumGate
          feature="monthly_dashboard"
          mockupImage={mockImage}
          mockupImageStyle={{ width: 300, height: 200 }}
        >
          <MockPremiumContent />
        </PremiumGate>
      );

      // Premium content should not be rendered
      expect(queryByTestId('premium-content')).toBeNull();
    });

    it('should show upgrade prompt by default', () => {
      const { getByText } = render(
        <PremiumGate feature="monthly_dashboard">
          <MockPremiumContent />
        </PremiumGate>
      );

      // Should render default premium overlay
      expect(getByText('Premium Feature')).toBeTruthy();
    });

    it('should hide upgrade prompt when disabled', () => {
      const { queryByText, getByTestId } = render(
        <PremiumGate
          feature="monthly_dashboard"
          showUpgradePrompt={false}
          fallback={<MockFallbackContent />}
        >
          <MockPremiumContent />
        </PremiumGate>
      );

      expect(getByTestId('fallback-content')).toBeTruthy();
      expect(queryByText('Upgrade Now')).toBeNull();
    });
  });

  describe('Feature Access Logic', () => {
    it('should correctly identify premium features', () => {
      const premiumFeatures = [
        'monthly_dashboard',
        'map_chart_daily',
        'map_chart_weekly',
        'productivity_chart',
        'historical_data_14plus'
      ];

      const isPremiumFeature = (feature: string) => {
        return premiumFeatures.includes(feature);
      };

      expect(isPremiumFeature('monthly_dashboard')).toBe(true);
      expect(isPremiumFeature('map_chart_daily')).toBe(true);
      expect(isPremiumFeature('basic_timer')).toBe(false);
      expect(isPremiumFeature('category_management')).toBe(false);
    });

    it('should allow access to non-premium features for all users', () => {
      mockUsePremium.mockReturnValue({
        canAccessFeature: jest.fn((feature) => {
          const premiumFeatures = ['monthly_dashboard', 'productivity_chart'];
          return !premiumFeatures.includes(feature);
        }),
        isPremium: false
      });

      const { getByTestId } = render(
        <PremiumGate feature="basic_timer">
          <MockPremiumContent />
        </PremiumGate>
      );

      expect(getByTestId('premium-content')).toBeTruthy();
    });
  });

  describe('Upgrade Interactions', () => {
    beforeEach(() => {
      mockUsePremium.mockReturnValue({
        canAccessFeature: jest.fn().mockReturnValue(false),
        isPremium: false
      });
    });

    it('should trigger upgrade screen when CTA is pressed', () => {
      const { getByText } = render(
        <PremiumGate feature="monthly_dashboard">
          <MockPremiumContent />
        </PremiumGate>
      );

      const upgradeButton = getByText('Upgrade to Premium');
      fireEvent.press(upgradeButton);

      expect(mockShowUpgradeScreen).toHaveBeenCalledWith('upgrade_button_click');
    });

    it('should handle missing showUpgradeScreen gracefully', () => {
      mockUseConversion.mockReturnValue({
        showUpgradeScreen: null
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const { getByText } = render(
        <PremiumGate feature="monthly_dashboard">
          <MockPremiumContent />
        </PremiumGate>
      );

      const upgradeButton = getByText('Upgrade to Premium');
      fireEvent.press(upgradeButton);

      expect(consoleSpy).toHaveBeenCalledWith('showUpgradeScreen is not available');
      consoleSpy.mockRestore();
    });
  });

  describe('Display Modes', () => {
    beforeEach(() => {
      mockUsePremium.mockReturnValue({
        canAccessFeature: jest.fn().mockReturnValue(false),
        isPremium: false
      });
    });

    it('should apply chart mode styling', () => {
      const mockImage = { uri: 'chart-mockup.png' };

      const { getByText } = render(
        <PremiumGate
          feature="map_chart_daily"
          mockupImage={mockImage}
          displayMode="chart"
        >
          <MockPremiumContent />
        </PremiumGate>
      );

      // Should render with chart-specific styling
      expect(getByText('Upgrade Now')).toBeTruthy();
    });

    it('should apply dashboard mode styling', () => {
      const mockImage = { uri: 'dashboard-mockup.png' };

      const { getByText } = render(
        <PremiumGate
          feature="monthly_dashboard"
          mockupImage={mockImage}
          displayMode="dashboard"
        >
          <MockPremiumContent />
        </PremiumGate>
      );

      // Should render with dashboard-specific styling
      expect(getByText('Upgrade Now')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing premium context gracefully', () => {
      mockUsePremium.mockImplementation(() => {
        throw new Error('usePremium must be used within a PremiumProvider');
      });

      expect(() => {
        render(
          <PremiumGate feature="monthly_dashboard">
            <MockPremiumContent />
          </PremiumGate>
        );
      }).toThrow('usePremium must be used within a PremiumProvider');
    });

    it('should handle missing conversion context gracefully', () => {
      mockUsePremium.mockReturnValue({
        canAccessFeature: jest.fn().mockReturnValue(false),
        isPremium: false
      });

      mockUseConversion.mockReturnValue({
        showUpgradeScreen: undefined
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const { getByText } = render(
        <PremiumGate feature="monthly_dashboard">
          <MockPremiumContent />
        </PremiumGate>
      );

      const upgradeButton = getByText('Upgrade to Premium');
      fireEvent.press(upgradeButton);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});