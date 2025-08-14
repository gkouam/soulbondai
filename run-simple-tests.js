const { chromium } = require('playwright');

async function runTests() {
  console.log('🚀 Starting E2E Tests for SoulBond AI\n');
  console.log('=====================================\n');
  
  let browser;
  let passed = 0;
  let failed = 0;
  
  try {
    browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Test 1: Homepage loads
    console.log('📝 Test 1: Homepage loads');
    try {
      await page.goto('https://soulbondai.com', { timeout: 30000 });
      const title = await page.title();
      if (title.includes('SoulBond')) {
        console.log('✅ PASSED: Homepage loads with correct title\n');
        passed++;
      } else {
        console.log('❌ FAILED: Homepage title incorrect\n');
        failed++;
      }
    } catch (error) {
      console.log('❌ FAILED: Could not load homepage\n');
      failed++;
    }
    
    // Test 2: Login page
    console.log('📝 Test 2: Login page');
    try {
      await page.goto('https://soulbondai.com/auth/login', { timeout: 30000 });
      const emailInput = await page.locator('input[type="email"]').isVisible();
      const passwordInput = await page.locator('input[type="password"]').isVisible();
      if (emailInput && passwordInput) {
        console.log('✅ PASSED: Login form elements present\n');
        passed++;
      } else {
        console.log('❌ FAILED: Login form missing elements\n');
        failed++;
      }
    } catch (error) {
      console.log('❌ FAILED: Could not test login page\n');
      failed++;
    }
    
    // Test 3: Registration page with reCAPTCHA
    console.log('📝 Test 3: Registration page with reCAPTCHA');
    try {
      await page.goto('https://soulbondai.com/auth/register', { timeout: 30000 });
      const nameInput = await page.locator('input[id="name"]').isVisible();
      const recaptcha = await page.locator('text=/protected.*recaptcha/i').isVisible();
      if (nameInput && recaptcha) {
        console.log('✅ PASSED: Registration form with reCAPTCHA protection\n');
        passed++;
      } else {
        console.log('❌ FAILED: Registration form or reCAPTCHA missing\n');
        failed++;
      }
    } catch (error) {
      console.log('❌ FAILED: Could not test registration page\n');
      failed++;
    }
    
    // Test 4: Pricing page
    console.log('📝 Test 4: Pricing page');
    try {
      await page.goto('https://soulbondai.com/pricing', { timeout: 30000 });
      const free = await page.locator('text="Free"').isVisible();
      const basic = await page.locator('text="Basic"').isVisible();
      const premium = await page.locator('text="Premium"').isVisible();
      const ultimate = await page.locator('text="Ultimate"').isVisible();
      if (free && basic && premium && ultimate) {
        console.log('✅ PASSED: All pricing tiers displayed\n');
        passed++;
      } else {
        console.log('❌ FAILED: Some pricing tiers missing\n');
        failed++;
      }
    } catch (error) {
      console.log('❌ FAILED: Could not test pricing page\n');
      failed++;
    }
    
    // Test 5: Privacy and Terms pages
    console.log('📝 Test 5: Privacy and Terms pages');
    try {
      await page.goto('https://soulbondai.com/privacy', { timeout: 30000 });
      const privacyTitle = await page.locator('h1').textContent();
      
      await page.goto('https://soulbondai.com/terms', { timeout: 30000 });
      const termsTitle = await page.locator('h1').textContent();
      
      if (privacyTitle && termsTitle) {
        console.log('✅ PASSED: Privacy and Terms pages exist\n');
        passed++;
      } else {
        console.log('❌ FAILED: Privacy or Terms pages missing\n');
        failed++;
      }
    } catch (error) {
      console.log('❌ FAILED: Could not test legal pages\n');
      failed++;
    }
    
    // Test 6: Protected route redirect
    console.log('📝 Test 6: Protected route redirect');
    try {
      await page.goto('https://soulbondai.com/dashboard', { timeout: 30000 });
      const url = page.url();
      if (url.includes('auth/login')) {
        console.log('✅ PASSED: Protected routes redirect to login\n');
        passed++;
      } else {
        console.log('❌ FAILED: Protected route did not redirect\n');
        failed++;
      }
    } catch (error) {
      console.log('❌ FAILED: Could not test protected routes\n');
      failed++;
    }
    
    // Test 7: Mobile responsiveness
    console.log('📝 Test 7: Mobile responsiveness');
    try {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('https://soulbondai.com', { timeout: 30000 });
      const mobileVisible = await page.locator('h1').first().isVisible();
      
      await page.setViewportSize({ width: 1920, height: 1080 });
      const desktopVisible = await page.locator('h1').first().isVisible();
      
      if (mobileVisible && desktopVisible) {
        console.log('✅ PASSED: Responsive design works\n');
        passed++;
      } else {
        console.log('❌ FAILED: Responsive design issues\n');
        failed++;
      }
    } catch (error) {
      console.log('❌ FAILED: Could not test responsiveness\n');
      failed++;
    }
    
    // Test 8: Performance
    console.log('📝 Test 8: Page performance');
    try {
      const startTime = Date.now();
      await page.goto('https://soulbondai.com', { 
        timeout: 30000,
        waitUntil: 'networkidle' 
      });
      const loadTime = Date.now() - startTime;
      
      if (loadTime < 5000) {
        console.log(`✅ PASSED: Good performance (${loadTime}ms)\n`);
        passed++;
      } else if (loadTime < 10000) {
        console.log(`⚠️  WARNING: Slow performance (${loadTime}ms)\n`);
        passed++;
      } else {
        console.log(`❌ FAILED: Very slow performance (${loadTime}ms)\n`);
        failed++;
      }
    } catch (error) {
      console.log('❌ FAILED: Could not test performance\n');
      failed++;
    }
    
    // Test 9: SEO meta tags
    console.log('📝 Test 9: SEO meta tags');
    try {
      await page.goto('https://soulbondai.com', { timeout: 30000 });
      const title = await page.title();
      const description = await page.getAttribute('meta[name="description"]', 'content');
      const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content');
      
      if (title && description && ogTitle) {
        console.log('✅ PASSED: SEO meta tags present\n');
        console.log(`   Title: ${title}`);
        console.log(`   Description: ${description.substring(0, 60)}...\n`);
        passed++;
      } else {
        console.log('❌ FAILED: SEO meta tags missing\n');
        failed++;
      }
    } catch (error) {
      console.log('❌ FAILED: Could not test SEO tags\n');
      failed++;
    }
    
    // Test 10: Local development server
    console.log('📝 Test 10: Local development server');
    try {
      await page.goto('http://localhost:3000', { timeout: 10000 });
      const localTitle = await page.title();
      if (localTitle) {
        console.log('✅ PASSED: Local dev server is running\n');
        passed++;
      } else {
        console.log('⚠️  WARNING: Local dev server not responding\n');
      }
    } catch (error) {
      console.log('ℹ️  INFO: Local dev server not available (this is okay for production tests)\n');
    }
    
  } catch (error) {
    console.error('Test suite error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  // Print summary
  console.log('=====================================');
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('=====================================');
  console.log(`✅ Passed: ${passed} tests`);
  console.log(`❌ Failed: ${failed} tests`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  console.log('=====================================\n');
  
  if (failed === 0) {
    console.log('🎉 All tests passed! The application is working correctly.');
  } else if (failed <= 2) {
    console.log('⚠️  Most tests passed with minor issues.');
  } else {
    console.log('❌ Multiple test failures detected. Please review.');
  }
  
  process.exit(failed > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(console.error);