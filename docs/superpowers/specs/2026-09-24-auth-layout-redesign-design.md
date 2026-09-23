# Auth Pages Layout Redesign — Design Spec

**Date:** 2026-09-24
**Status:** Approved (design confirmed in conversation)
**Theme context:** Oceanic Navy & Electric Cyan world (current `index.css` tokens are the binding source of truth)
**Trigger:** User asked to research login-page layouts and implement; prior full redesign was reverted at user request (`883706b`) — this spec **keeps the existing split-screen architecture** and refines it, changing only what the user explicitly approved.

---

## 1. Research Summary (what the design follows)

Sources: Eleken's 50+ login examples (2026), web.dev sign-in form best practices, Cieden B2B login guidance.

- **Split-screen** (Headspace, Zoom, Origin, Frontend AI): hero/value panel + form. Already the incumbent — retained.
- **Form mechanics** (web.dev, binding): visible labels above inputs; `autocomplete="email"|"username"|"current-password"|"new-password"|"name"`; show-password toggle with `type="button"`; forgot-password link; do NOT disable submit awaiting input without explanation; stable input `id`s; success removes the password form from the DOM (navigation or `pushState`).
- **Inline validation on blur** (OptiFlow/QU3ST patterns) — errors surface below the field, not just in a top banner.
- **Radio list over card grids** for ≤5 options (RedOwl role-segmentation pattern) — vertical, full-width rows.
- **B2B trust**: friction-light, boring-on-purpose forms; brand lives in the hero panel.

## 2. Decisions Log (user-approved)

| # | Decision | Choice |
|---|---|---|
| D1 | Layout family | **Split-screen, refined** — incumbent 45/55 architecture survives |
| D2 | Form upgrades | **All four**: show-password toggle, forgot-password link, remember-me checkbox, labels stay above inputs; keep current input fields |
| D3 | Forgot password | **Build link + flow** — in-card 3-step reset; backend endpoints added per Microscopic_Task Task 321/322 design (6-digit code in response, 15-min expiry, no email service) |
| D4 | SignUp identifiers | **Two separate required fields**: Employee ID and Email |
| D5 | Roles | **Features.md wins**: Officer / Manager / Admin (maps to backend `logistics_planner` / `plant_manager` / `admin`) |
| D6 | Hero live marker | **No dot at all** — user rejected the static dot; ticker line is plain mono text |

## 3. Measured Contrast Matrix (binding, WCAG exact math)

| Pair | Ratio | Verdict | Use |
|---|---|---|---|
| Charcoal label on Paper | 10.35 | AA+ ✓ | Field labels, body |
| Slate secondary on Paper | 4.76 | AA ✓ (thin) | Helper text ≥12px; never bold-on-fog |
| Navy ink on Paper | 17.66 | AA+ ✓ | Card headings |
| Charcoal on Fog | 9.45 | AA ✓ | Reset-code info box text |
| Navy on Ice Mist | 15.39 | AA+ ✓ | Selected radio rows |
| Cyan on Navy | 8.24 | AA ✓ | Hero headline, ticker text |
| Paper on Navy | 17.66 | AA+ ✓ | Hero body |
| Alarm Red on Paper | 6.29 | AA ✓ | Field errors, alert banner |
| Alarm Red on Fog | 5.74 | AA ✓ | Alert banner on fog fill |
| Maritime Blue on Paper | 4.10 | **Text fails AA (4.5)** | **Links must not use signal-blue on Paper** — use Spruce `#0c4a6e` for text links (9.46:1, measured); reserve signal-blue for non-text UI |
| Spruce link on Paper | 9.46 | AA+ ✓ | All text links (forgot-password, switch-mode) |
| Emerald Profit on Emerald Wash | 5.21 | AA ✓ | Success panel icon (paired with text below) |
| Obsidian on Emerald Wash | 19.11 | AA+ ✓ | Success panel heading |
| Charcoal on Emerald Wash | 9.83 | AA ✓ | Success panel body |

**Lime/Cyan rule carries over:** `lime-voltage` (now `#38bdf8`) is fill-only on Paper (2.14:1 as text). Cyan text appears **only on the navy hero panel**.

## 4. Page Structure (both pages)

