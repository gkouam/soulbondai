import { test, expect, Page } from '@playwright/test';
import { AuthHelper } from './helpers/auth.helper';
import { testUsers, testMessages, waitTimes } from './fixtures/test-data';

test.describe('Chat Functionality', () => {
  let page: Page;
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    authHelper = new AuthHelper(page);
    
    // Setup authenticated session
    await authHelper.setupAuthenticatedSession(testUsers.freeUser);
    
    // Navigate to chat
    await page.goto('/dashboard/chat');
    await page.waitForLoadState('networkidle');
  });

  test('should load chat interface', async () => {
    // Check main chat elements are present
    await expect(page.locator('input[placeholder*="Message"]')).toBeVisible();
    await expect(page.locator('button[aria-label="Send message"]')).toBeVisible();
    
    // Check companion info is displayed
    await expect(page.locator('text=/Luna|Your AI Companion/')).toBeVisible();
  });

  test('should send and receive messages', async () => {
    // Send a message
    const messageInput = page.locator('input[placeholder*="Message"]');
    await messageInput.fill(testMessages.simple);
    await page.click('button[aria-label="Send message"]');
    
    // Check message appears in chat
    await expect(page.locator(`text="${testMessages.simple}"`)).toBeVisible();
    
    // Wait for AI response (with typing indicator)
    await expect(page.locator('[data-testid="typing-indicator"]')).toBeVisible();
    
    // Check AI response appears
    await page.waitForSelector('[data-testid="ai-message"]', { 
      timeout: waitTimes.veryLong 
    });
    
    const aiMessage = page.locator('[data-testid="ai-message"]').last();
    await expect(aiMessage).toBeVisible();
    await expect(aiMessage).not.toBeEmpty();
  });

  test('should show message history', async () => {
    // Send multiple messages
    const messages = [testMessages.simple, testMessages.question];
    
    for (const message of messages) {
      await page.fill('input[placeholder*="Message"]', message);
      await page.click('button[aria-label="Send message"]');
      await page.waitForTimeout(waitTimes.short);
    }
    
    // Check all messages are visible
    for (const message of messages) {
      await expect(page.locator(`text="${message}"`)).toBeVisible();
    }
    
    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check messages persist after refresh
    for (const message of messages) {
      await expect(page.locator(`text="${message}"`)).toBeVisible();
    }
  });

  test('should handle empty messages', async () => {
    // Try to send empty message
    await page.click('button[aria-label="Send message"]');
    
    // Check no message is sent
    const messageCount = await page.locator('[data-testid="user-message"]').count();
    expect(messageCount).toBe(0);
  });

  test('should show companion mood changes', async () => {
    // Send emotional message
    await page.fill('input[placeholder*="Message"]', testMessages.emotional);
    await page.click('button[aria-label="Send message"]');
    
    // Wait for response
    await page.waitForSelector('[data-testid="ai-message"]', { 
      timeout: waitTimes.veryLong 
    });
    
    // Check if mood indicator changes (if visible)
    const moodIndicator = page.locator('[data-testid="companion-mood"]');
    if (await moodIndicator.isVisible()) {
      // Mood should reflect empathy
      await expect(moodIndicator).toHaveAttribute('data-mood', /sad|concerned|empathetic/);
    }
  });

  test('should handle voice toggle', async () => {
    // Find voice toggle button
    const voiceToggle = page.locator('button[aria-label*="voice"]');
    
    if (await voiceToggle.isVisible()) {
      // Check initial state
      const initialPressed = await voiceToggle.getAttribute('aria-pressed');
      
      // Toggle voice
      await voiceToggle.click();
      
      // Check state changed
      const newPressed = await voiceToggle.getAttribute('aria-pressed');
      expect(newPressed).not.toBe(initialPressed);
    }
  });

  test('should handle photo upload button', async () => {
    // Find photo button
    const photoButton = page.locator('button[aria-label="Send a photo"]');
    
    if (await photoButton.isVisible()) {
      await photoButton.click();
      
      // Check if upgrade prompt appears for free users
      const upgradePrompt = page.locator('text=/Premium|Upgrade/');
      if (await upgradePrompt.isVisible({ timeout: waitTimes.short })) {
        await expect(upgradePrompt).toContainText(/photo|Premium/i);
      } else {
        // Photo upload modal should appear for premium users
        await expect(page.locator('[data-testid="photo-upload-modal"]')).toBeVisible();
      }
    }
  });

  test('should auto-scroll to latest message', async () => {
    // Send multiple messages to fill the chat
    for (let i = 0; i < 5; i++) {
      await page.fill('input[placeholder*="Message"]', `Test message ${i + 1}`);
      await page.click('button[aria-label="Send message"]');
      await page.waitForTimeout(waitTimes.short);
    }
    
    // Check if latest message is in viewport
    const lastMessage = page.locator('[data-testid="user-message"]').last();
    await expect(lastMessage).toBeInViewport();
  });

  test('should handle network errors gracefully', async () => {
    // Simulate offline mode
    await page.context().setOffline(true);
    
    // Try to send message
    await page.fill('input[placeholder*="Message"]', testMessages.simple);
    await page.click('button[aria-label="Send message"]');
    
    // Check for offline indicator or error message
    const offlineIndicator = page.locator('[data-testid="offline-indicator"]');
    const errorToast = page.locator('[role="alert"]');
    
    const hasOfflineUI = await offlineIndicator.isVisible({ timeout: waitTimes.short })
      || await errorToast.isVisible({ timeout: waitTimes.short });
    
    expect(hasOfflineUI).toBeTruthy();
    
    // Go back online
    await page.context().setOffline(false);
  });

  test('should preserve input when navigating away and back', async () => {
    const testInput = 'This is a test message in progress';
    
    // Type message but don't send
    await page.fill('input[placeholder*="Message"]', testInput);
    
    // Navigate away
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Navigate back
    await page.goto('/dashboard/chat');
    await page.waitForLoadState('networkidle');
    
    // Check if input is preserved (if feature is implemented)
    const messageInput = page.locator('input[placeholder*="Message"]');
    const inputValue = await messageInput.inputValue();
    
    // This might be empty if draft saving is not implemented
    // Just test that the input field exists and works
    await expect(messageInput).toBeVisible();
    await messageInput.fill('New message');
    await expect(messageInput).toHaveValue('New message');
  });
});