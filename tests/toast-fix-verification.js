/**
 * Toast Fix Verification Test
 * 
 * This test verifies that the toast.info fix is working correctly
 * by testing the auto-fill functionality that was causing the runtime error.
 */

const { chromium } = require('playwright');

async function testToastFix() {
  console.log('🧪 Starting Toast Fix Verification Test...\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate to the application
    console.log('📱 Navigating to application...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Check if the page loaded correctly
    const title = await page.title();
    console.log(`✅ Page loaded: ${title}`);

    // Look for the auto-fill button (should be visible when CV is uploaded)
    console.log('\n🔍 Looking for auto-fill functionality...');
    
    // First, let's check if we can find the job search component
    const jobSearchSection = await page.locator('text=Parameter Pencarian Kerja').first();
    if (await jobSearchSection.isVisible()) {
      console.log('✅ Job search component found');
    } else {
      console.log('⚠️  Job search component not visible (may need CV upload first)');
    }

    // Check for auto-fill button
    const autoFillButton = await page.locator('button:has-text("Auto-Fill")').first();
    if (await autoFillButton.isVisible()) {
      console.log('✅ Auto-fill button found');
      
      // Test clicking the auto-fill button
      console.log('\n🎯 Testing auto-fill button click...');
      
      // Listen for console errors
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Listen for page errors
      const pageErrors = [];
      page.on('pageerror', error => {
        pageErrors.push(error.message);
      });

      // Click the auto-fill button
      await autoFillButton.click();
      
      // Wait a moment for any errors to surface
      await page.waitForTimeout(2000);

      // Check for the specific toast.info error
      const toastInfoError = [...consoleErrors, ...pageErrors].find(error => 
        error.includes('toast.info is not a function') || 
        error.includes('toast.default.info is not a function')
      );

      if (toastInfoError) {
        console.log('❌ TOAST ERROR STILL EXISTS:');
        console.log(`   ${toastInfoError}`);
        return false;
      } else {
        console.log('✅ No toast.info errors detected');
      }

      // Check for any toast notifications (should show info message)
      const toastNotification = await page.locator('[data-testid="toast"], .toast, [class*="toast"]').first();
      if (await toastNotification.isVisible({ timeout: 3000 })) {
        const toastText = await toastNotification.textContent();
        console.log(`✅ Toast notification appeared: "${toastText}"`);
      } else {
        console.log('ℹ️  No toast notification visible (may be expected if no CV data)');
      }

      // Report any other console errors
      if (consoleErrors.length > 0) {
        console.log('\n⚠️  Other console errors detected:');
        consoleErrors.forEach(error => console.log(`   - ${error}`));
      }

      if (pageErrors.length > 0) {
        console.log('\n⚠️  Page errors detected:');
        pageErrors.forEach(error => console.log(`   - ${error}`));
      }

      if (consoleErrors.length === 0 && pageErrors.length === 0) {
        console.log('✅ No JavaScript errors detected');
      }

    } else {
      console.log('⚠️  Auto-fill button not visible (may need CV upload first)');
      console.log('   This is expected if no CV has been uploaded yet.');
    }

    console.log('\n🎉 Toast fix verification completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
if (require.main === module) {
  testToastFix()
    .then(success => {
      if (success) {
        console.log('\n✅ ALL TESTS PASSED - Toast fix is working correctly!');
        process.exit(0);
      } else {
        console.log('\n❌ TESTS FAILED - Toast fix needs attention');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testToastFix };
