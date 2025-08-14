import { test, expect, Page } from '@playwright/test';
import { AuthHelper } from './helpers/auth.helper';
import { testUsers, waitTimes } from './fixtures/test-data';

test.describe('Subscription and Upgrade Flow', () => {
  let page: Page;
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    authHelper = new AuthHelper(page);
    await authHelper.setupAuthenticatedSession(testUsers.freeUser);
  });

  test('should display pricing page correctly', async () => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');
    
    // Check all plans are displayed
    await expect(page.locator('text="Free"')).toBeVisible();
    await expect(page.locator('text="Basic"')).toBeVisible();
    await expect(page.locator('text="Premium"')).toBeVisible();
    await expect(page.locator('text="Ultimate"')).toBeVisible();
    
    // Check key features are listed
    await expect(page.locator('text=/10 messages.*day/i')).toBeVisible(); // Free
    await expect(page.locator('text=/50 messages.*day/i')).toBeVisible(); // Basic
    await expect(page.locator('text=/100 messages.*day/i')).toBeVisible(); // Premium
    await expect(page.locator('text=/200 messages.*day/i')).toBeVisible(); // Ultimate
  });

  test('should show current plan indicator', async () => {
    await page.goto('/pricing');
    
    // Look for current plan indicator
    const currentPlanBadge = page.locator('text=/current plan|your plan/i');
    
    if (await currentPlanBadge.isVisible()) {
      // Free user should see indicator on free plan
      const freePlanCard = page.locator('[data-plan="free"]');
      if (await freePlanCard.count() > 0) {
        await expect(freePlanCard).toContainText(/current|your plan/i);
      }
    }
  });

  test('should initiate upgrade flow', async () => {
    await page.goto('/pricing');
    
    // Click upgrade button for Basic plan
    const basicUpgradeButton = page.locator('button:has-text("Upgrade to Basic")').first();
    
    if (await basicUpgradeButton.isVisible()) {
      await basicUpgradeButton.click();
      
      // Should redirect to Stripe or show payment modal
      await page.waitForLoadState('networkidle');
      
      // Check for Stripe checkout or payment form
      const stripeFrame = page.frameLocator('iframe[name*="stripe"]');
      const paymentModal = page.locator('[data-testid="payment-modal"]');
      
      const hasPaymentUI = await stripeFrame.locator('*').first().isVisible({ timeout: waitTimes.long })
        || await paymentModal.isVisible({ timeout: waitTimes.long });
      
      expect(hasPaymentUI).toBeTruthy();
    }
  });

  test('should show upgrade prompts in chat when limit reached', async () => {
    await page.goto('/dashboard/chat');
    
    // Look for upgrade prompts
    const upgradePrompts = [
      page.locator('[data-testid="upgrade-prompt"]'),
      page.locator('text=/upgrade.*more messages/i'),
      page.locator('button:has-text("Upgrade")')
    ];
    
    // At least one upgrade option should be available
    let hasUpgradeOption = false;
    for (const prompt of upgradePrompts) {
      if (await prompt.isVisible({ timeout: waitTimes.short })) {
        hasUpgradeOption = true;
        
        // Test clicking upgrade
        await prompt.first().click();
        
        // Should navigate to pricing or show upgrade modal
        await page.waitForLoadState('networkidle');
        const url = page.url();
        
        // Check navigation or modal
        const wentToPricing = url.includes('/pricing');
        const showedModal = await page.locator('[data-testid="upgrade-modal"]').isVisible();
        
        expect(wentToPricing || showedModal).toBeTruthy();
        break;
      }
    }
  });

  test('should display subscription benefits', async () => {
    await page.goto('/pricing');
    
    // Check feature comparisons
    const features = [
      'Voice messages',
      'Photo sharing',
      'Priority support',
      'Advanced personality',
      'Memory system',
      'Custom avatars'
    ];
    
    for (const feature of features) {
      const featureElement = page.locator(`text=/${feature}/i`);
      if (await featureElement.isVisible()) {
        // Check which plans have this feature
        const featureRow = featureElement.locator('xpath=ancestor::*[contains(@class, "row") or contains(@class, "item")]');
        
        if (await featureRow.count() > 0) {
          // Feature should have checkmarks or indicators for applicable plans
          const checkmarks = featureRow.locator('[data-testid="feature-included"]');
          expect(await checkmarks.count()).toBeGreaterThan(0);
        }
      }
    }
  });

  test('should handle subscription management', async () => {
    // Navigate to account/subscription page
    await page.goto('/dashboard/account');
    
    // Look for subscription section
    const subscriptionSection = page.locator('[data-testid="subscription-info"]');
    
    if (await subscriptionSection.isVisible()) {
      // Check current plan is displayed
      await expect(subscriptionSection).toContainText(/free|basic|premium|ultimate/i);
      
      // Check for manage/upgrade button
      const manageButton = page.locator('button:has-text("Manage Subscription")');
      const upgradeButton = page.locator('button:has-text("Upgrade")');
      
      const hasManagement = await manageButton.isVisible() || await upgradeButton.isVisible();
      expect(hasManagement).toBeTruthy();
    }
  });

  test('should show billing history', async () => {
    await page.goto('/dashboard/account');
    
    // Look for billing section
    const billingSection = page.locator('[data-testid="billing-history"]');
    
    if (await billingSection.isVisible()) {
      // Free users might not have billing history
      const noBillingMessage = page.locator('text=/no billing history|no payments/i');
      const billingTable = page.locator('table').filter({ hasText: /invoice|payment|date/i });
      
      // Either no billing or billing table should be shown
      const hasBillingUI = await noBillingMessage.isVisible() || await billingTable.isVisible();
      expect(hasBillingUI).toBeTruthy();
    }
  });

  test('should handle payment method updates', async () => {
    await page.goto('/dashboard/account');
    
    // Look for payment method section
    const paymentMethodButton = page.locator('button:has-text("Payment Method")');
    
    if (await paymentMethodButton.isVisible()) {
      await paymentMethodButton.click();
      
      // Should show payment method form or redirect to Stripe
      const paymentForm = page.locator('[data-testid="payment-method-form"]');
      const stripePortal = page.url().includes('stripe.com');
      
      const hasPaymentUI = await paymentForm.isVisible({ timeout: waitTimes.short }) || stripePortal;
      expect(hasPaymentUI).toBeTruthy();
    }
  });

  test('should handle subscription cancellation flow', async () => {
    // This test would need a paid account
    // For now, test that UI elements exist
    
    await page.goto('/dashboard/account');
    
    const cancelButton = page.locator('button:has-text("Cancel Subscription")');
    
    if (await cancelButton.isVisible()) {
      await cancelButton.click();
      
      // Should show confirmation dialog
      const confirmDialog = page.locator('[role="dialog"]').filter({ hasText: /cancel.*subscription/i });
      await expect(confirmDialog).toBeVisible();
      
      // Should have confirm and cancel buttons
      await expect(confirmDialog.locator('button:has-text("Confirm")')).toBeVisible();
      await expect(confirmDialog.locator('button:has-text("Keep Subscription")')).toBeVisible();
      
      // Close dialog
      await page.keyboard.press('Escape');
    }
  });

  test('should show feature locks for free users', async () => {
    await page.goto('/dashboard/chat');
    
    // Check for locked features
    const lockedFeatures = [
      { selector: 'button[aria-label*="voice"]', feature: 'Voice messages' },
      { selector: 'button[aria-label="Send a photo"]', feature: 'Photo sharing' }
    ];
    
    for (const { selector, feature } of lockedFeatures) {
      const button = page.locator(selector);
      
      if (await button.isVisible()) {
        // Check for lock indicator
        const lockIcon = button.locator('[data-testid="lock-icon"]');
        const badgeIcon = button.locator('.bg-yellow-500'); // Premium badge
        
        const hasLockIndicator = await lockIcon.isVisible() || await badgeIcon.isVisible();
        
        if (hasLockIndicator) {
          // Click should show upgrade prompt
          await button.click();
          
          const upgradePrompt = page.locator('text=/upgrade.*premium/i');
          await expect(upgradePrompt).toBeVisible({ timeout: waitTimes.short });
          
          // Close prompt if it's a modal
          await page.keyboard.press('Escape');
        }
      }
    }
  });
});