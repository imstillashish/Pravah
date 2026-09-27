const { chromium } = require('playwright');

async function verifyAllTourSteps() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();

  console.log('--- PRAVAH 28-Step Spotlight Walkthrough Verification ---');

  // Step A: Navigate to login page
  console.log('1. Navigating to http://localhost:5173/#login...');
  await page.goto('http://localhost:5173/#login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Check demo accounts container
  const demoAccounts = await page.$('[data-tour="auth-demo-accounts"]');
  if (!demoAccounts) {
    throw new Error('Could not find [data-tour="auth-demo-accounts"] on #login page');
  }
  console.log('✓ Found [data-tour="auth-demo-accounts"] on Auth page');

  // Click Freight Planner demo button to log in
  console.log('2. Logging in via Freight Planner demo account...');
  const plannerButton = await page.$('text=Freight Planner');
  if (plannerButton) {
    await plannerButton.click();
    await page.waitForTimeout(300);
    // Click submit
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) await submitBtn.click();
  }

  // If still on login, set demo token in localStorage directly
  await page.evaluate(() => {
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('user', JSON.stringify({
      id: 1,
      email: 'demo@sail.gov.in',
      full_name: 'Arjun Verma',
      role: 'logistics_planner',
      is_active: true
    }));
  });

  // Navigate to #dashboard
  await page.goto('http://localhost:5173/#dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Click "Feature Tour" button in TopBar
  console.log('3. Triggering Feature Tour from TopBar...');
  const tourTrigger = await page.$('[data-tour-trigger="start"]');
  if (!tourTrigger) {
    throw new Error('Feature Tour trigger button [data-tour-trigger="start"] not found in TopBar');
  }
  await tourTrigger.click();
  await page.waitForTimeout(500);

  // Iterate all 28 steps
  for (let stepIndex = 0; stepIndex < 28; stepIndex++) {
    const stepNum = stepIndex + 1;
    console.log(`\nValidating Step ${stepNum} of 28...`);

    // Wait for tour dialog
    await page.waitForSelector('div[data-tour-overlay="true"]', { timeout: 5000 });
    
    // Check step badge text
    const badgeText = await page.$eval('div[data-tour-overlay="true"]', (el) => el.innerText);
    if (!badgeText.includes(`Step ${stepNum} of 28`)) {
      throw new Error(`Expected badge to contain "Step ${stepNum} of 28", but dialog text was: ${badgeText.slice(0, 100)}`);
    }

    // Extract current step title
    const title = await page.$eval('div[data-tour-overlay="true"] h3', (el) => el.innerText.trim());
    console.log(`  Title: "${title}"`);

    // Get current hash
    const currentHash = await page.evaluate(() => window.location.hash);
    console.log(`  Route: ${currentHash}`);

    // Allow UI transition to settle
    await page.waitForTimeout(300);

    // Check SVG mask cutout rect
    const cutoutRect = await page.evaluate(() => {
      const maskRect = document.querySelector('mask#tour-spotlight-mask rect:nth-child(2)');
      if (!maskRect) return null;
      return {
        x: parseFloat(maskRect.getAttribute('x')),
        y: parseFloat(maskRect.getAttribute('y')),
        width: parseFloat(maskRect.getAttribute('width')),
        height: parseFloat(maskRect.getAttribute('height'))
      };
    });

    if (!cutoutRect || cutoutRect.width <= 0 || cutoutRect.height <= 0) {
      throw new Error(`Step ${stepNum}: Invalid SVG cutout dimensions: ${JSON.stringify(cutoutRect)}`);
    }
    console.log(`  Spotlight bounds: x=${Math.round(cutoutRect.x)}, y=${Math.round(cutoutRect.y)}, w=${Math.round(cutoutRect.width)}, h=${Math.round(cutoutRect.height)}`);

    // Check floating explanation card positioning
    const cardRect = await page.evaluate(() => {
      const dialog = document.querySelector('div[data-tour-overlay="true"]');
      const card = dialog ? dialog.querySelector('.rounded-2xl.border') : null;
      if (!card) return null;
      const r = card.getBoundingClientRect();
      return { top: r.top, left: r.left, width: r.width, height: r.height };
    });

    if (!cardRect || cardRect.width <= 0 || cardRect.height <= 0) {
      throw new Error(`Step ${stepNum}: Floating card not rendered or zero dimensions: ${JSON.stringify(cardRect)}`);
    }
    console.log(`  Floating card: top=${Math.round(cardRect.top)}, left=${Math.round(cardRect.left)}, w=${Math.round(cardRect.width)}, h=${Math.round(cardRect.height)}`);

    // STRICT ZERO-COLLISION INVARIANT CHECK
    const overlaps = !(
      cardRect.left >= cutoutRect.x + cutoutRect.width ||
      cardRect.left + cardRect.width <= cutoutRect.x ||
      cardRect.top >= cutoutRect.y + cutoutRect.height ||
      cardRect.top + cardRect.height <= cutoutRect.y
    );

    if (overlaps) {
      throw new Error(
        `CRITICAL COLLISION ERROR on Step ${stepNum} ("${title}"):\n` +
        `Card [left=${Math.round(cardRect.left)}, top=${Math.round(cardRect.top)}, w=${Math.round(cardRect.width)}, h=${Math.round(cardRect.height)}] ` +
        `overlaps Target Spotlight [x=${Math.round(cutoutRect.x)}, y=${Math.round(cutoutRect.y)}, w=${Math.round(cutoutRect.width)}, h=${Math.round(cutoutRect.height)}]!`
      );
    }
    console.log(`  ✓ ZERO OVERLAP VERIFIED: Card is 100% clear of spotlight target.`);

    // Advance to next step (or finish if step 28)
    if (stepNum < 28) {
      // Press ArrowRight key to advance
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(500);
    } else {
      // Step 28: Click "Finish Tour"
      const finishBtn = await page.$('button:has-text("Finish Tour")');
      if (finishBtn) {
        await finishBtn.click();
      } else {
        await page.keyboard.press('ArrowRight');
      }
      await page.waitForTimeout(500);
    }
  }

  // Verify tour dialog closed
  const dialogAfterFinish = await page.$('div[role="dialog"]');
  if (dialogAfterFinish) {
    throw new Error('Tour dialog was expected to close after finishing step 28, but it is still open');
  }
  console.log('\n✓ Successfully verified all 28 steps with zero positioning errors! Tour closed cleanly.');

  await browser.close();
}

verifyAllTourSteps().catch((err) => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
