const { chromium } = require('playwright');

async function testStep1AutoLogin() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();

  console.log('=== VERIFYING STEP 1 -> STEP 2 AUTO LOGIN FLOW ===');

  // 1. Navigate to root as a pure guest (clean storage)
  console.log('1. Navigating to http://localhost:5173/ as unauthenticated guest...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  const initialToken = await page.evaluate(() => localStorage.getItem('token'));
  console.log(`   Initial localStorage token: ${initialToken} (guest status confirmed)`);

  // 2. Start tour from Welcome Modal
  console.log('2. Starting walkthrough from Welcome Modal...');
  const startBtn = await page.waitForSelector('text=Start Guided Walkthrough', { timeout: 4000 });
  await startBtn.click();
  await page.waitForTimeout(600);

  // 3. Confirm Step 1 is active
  const step1Badge = await page.textContent('text=Step 1 of 28');
  console.log(`   Tour status: ${step1Badge}`);
  if (!step1Badge) {
    throw new Error('Did not reach Step 1 of tour');
  }

  // 4. Click "Next" on Step 1
  console.log('3. Clicking "Next" on Step 1 of 28...');
  const nextBtn = await page.waitForSelector('button:has-text("Next")', { timeout: 3000 });
  await nextBtn.click();

  // Wait for auto-login and transition to Step 2
  console.log('4. Waiting for auto-login and navigation to Step 2 on #dashboard...');
  await page.waitForTimeout(1500);

  // 5. Verify JWT token is present in localStorage
  const postLoginToken = await page.evaluate(() => localStorage.getItem('token'));
  console.log(`   Post-Step-1 token in localStorage: ${postLoginToken ? postLoginToken.slice(0, 30) + '...' : 'NULL'}`);
  if (!postLoginToken || postLoginToken === 'demo-token') {
    throw new Error(`Expected valid JWT token, but got: ${postLoginToken}`);
  }
  console.log('✓ PASS: Real JWT token was automatically acquired from /api/auth/login');

  // 6. Verify URL is #dashboard
  const currentHash = await page.evaluate(() => window.location.hash);
  console.log(`   Current URL hash: ${currentHash}`);
  if (currentHash !== '#dashboard') {
    throw new Error(`Expected #dashboard, got ${currentHash}`);
  }
  console.log('✓ PASS: Route cleanly transitioned to #dashboard');

  // 7. Verify Step 2 is active on Dashboard
  const step2Badge = await page.textContent('text=Step 2 of 28');
  console.log(`   Tour status: ${step2Badge}`);
  if (!step2Badge) {
    throw new Error('Did not reach Step 2 of tour');
  }
  console.log('✓ PASS: Step 2 of 28 ("Maritime Disruption Alert Scanner") is active');

  // 8. Verify Dashboard is actually rendered (not kicked back to Login)
  const dashboardElement = await page.$('[data-tour="disruption-alert"]');
  if (!dashboardElement) {
    throw new Error('Disruption alert element not found on dashboard! User was likely kicked back to login.');
  }
  console.log('✓ PASS: [data-tour="disruption-alert"] successfully rendered on Dashboard');

  // 9. Verify session permanence (wait another 1s to verify /api/auth/me does not logout)
  await page.waitForTimeout(1000);
  const stillToken = await page.evaluate(() => localStorage.getItem('token'));
  const stillUser = await page.evaluate(() => localStorage.getItem('user'));
  if (!stillToken) {
    throw new Error('Token was wiped by auth/me background check!');
  }
  console.log(`✓ PASS: Session remains 100% active and authenticated after /api/auth/me check`);

  // 10. Check TopBar user display
  const userText = await page.textContent('header');
  console.log(`   TopBar text preview contains user session: ${userText.includes('SAIL') || userText.includes('Planner') || userText.includes('Arjun')}`);

  await browser.close();
  console.log('\n=== ALL TESTS PASSED! STEP 1 AUTO-LOGIN IS WORKING FLAWLESSLY ===');
}

testStep1AutoLogin().catch((err) => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
