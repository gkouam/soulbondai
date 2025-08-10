/**
 * Device detection utilities for optimizing UI/UX based on platform
 */

/**
 * Detects if the user is on an Apple device (iOS, iPadOS, or macOS)
 */
export function isAppleDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  const platform = window.navigator.platform?.toLowerCase() || '';
  
  // Check for iOS devices
  const isIOS = /iphone|ipad|ipod/.test(userAgent) || 
    (platform === 'macintel' && window.navigator.maxTouchPoints > 1); // iPad on iOS 13+
  
  // Check for macOS
  const isMac = platform.startsWith('mac');
  
  // Check for Safari on any Apple device
  const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
  
  return isIOS || isMac || (isSafari && /apple/.test(userAgent));
}

/**
 * Detects if the user is on a mobile device
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  const mobileKeywords = [
    'android', 'webos', 'iphone', 'ipad', 'ipod', 
    'blackberry', 'windows phone', 'mobile'
  ];
  
  // Check user agent
  const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));
  
  // Check touch support and screen size
  const hasTouch = 'ontouchstart' in window || window.navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth <= 768;
  
  return isMobileUA || (hasTouch && isSmallScreen);
}

/**
 * Detects if the device supports biometric authentication
 */
export async function supportsBiometric(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  // Check for WebAuthn support (modern biometric API)
  if (window.PublicKeyCredential) {
    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return available;
    } catch {
      return false;
    }
  }
  
  // Check for older Touch ID / Face ID support in Safari
  // @ts-ignore - Safari specific API
  if (window.PublicKeyCredential?.isConditionalMediationAvailable) {
    try {
      // @ts-ignore
      const available = await window.PublicKeyCredential.isConditionalMediationAvailable();
      return available;
    } catch {
      return false;
    }
  }
  
  return false;
}

/**
 * Provides haptic feedback if supported
 */
export function triggerHapticFeedback(duration: number = 10): void {
  if (typeof window === 'undefined') return;
  
  // Standard Vibration API
  if ('vibrate' in navigator) {
    navigator.vibrate(duration);
  }
  
  // iOS Haptic Feedback (if using Capacitor or similar)
  // @ts-ignore
  if (window.Capacitor?.Plugins?.Haptics) {
    // @ts-ignore
    window.Capacitor.Plugins.Haptics.impact({ style: 'light' });
  }
}

/**
 * Gets the safe area insets for the device
 */
export function getSafeAreaInsets() {
  if (typeof window === 'undefined') {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }
  
  const computedStyle = getComputedStyle(document.documentElement);
  
  return {
    top: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)') || '0'),
    right: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)') || '0'),
    bottom: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
    left: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)') || '0'),
  };
}

/**
 * Detects if the PWA is installed
 */
export function isPWAInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check if running in standalone mode (PWA)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
    // @ts-ignore - iOS specific
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://');
    
  return isStandalone;
}

/**
 * Detects the user's preferred color scheme
 */
export function getPreferredColorScheme(): 'light' | 'dark' | 'no-preference' {
  if (typeof window === 'undefined') return 'no-preference';
  
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  
  if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  
  return 'no-preference';
}