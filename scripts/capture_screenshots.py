import os
import sys
import shutil
import time
from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.abspath('backend'))
from app.security import create_access_token

OUT_DIR = os.path.abspath("docs/screenshots")
ARTIFACT_DIR = "/home/asp/.gemini/antigravity/brain/63339a7e-92f1-40c2-9c79-cd03c46c2d15/screenshots"
os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(ARTIFACT_DIR, exist_ok=True)

token = create_access_token({'sub': 'planner@sail.gov.in'})

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        
        # 1. Desktop context
        context = browser.new_context(viewport={'width': 1440, 'height': 900}, device_scale_factor=2)
        page = context.new_page()
        
        # --- 01. Login Page ---
        print("Capturing 01_login_page.png...")
        page.goto('http://127.0.0.1:5173/#login', wait_until='networkidle')
        page.wait_for_timeout(1000)
        page.screenshot(path=os.path.join(OUT_DIR, "01_login_page.png"))
        
        # --- 02. Sign Up Page ---
        print("Capturing 02_signup_page.png...")
        page.goto('http://127.0.0.1:5173/#signup', wait_until='networkidle')
        page.wait_for_timeout(1000)
        page.screenshot(path=os.path.join(OUT_DIR, "02_signup_page.png"))
        
        # --- 03. Authenticated Dashboard Overview ---
        print("Capturing 03_dashboard_overview.png...")
        page.goto('http://127.0.0.1:5173/', wait_until='domcontentloaded')
        page.evaluate(f'localStorage.setItem("token", "{token}")')
        page.goto('http://127.0.0.1:5173/', wait_until='networkidle')
        page.wait_for_timeout(2500)
        page.screenshot(path=os.path.join(OUT_DIR, "03_dashboard_overview.png"))
        page.screenshot(path=os.path.join(OUT_DIR, "03b_dashboard_fullpage.png"), full_page=True)
        
        # --- 04. Dashboard with New Analysis Drawer (Top) ---
        print("Capturing 04_dashboard_new_analysis_drawer.png...")
        btn = page.locator('button:has-text("Run New Analysis")').first
        if btn.is_visible():
            btn.click()
            page.wait_for_timeout(1200)
            page.screenshot(path=os.path.join(OUT_DIR, "04_dashboard_new_analysis_drawer.png"))
            
            # --- 05. Drawer Scrolled to Chart & Landed Costs ---
            print("Capturing 05_drawer_chart_and_cost_breakdown.png...")
            scrollable = page.locator('div.overflow-y-auto.bg-paper').first
            if scrollable.is_visible():
                scrollable.evaluate('el => el.scrollTop = el.scrollHeight')
                page.wait_for_timeout(1000)
                page.screenshot(path=os.path.join(OUT_DIR, "05_drawer_chart_and_cost_breakdown.png"))
        
        context.close()
        
        # --- 06. Mobile View (390 x 844) ---
        print("Capturing 06_dashboard_mobile.png...")
        mob_context = browser.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
        mob_page = mob_context.new_page()
        mob_page.goto('http://127.0.0.1:5173/', wait_until='domcontentloaded')
        mob_page.evaluate(f'localStorage.setItem("token", "{token}")')
        mob_page.goto('http://127.0.0.1:5173/', wait_until='networkidle')
        mob_page.wait_for_timeout(2000)
        mob_page.screenshot(path=os.path.join(OUT_DIR, "06_dashboard_mobile.png"))
        mob_context.close()
        
        # --- 07. Tablet View (768 x 1024) ---
        print("Capturing 07_dashboard_tablet.png...")
        tab_context = browser.new_context(viewport={'width': 768, 'height': 1024}, device_scale_factor=2)
        tab_page = tab_context.new_page()
        tab_page.goto('http://127.0.0.1:5173/', wait_until='domcontentloaded')
        tab_page.evaluate(f'localStorage.setItem("token", "{token}")')
        tab_page.goto('http://127.0.0.1:5173/', wait_until='networkidle')
        tab_page.wait_for_timeout(2000)
        tab_page.screenshot(path=os.path.join(OUT_DIR, "07_dashboard_tablet.png"))
        tab_context.close()
        
        browser.close()

    # Copy files to artifact dir
    for fname in os.listdir(OUT_DIR):
        if fname.endswith(".png"):
            shutil.copy2(os.path.join(OUT_DIR, fname), os.path.join(ARTIFACT_DIR, fname))
            
    print(f"Screenshots saved to {OUT_DIR} and {ARTIFACT_DIR}")

if __name__ == "__main__":
    run()
