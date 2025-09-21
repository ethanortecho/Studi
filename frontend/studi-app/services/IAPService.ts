import {
  initConnection,
  purchaseUpdatedListener,
  purchaseErrorListener,
  getSubscriptions,
  requestSubscription,
  finishTransaction,
  Purchase,
  PurchaseError,
  Subscription,
} from 'react-native-iap';

class IAPService {
  private isInitialized = false;
  private readonly PRODUCT_ID = 'com.studi.premium.monthly';

  async initialize(): Promise<boolean> {
    try {
      console.log('🔧 Initializing IAP connection...');

      const result = await initConnection();
      console.log('✅ IAP connection result:', result);

      this.setupPurchaseListeners();
      this.isInitialized = true;

      return true;
    } catch (error) {
      console.error('❌ Failed to initialize IAP:', error);
      return false;
    }
  }

  private setupPurchaseListeners(): void {
    // Listen for successful purchases
    purchaseUpdatedListener(async (purchase: Purchase) => {
      console.log('🎉 Purchase successful:', purchase);

      try {
        // Finish the transaction to complete the purchase
        await finishTransaction({ purchase });
        console.log('✅ Transaction finished successfully');

        // TODO: Update user premium status in backend
      } catch (error) {
        console.error('❌ Error finishing transaction:', error);
      }
    });

    // Listen for purchase errors
    purchaseErrorListener((error: PurchaseError) => {
      console.log('⚠️ Purchase error:', error);

      if (error.code === 'E_USER_CANCELLED') {
        console.log('👤 User cancelled the purchase');
      } else {
        console.error('❌ Purchase failed:', error.message);
      }
    });
  }

  async purchaseSubscription(): Promise<void> {
    try {
      console.log('🔧 purchaseSubscription called, isInitialized:', this.isInitialized);

      // Initialize if not already done
      if (!this.isInitialized) {
        console.log('🔧 Initializing IAP...');
        const initialized = await this.initialize();
        console.log('🔧 Initialize result:', initialized);
        if (!initialized) {
          throw new Error('Failed to initialize IAP');
        }
      }

      console.log('🛒 Loading subscription products for:', this.PRODUCT_ID);

      // Load available subscriptions
      const subscriptions = await getSubscriptions({ skus: [this.PRODUCT_ID] });
      console.log('📦 Available subscriptions count:', subscriptions.length);
      console.log('📦 Subscriptions details:', subscriptions);

      if (subscriptions.length === 0) {
        const errorMsg = `Subscription ${this.PRODUCT_ID} not found in App Store`;
        console.error('❌', errorMsg);
        throw new Error(errorMsg);
      }

      console.log('🚀 Requesting subscription purchase for:', this.PRODUCT_ID);

      // Request the subscription purchase
      await requestSubscription({
        sku: this.PRODUCT_ID,
      });

      console.log('⏳ Purchase request sent to Apple successfully');

    } catch (error: any) {
      console.error('❌ Subscription purchase failed:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      throw error;
    }
  }
}

// Export a singleton instance
export const iapService = new IAPService();