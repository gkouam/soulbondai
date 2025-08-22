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
    
    // Log page load
    console.log('\n' + '🌟'.repeat(40));
    console.log('📄 CLIENT PAGE LOAD');
    console.log('🌟'.repeat(40));
    console.log(`📍 Path: ${pathname}`);
    console.log(`⏰ Time: ${new Date().toISOString()}`);
    console.log(`📊 Load Time: ${Math.round(startTime)}ms`);
    
    // Log browser information
    if (typeof window !== 'undefined') {
      console.log(`🌐 Browser: ${navigator.userAgent.slice(0, 50)}...`);
      console.log(`📱 Screen: ${window.innerWidth}x${window.innerHeight}`);
      console.log(`🔗 Referrer: ${document.referrer || 'Direct'}`);
      
      // Check if this is a navigation or initial load
      const isNavigation = window.performance?.navigation?.type === 1;
      console.log(`🚀 Type: ${isNavigation ? 'Navigation' : 'Initial Load'}`);
    }
    
    console.log('🌟'.repeat(40) + '\n');
    
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
      
      console.log('\n' + '👋'.repeat(30));
      console.log('📄 CLIENT PAGE LEAVE');
      console.log(`📍 Path: ${pathname}`);
      console.log(`⏱️ Time on Page: ${Math.round(duration)}ms`);
      console.log('👋'.repeat(30) + '\n');
      
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
    console.log('\n' + '🎯'.repeat(25));
    console.log('USER ACTION');
    console.log(`🎯 Action: ${action}`);
    
    if (userId) {
      console.log(`👤 User: ${userId}`);
    }
    
    if (details) {
      console.log('📊 Details:', JSON.stringify(details, null, 2));
    }
    
    console.log(`⏰ Time: ${new Date().toISOString()}`);
    console.log('🎯'.repeat(25) + '\n');
    
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
    
    console.log('\n' + '🚀'.repeat(30));
    console.log('CLIENT API CALL');
    console.log(`📍 ${method} ${url}`);
    
    if (expectedNavigation) {
      console.log(`🔄 Expected Navigation: ${expectedNavigation}`);
    }
    
    if (options?.body) {
      console.log('📦 Request Body:', options.body);
    }
    
    console.log('🚀'.repeat(30));
    
    try {
      const response = await fetch(url, options);
      const duration = Date.now() - startTime;
      
      console.log(`✅ Response: ${response.status} ${response.statusText}`);
      console.log(`⏱️ Duration: ${duration}ms`);
      
      // Check for redirect header
      const redirectTo = response.headers.get('x-redirect-to');
      if (redirectTo) {
        console.log(`📍 Server says redirect to: ${redirectTo}`);
      }
      
      console.log('─'.repeat(60) + '\n');
      
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
      
      console.log(`❌ Request Failed: ${error}`);
      console.log(`⏱️ Duration: ${duration}ms`);
      console.log('─'.repeat(60) + '\n');
      
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