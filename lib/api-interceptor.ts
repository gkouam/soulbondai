'use client';

// Enhanced API interceptor for debugging
export function setupAPIInterceptor() {
  if (typeof window === 'undefined') return;

  // Store original fetch
  const originalFetch = window.fetch;

  // Override fetch to add logging
  window.fetch = async function(...args) {
    const [resource, config] = args;
    const url = typeof resource === 'string' ? resource : resource.url;
    const method = config?.method || 'GET';
    const startTime = performance.now();
    
    // Log request details
    console.group(`🚀 API Request: ${method} ${url}`);
    console.log('📍 URL:', url);
    console.log('📋 Method:', method);
    
    if (config?.headers) {
      console.log('📨 Headers:', config.headers);
    }
    
    if (config?.body) {
      try {
        const bodyData = typeof config.body === 'string' 
          ? JSON.parse(config.body) 
          : config.body;
        console.log('📦 Body:', bodyData);
      } catch {
        console.log('📦 Body:', config.body);
      }
    }
    
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('📍 Called from:', new Error().stack?.split('\n')[2]?.trim());
    console.groupEnd();

    try {
      // Make the actual request
      const response = await originalFetch.apply(this, args);
      const duration = Math.round(performance.now() - startTime);
      
      // Clone response to read it without consuming
      const clonedResponse = response.clone();
      
      // Log response details
      const statusEmoji = response.ok ? '✅' : '❌';
      console.group(`${statusEmoji} API Response: ${method} ${url}`);
      console.log('📊 Status:', response.status, response.statusText);
      console.log('⏱️ Duration:', `${duration}ms`);
      console.log('📍 URL:', url);
      
      // Log response headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });
      if (Object.keys(responseHeaders).length > 0) {
        console.log('📨 Response Headers:', responseHeaders);
      }
      
      // Try to log response body
      try {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const data = await clonedResponse.json();
          console.log('📦 Response Data:', data);
        }
      } catch (e) {
        // Ignore if can't parse response
      }
      
      console.groupEnd();
      
      return response;
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      
      // Log error details
      console.group(`💥 API Error: ${method} ${url}`);
      console.log('❌ Error:', error);
      console.log('⏱️ Duration:', `${duration}ms`);
      console.log('📍 URL:', url);
      console.log('🔍 Stack:', new Error().stack);
      console.groupEnd();
      
      throw error;
    }
  };

  console.log('🔧 API Interceptor installed - all fetch requests will be logged');
}

// Track all clicks on links and buttons
export function setupClickTracking() {
  if (typeof window === 'undefined') return;

  // Track link clicks
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    
    // Check if it's a link or button
    const link = target.closest('a');
    const button = target.closest('button');
    
    if (link) {
      const href = link.getAttribute('href');
      const isExternal = href?.startsWith('http');
      const isAPI = href?.startsWith('/api');
      
      console.group(`🔗 Link Click: ${href}`);
      console.log('📍 Href:', href);
      console.log('📝 Text:', link.textContent?.trim());
      console.log('🎯 Target:', link.target || '_self');
      console.log('🌐 Type:', isExternal ? 'External' : isAPI ? 'API' : 'Internal');
      console.log('⏰ Time:', new Date().toISOString());
      console.log('📐 Position:', { x: event.clientX, y: event.clientY });
      console.groupEnd();
    } else if (button) {
      const buttonText = button.textContent?.trim();
      const buttonType = button.type || 'button';
      const onClick = button.getAttribute('onclick');
      
      console.group(`🔘 Button Click: ${buttonText}`);
      console.log('📝 Text:', buttonText);
      console.log('🎯 Type:', buttonType);
      console.log('🎨 Classes:', button.className);
      console.log('🆔 ID:', button.id || 'none');
      if (onClick) console.log('📜 OnClick:', onClick);
      console.log('⏰ Time:', new Date().toISOString());
      console.log('📐 Position:', { x: event.clientX, y: event.clientY });
      console.groupEnd();
    }
  }, true);

  console.log('🔧 Click Tracking installed - all clicks will be logged');
}

// Track form submissions
export function setupFormTracking() {
  if (typeof window === 'undefined') return;

  document.addEventListener('submit', (event) => {
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const data: Record<string, any> = {};
    
    formData.forEach((value, key) => {
      data[key] = value;
    });
    
    console.group(`📝 Form Submit: ${form.action || 'unknown'}`);
    console.log('📍 Action:', form.action);
    console.log('📋 Method:', form.method);
    console.log('📦 Data:', data);
    console.log('🆔 Form ID:', form.id || 'none');
    console.log('⏰ Time:', new Date().toISOString());
    console.groupEnd();
  }, true);

  console.log('🔧 Form Tracking installed - all form submissions will be logged');
}

// Setup all interceptors
export function setupDebugLogging() {
  if (typeof window === 'undefined') return;
  
  // Only setup in development or if debug flag is set
  const isDebugMode = process.env.NODE_ENV === 'development' || 
                      localStorage.getItem('debug') === 'true' ||
                      window.location.search.includes('debug=true');
  
  if (!isDebugMode) {
    console.log('🔇 Debug logging disabled. Enable with localStorage.setItem("debug", "true")');
    return;
  }

  setupAPIInterceptor();
  setupClickTracking();
  setupFormTracking();
  
  // Log navigation events
  if (typeof window !== 'undefined') {
    window.addEventListener('popstate', () => {
      console.log(`🔄 Navigation: ${window.location.pathname}`);
    });
  }
  
  console.log(`
╔════════════════════════════════════════╗
║     🔍 DEBUG LOGGING ENABLED 🔍        ║
╠════════════════════════════════════════╣
║ • API calls will be logged             ║
║ • Clicks will be tracked               ║
║ • Forms will be monitored              ║
║ • Navigation will be tracked           ║
╠════════════════════════════════════════╣
║ Disable: localStorage.setItem('debug', 'false') ║
╚════════════════════════════════════════╝
  `);
}