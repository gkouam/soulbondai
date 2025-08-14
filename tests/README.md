# End-to-End Testing Guide

## Overview

This directory contains comprehensive end-to-end tests for SoulBond AI using Playwright. The tests cover:

- Chat functionality
- Message limits and rate limiting
- Subscription and upgrade flows
- Complete user journeys
- Production smoke tests

## Setup

### Install Dependencies

```bash
# Install Playwright
npm install -D @playwright/test

# Install browsers
npx playwright install
```

### Environment Setup

Create a `.env.test` file for test environment:

```env
DATABASE_URL="your-test-database-url"
NEXTAUTH_SECRET="test-secret"
NEXTAUTH_URL="http://localhost:3000"
```

## Running Tests

### Run All Tests

```bash
npm run test:e2e
```

### Run Tests with UI

```bash
npm run test:e2e:ui
```

### Run Tests in Debug Mode

```bash
npm run test:e2e:debug
```

### Run Specific Test File

```bash
npx playwright test tests/e2e/chat.spec.ts
```

### Run Tests in Specific Browser

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Run Smoke Tests Only

```bash
npx playwright test tests/e2e/smoke.spec.ts
```

## Test Structure

### Test Files

- `chat.spec.ts` - Chat functionality tests
- `message-limits.spec.ts` - Rate limiting and message quota tests
- `subscription.spec.ts` - Subscription and upgrade flow tests
- `user-journey.spec.ts` - Complete user journey from signup to chat
- `smoke.spec.ts` - Quick production health checks

### Helpers

- `helpers/auth.helper.ts` - Authentication utilities
- `fixtures/test-data.ts` - Test users and data

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/path');
    await expect(page.locator('selector')).toBeVisible();
  });
});
```

### Using Auth Helper

```typescript
import { AuthHelper } from './helpers/auth.helper';

test('authenticated test', async ({ page }) => {
  const authHelper = new AuthHelper(page);
  await authHelper.login(testUser);
  // Now user is logged in
});
```

## CI/CD Integration

Tests run automatically on:
- Every push to `main`
- Pull requests
- Daily at 2 AM UTC (smoke tests against production)

### GitHub Actions Workflow

The `.github/workflows/e2e-tests.yml` file configures:
- Multi-browser testing (Chrome, Firefox, Safari)
- Test artifacts upload
- Production smoke tests
- Failure notifications

## Test Reports

### View HTML Report

After running tests:

```bash
npx playwright show-report
```

### Test Artifacts

On CI, test artifacts are saved:
- HTML reports
- Test videos (on failure)
- Screenshots (on failure)
- JUnit XML reports

## Best Practices

### 1. Use Data Attributes

Add `data-testid` attributes to elements for reliable selection:

```tsx
<button data-testid="send-button">Send</button>
```

### 2. Wait for Elements

Always wait for elements before interacting:

```typescript
await page.waitForSelector('[data-testid="element"]');
```

### 3. Use Page Objects

For complex pages, create page objects:

```typescript
class ChatPage {
  constructor(private page: Page) {}
  
  async sendMessage(text: string) {
    await this.page.fill('[data-testid="message-input"]', text);
    await this.page.click('[data-testid="send-button"]');
  }
}
```

### 4. Test Data Isolation

Use unique test data to avoid conflicts:

```typescript
const uniqueEmail = `test.${Date.now()}@example.com`;
```

### 5. Handle Flakiness

Add appropriate waits and retries:

```typescript
await page.waitForLoadState('networkidle');
await expect(element).toBeVisible({ timeout: 10000 });
```

## Debugging

### Debug Single Test

```bash
npx playwright test --debug tests/e2e/chat.spec.ts
```

### View Browser

Run tests in headed mode:

```bash
npx playwright test --headed
```

### Slow Down Execution

```bash
npx playwright test --headed --slow-mo=1000
```

### Generate Code

Use codegen to generate test code:

```bash
npx playwright codegen https://soulbondai.com
```

## Performance Testing

### Measure Load Times

```typescript
test('should load quickly', async ({ page }) => {
  const startTime = Date.now();
  await page.goto('/');
  const loadTime = Date.now() - startTime;
  expect(loadTime).toBeLessThan(3000);
});
```

### Check Core Web Vitals

```typescript
test('should have good LCP', async ({ page }) => {
  await page.goto('/');
  const lcp = await page.evaluate(() => {
    return new Promise((resolve) => {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        resolve(entries[entries.length - 1].startTime);
      }).observe({ entryTypes: ['largest-contentful-paint'] });
    });
  });
  expect(lcp).toBeLessThan(2500);
});
```

## Troubleshooting

### Tests Failing Locally

1. Check environment variables
2. Ensure database is running
3. Clear test database: `npx prisma migrate reset`
4. Update browsers: `npx playwright install`

### Tests Failing in CI

1. Check secrets are configured
2. Review workflow logs
3. Download artifacts for debugging
4. Check for timing issues

### Flaky Tests

1. Add explicit waits
2. Use `waitForLoadState('networkidle')`
3. Increase timeouts
4. Use retries in config

## Coverage

To generate test coverage report:

```bash
# Run tests with coverage
npx playwright test --reporter=html

# View coverage
npx playwright show-report
```

## Contributing

When adding new features:
1. Write E2E tests for critical paths
2. Add data-testid attributes
3. Update test fixtures if needed
4. Ensure tests pass locally
5. Document any special setup