'use client';

import { usePageTracking } from '@/hooks/use-page-tracking';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { logger } from '@/lib/logger';

export function TrackingProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  
  // Track page views
  usePageTracking();
  
  // Track session changes
  useEffect(() => {
    if (session?.user) {
      console.log('\n' + '🔐'.repeat(30));
      console.log('SESSION ESTABLISHED');
      console.log(`👤 User: ${session.user.email}`);
      console.log(`🆔 ID: ${session.user.id}`);
      console.log(`👮 Role: ${session.user.role || 'USER'}`);
      console.log('🔐'.repeat(30) + '\n');
      
      logger.auth('login', true, {
        userId: session.user.id,
        metadata: {
          email: session.user.email,
          role: session.user.role
        }
      });
    }
  }, [session]);
  
  // Track global errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('\n' + '💥'.repeat(30));
      console.error('GLOBAL ERROR CAUGHT');
      console.error(`📍 File: ${event.filename}`);
      console.error(`📝 Message: ${event.message}`);
      console.error(`📍 Line: ${event.lineno}:${event.colno}`);
      console.error('💥'.repeat(30) + '\n');
      
      logger.error('Global Error', new Error(event.message), {
        filename: event.filename,
        line: event.lineno,
        column: event.colno
      });
    };
    
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('\n' + '⚠️'.repeat(30));
      console.error('UNHANDLED PROMISE REJECTION');
      console.error(`📝 Reason: ${event.reason}`);
      console.error('⚠️'.repeat(30) + '\n');
      
      logger.error('Unhandled Promise Rejection', event.reason);
    };
    
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
  
  // Track visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      const state = document.hidden ? 'hidden' : 'visible';
      console.log(`👁️ Page Visibility: ${state}`);
      
      logger.info(`Page visibility changed: ${state}`, {
        metadata: {
          timestamp: new Date().toISOString(),
          path: window.location.pathname
        }
      });
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  return <>{children}</>;
}