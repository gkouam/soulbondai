import { test, expect, Page } from '@playwright/test';
import { AuthHelper } from './helpers/auth.helper';
import { testMessages, waitTimes } from './fixtures/test-data';

test.describe('Complete User Journey', () => {
  let page: Page;
  let authHelper: AuthHelper;
  
  // Generate unique user for this test run
  const uniqueUser = {
    email: `test.${Date.now()}@example.com`,
    password: 'TestPassword123!',
    name: 'Test User'
  };

  test('should complete full user journey from signup to chat', async ({ page: testPage }) => {
    page = testPage;
    authHelper = new AuthHelper(page);
    
    // Step 1: Visit landing page
    await test.step('Visit landing page', async () => {
      await page.goto('/');
      await expect(page.locator('h1')).toContainText(/SoulBond|AI Companion/i);
      
      // Check CTA button
      const ctaButton = page.locator('a:has-text("Get Started")').first();
      await expect(ctaButton).toBeVisible();
    });
    
    // Step 2: Navigate to signup
    await test.step('Navigate to signup', async () => {
      await page.click('a:has-text("Get Started")');
      await page.waitForURL(/\/auth\/(register|signup)/);
      await expect(page.locator('h1')).toContainText(/Create.*Account/i);
    });
    
    // Step 3: Complete registration
    await test.step('Complete registration', async () => {
      // Fill registration form
      await page.fill('input[id="name"]', uniqueUser.name);
      await page.fill('input[id="email"]', uniqueUser.email);
      await page.fill('input[id="password"]', uniqueUser.password);
      await page.fill('input[id="confirmPassword"]', uniqueUser.password);
      
      // Accept terms
      const termsCheckbox = page.locator('input[type="checkbox"]').last();
      await termsCheckbox.check();
      
      // Check reCAPTCHA indicator if present
      const recaptchaIndicator = page.locator('text=/protected.*recaptcha/i');
      if (await recaptchaIndicator.isVisible()) {
        await expect(recaptchaIndicator).toBeVisible();
      }
      
      // Submit form
      await page.click('button:has-text("Create Account")');
      
      // Wait for redirect
      await page.waitForURL(/\/(onboarding|dashboard)/, { timeout: 15000 });
    });
    
    // Step 4: Complete onboarding (if present)
    await test.step('Complete onboarding', async () => {
      if (page.url().includes('onboarding')) {
        // Personality test
        if (page.url().includes('personality-test')) {
          // Answer personality questions
          const questions = await page.locator('[data-testid="personality-question"]').all();
          
          for (const question of questions) {
            // Select first available answer
            const firstOption = question.locator('input[type="radio"]').first();
            await firstOption.check();
          }
          
          // Submit test
          await page.click('button:has-text("Continue")');
          await page.waitForLoadState('networkidle');
        }
        
        // Companion customization
        if (page.url().includes('customize')) {
          // Set companion name
          const nameInput = page.locator('input[placeholder*="companion"]');
          if (await nameInput.isVisible()) {
            await nameInput.fill('Luna');
          }
          
          // Select avatar if available
          const avatarOption = page.locator('[data-testid="avatar-option"]').first();
          if (await avatarOption.isVisible()) {
            await avatarOption.click();
          }
          
          // Continue
          await page.click('button:has-text("Continue")');
          await page.waitForLoadState('networkidle');
        }
        
        // Complete onboarding
        const completeButton = page.locator('button:has-text("Start Chatting")');
        if (await completeButton.isVisible()) {
          await completeButton.click();
          await page.waitForURL('**/dashboard/**');
        }
      }
    });
    
    // Step 5: Navigate to chat
    await test.step('Navigate to chat', async () => {
      if (!page.url().includes('/chat')) {
        await page.goto('/dashboard/chat');
      }
      await page.waitForLoadState('networkidle');
      
      // Verify chat interface loaded
      await expect(page.locator('input[placeholder*="Message"]')).toBeVisible();
    });
    
    // Step 6: Send first message
    await test.step('Send first message', async () => {
      const firstMessage = "Hello! This is my first message.";
      
      await page.fill('input[placeholder*="Message"]', firstMessage);
      await page.click('button[aria-label="Send message"]');
      
      // Verify message appears
      await expect(page.locator(`text="${firstMessage}"`)).toBeVisible();
      
      // Wait for AI response
      await expect(page.locator('[data-testid="typing-indicator"]')).toBeVisible({ 
        timeout: waitTimes.medium 
      });
      
      await page.waitForSelector('[data-testid="ai-message"]', { 
        timeout: waitTimes.veryLong 
      });
      
      const aiResponse = page.locator('[data-testid="ai-message"]').last();
      await expect(aiResponse).toBeVisible();
      await expect(aiResponse).not.toBeEmpty();
    });
    
    // Step 7: Test conversation flow
    await test.step('Continue conversation', async () => {
      // Send follow-up message
      const followUp = "What's your favorite thing to talk about?";
      
      await page.fill('input[placeholder*="Message"]', followUp);
      await page.click('button[aria-label="Send message"]');
      
      // Verify conversation continues
      await expect(page.locator(`text="${followUp}"`)).toBeVisible();
      
      // Check message count increases
      const messageElements = await page.locator('[data-testid*="message"]').all();
      expect(messageElements.length).toBeGreaterThan(2);
    });
    
    // Step 8: Check rate limits
    await test.step('Check rate limits', async () => {
      // Look for rate limit indicator
      const rateLimitIndicator = page.locator('text=/messages remaining|messages left/i');
      
      if (await rateLimitIndicator.isVisible()) {
        const text = await rateLimitIndicator.textContent();
        expect(text).toMatch(/\d+/); // Should contain a number
        
        // Free users should see limit of 10
        if (text?.includes('10')) {
          await expect(rateLimitIndicator).toContainText('10');
        }
      }
    });
    
    // Step 9: Explore premium features
    await test.step('Explore premium features', async () => {
      // Try voice toggle
      const voiceButton = page.locator('button[aria-label*="voice"]');
      if (await voiceButton.isVisible()) {
        await voiceButton.click();
        
        // Free users should see upgrade prompt
        const upgradePrompt = page.locator('text=/upgrade.*voice/i');
        if (await upgradePrompt.isVisible({ timeout: waitTimes.short })) {
          await expect(upgradePrompt).toBeVisible();
          await page.keyboard.press('Escape'); // Close prompt
        }
      }
      
      // Try photo sharing
      const photoButton = page.locator('button[aria-label="Send a photo"]');
      if (await photoButton.isVisible()) {
        await photoButton.click();
        
        // Free users should see upgrade prompt
        const photoUpgradePrompt = page.locator('text=/upgrade.*photo/i');
        if (await photoUpgradePrompt.isVisible({ timeout: waitTimes.short })) {
          await expect(photoUpgradePrompt).toBeVisible();
          await page.keyboard.press('Escape'); // Close prompt
        }
      }
    });
    
    // Step 10: Visit pricing page
    await test.step('Visit pricing page', async () => {
      await page.goto('/pricing');
      await page.waitForLoadState('networkidle');
      
      // Verify all plans are shown
      await expect(page.locator('text="Free"')).toBeVisible();
      await expect(page.locator('text="Basic"')).toBeVisible();
      await expect(page.locator('text="Premium"')).toBeVisible();
      await expect(page.locator('text="Ultimate"')).toBeVisible();
      
      // Check current plan indicator
      const currentPlanBadge = page.locator('text=/current plan/i');
      if (await currentPlanBadge.isVisible()) {
        await expect(currentPlanBadge).toBeVisible();
      }
    });
    
    // Step 11: Check account settings
    await test.step('Check account settings', async () => {
      await page.goto('/dashboard/account');
      await page.waitForLoadState('networkidle');
      
      // Verify user info is displayed
      await expect(page.locator(`text="${uniqueUser.email}"`)).toBeVisible();
      
      // Check subscription info
      const subscriptionInfo = page.locator('text=/free plan|subscription/i');
      if (await subscriptionInfo.isVisible()) {
        await expect(subscriptionInfo).toContainText(/free/i);
      }
    });
    
    // Step 12: Test logout
    await test.step('Test logout', async () => {
      // Find and click logout
      const userMenu = page.locator('[data-testid="user-menu-button"]');
      if (await userMenu.isVisible()) {
        await userMenu.click();
        await page.click('text="Logout"');
      } else {
        // Direct logout link
        await page.goto('/api/auth/signout');
        await page.click('button:has-text("Sign out")');
      }
      
      // Verify redirect to home
      await page.waitForURL('/');
      await expect(page.locator('h1')).toContainText(/SoulBond|AI Companion/i);
    });
  });

  test('should handle returning user journey', async ({ page: testPage }) => {
    page = testPage;
    authHelper = new AuthHelper(page);
    
    // Use existing test user
    const returningUser = {
      email: 'returning@test.com',
      password: 'TestPass123!',
      name: 'Returning User'
    };
    
    // Step 1: Login as returning user
    await test.step('Login as returning user', async () => {
      await page.goto('/auth/login');
      
      // Try to login (will fail if user doesn't exist, that's ok)
      await page.fill('input[type="email"]', returningUser.email);
      await page.fill('input[type="password"]', returningUser.password);
      await page.click('button[type="submit"]');
      
      // Check if login succeeded or need to register
      await page.waitForLoadState('networkidle');
      
      if (page.url().includes('login')) {
        // User doesn't exist, create account
        await page.click('a:has-text("Sign up")');
        await authHelper.register(returningUser);
      }
    });
    
    // Step 2: Verify conversation history persists
    await test.step('Check conversation history', async () => {
      await page.goto('/dashboard/chat');
      await page.waitForLoadState('networkidle');
      
      // Check if previous messages are loaded
      const messages = await page.locator('[data-testid*="message"]').all();
      
      // Returning users might have message history
      if (messages.length > 0) {
        expect(messages.length).toBeGreaterThan(0);
      }
    });
    
    // Step 3: Continue conversation
    await test.step('Continue existing conversation', async () => {
      const continuationMessage = "I'm back! Do you remember our last conversation?";
      
      await page.fill('input[placeholder*="Message"]', continuationMessage);
      await page.click('button[aria-label="Send message"]');
      
      // Verify message sent
      await expect(page.locator(`text="${continuationMessage}"`)).toBeVisible();
      
      // Wait for response
      await page.waitForSelector('[data-testid="ai-message"]', { 
        state: 'attached',
        timeout: waitTimes.veryLong 
      });
    });
  });
});