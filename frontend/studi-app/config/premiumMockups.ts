/**
 * Premium Chart Mockup Images Registry
 * 
 * This file manages static mockup images for premium charts.
 * When you create mockup images, add them here for easy management.
 */

import { ImageSourcePropType } from 'react-native';

export interface ChartMockup {
  id: string;
  name: string;
  image: ImageSourcePropType;
  description: string;
  defaultStyle?: object;
  overlayConfig?: {
    title: string;
    subtitle: string;
    ctaText: string;
    position?: 'center' | 'top' | 'bottom';
  };
}

// Mockup images for different chart types
export const CHART_MOCKUPS: Record<string, ChartMockup> = {
  // Productivity/Flow Score Charts
  productivity_chart: {
    id: 'productivity_chart',
    name: 'Flow Score Chart',
    image: require('../assets/mockups/productivity-chart-mockup.png'), // You'll add this
    description: 'Beautiful flow score visualization with rich data',
    defaultStyle: {
      width: '100%',
      height: 220,
    },
    overlayConfig: {
      title: 'Unlock Advanced Flow Analytics',
      subtitle: 'Track your focus patterns and productivity trends',
      ctaText: 'UPGRADE TO PREMIUM',
      position: 'center'
    }
  },

  // Map Charts  
  map_chart_daily: {
    id: 'map_chart_daily',
    name: 'Daily Study Map',
    image: require('../assets/mockups/daily-map-mockup.png'), // You'll add this
    description: 'Detailed daily study patterns visualization',
    defaultStyle: {
      width: '100%',
      height: 250,
    },
    overlayConfig: {
      title: 'Unlock Detailed Study Maps',
      subtitle: 'Visualize your study patterns and time distribution',
      ctaText: 'UPGRADE TO PREMIUM',
      position: 'center'
    }
  },

  map_chart_weekly: {
    id: 'map_chart_weekly', 
    name: 'Weekly Study Map',
    image: require('../assets/mockups/weekly-map-mockup.png'), // You'll add this
    description: 'Weekly study patterns and trends',
    defaultStyle: {
      width: '100%',
      height: 250,
    },
    overlayConfig: {
      title: 'Unlock Detailed Study Maps',
      subtitle: 'Visualize your study patterns and time distribution',
      ctaText: 'UPGRADE TO PREMIUM',
      position: 'center'
    }
  },

  // Alternative naming patterns for chart registry compatibility
  'map_chart': {
    id: 'map_chart',
    name: 'Study Map Chart',
    image: require('../assets/mockups/daily-map-mockup.png'),
    description: 'Study patterns visualization',
    defaultStyle: {
      width: '100%',
      height: 210,
    },
    overlayConfig: {
      title: 'Unlock Detailed Study Maps',
      subtitle: 'Visualize your study patterns and time distribution',
      ctaText: 'UPGRADE TO PREMIUM',
      position: 'center'
    }
  },

  // Monthly Dashboard
  monthly_dashboard: {
    id: 'monthly_dashboard',
    name: 'Monthly Dashboard',
    image: require('../assets/mockups/monthly-dashboard-mockup.png'), // You'll add this
    description: 'Comprehensive monthly analytics dashboard',
    defaultStyle: {
      width: '100%',
      height: 400, // Larger for dashboard view
    },
    overlayConfig: {
      title: 'Unlock Monthly Insights',
      subtitle: 'Deep analytics and comprehensive monthly reports',
      ctaText: 'UPGRADE TO PREMIUM',
      position: 'center'
    }
  },

  // Historical Dashboards
  historical_daily_dashboard: {
    id: 'historical_daily_dashboard',
    name: 'Historical Daily Dashboard',
    image: require('../assets/mockups/historical-daily-mockup.png'),
    description: 'Rich historical daily analytics with detailed insights',
    defaultStyle: {
      width: '100%',
      height: 920, // Full dashboard height
    },
    overlayConfig: {
      title: 'Unlock your Complete Study History',
      subtitle: 'See trends and compare progress over months',
      ctaText: 'VIEW FULL HISTORY',
      position: 'center'
    }
  },

  historical_weekly_dashboard: {
    id: 'historical_weekly_dashboard',
    name: 'Historical Weekly Dashboard',
    image: require('../assets/mockups/historical-weekly-mockup.png'),
    description: 'Comprehensive historical weekly patterns and trends',
    defaultStyle: {
      width: '100%',
      height: 620, // Full dashboard height
    },
    overlayConfig: {
      title: 'Unlock your Complete Study History',
      subtitle: 'See trends and compare progress over months',
      ctaText: 'VIEW FULL HISTORY',
      position: 'center'
    }
  },
};

/**
 * Get mockup image for a specific feature
 */
export const getMockupForFeature = (featureId: string): ChartMockup | null => {
  return CHART_MOCKUPS[featureId] || null;
};

/**
 * Get all available mockups
 */
export const getAllMockups = (): ChartMockup[] => {
  return Object.values(CHART_MOCKUPS);
};