'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { logger } from '@/lib/logger';

/**
 * Hook to track page views and navigation
 */
export function usePageTracking() {
  const pathname = usePathname();

  useEffect(() => {
    const startTime = performance.now();
    
    // Simple, clean console logging
    console.log(`📄 Page Load: ${pathname} (${Math.round(startTime)}ms)`);
    
    
    // Log to centralized logger
    logger.page({
      path: pathname,
      action: 'load',
      loadTime: Math.round(startTime),
      metadata: {
        referrer: document.referrer,
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
        platform: navigator.platform,
        language: navigator.language
      }
    });

    // Cleanup function to log page leave
    return () => {
      const duration = performance.now() - startTime;
      console.log(`👋 Page Leave: ${pathname} (${Math.round(duration)}ms)`);
      
      logger.page({
        path: pathname,
        action: 'leave',
        metadata: {
          timeOnPage: Math.round(duration)
        }
      });
    };
  }, [pathname]);
}

/**
 * Hook to track specific user actions
 */
export function useActionTracking(userId?: string) {
  const logAction = (action: string, details?: Record<string, any>) => {
    console.log(`🎯 User Action: ${action}`, {
      user: userId || 'anonymous',
      ...details,
      time: new Date().toISOString()
    });
    
    logger.userJourney(userId || 'anonymous', action, details);
  };

  return { logAction };
}

/**
 * Hook to track API calls with expected navigation
 */
export function useAPITracking() {
  const trackAPICall = async (
    url: string,
    options?: RequestInit,
    expectedNavigation?: string
  ): Promise<Response> => {
    const startTime = Date.now();
    const method = options?.method || 'GET';
    
    console.log(`🚀 API Call: ${method} ${url}`, {
      expectedNav: expectedNavigation,
      hasBody: !!options?.body
    });
    
    try {
      const response = await fetch(url, options);
      const duration = Date.now() - startTime;
      
      const redirectTo = response.headers.get('x-redirect-to');
      console.log(`✅ API Response: ${response.status}`, {
        duration: `${duration}ms`,
        redirect: redirectTo || 'none'
      });
      
      logger.endpoint({
        method,
        path: url,
        statusCode: response.status,
        duration,
        resultingPage: redirectTo || expectedNavigation
      });
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      console.error(`❌ API Failed: ${url}`, {
        error: error?.message || error,
        duration: `${duration}ms`
      });
      
      logger.endpoint({
        method,
        path: url,
        statusCode: 0,
        duration
      });
      
      throw error;
    }
  };

  return { trackAPICall };
}