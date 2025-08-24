import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';

interface PremiumContextType {
  isPremium: boolean;
  canAccessFeature: (feature: string) => boolean;
  canAccessDate: (date: Date) => boolean;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

export const PremiumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  const isPremium = useMemo(() => {
    return user?.is_premium || false;
  }, [user]);

  const canAccessFeature = (feature: string): boolean => {
    // Define premium-only features
    const premiumFeatures = [
      'monthly_dashboard',
      'map_chart_daily',
      'map_chart_weekly', 
      'productivity_chart',
      'historical_data_14plus'
    ];
    
    // If not a premium feature, everyone can access
    if (!premiumFeatures.includes(feature)) {
      return true;
    }
    
    // Otherwise, only premium users can access
    return isPremium;
  };

  const canAccessDate = (date: Date): boolean => {
    // Premium users can access any date
    if (isPremium) return true;
    
    // Free users limited to 14 days
    const today = new Date();
    const daysDiff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysDiff <= 14;
  };

  const value = {
    isPremium,
    canAccessFeature,
    canAccessDate
  };

  return (
    <PremiumContext.Provider value={value}>
      {children}
    </PremiumContext.Provider>
  );
};

export const usePremium = () => {
  const context = useContext(PremiumContext);
  if (context === undefined) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return context;
};