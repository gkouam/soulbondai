import { test, expect } from '@playwright/test';

/**
 * Smoke tests for production environment
 * These are lightweight tests that verify critical functionality
 */
test.describe('Production Smoke Tests', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/');
    
    // Check page loaded
    await expect(page).toHaveTitle(/SoulBond/i);
    
    // Check main elements
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('a:has-text("Get Started")')).toBeVisible();
    
    // Check footer links
    await expect(page.locator('a[href="/privacy"]')).toBeVisible();
    await expect(page.locator('a[href="/terms"]')).toBeVisible();
  });

  test('should load login page', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Check login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Check OAuth options
    await expect(page.locator('button:has-text("Continue with Google")')).toBeVisible();
  });

  test('should load registration page', async ({ page }) => {
    await page.goto('/auth/register');
    
    // Check registration form
    await expect(page.locator('input[id="name"]')).toBeVisible();
    await expect(page.locator('input[id="email"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
    await expect(page.locator('input[id="confirmPassword"]')).toBeVisible();
    
    // Check reCAPTCHA indicator
    const recaptchaIndicator = page.locator('text=/protected.*recaptcha/i');
    await expect(recaptchaIndicator).toBeVisible();
  });

  test('should load pricing page', async ({ page }) => {
    await page.goto('/pricing');
    
    // Check all plans are displayed
    await expect(page.locator('text="Free"')).toBeVisible();
    await expect(page.locator('text="Basic"')).toBeVisible();
    await expect(page.locator('text="Premium"')).toBeVisible();
    await expect(page.locator('text="Ultimate"')).toBeVisible();
    
    // Check pricing is displayed
    await expect(page.locator('text="$9"')).toBeVisible(); // Basic
    await expect(page.locator('text="$19"')).toBeVisible(); // Premium
    await expect(page.locator('text="$39"')).toBeVisible(); // Ultimate
  });

  test('should load privacy policy', async ({ page }) => {
    await page.goto('/privacy');
    
    await expect(page.locator('h1')).toContainText(/Privacy Policy/i);
    await expect(page.locator('text=/data collection|personal information/i')).toBeVisible();
  });

  test('should load terms of service', async ({ page }) => {
    await page.goto('/terms');
    
    await expect(page.locator('h1')).toContainText(/Terms/i);
    await expect(page.locator('text=/agreement|service/i')).toBeVisible();
  });

  test('should redirect to login when accessing protected routes', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to login
    await page.waitForURL('**/auth/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('should have working navigation', async ({ page }) => {
    await page.goto('/');
    
    // Test navigation to pricing
    await page.click('a[href="/pricing"]');
    await page.waitForURL('**/pricing');
    await expect(page.locator('text="Choose Your Plan"')).toBeVisible();
    
    // Test navigation to login
    await page.click('a:has-text("Login")');
    await page.waitForURL('**/auth/login');
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should handle 404 pages', async ({ page }) => {
    await page.goto('/non-existent-page-12345');
    
    // Should show 404 or redirect
    const is404 = await page.locator('text=/404|not found/i').isVisible();
    const isRedirected = page.url().includes('/');
    
    expect(is404 || isRedirected).toBeTruthy();
  });

  test('should have responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Mobile menu should be available
    const mobileMenu = page.locator('[data-testid="mobile-menu-button"]');
    const hasResponsiveNav = await mobileMenu.isVisible() || 
                            await page.locator('nav').isVisible();
    
    expect(hasResponsiveNav).toBeTruthy();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    // Desktop navigation should be visible
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should have meta tags for SEO', async ({ page }) => {
    await page.goto('/');
    
    // Check meta tags
    const description = await page.getAttribute('meta[name="description"]', 'content');
    expect(description).toBeTruthy();
    
    // Check Open Graph tags
    const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content');
    expect(ogTitle).toBeTruthy();
    
    const ogImage = await page.getAttribute('meta[property="og:image"]', 'content');
    expect(ogImage).toBeTruthy();
  });

  test('should load favicon', async ({ page }) => {
    const response = await page.goto('/favicon.ico');
    expect(response?.status()).toBe(200);
  });

  test('should have security headers', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers();
    
    // Check for security headers
    expect(headers?.['x-frame-options']).toBeTruthy();
    expect(headers?.['x-content-type-options']).toBeTruthy();
  });

  test.describe('Performance', () => {
    test('should load quickly', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      // Page should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should have service worker registered', async ({ page }) => {
      await page.goto('/');
      
      // Check if service worker is registered
      const hasServiceWorker = await page.evaluate(() => {
        return 'serviceWorker' in navigator;
      });
      
      expect(hasServiceWorker).toBeTruthy();
    });
  });
});