/**
 * Network Error Manager
 * Prevents infinite error loops by tracking network failures and backing off
 */

class NetworkErrorManager {
  private failureCount = 0;
  private lastFailureTime = 0;
  private isBackingOff = false;
  private backoffEndTime = 0;
  private readonly MAX_FAILURES = 3;
  private readonly BACKOFF_DURATION = 30000; // 30 seconds
  private readonly FAILURE_WINDOW = 5000; // 5 seconds

  /**
   * Record a network failure
   */
  recordFailure() {
    const now = Date.now();
    
    // Reset counter if last failure was more than 5 seconds ago
    if (now - this.lastFailureTime > this.FAILURE_WINDOW) {
      this.failureCount = 0;
    }
    
    this.failureCount++;
    this.lastFailureTime = now;
    
    // Start backoff if we've had too many failures
    if (this.failureCount >= this.MAX_FAILURES) {
      this.startBackoff();
    }
  }
  
  /**
   * Start backoff period
   */
  private startBackoff() {
    this.isBackingOff = true;
    this.backoffEndTime = Date.now() + this.BACKOFF_DURATION;
    console.log(`🛑 Network Error Manager: Too many failures. Backing off for ${this.BACKOFF_DURATION / 1000} seconds`);
    
    // Auto-clear backoff after duration
    setTimeout(() => {
      this.clearBackoff();
    }, this.BACKOFF_DURATION);
  }
  
  /**
   * Clear backoff state
   */
  clearBackoff() {
    this.isBackingOff = false;
    this.failureCount = 0;
    this.backoffEndTime = 0;
    console.log('✅ Network Error Manager: Backoff period ended, resuming normal operation');
  }
  
  /**
   * Check if we should allow a request
   */
  shouldAllowRequest(): boolean {
    if (!this.isBackingOff) {
      return true;
    }
    
    // Check if backoff period has ended
    if (Date.now() >= this.backoffEndTime) {
      this.clearBackoff();
      return true;
    }
    
    const remainingSeconds = Math.ceil((this.backoffEndTime - Date.now()) / 1000);
    console.log(`⏸️ Network Error Manager: Request blocked. ${remainingSeconds}s remaining in backoff`);
    return false;
  }
  
  /**
   * Record a successful request (resets failure count)
   */
  recordSuccess() {
    if (this.failureCount > 0) {
      console.log('✅ Network Error Manager: Connection restored');
    }
    this.failureCount = 0;
    this.isBackingOff = false;
  }
  
  /**
   * Get current status
   */
  getStatus() {
    return {
      isBackingOff: this.isBackingOff,
      failureCount: this.failureCount,
      remainingBackoffMs: this.isBackingOff ? Math.max(0, this.backoffEndTime - Date.now()) : 0
    };
  }
}

// Singleton instance
export const networkErrorManager = new NetworkErrorManager();