```
grid min-h-screen lg:grid-cols-[45fr_55fr]
├─ Hero aside (hidden <lg): navy bg-forest-ink panel, m-4 rounded-xl p-12
│  ├─ AstitvaLogo variant="inverse" subtitle
│  ├─ MaritimeGlobe absolute right, opacity-75 (UNCHANGED)
│  ├─ h1 Inter 900 cyan, tracking -0.03em (copy per mode)
│  ├─ sub copy Paper/90 max-w-[46ch]
│  ├─ cyan pill CTA (per mode)
│  └─ ticker row: NO DOT — "LIVE GLOBAL ROUTE RADAR" in cyan mono 12px
│     tracking-[0.08em] uppercase; left side keeps "Steel in motion…"
│     in Paper/60 mono
└─ main (Paper): centered Card max-w-md p-6 sm:p-8
   ├─ h2 (per mode) + intro line
   ├─ [flow body — see §5]
   ├─ hairline border-t border-pebble
   └─ TextButton switch link (per mode)
Mobile banner (<lg): navy rounded-xl p-6, logo row + 24px headline + sub.
   NO Compass icon chip, NO dot.
```

**Copy (pinned):**
- Login hero: "Know your rate before you book." / sub unchanged / CTA "Run your first analysis" (focuses email)
- Signup hero: "Intelligent freight chartering." / sub unchanged / CTA "Sign in to existing account" (switches to login)
- Login card: "Access the freight terminal" / signup card: "Create your operations account"

## 5. Flows

### 5.1 Login card
1. Email or Employee ID — one field, `id="work-email"`, `autocomplete="username"`, `type="email"` (employee IDs are also valid emails in this system; validation: non-empty + email-or-ID regex `^[^\s@]+@[^\s@]+\.[^\s@]+$|^[A-Za-z0-9-]{4,}$`)
2. Password row: label left, **"Forgot password?"** text link right (Spruce `text-spruce` `#0c4a6e`, underline on hover) → opens reset flow (§5.3). Password input `id="account-password"`, `autocomplete="current-password"`, **show-password eye toggle** inside right edge.
3. **Remember-me checkbox** — custom 16px checkbox, Forest Ink fill when checked, label "Keep me signed in for 30 days" (Charcoal). Stores `auth_remember=1` in localStorage; AuthContext reads it to skip the 30-day re-prompt (frontend flag only).
4. Submit "Sign In" — **never disabled by empty fields** (web.dev: users retry-tap disabled buttons); loading state "Verifying…" with disabled+spinner while submitting.
5. Error: existing `role="alert"` banner (Fog fill, Alarm Red text/border, "!" glyph) — unchanged recipe.
6. Below hairline: "Don't have an account yet? Register here" TextButton → signup.

### 5.2 Signup card
Fields in order (all required unless noted):
1. Full Name — `id="full-name"`, `autocomplete="name"`
2. **Employee ID** — `id="employee-id"`, NEW field, `inputmode="text"`, placeholder "e.g. SAIL-12345", pattern `^SAIL-[0-9]{4,6}$` (validated only on blur; error "Employee IDs look like SAIL-12345")
3. **Email** — `id="signup-email"`, `autocomplete="email"`, `type="email"`
4. Password — `id="signup-password"`, `autocomplete="new-password"`, **show-password toggle**, helper "Min. 8 characters" right-aligned on label row (Slate, 11px mono)
5. Confirm Password — `id="signup-confirm-password"`, `autocomplete="new-password"`, match error below field ("Passwords do not match.")
6. **Role — vertical radio list** (`role="radiogroup"`, `aria-label="Account role"`), 3 full-width rows (check indicator · title · sub · mono code chip):
   | Label | Backend value | Sub | Code |
   |---|---|---|---|
   | Officer | `logistics_planner` | Procurement & contracts | OFF |
   | Manager | `plant_manager` | Stock & clearance | MGR |
   | Admin | `admin` | User approvals | ADM |
   Selected row: Ice Mist fill + Navy ink; unselected: Paper + Pebble border. Row = `<button role="radio" aria-checked>` inside `role="radiogroup"` (keyboard: arrows move selection — buttons in a radiogroup get roving tabindex).
7. Submit "Create Account" — disabled until all fields valid (form is long; disabled-until-valid is correct here, unlike login).
8. Success state (replaces form in-card): Emerald Profit recipe — `bg-emerald-wash` fill, `CheckCircle2` in `text-emerald-profit`, heading "Registration Submitted" (Obsidian), body = server message (Charcoal), cyan pill "Return to Sign In". Uses the theme's own semantic tokens (`--color-emerald-profit/wash` exist in the current theme) — no Tailwind-palette classes.
9. Below hairline: "Already have an account? Sign in here" → login.

**Backend note:** signup continues to hit `/auth/register` (admin-approval flow, returns message). The `confirm_password` field is sent. Employee ID is appended to the payload as `employee_id` (backend ignores unknown fields — pydantic default; harmless).

