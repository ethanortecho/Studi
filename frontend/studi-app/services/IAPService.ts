import { useIAP, type ProductSubscription, type PurchaseError, type Purchase } from 'react-native-iap';

// Product ID for the monthly subscription
export const SUBSCRIPTION_ID = 'com.studi.premium.monthly';

// Custom hook that wraps useIAP for Studi app
export const useStudiIAP = (setPremiumStatus?: (isPremium: boolean) => Promise<void>) => {
  const {
    connected,
    subscriptions,
    availablePurchases,
    activeSubscriptions,
    fetchProducts,
    finishTransaction,
    getAvailablePurchases,
    getActiveSubscriptions,
    requestPurchase,
  } = useIAP({
    onPurchaseSuccess: async (purchase: Purchase) => {
      __DEV__ && console.log('🎉 Purchase successful:', purchase.productId);

      try {
        // Update premium status on backend
        if (setPremiumStatus) {
          __DEV__ && console.log('🔧 Updating premium status on backend...');
          await setPremiumStatus(true);
          __DEV__ && console.log('✅ Premium status updated successfully');
        }

        // Finish the transaction for subscriptions (isConsumable: false)
        await finishTransaction({
          purchase,
          isConsumable: false,
        });

        __DEV__ && console.log('✅ Transaction finished successfully');

        // Refresh subscription status
        await getActiveSubscriptions([SUBSCRIPTION_ID]);
        await getAvailablePurchases();

      } catch (error) {
        console.error('❌ Error finishing transaction:', error);
        throw error;
      }
    },
    onPurchaseError: (error: PurchaseError) => {
      __DEV__ && console.error('❌ Purchase failed:', error);
      // Could log to analytics service here
    },
    onSyncError: (error: Error) => {
      console.error('❌ Sync error:', error);
    },
  });

  return {
    connected,
    subscriptions,
    availablePurchases,
    activeSubscriptions,
    fetchProducts,
    finishTransaction,
    getAvailablePurchases,
    getActiveSubscriptions,
    requestPurchase,
  };
};

// Helper functions for subscription management
export const loadSubscriptionProducts = async (fetchProducts: any) => {
  try {
    __DEV__ && console.log('🔧 Loading subscription products...');

    const result = await fetchProducts({
      skus: [SUBSCRIPTION_ID],
      type: 'subs',
    });

    __DEV__ && console.log('✅ Subscription products loaded');
    return result;
  } catch (error) {
    console.error('❌ Failed to load subscription products:', error);
    throw error;
  }
};

export const purchaseSubscription = async (requestPurchase: any, subscriptions: ProductSubscription[]) => {
  try {
    __DEV__ && console.log('🚀 Starting subscription purchase...');

    // Find the subscription product - check both productId and id fields
    const subscription = subscriptions.find((sub) => sub.productId === SUBSCRIPTION_ID || sub.id === SUBSCRIPTION_ID);
    if (!subscription) {
      __DEV__ && console.log('❌ Product not found. Available products:', subscriptions.map(s => s.productId || s.id));
      throw new Error(`Subscription ${SUBSCRIPTION_ID} not found in available products`);
    }

    __DEV__ && console.log('✅ Found subscription product:', subscription.productId);

    // Request purchase using the modern API
    await requestPurchase({
      request: {
        ios: {
          sku: SUBSCRIPTION_ID,
        },
        android: {
          skus: [SUBSCRIPTION_ID],
          subscriptionOffers:
            subscription &&
            'subscriptionOfferDetailsAndroid' in subscription &&
            subscription.subscriptionOfferDetailsAndroid
              ? subscription.subscriptionOfferDetailsAndroid.map((offer: any) => ({
                  sku: SUBSCRIPTION_ID,
                  offerToken: offer.offerToken,
                }))
              : [],
        },
      },
      type: 'subs',
    });

    __DEV__ && console.log('⏳ Purchase request sent successfully');
  } catch (error) {
    console.error('❌ Purchase request failed:', error);
    throw error;
  }
};

// Development helper for testing IAP connection
export const testConnection = async (
  connected: boolean,
  fetchProducts: any,
  subscriptions: ProductSubscription[]
): Promise<{ connected: boolean; products: ProductSubscription[]; errors: string[] }> => {
  if (!__DEV__) {
    return { connected, products: subscriptions, errors: [] };
  }

  const errors: string[] = [];

  try {
    console.log('🔧 Testing IAP connection...');

    if (!connected) {
      errors.push('Not connected to IAP service');
      return { connected: false, products: [], errors };
    }

    try {
      await loadSubscriptionProducts(fetchProducts);
    } catch (error: any) {
      errors.push(`Product loading failed: ${error.message}`);
    }

    if (subscriptions.length === 0) {
      errors.push(`Subscription ${SUBSCRIPTION_ID} not found in App Store Connect`);
    } else {
      console.log('📦 Found subscription products:', subscriptions.length);
    }

    return { connected: true, products: subscriptions, errors };

  } catch (error: any) {
    errors.push(`Connection test failed: ${error.message}`);
    console.error('❌ Connection test error:', error);
    return { connected: false, products: [], errors };
  }
};