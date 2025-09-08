import React from 'react';
import { usePremium } from '../../contexts/PremiumContext';
import { PremiumGate } from './PremiumGate';
import { getMockupForFeature } from '../../config/premiumMockups';

interface HistoricalGateProps {
  date: Date;
  timeframe: 'daily' | 'weekly';
  children: React.ReactNode;
}

export const HistoricalGate: React.FC<HistoricalGateProps> = ({ 
  date, 
  timeframe, 
  children 
}) => {
  const { canAccessDate, canAccessWeek } = usePremium();
  
  // Determine if user can access this historical date
  const canAccess = timeframe === 'weekly' 
    ? canAccessWeek(date) 
    : canAccessDate(date);
  
  // If user can access this date, show real content
  if (canAccess) {
    return <>{children}</>;
  }
  
  // Otherwise show premium mockup for historical data
  const mockupFeatureId = `historical_${timeframe}_dashboard`;
  const mockup = getMockupForFeature(mockupFeatureId);
  
  return (
    <PremiumGate
      feature={mockupFeatureId}
      mockupImage={mockup?.image}
      mockupImageStyle={mockup?.defaultStyle}
    >
      {children}
    </PremiumGate>
  );
};