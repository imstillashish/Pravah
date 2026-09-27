# Spotlight Walkthrough Design: 28-Feature Guided Tour

## What this is

An interactive guided tour built into the PRAVAH web app. When a user clicks **"Feature Tour"**, the screen dims and blurs, leaving a bright spotlight cutout over the exact button, card, or chart being explained. Next to the highlighted item, an explanation card tells the user:
1. What they are looking at on screen.
2. What the backend calculates under the hood.
3. Why this matters to Steel Authority of India Limited (SAIL).

Clicking **Next** moves the spotlight to the next feature, changing pages automatically when needed.

---

## How the spotlight works (in plain terms)

Think of the screen as a theater stage:
1. **The dark curtain**: A dark, blurred film covers the entire screen (`bg-black/60 backdrop-blur-sm`).
2. **The spotlight hole**: Using an SVG cutout mask, a transparent hole is cut out right over the element we want to show. Because the hole is transparent, that button or table shows through completely bright and sharp.
3. **The glowing ring**: A slim lime-green box outlines the spotlighted element so your eye goes straight to it.
4. **The explainer note**: A clean card floats right next to the spotlight with "Previous", "Next", and a progress number (e.g., "Step 5 of 28").

---

## Preventing positioning errors

A common bug in web tours is the spotlight jumping away from the button or drawing in the wrong place when the user scrolls. We prevent this using four simple rules:

1. **Direct screen coordinates**: We read the element's position using `getBoundingClientRect()`, which gives coordinates directly relative to what the user sees on screen. We do not guess offsets.
2. **Scroll lock and tracking**: While the tour runs, we listen for scroll and window resize events. If the page shifts, the spotlight recalculates on the very next animation frame and stays stuck to the target.
3. **Scroll into view first**: Before moving the spotlight, the browser smoothly scrolls the target element to the center of the screen.
4. **Smart card placement**: The floating card checks how much room is left on screen. If the button is near the bottom, the card appears above it. If the button is near the top, the card appears below it. If the button is too wide, the card stays within screen borders so it never gets clipped.

---

## The 28-Step Tour Order

The tour follows the natural story of a logistics officer planning a shipment:

### Part 1: Starting up & Global Signals
1. **Feature #13: Login & Roles (`#login`)**  
   - Spotlight: Quick Demo Accounts buttons.  
   - Explanation: Shows how officers, port operators, and admins get separate access permissions with single-click demo logins.
2. **Feature #25: Disruption Alert Scanner (`#dashboard`)**  
   - Spotlight: Red Sea alert banner.  
   - Explanation: Watches global shipping routes and weather alerts in real time to warn planners before ships get delayed.
3. **Feature #21: Stock-Out Alert (`#dashboard`)**  
   - Spotlight: Days-to-stockout card.  
   - Explanation: Compares plant coal reserves (15 days left) with ocean shipping times (22 days needed) so plants do not run out of fuel.
4. **Feature #22: Multi-Plant Parcel Pooling (`#demand`)**  
   - Spotlight: Demand consolidation bar.  
   - Explanation: Combines two smaller orders (Bhilai 40,000 MT and Rourkela 35,000 MT) into one big Panamax ship, cutting freight costs by 14.2%.

### Part 2: Setting up a Voyage
5. **Feature #1: New Analysis Form (`#new-analysis`)**  
   - Spotlight: Cargo and quantity inputs.  
   - Explanation: Simple 5-field form where an officer enters what they need to ship, how much, and when.
6. **Feature #2: Context & Port Resolution (`#new-analysis`)**  
   - Spotlight: Port selection dropdowns.  
   - Explanation: Automatically checks port codes, sea distances, and water depths for ports around the world.
7. **Feature #3: Live Market Data Feeds (`#new-analysis`)**  
   - Spotlight: Market data feed strip.  
   - Explanation: 8 background connectors that pull fuel prices, currency rates, and market indices.
8. **Feature #4: Voyage Math Derivations (`#new-analysis`)**  
   - Spotlight: Voyage calculation summary card.  
   - Explanation: 11 automatic formulas that calculate transit days, fuel burned, and number of trips required.

### Part 3: AI Price Forecasts & Ship Safety
9. **Feature #5: Freight Rate Forecast (`#analysis-1`)**  
   - Spotlight: Forecast price chart.  
   - Explanation: Machine learning model (LightGBM) predicts high, medium, and low expected shipping costs over the delivery window.
10. **Feature #6: Ship & Port Compatibility Check (`#analysis-1`)**  
    - Spotlight: Feasibility matrix table.  
    - Explanation: Checks ship size against water depth at Paradip port. Explains why a giant Capesize ship is rejected (draft too deep) while a Panamax ship is approved.
