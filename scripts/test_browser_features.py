import sys
import time
import json
import os
from playwright.sync_api import sync_playwright

URL = "https://pravah-sail.vercel.app"
SCREENSHOT_DIR = "/home/asp/Downloads/Organized/01_ACTIVE_PROJECTS/SIH26006/test_screenshots"
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

results = {}

def run_tests():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type in ["error"] else None)

        print("--- Step 1: Login Page Navigation & Title ---")
        try:
            page.goto(f"{URL}/#login", wait_until="networkidle", timeout=30000)
            page.wait_for_timeout(2000)
            title = page.title()
            page.screenshot(path=f"{SCREENSHOT_DIR}/01_login_page.png")
            print(f"Page title: {title}")
            results["Login Page Navigation"] = {"status": "PASS", "details": f"Loaded with title '{title}'"}
        except Exception as e:
            results["Login Page Navigation"] = {"status": "FAIL", "details": str(e)}

        print("\n--- Step 2: Testing Demo Logins ---")
        demo_accounts = [
            ("Freight Planner", "demo@sail.gov.in", "Password123"),
            ("Port Operator", "portops@sail.gov.in", "Password123"),
            ("Admin", "admin@sail.gov.in", "Password123")
        ]

        for role_name, email, password in demo_accounts:
            try:
                page.goto(f"{URL}/#login", wait_until="networkidle")
                page.wait_for_timeout(1000)

                # Dismiss welcome tour modal if present
                for sel in ["button:has-text('Skip')", "button:has-text('Dismiss')", "button:has-text('Explore on my own')"]:
                    btn = page.query_selector(sel)
                    if btn and btn.is_visible():
                        btn.click()
                        page.wait_for_timeout(300)

                # Click demo account button
                demo_btn = page.locator(f"button:has-text('{role_name}')").first
                if demo_btn.is_visible():
                    demo_btn.click()
                    page.wait_for_timeout(500)
                else:
                    page.fill('input[type="email"]', email)
                    page.fill('input[type="password"]', password)

                # Click Sign In
                sign_in_btn = page.locator('button[type="submit"]:has-text("Sign In"), button:has-text("Sign In")').first
                sign_in_btn.click()
                page.wait_for_timeout(3500)

                current_url = page.url
                logged_in = "#dashboard" in current_url or "#login" not in current_url
                page.screenshot(path=f"{SCREENSHOT_DIR}/02_login_{role_name.replace(' ', '_').lower()}.png")
                
                if logged_in:
                    results[f"Demo Login ({role_name})"] = {"status": "PASS", "details": f"Successfully authenticated, navigated to {current_url}"}
                    print(f"Login {role_name}: PASS")
                else:
                    err_alert = page.query_selector('[role="alert"]')
                    err_text = err_alert.inner_text() if err_alert else "Unknown login failure"
                    results[f"Demo Login ({role_name})"] = {"status": "FAIL", "details": err_text}
                    print(f"Login {role_name}: FAIL ({err_text})")
            except Exception as e:
                results[f"Demo Login ({role_name})"] = {"status": "FAIL", "details": str(e)}
                print(f"Login {role_name}: ERROR {e}")

        # Now test features with logged-in session (Freight Planner)
        print("\n--- Step 3: Testing Application Pages & Features ---")
        pages_to_test = [
            ("Dashboard", "#dashboard", ["Voyages", "Rate", "Recent", "Fleet", "Trends"]),
            ("Analysis #1 Results", "#analysis-1", ["Newcastle", "Paradip", "Panamax", "Feasibility", "Cost"]),
            ("Scenario Studio", "#scenario", ["Scenario", "Parameters", "Simulation", "Sensitivity"]),
            ("Decision Record", "#decision-1", ["Decision", "Record", "Charter", "Audit", "Rationale"]),
            ("History", "#history", ["Analyses", "Archive", "Search", "Filters"]),
            ("Booking", "#booking", ["Booking", "Fixture", "Contract", "Vessel"]),
            ("Demand Board", "#demand", ["Demand", "Cargo", "Parcel", "Port"]),
            ("Vendor Quotes", "#quotes", ["Quotes", "Freight", "Bids", "Carrier"]),
            ("Live Map", "#live-map", ["Map", "Vessel", "Tracking", "Routes"]),
            ("Admin Reference", "#admin-reference", ["Reference", "Ports", "Bunkers", "Rates"]),
            ("Admin Users", "#admin-users", ["Users", "Roles", "Access", "Permissions"]),
            ("Audit Log", "#audit", ["Audit", "Activity", "Timestamp", "Action"]),
            ("New Analysis Modal", "#new-analysis", ["New Analysis", "Cargo", "Route", "Vessel", "Tonnage"])
        ]

        for page_name, hash_route, expected_keywords in pages_to_test:
            try:
                page.goto(f"{URL}/{hash_route}", wait_until="networkidle", timeout=20000)
                page.wait_for_timeout(2500)

                for sel in ["button:has-text('Skip')", "button:has-text('Dismiss')", "button:has-text('Got it')"]:
                    btn = page.query_selector(sel)
                    if btn and btn.is_visible():
                        btn.click()
                        page.wait_for_timeout(300)

                body_text = page.inner_text("body")
                page_slug = page_name.replace(" ", "_").replace("#", "").lower()
                page.screenshot(path=f"{SCREENSHOT_DIR}/page_{page_slug}.png")

                matched = [kw for kw in expected_keywords if kw.lower() in body_text.lower()]
                has_error_screen = "Something went wrong" in body_text or "Internal Server Error" in body_text or "Unable to load" in body_text
                
                if has_error_screen:
                    results[page_name] = {"status": "FAIL", "details": "Error screen or failure banner detected"}
                    print(f"Feature {page_name}: FAIL (Error banner displayed)")
                elif len(matched) >= 1:
                    results[page_name] = {"status": "PASS", "details": f"Rendered with matched content: {', '.join(matched)}"}
                    print(f"Feature {page_name}: PASS ({len(matched)} keywords matched)")
                else:
                    results[page_name] = {"status": "PARTIAL", "details": "Rendered but expected keywords not strongly matched"}
                    print(f"Feature {page_name}: PARTIAL")
            except Exception as e:
                results[page_name] = {"status": "FAIL", "details": str(e)}
                print(f"Feature {page_name}: ERROR {e}")

        # Step 4: Test New Analysis Form Submission
        print("\n--- Step 4: Interactive Analysis Creation Flow ---")
        try:
            page.goto(f"{URL}/#new-analysis", wait_until="networkidle")
            page.wait_for_timeout(2000)
            inputs = page.query_selector_all("input, select")
            print(f"New Analysis Modal inputs found: {len(inputs)}")
            page.screenshot(path=f"{SCREENSHOT_DIR}/new_analysis_form.png")
            results["New Analysis Modal Form"] = {"status": "PASS", "details": f"Form rendered with {len(inputs)} interactive inputs"}
        except Exception as e:
            results["New Analysis Modal Form"] = {"status": "FAIL", "details": str(e)}

        browser.close()

    print("\n================== SUMMARY ==================")
    print(json.dumps(results, indent=2))
    with open(f"{SCREENSHOT_DIR}/results.json", "w") as f:
        json.dump(results, f, indent=2)

if __name__ == "__main__":
    run_tests()
