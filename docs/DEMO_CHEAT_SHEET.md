# ASTITVA — 3-Minute Live Jury Presentation Cheat Sheet

**Problem Statement**: SIH26006 — Intelligent Bulk Maritime Logistics & Freight Rate Forecasting Platform  
**Target Organization**: Steel Authority of India Limited (SAIL)  
**Production URL**: `https://astitva-frontend.onrender.com` / `http://localhost:5173`  
**API Health Check**: `GET /health` → `{"status": "ok", "service": "Astitva Core API"}`

---

## 🔑 Demo Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Procurement Officer (Primary)** | `demo@sail.gov.in` | `SailDemo2026!` |
| **System Admin** | `admin@astitva.gov.in` | `AstitvaDemo2026!` |

---

## 🔄 Quick Database Reset (Run anytime to restore clean state in < 5s)
```bash
python scripts/reset_demo_db.py
```
*Clears application tables in strict dependency order, re-seeds reference ports/vessels/plants, Golden Demo analysis, risk matrices, and vendor quotes.*

---

## ⏱️ 3-Minute Timed Presentation Walkthrough

### 0:00 – 0:45 | Dashboard & Live Global Signals
1. **Login** at `/login` as `demo@sail.gov.in`.
2. **Dashboard Overview**:
   - Highlight the **Red Sea Disruption Alert** marquee banner (*"Red Sea shipping disruptions continue amid ongoing security concerns"*).
   - Point to the live Baltic Dry Index (BDI), bunker VLSFO, and Cape/Panamax spot trend series.
   - Show the active Golden Demo card: **Newcastle → Paradip (75,000 MT Coking Coal)**.

### 0:45 – 1:30 | Demand Board & Parcel Pooling
1. Navigate to **Demand Board** (`/demand`).
2. Point to the 2 open SAIL plant cargo requests:
   - **Bhilai Plant**: 40,000 MT coking coal to Paradip.
   - **Rourkela Plant**: 35,000 MT coking coal to Paradip.
3. Select both requests and click **Consolidate / Merge Requests**.
4. Show the combined **75,000 MT parcel** — demonstrate how pooling shifts procurement from two inefficient Supramax voyages into one high-efficiency Panamax parcel, saving ~14.2% in freight costs.

### 1:30 – 2:30 | Predictive Freight & Engineering Decision Engine
1. Click the **Golden Demo Analysis** to open the Analysis Results page (`/analyses/1`).
2. **Forecast Engine**:
   - Point to LightGBM Quantile Forecast: $18.50 (p10), $22.30 (p50), $27.80 (p90) with ARIMA(5,1,0) baseline check.
3. **Vessel Feasibility (Crucial Jury Checkpoint)**:
   - Show **Capesize Rejected ❌**: Verify exact reason `"Draft 18.2m exceeds Paradip max draft 16.5m"`.
   - Show **Panamax Approved ✅**: Feasible on draft (14.2m <= 16.5m), LOA, and beam.
   - Note Haldia lightering intelligence (Sagar-Sandheads anchorages).
4. **Landed Cost Breakdown**:
   - Freight: $22.30/MT + BAF surcharge: $1.20/MT (`ENGINEERING ASSUMPTION` label).
   - Total: **$23.50/MT** = **Rs. 1,962.25/MT** (@ 83.5 INR/USD).
   - Total Parcel Cost: **Rs. 147.17 Crore**.
5. **Explainability & Recommendation Score**:
   - Explainable multi-factor formula: `0.5*Cost + 0.3*Confidence + 0.2*Coverage`.
   - Top Recommendation: **Panamax to Paradip** (Total Score: **0.756**).

### 2:30 – 3:00 | Operational Risk & Broker Quotes
1. **Stock-Out Urgency Alert**:
   - Red highlight box: Current stock (12,000 MT) will last **15 days**. Next optimal freight window is **22 days away**.
   - Platform verdict: **Order now — cannot afford to wait**.
2. **Decision & Regret Tracking**:
   - Show historical Regret Scores (0.5%, 3.2%, 8.1%) demonstrating post-voyage audit accuracy.
3. **Vendor Quotes**:
   - Show live broker quotes from Clarksons, Braemar, and SSY ($21.50–$24.20/MT).
   - Emphasize the sample disclaimer: *"These quotes are sample data. Real broker integration is not connected."*
4. **Interactive Route Map**:
   - Show Newcastle → Paradip great-circle nautical track (6,214 NM) and interpolated vessel position.