### 5.3 Forgot-password flow (in the login card, 3 steps, same shell)
- **Entry:** "Forgot password?" link swaps card content to Step 1 (component state, no route change). Card h2 → "Reset your password". "← Back to sign in" text link at top.
- **Step 1:** intro copy ("Enter your work email and we'll issue a 6-digit reset code."); email field (`id="reset-email"`); submit "Send reset code" → `POST /api/auth/forgot-password` `{email}` → 201 `{reset_code: "123456"}`.
- **Step 2:** mono info box (Fog fill): "Your reset code (valid 15 minutes): **123456**" — code shown per the no-email-service rule. Below: code input (`id="reset-code"`, `inputmode="numeric"`, `autocomplete="one-time-code"`, 6-char, auto-filled from response but editable).
- **Step 3:** new password + confirm (both `autocomplete="new-password"`, show-password toggles) → submit "Reset password" → `POST /api/auth/reset-password` `{email, code, new_password}` → success panel (emerald recipe): "Password updated. Sign in with your new password." + "Return to sign in" pill.
- **Error handling:** unknown email → same success-looking Step 2 path with a random code (does NOT reveal account existence; backend always 201s); invalid/expired code at Step 3 → 400 → field error "That code didn't work or expired. Request a new one." + link back to Step 1.
- **Backend (new endpoints, per Task 321/322):** `password_reset_tokens` table (code_hash, email, expires_at 15min); `POST /auth/forgot-password` always 201 with generated code; `POST /auth/reset-password` verifies hash+expiry, updates `hashed_password`, deletes token. Pytest: happy path, unknown email still 201, expired/invalid code 400, password min-length enforced.

## 6. Component Architecture

- `AuthPage.tsx` — keeps login + hidden `isRegister` form? **No:** the `isRegister` toggle branch in AuthPage is **removed** (it was unreachable — App.tsx always routes the link to SignUpPage). AuthPage = login only + reset flow. **This is the one structural deletion**, and it's justified: dead code that confuses future edits.
- `SignUpPage.tsx` — stays the signup surface (separate file, as today), gains: employee-id field, role radio list, show-password toggles, emerald-token success.
- `frontend/src/components/PasswordInput.tsx` — NEW shared component: input + eye/eye-off toggle button (`type="button"`, `aria-label` swaps, `aria-pressed`), forwards all input props. Used by both pages and reset steps 1/3.
- `AuthContext` — reads `auth_remember` flag (no behavioral change yet; flag stored only).
- Routing: unchanged (`#login` / `#signup` hashes, App.tsx untouched).

## 7. Accessibility (binding)

- Every input: visible `<label for>` above; stable ids; correct `autocomplete`; `aria-invalid` + inline error `<p id>` linked via `aria-describedby`.
- Show-password: `<button type="button" aria-label aria-pressed>`, icon `aria-hidden`.
- Radio group: `role="radiogroup"` + `role="radio"` + `aria-checked`; arrow-key navigation with roving tabindex; visible focus ring (global `:focus-visible`).
- Reset flow: step changes move focus to the step heading (`tabIndex={-1}` + `.focus()`), so screen readers announce progression.
- Color independence: errors pair text + icon, never color alone.
- All contrast pairs per §3.

## 8. Verification

- Build + lint green. Drift sweep: zero Tailwind-palette color classes in the two pages (`grep -nE "emerald-[0-9]|slate-[0-9]|sky-|rose-|red-|amber-|green-" pages/`), zero `animate-pulse|animate-ping` in auth pages.
- **Backend pytest:** forgot/reset contract per §5.3 (5 cases).
- **axe sweep** (production preview): login, signup, reset step 1, reset step 3, mobile 390 — 0 violations.
- **Structural probes:** split layout at 1440 (hero ≈45% width); navy banner + single column at 390; eye toggle flips `input.type`; radio rows ≥300px wide; reset code box mono; "Forgot password?" link present on login only; no dot elements in hero ticker (`.size-1.5.rounded-full` absent from aside); remember-me checkbox toggles `aria-checked`; success panel uses `rgb(4,120,87)` on `rgb(236,253,245)`.
- Screenshots: login desktop/mobile, signup desktop, reset step 2 → `/tmp/qa-shots-auth-layout/`.

## 9. Out of Scope

- Landing page, OAuth/social login, real email delivery, multi-factor auth, changing the 45/55 split / globe / headline treatments, App.tsx routing changes.

## 10. Tasks Preview (for writing-plans)

1. Backend: `password_reset_tokens` model + `POST /auth/forgot-password` + `POST /auth/reset-password` + pytest (TDD).
2. `PasswordInput` shared component.
3. AuthPage login card: forgot link, remember-me, show-password, remove dead `isRegister` branch, dot-free ticker.
4. SignUpPage: employee-id + email fields, role radio list, show-password, emerald-token success.
5. AuthPage reset flow (3 steps, focus management).
6. Build/lint/drift verification.
7. QA: pytest + axe 5-flow sweep + structural probes + screenshots.
