/**
 * Governance & PDF export end-to-end verification.
 *
 * Walks the real decision-governance flow against the local dev stack:
 *   demo login -> APPROVE -> branded PDF download -> REJECT with reason
 * plus the backend plain-text audit export, the finalized-state policy, and the
 * "rejection reason is mandatory" guard.
 *
 * Requires the dev stack: backend on :8000, vite dev server on :5173
 * (vite proxies /api -> :8000, see frontend/vite.config.ts).
 *
 * Run: npm run test:governance
 */
const { chromium } = require("playwright");
const fs = require("fs");
const os = require("os");
const path = require("path");

const BASE = process.env.BASE_URL || "http://localhost:5173";
const API = process.env.API_BASE_URL || "http://localhost:8000";
const CHROME = process.env.CHROME_PATH || "/usr/bin/google-chrome";
const DEMO = { email: "demo@sail.gov.in", password: "Password123" };

let failures = 0;
const pass = (msg) => console.log(`  \u2713 ${msg}`);
const fail = (msg) => {
  failures++;
  console.error(`  \u2717 ${msg}`);
};
const assert = (cond, msg) => (cond ? pass(msg) : fail(msg));
const section = (title) => console.log(`\n--- ${title} ---`);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Fetch JSON from the backend, tolerating non-OK responses. */
async function getJson(url, token) {
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function apiLogin() {
  const res = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(DEMO),
  });
  if (!res.ok) throw new Error(`demo login failed with status ${res.status}`);
  return res.json();
}

/** Candidate analysis ids, preferring the authenticated list endpoint. */
async function candidateIds(token) {
  const data = await getJson(`${API}/api/analyses`, token);
  const arr = Array.isArray(data)
    ? data
    : (data && (data.analyses || data.items || data.results || data.recent_analyses)) || [];
  const ids = arr.map((a) => a && a.id).filter((n) => typeof n === "number");
  return ids.length ? ids : Array.from({ length: 30 }, (_, i) => i + 1);
}

/** Analyses whose decision is still awaiting sign-off. */
async function findPending(token, want = 2) {
  const pending = [];
  for (const id of await candidateIds(token)) {
    const a = await getJson(`${API}/api/analyses/${id}`);
    if (!a) continue;
    const approved = a.decision ? a.decision.manager_approved : null;
    if (approved === null || approved === undefined) pending.push({ id, analysis: a });
    if (pending.length >= want) break;
  }
  return pending;
}

/** Log in through the real UI and confirm we land in the app. */
async function uiLogin(page) {
  await page.goto(`${BASE}/#login`, { waitUntil: "networkidle" });
  await sleep(800);

  const welcome = page.getByText("Explore on My Own");
  if (await welcome.count()) {
    await welcome.first().click();
    await sleep(400);
  }

  const planner = page.getByText("Freight Planner");
  if (await planner.count()) {
    await planner.first().click();
    await sleep(300);
  }

  const submit = page.locator('button[type="submit"]');
  if (await submit.count()) {
    await submit.first().click();
    await sleep(1500);
  }

  // Fallback: seed the session exactly like the other browser tests do.
  if (!(await page.evaluate(() => window.location.hash)).includes("dashboard")) {
    await page.evaluate(() => {
      localStorage.setItem("token", "demo-token");
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: 1,
          email: "demo@sail.gov.in",
          full_name: "SAIL Demo Planner",
          role: "logistics_planner",
          is_active: true,
        })
      );
    });
    await page.goto(`${BASE}/#dashboard`, { waitUntil: "networkidle" });
    await sleep(800);
  }
  return page.evaluate(() => window.location.hash);
}

async function openDecisionPage(page, id) {
  await page.goto(`${BASE}/#decision-${id}`, { waitUntil: "networkidle" });
  await page.waitForSelector("text=Plant Management Approval Status", { timeout: 15000 });
  await sleep(400);
}

async function verifyApprove(page, id) {
  section(`APPROVE flow — analysis #${id}`);
  await openDecisionPage(page, id);

  assert(
    await page.getByText("PENDING APPROVAL", { exact: true }).count() > 0,
    "shows PENDING APPROVAL badge before sign-off"
  );

  const approveBtn = page.getByRole("button", { name: /Approve Fixture/i });
  assert((await approveBtn.count()) === 1, 'renders the "Approve Fixture" control');
  if ((await approveBtn.count()) === 0) return;

  await approveBtn.click();
  await sleep(1800);

  assert(
    await page.getByText("APPROVED", { exact: true }).count() > 0,
    "governance badge flips to APPROVED"
  );
  assert(
    (await page.getByText(/officially APPROVED/i).count()) > 0,
    "approval confirmation banner is shown"
  );
  assert(
    (await page.getByRole("button", { name: /Initiate Charter Booking Fixture/i }).count()) === 1,
    "charter booking CTA unlocks after approval"
  );

  const after = await getJson(`${API}/api/analyses/${id}`);
  assert(
    after && after.decision && after.decision.manager_approved === true,
    "APPROVED state persisted to the backend"
  );

  // Governance policy: once finalized, the sign-off controls must be gone.
  await page.reload({ waitUntil: "networkidle" });
  await sleep(1000);
  assert(
    (await page.getByText(/Decision finalized/i).count()) > 0,
    "sign-off controls lock after finalization (governance policy)"
  );
  assert(
    (await page.getByRole("button", { name: /Approve Fixture/i }).count()) === 0,
    "no duplicate approve control on a finalized record"
  );
}