11. **Feature #24: Total Landed Cost Calculator (`#analysis-1`)**  
    - Spotlight: Cost breakdown box.  
    - Explanation: Multiplies freight rate, fuel surcharges, and dollar-to-rupee currency rate to give the exact total cost per ton and total project bill.
12. **Feature #8: Risk Evaluation Engine (`#analysis-1`)**  
    - Spotlight: Risk signals panel.  
    - Explanation: Highlights real data risks like monsoon storms or port congestion before contracts are signed.

### Part 4: Recommendations & Testing "What-If"
13. **Feature #9: Best Recommendation (`#analysis-1`)**  
    - Spotlight: Top recommendation card.  
    - Explanation: Mathematical score combining 50% price, 30% forecast confidence, and 20% delivery timing to pick the winning option.
14. **Feature #10: Plain-English Explanation (`#analysis-1`)**  
    - Spotlight: Explainability summary box.  
    - Explanation: Translates the algorithm's math into a simple paragraph any officer or auditor can read.
15. **Feature #23: Score Breakdown Bar Chart (`#analysis-1`)**  
    - Spotlight: 50/30/20 horizontal bar chart.  
    - Explanation: Shows exactly how many points came from price, how many from confidence, and how many from schedule fit.
16. **Feature #7: What-If Scenario Sandbox (`#scenarios`)**  
    - Spotlight: Scenario adjustment sliders.  
    - Explanation: Lets the officer test "What if fuel prices rise 15%?" or "What if the ship is delayed 4 days?" without breaking the main plan.
17. **Feature #27: Emergency Procurement Toggle (`#scenarios`)**  
    - Spotlight: Emergency mode switch.  
    - Explanation: Tells the system not to wait for cheaper prices when a steel plant is near an emergency shutdown.
18. **Feature #28: Spot Market vs. Long-Term Contract (`#quotes`)**  
    - Spotlight: Spot vs. COA comparison card.  
    - Explanation: Compares hiring a ship for one single trip versus using an existing long-term volume discount contract.

### Part 5: Executive Sign-off & Audit Trail
19. **Feature #11: Human Override with Reason (`#decisions`)**  
    - Spotlight: Override reason input and submit button.  
    - Explanation: Allows senior managers to choose a different ship, but requires typing a written reason for government record-keeping.
20. **Feature #26: Regret Score (`#decisions`)**  
    - Spotlight: Regret percentage indicator.  
    - Explanation: Reviews past shipments to see if the chosen date was close to the cheapest day of that month.
21. **Feature #12: Formal PDF / Print Export (`#decisions`)**  
    - Spotlight: Export decision record button.  
    - Explanation: Downloads a clean one-page memorandum ready for board meetings or official audits.
22. **Feature #14: Permanent Audit Ledger (`#audit-log`)**  
    - Spotlight: Audit table entries.  
    - Explanation: An unchangeable log that records who approved what, when, and why.

### Part 6: History & Administration
23. **Feature #16: Past Analyses Library (`#history`)**  
    - Spotlight: Search and filter table.  
    - Explanation: Easy lookup to search and review older shipping calculations.
24. **Feature #15: Port & Vessel Data Upload (`#admin-reference`)**  
    - Spotlight: CSV file upload area.  
    - Explanation: Lets port administrators update water depths and new ship types with automatic error checks on bad data rows.
25. **Feature #17: Model Retraining Health (`#admin-reference`)**  
    - Spotlight: Model status indicator.  
    - Explanation: Shows the training date and accuracy status of the AI model.
26. **Feature #18: Batch Analysis (`#history`)**  
    - Spotlight: Batch action button.  
    - Explanation: Lets planners run shipping calculations for multiple steel plants at the same time.
27. **Feature #19: Contract System Integration Hooks (`#quotes`)**  
    - Spotlight: Carrier integration badge.  
    - Explanation: Explains the connection points designed for enterprise ERP systems.
28. **Feature #20: Live Map & Coastal Route Boundaries (`#map`)**  
    - Spotlight: Interactive nautical sea route.  
    - Explanation: Shows the vessel's calculated nautical path between ports, clearly distinguishing verified math from paid satellite tracking feeds.

---

## User controls during the tour

- **Click "Feature Tour" in the top bar** at any time to start or resume.
- **Next / Previous buttons** or **Arrow keys** to step through.
- **"Jump to feature" dropdown** to jump directly to any of the 28 features.
- **Escape key or Close button** to close the tour immediately.
