import { useIAP, type ProductSubscription, type PurchaseError, type Purchase } from 'react-native-iap';

// Product ID for the monthly subscription
export const SUBSCRIPTION_ID = 'com.studi.premium.monthly';

// Custom hook that wraps useIAP for Studi app
export const useStudiIAP = () => {
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
      console.log('🎉 Purchase successful:', purchase.productId);

      try {
        // IMPORTANT: In production, validate receipt on server here
        // const isValid = await validateReceiptOnServer(purchase.purchaseToken);
        // if (!isValid) {
        //   throw new Error('Receipt validation failed');
        // }

        // Finish the transaction for subscriptions (isConsumable: false)
        await finishTransaction({
          purchase,
          isConsumable: false,
        });

        console.log('✅ Transaction finished successfully');

        // Refresh subscription status
        await getActiveSubscriptions([SUBSCRIPTION_ID]);
        await getAvailablePurchases();

      } catch (error) {
        console.error('❌ Error finishing transaction:', error);
      }
    },
    onPurchaseError: (error: PurchaseError) => {
      console.error('❌ Purchase failed:', error);
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
    console.log('🔧 Loading subscription products...');
    console.log('🔧 Requesting products for SKU:', [SUBSCRIPTION_ID]);

    const result = await fetchProducts({
      skus: [SUBSCRIPTION_ID],
      type: 'subs',
    });

    console.log('🔧 fetchProducts result:', result);
    console.log('✅ Subscription products loaded');
    return result;
  } catch (error) {
    console.error('❌ Failed to load subscription products:', error);
    console.error('❌ Error details:', JSON.stringify(error, null, 2));
    throw error;
  }
};

export const purchaseSubscription = async (requestPurchase: any, subscriptions: ProductSubscription[]) => {
  try {
    console.log('🚀 Starting subscription purchase...');
    console.log('🔍 Looking for subscription ID:', SUBSCRIPTION_ID);
    console.log('🔍 Available subscription products:', subscriptions.map(sub => ({
      productId: sub.productId,
      id: sub.id,
      title: sub.title || 'No title'
    })));

    // Find the subscription product - check both productId and id fields
    const subscription = subscriptions.find((sub) => sub.productId === SUBSCRIPTION_ID || sub.id === SUBSCRIPTION_ID);
    if (!subscription) {
      console.log('❌ Product not found. Available products:', subscriptions.map(s => s.productId || s.id));
      throw new Error(`Subscription ${SUBSCRIPTION_ID} not found in available products`);
    }

    console.log('✅ Found subscription product:', {
      productId: subscription.productId,
      id: subscription.id,
      title: subscription.title
    });

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

    console.log('⏳ Purchase request sent successfully');
  } catch (error) {
    console.error('❌ Purchase request failed:', error);
    throw error;
  }
};

export const testConnection = async (
  connected: boolean,
  fetchProducts: any,
  subscriptions: ProductSubscription[]
): Promise<{ connected: boolean; products: ProductSubscription[]; errors: string[] }> => {
  const errors: string[] = [];

  try {
    console.log('🔧 Testing IAP connection...');

    // Test 1: Check connection
    if (!connected) {
      errors.push('Not connected to IAP service');
      return { connected: false, products: [], errors };
    }

    console.log('✅ IAP connection successful');

    // Test 2: Try to load products
    try {
      await loadSubscriptionProducts(fetchProducts);
    } catch (error: any) {
      errors.push(`Product loading failed: ${error.message}`);
    }

    // Test 3: Check if products were loaded
    if (subscriptions.length === 0) {
      errors.push(`Subscription ${SUBSCRIPTION_ID} not found in App Store Connect`);
    } else {
      console.log('📦 Found subscription products:', subscriptions.length);
      subscriptions.forEach(sub => {
        console.log('📦 Product:', sub.productId, 'Price:', sub.localizedPrice || sub.displayPrice);
      });
    }

    return {
      connected: true,
      products: subscriptions,
      errors
    };

  } catch (error: any) {
    errors.push(`Connection test failed: ${error.message}`);
    console.error('❌ Connection test error:', error);
    return { connected: false, products: [], errors };
  }
};