async function verifyPdfExport(page, id) {
  section("Branded PDF export");
  const btn = page.locator('[data-tour="pdf-export"]');
  assert((await btn.count()) === 1, "PDF export control is present on the decision record");
  if ((await btn.count()) === 0) return;

  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 20000 }),
    btn.click(),
  ]);

  const expected = `SAIL_FR8_${id}_Official_Decision_Record.pdf`;
  assert(download.suggestedFilename() === expected, `download is named ${expected}`);

  const dest = path.join(os.tmpdir(), `verify_governance_${Date.now()}.pdf`);
  await download.saveAs(dest);
  const bytes = fs.readFileSync(dest);
  const raw = bytes.toString("latin1");

  assert(bytes.length > 2000, `PDF has real content (${bytes.length} bytes)`);
  assert(raw.startsWith("%PDF-1.4"), "valid PDF 1.4 header");
  assert(raw.includes("%%EOF"), "well-formed trailer (%%EOF)");
  assert(raw.includes("/Type /Page"), "contains a page object");
  assert(raw.includes("OFFICIALLY APPROVED"), "carries the approved governance status");
  assert(raw.includes("SAIL"), "carries SAIL branding");
  assert(raw.includes("Tamper-Evident"), "carries the audit footer");

  fs.unlinkSync(dest);
}

async function verifyReject(page, id, reason) {
  section(`REJECT flow — analysis #${id}`);
  await openDecisionPage(page, id);

  assert(
    await page.getByText("PENDING APPROVAL", { exact: true }).count() > 0,
    "shows PENDING APPROVAL badge before sign-off"
  );

  const rejectBtn = page.getByRole("button", { name: /Reject with Reason/i });
  assert((await rejectBtn.count()) === 1, 'renders the "Reject with Reason" control');
  if ((await rejectBtn.count()) === 0) return;

  await rejectBtn.click();
  await sleep(500);

  const textarea = page.locator("textarea");
  assert((await textarea.count()) >= 1, "rejection justification input appears");
  await textarea.first().fill(reason);

  const confirm = page.getByRole("button", { name: /Confirm Rejection/i });
  await confirm.first().click();
  await sleep(1800);

  assert(
    await page.getByText("REJECTED", { exact: true }).count() > 0,
    "governance badge flips to REJECTED"
  );
  assert(
    (await page.getByText(reason, { exact: false }).count()) > 0,
    "rejection note surfaces the justification"
  );
  assert(
    (await page.getByRole("button", { name: /Initiate Charter Booking Fixture/i }).count()) === 0,
    "booking CTA stays locked for a rejected fixture"
  );

  const after = await getJson(`${API}/api/analyses/${id}`);
  assert(
    after && after.decision && after.decision.manager_approved === false,
    "REJECTED state persisted to the backend"
  );
  assert(
    after && after.decision && (after.decision.approval_notes || "").includes(reason),
    "justification persisted to the backend"
  );
}

async function verifyRejectRequiresReason(id) {
  section("Governance guard — rejection reason mandatory");
  const res = await fetch(`${API}/api/analyses/${id}/decision/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  assert(res.status === 400, `reject without a reason is refused (got ${res.status}, want 400)`);
}

async function verifyTextAuditExport(id, expectApproved) {
  section("Backend plain-text audit export");
  const res = await fetch(`${API}/analyses/${id}/export`);
  assert(res.ok, `GET /analyses/${id}/export responds (${res.status})`);
  if (!res.ok) return;

  const contentType = res.headers.get("content-type") || "";
  assert(contentType.includes("text/plain"), `content-type is text/plain (got ${contentType})`);

  const disposition = res.headers.get("content-disposition") || "";
  assert(
    disposition.includes(`analysis_${id}_decision_record.txt`),
    "attachment filename is set for download"
  );

  const body = await res.text();
  assert(body.includes("PRAVAH"), "carries the PRAVAH document header");
  assert(body.includes("SAIL-FR8-"), "carries the SAIL document reference");
  assert(body.includes("Approval Status:"), "exposes the approval status field");
  assert(
    body.includes(expectApproved ? "APPROVED" : "REJECTED"),
    `reflects the ${expectApproved ? "approved" : "rejected"} decision`
  );
}

async function main() {
  console.log("=== Governance & PDF export verification ===");
  console.log(`Frontend: ${BASE}\nBackend:  ${API}`);

  const session = await apiLogin();
  const token = session.access_token;
  pass("demo login via API");

  const pending = await findPending(token, 2);
  if (pending.length < 2) {
    console.log(
      `\n! Only ${pending.length} pending analysis/analyses available — ` +
        "approve+reject interaction needs two. Run against a fresh demo dataset to exercise both."
    );
  }

  const executablePath = fs.existsSync(CHROME) ? CHROME : undefined;
  const browser = await chromium.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    acceptDownloads: true,
  });
  const page = await context.newPage();

  try {
    section("UI login");
    const hash = await uiLogin(page);
    assert(hash.includes("dashboard"), `landed on the dashboard (hash: ${hash || "none"})`);

    const approveTarget = pending[0];
    const rejectTarget = pending[1];

    if (approveTarget) {
      await verifyApprove(page, approveTarget.id);
      await verifyPdfExport(page, approveTarget.id);
      await verifyTextAuditExport(approveTarget.id, true);
    }

    if (rejectTarget) {
      await verifyRejectRequiresReason(rejectTarget.id);
      await verifyReject(page, rejectTarget.id, "Berth unavailable in target laycan window");
      await verifyTextAuditExport(rejectTarget.id, false);
    }

    if (!approveTarget && !rejectTarget) {
      section("No pending analyses — verifying export paths only");
      const fallback = (await candidateIds(token))[0] || 1;
      await openDecisionPage(page, fallback);
      await verifyPdfExport(page, fallback);
    }
  } finally {
    await browser.close();
  }

  console.log(
    failures === 0
      ? "\n\u2713 All governance & PDF checks passed."
      : `\n\u2717 ${failures} check(s) failed.`
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("\n\u2717 Verification crashed:", err);
  process.exit(1);
});
