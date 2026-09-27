const { chromium } = require('playwright');

async function verifyWelcomeFlow() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();

  console.log('--- PRAVAH Default Login & Welcome Walkthrough Modal Verification ---');

  // Test 1: Root URL default route
  console.log('1. Testing root URL default route (http://localhost:5173/)...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  const hash = await page.evaluate(() => window.location.hash);
  console.log(`   Current URL hash: "${hash}"`);
  if (hash !== '#login') {
    throw new Error(`Expected default hash to be #login, but got "${hash}"`);
  }
  console.log('✓ PASS: Root route defaults to #login (not signup)');

  // Test 2: Check Welcome Modal visibility on Login
  console.log('2. Verifying Welcome Modal elements on #login...');
  const modal = await page.waitForSelector('[role="dialog"][aria-label="Welcome Walkthrough Invitation"]', { timeout: 3000 });
  if (!modal) {
    throw new Error('Welcome modal dialog not found');
  }

  const badgeText = await page.textContent('text=SAIL LOGISTICS AI');
  const titleText = await page.textContent('text=Welcome to PRAVAH');
  const startBtn = await page.$('text=Start Guided Walkthrough');
  const exploreBtn = await page.$('text=Explore on My Own');

  if (!badgeText || !titleText || !startBtn || !exploreBtn) {
    throw new Error('Missing expected welcome modal content');
  }
  console.log('✓ PASS: Welcome modal rendered with SAIL badge, title, and actions');

  // Test 3: Click "Start Guided Walkthrough"
  console.log('3. Clicking "Start Guided Walkthrough" from welcome modal...');
  await startBtn.click();
  await page.waitForTimeout(500);

  // Check tour is active and at Step 1
  const tourOverlay = await page.waitForSelector('div[data-tour-overlay="true"]', { timeout: 4000 });
  const stepBadge = await page.textContent('text=Step 1 of 28');
  if (!tourOverlay || !stepBadge) {
    throw new Error('Tour overlay did not appear or is not on Step 1');
  }
  console.log('✓ PASS: Walkthrough successfully started on Step 1 directly from Welcome Modal');

  // Test 4: Advance to Step 2
  console.log('4. Advancing to Step 2 via Next button...');
  const nextBtn = await page.$('button:has-text("Next")');
  if (nextBtn) {
    await nextBtn.click();
    await page.waitForTimeout(1000);
    const step2Badge = await page.textContent('text=Step 2 of 28');
    const newHash = await page.evaluate(() => window.location.hash);
    if (!step2Badge || newHash !== '#dashboard') {
      throw new Error(`Expected Step 2 on #dashboard, got hash: ${newHash}`);
    }
    console.log('✓ PASS: Successfully transitioned to Step 2 on #dashboard with automatic demo auth');
  }

  // Test 5: Verify Landing page also supports welcome modal when unauthenticated
  console.log('5. Testing Landing page welcome modal behavior in fresh context...');
  const context2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page2 = await context2.newPage();
  await page2.goto('http://localhost:5173/#landing', { waitUntil: 'networkidle' });
  await page2.waitForTimeout(600);

  const landingModal = await page2.waitForSelector('[role="dialog"][aria-label="Welcome Walkthrough Invitation"]', { timeout: 3000 });
  if (!landingModal) {
    throw new Error('Welcome modal did not appear on #landing');
  }
  console.log('✓ PASS: Welcome modal also successfully triggers on #landing');

  await browser.close();
  console.log('\nAll Welcome Flow & Default Login validations PASSED flawlessly!');
}

verifyWelcomeFlow().catch((err) => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
