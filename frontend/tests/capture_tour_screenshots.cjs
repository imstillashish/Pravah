const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = '/home/asp/.gemini/antigravity/brain/6681c3bb-85b8-4f44-9015-765f25421811/screenshots';

const KEY_STEPS_TO_CAPTURE = [
  { stepNum: 1, name: '01_login_demo_accounts' },
  { stepNum: 2, name: '02_dashboard_disruption_alert' },
  { stepNum: 3, name: '03_dashboard_stockout_tracker' },
  { stepNum: 4, name: '04_demand_parcel_pooling' },
  { stepNum: 5, name: '05_wizard_intent_form' },
  { stepNum: 8, name: '08_wizard_derivations' },
  { stepNum: 9, name: '09_freight_rate_forecast' },
  { stepNum: 13, name: '13_top_recommendation' },
  { stepNum: 14, name: '14_explainability_waterfall' },
  { stepNum: 16, name: '16_scenario_sandbox' },
  { stepNum: 20, name: '20_decision_regret_score' },
  { stepNum: 28, name: '28_live_map_route' },
];

async function captureMicroscopicTourScreenshots() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1
  });

  const page = await context.newPage();

  console.log('--- Starting Microscopic Visual Capture & Precision Analysis ---');

  // Step A: Load page and prepare demo session
  await page.goto('http://localhost:5173/#login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const plannerButton = await page.$('text=Freight Planner');
  if (plannerButton) {
    await plannerButton.click();
    await page.waitForTimeout(300);
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) await submitBtn.click();
  }

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

  // Navigate to dashboard and trigger tour
  await page.goto('http://localhost:5173/#dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const tourTrigger = await page.waitForSelector('[data-tour-trigger="start"]', { timeout: 5000 });
  await tourTrigger.click();
  await page.waitForSelector('div[data-tour-overlay="true"]', { timeout: 5000 });
  await page.waitForTimeout(600);

  const results = [];

  for (const item of KEY_STEPS_TO_CAPTURE) {
    // Jump to step
    await page.evaluate((targetStepIdx) => {
      const select = document.getElementById('tour-jump-select');
      if (select) {
        select.value = String(targetStepIdx);
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, item.stepNum - 1);

    await page.waitForTimeout(600);

    // Wait for tour dialog
    await page.waitForSelector('div[data-tour-overlay="true"]', { timeout: 5000 });

    // Extract precision metrics
    const metrics = await page.evaluate(() => {
      const dialog = document.querySelector('div[data-tour-overlay="true"]');
      const maskRect = document.querySelector('mask#tour-spotlight-mask rect:nth-child(2)');
      const card = dialog ? dialog.querySelector('.rounded-2xl.border') : null;

      const mask = maskRect ? {
        x: Math.round(parseFloat(maskRect.getAttribute('x'))),
        y: Math.round(parseFloat(maskRect.getAttribute('y'))),
        w: Math.round(parseFloat(maskRect.getAttribute('width'))),
        h: Math.round(parseFloat(maskRect.getAttribute('height')))
      } : null;

      const cardB = card ? {
        top: Math.round(card.getBoundingClientRect().top),
        left: Math.round(card.getBoundingClientRect().left),
        w: Math.round(card.getBoundingClientRect().width),
        h: Math.round(card.getBoundingClientRect().height)
      } : null;

      const title = dialog ? dialog.querySelector('h3')?.innerText.trim() : '';

      return { mask, card: cardB, title, innerW: window.innerWidth, innerH: window.innerHeight };
    });

    // Capture screenshot
    const screenshotPath = path.join(ARTIFACT_DIR, `${item.name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });

    console.log(`[Captured Step ${item.stepNum}] "${metrics.title}"`);
    console.log(`  File: ${item.name}.png`);
    console.log(`  Spotlight Mask: [x=${metrics.mask.x}, y=${metrics.mask.y}, w=${metrics.mask.w}, h=${metrics.mask.h}]`);
    console.log(`  Floating Card:  [left=${metrics.card.left}, top=${metrics.card.top}, w=${metrics.card.w}, h=${metrics.card.h}]`);

    // Geometric integrity check:
    // 1. Mask must be on screen
    const maskValid = metrics.mask.w > 0 && metrics.mask.h > 0;
    // 2. Card must fit horizontally within viewport with >= 16px margins
    const cardHorizontalFit = metrics.card.left >= 16 && (metrics.card.left + metrics.card.w) <= (metrics.innerW - 16);
    // 3. Card must fit vertically within viewport
    const cardVerticalFit = metrics.card.top >= 16 && (metrics.card.top + metrics.card.h) <= (metrics.innerH - 8);

    console.log(`  Checks: MaskValid=${maskValid} | CardHFit=${cardHorizontalFit} | CardVFit=${cardVerticalFit}\n`);

    results.push({
      step: item.stepNum,
      title: metrics.title,
      file: `${item.name}.png`,
      mask: metrics.mask,
      card: metrics.card,
      cardHFit: cardHorizontalFit,
      cardVFit: cardVerticalFit
    });
  }

  await browser.close();
  console.log(`--- Finished capturing ${results.length} key step screenshots successfully ---`);
}

captureMicroscopicTourScreenshots().catch((err) => {
  console.error('Capture error:', err);
  process.exit(1);
});
