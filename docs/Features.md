# CharterSense — Page-by-Page Feature List (Simple Language)

Here is every page in the app, and what each page actually does. No design details — just what exists and why.

---

## 1. Landing Page (the first page anyone sees, before login)

**Section: Introduction**
Explains in one line what the tool does — helps SAIL decide which ship to hire and when, for the best price.

**Section: Problem**
Shows the problem in simple numbers — right now, choosing a ship takes too long and sometimes costs more money than needed.

**Section: How It Works**
A short 4-5 step picture showing: you enter cargo details → tool checks prices and ships → tool gives you an answer → you decide.

**Section: What You Get**
A short list of the main things the tool does — predicts price, checks if a ship fits, shows risks, gives one clear recommendation.

**Section: Trust/Proof**
A note saying which parts of the tool are real predictions and which parts are shown using sample data, so nobody is confused.

**Button: Sign Up**
Takes a new user to the Sign Up page.

**Button: Login**
Takes an existing user to the Login page.

---

## 2. Sign Up Page

**Inputs:**
- Full Name
- Employee ID or Email
- Password
- Confirm Password
- Role (dropdown: Officer / Manager / Admin)

**Button: Create Account**
Creates the user and sends them to the Login page.

**Link: Already have an account? Login**
Takes user back to Login page.

---

## 3. Login Page

**Inputs:**
- Email or Employee ID
- Password

**Button: Login**
Checks the details and lets the user into the Dashboard.

**Link: Forgot Password**
Simple reset flow (basic, no SMS/email service needed).

---

## 4. Dashboard (Home Page after Login)

**Section: Quick Summary**
Shows how many analyses the user has done, and how many are waiting for approval.

**Section: Recent Analyses**
A short list of the last few cargo decisions the user looked at, with quick links to open them again.

**Section: Alerts**
Shows short warnings if something needs attention — like a stock running low, or a good price window closing soon.

**Button: Start New Analysis**
Takes the user to the New Analysis page.

---

## 5. New Analysis Page (the main input page)

**Inputs (the only 5 things a user must type):**
- Cargo Type (dropdown, e.g., Coking Coal)
- Quantity (in tonnes)
- Origin (where the cargo is coming from)
- Destination Port (dropdown, one of the 4 supported ports)
- Delivery Window (start date, end date)

**Optional Inputs (for extra features):**
- Current Stock Available (for stock-out warning)
- Daily Usage Rate (for stock-out warning)

**Button: Analyze**
Sends the details to the system and takes the user to the Results page once ready.

---

## 6. Analysis Results Page (the main output page)

**Section: Recommendation**
Shows the one best choice — which type of ship, expected price, and expected delivery time.

**Section: Why This Was Chosen**
A simple breakdown showing how much the price, confidence, and route match each added to the final decision.

**Section: Other Options Considered**
Shows 2-3 other ship choices that were considered but not picked, with a short reason why not.

**Section: Ship Fit Check**
Tells the user whether the recommended ship can actually enter the chosen port safely (based on ship size and port depth rules).

**Section: Risk Warnings**
A short table showing possible risks — like bad weather season, or a recent disruption news match — with a note on how confident each warning is.

**Section: Total Cost Breakdown**
Shows the full expected cost per tonne, including ship hire price and currency conversion, added together.

**Section: Extra Cost Estimates (if applicable)**
Shows CO2 emission estimate, demurrage cost estimate, and ship space usage percentage — only when relevant.

**Section: Spot vs Long-Term Contract**
Compares the predicted one-time ship price against a long-term contract price the user can adjust.

**Button: Approve / Send for Booking**
Marks this decision as approved and creates a booking request.

**Button: Try Different Scenario**
Lets the user change one input (like quantity or dates) and see a new result without starting over.

**Button: Download Report**
Saves this result as a PDF file.

---

## 7. Scenario Comparison Page

**Section: Side-by-Side Comparison**
Shows two or three versions of the same cargo decision next to each other (e.g., different quantities or dates), so the user can compare prices and risks together.

**Button: Choose This Scenario**
Picks one version as the final decision and moves it to the Results page.

---

## 8. Decision Record Page

**Section: Final Decision Summary**
Shows what was recommended, what the user actually chose, and the reason if they picked something different from the system's suggestion.

**Section: Approval Status**
Shows whether this decision is still waiting for manager approval, approved, or rejected.

**Button: Approve** (only visible to Managers)
Marks the decision as approved.

**Button: Reject** (only visible to Managers)
Marks the decision as rejected, with a required short reason.

**Button: Download Final Record**
Saves the complete decision, including who approved it, as a PDF.

---

## 9. My Analyses / History Page

**Section: List of Past Analyses**
Shows every analysis the user has done before, with date, cargo type, and final decision.

**Search/Filter:**
Lets user find old analyses by date, cargo type, or port.

**Button: Open**
Opens any past analysis again to view or re-check it.

---

## 10. Booking Page

**Section: Booking Status**
Shows the current stage of a booking — Waiting, Sent to Broker, Confirmed, or Cancelled.

**Button: Initiate Booking**
Creates a booking request out of an approved decision.

**Button: Mark as Confirmed** (Admin/Manager only)
Updates the booking once the real-world deal is done outside the system.

**Note shown on this page:**
A short line saying booking status here is tracked manually and does not connect to any live shipping company system yet.

---

## 11. Demand Board Page

**Section: All Open Requests**
Shows cargo requests from different SAIL plants (Bhilai, Rourkela, Durgapur, Bokaro, Burnpur) that are still open.

**Section: Combine Requests**
Lets the chartering team merge two similar requests going to the same port into one bigger, cheaper request.

**Button: Merge Selected Requests**
Combines the chosen requests into one.

**Button: Post New Request**
Adds a new plant's cargo need to the board.

---

## 12. Vendor Quotes Page *(sample data, clearly marked)*

**Section: Quotes Received**
Shows a small set of ship broker quotes (price, ship type, delivery time) next to the tool's own prediction, for comparison.

**Label shown on this page:**
A constant note saying these quotes are sample data, shown to demonstrate how real broker replies would look once connected.

**Button: Send for Quotes**
Creates a new quote request (in the working version, this would send a link to a real broker).

---

## 13. Live Map Page *(sample data, clearly marked)*

**Section: Route View**
Shows the shipping route between the origin and destination port on a map.

**Section: Ship Position**
Shows a ship icon moving along the route over time.

**Label shown on this page:**
A constant note saying the ship's position is generated automatically to show how real tracking would look, and is not an actual live ship location.

---

## 14. Admin — Reference Data Page

**Section: Ports List**
Shows the 4 supported ports and their size limits (depth, ship length, ship width).

**Section: Vessel Classes List**
Shows the 4 ship types and their size ranges.

**Section: Plants List**
Shows the SAIL plants used for the Demand Board.

**Button: Edit**
Lets Admin update any of these values if they change in real life.

---

## 15. Admin — Users & Roles Page

**Section: All Users**
Shows every person using the tool and their role (Officer, Manager, Admin).

**Button: Change Role**
Lets Admin update someone's role.

**Button: Disable User**
Stops a user from logging in without deleting their history.

---

## 16. Audit Log Page

**Section: Activity List**
Shows a plain list of important actions taken in the tool — who created an analysis, who approved a decision, who changed a setting — with date and time.

**Search/Filter:**
Lets user find actions by person, date, or type of action.

---