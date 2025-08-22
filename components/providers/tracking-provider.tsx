'use client';

import { usePageTracking } from '@/hooks/use-page-tracking';
import { useSession } from 'next-auth/react';
import { useEffect, Component, ReactNode } from 'react';
import { logger } from '@/lib/logger';

// Simple error boundary implementation
class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error('Error Boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }

    return this.props.children;
  }
}

function TrackingProviderInner({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  
  // Track page views
  try {
    usePageTracking();
  } catch (error) {
    console.error('Page tracking error:', error);
  }
  
  // Track session changes
  useEffect(() => {
    if (session?.user) {
      console.log(`🔐 Session: ${session.user.email} (${session.user.role || 'USER'})`);
      
      logger.info('User session established', {
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role
      });
    }
  }, [session]);
  
  // Track global errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error(`💥 Global Error: ${event.message} at ${event.filename}:${event.lineno}`);
      
      logger.error('Global Error', new Error(event.message), {
        filename: event.filename,
        line: event.lineno,
        column: event.colno
      });
    };
    
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error(`⚠️ Unhandled Promise: ${event.reason}`);
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

export function TrackingProvider({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <TrackingProviderInner>{children}</TrackingProviderInner>
    </ErrorBoundary>
  );
}