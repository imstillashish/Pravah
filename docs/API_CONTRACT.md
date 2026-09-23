# Astitva API Contract

## Overview
The Astitva Core API delivers intelligence, predictive freight rate forecasting, vessel-port feasibility validation, landed cost calculations, and supply chain risk intelligence for bulk maritime procurement (SIH26006).

**Base URL**: `http://localhost:8000` (Local) / `https://astitva-api.onrender.com` (Production)  
**Authentication**: Bearer JWT (`Authorization: Bearer <token>`)

---

## Table of Contents
1. [Authentication (`/auth`)](#1-authentication-auth)
   - `POST /auth/login`
   - `POST /auth/register`
   - `POST /auth/switch-role`
2. [Freight Analysis & Predictions (`/analyses`)](#2-freight-analysis--predictions-analyses)
   - `GET /analyses`
   - `POST /analyses`
   - `GET /analyses/{id}`
   - `POST /analyses/{id}/decision`
   - `GET /analyses/disruption-alerts`
   - `GET /disruption-alerts`
3. [Global Market Metrics (`/metrics`)](#3-global-market-metrics-metrics)
   - `GET /metrics/global`
4. [Broker Vendor Quotes (`/quotes`)](#4-broker-vendor-quotes-quotes)
   - `GET /quotes`
5. [Maritime Routing & Navigation (`/map`)](#5-maritime-routing--navigation-map)
   - `GET /map/route`
   - `GET /map/ship-position`
6. [Administration & Reference Data (`/admin`)](#6-administration--reference-data-admin)
   - `GET /admin/users`
   - `POST /admin/users`
   - `PATCH /admin/users/{id}/deactivate`
   - `GET /admin/reference`
   - `PUT /admin/reference/ports/{id}`
7. [Audit Trails & Governance (`/audit-logs`)](#7-audit-trails--governance-audit-logs)
   - `GET /audit-logs`
8. [System Health Check](#8-system-health-check)
   - `GET /health`

---

## 1. Authentication (`/auth`)

### `POST /auth/login`
Authenticates a user and issues a signed JWT access token.
- **Request Body**:
  ```json
  {
    "email": "demo@sail.gov.in",
    "password": "SailDemo2026!"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "user": {
      "id": 1,
      "email": "demo@sail.gov.in",
      "full_name": "SAIL Demo Officer",
      "role": "PROCUREMENT_OFFICER",
      "is_active": true
    }
  }
  ```

### `POST /auth/register`
Registers a new user account.
- **Request Body**:
  ```json
  {
    "full_name": "Logistics Planner",
    "email": "planner@sail.gov.in",
    "password": "SecurePassword123!",
    "role": "logistics_planner"
  }
  ```
- **Response `200 OK`**: User profile with created status.

---

## 2. Freight Analysis & Predictions (`/analyses`)

### `GET /analyses`
Lists past freight analyses with pagination and filtering.
- **Headers**: `Authorization: Bearer <token>`
- **Query Params**: `limit` (int, default 20), `status` (string, optional)
- **Response `200 OK`**: Array of analysis objects.

### `POST /analyses`
Runs end-to-end multi-agent pipeline: context resolution, ML forecasting (LightGBM quantile ensemble), port-vessel feasibility, landed cost calculation, risk scoring, recommendation, and stockout alert.
- **Request Body**:
  ```json
  {
    "origin_country": "Australia",
    "origin_port": "Newcastle, AU",
    "destination_port": "Paradip",
    "commodity": "coking_coal",
    "parcel_tonnage": 75000.0,
    "benchmark_spot_pmt": 25.50,
    "predicted_rate_pmt": 22.30
  }
  ```
- **Response `200 OK`**: Created analysis with id, summary metrics, and generated artifacts.

### `GET /analyses/disruption-alerts` / `GET /disruption-alerts`
Returns real-time and simulated geopolitical disruption alerts (e.g., Red Sea rerouting advisories).
- **Response `200 OK`**:
  ```json
  [
    {
      "id": 1,
      "keyword_matched": "Red Sea",
      "headline_text": "Red Sea shipping disruptions continue amid ongoing security concerns",
      "source_url": "https://maritime-bulletin.org/red-sea-advisory",
      "matched_at": "2026-09-23T10:45:00Z",
      "is_active": true
    }
  ]
  ```

---

## 3. Global Market Metrics (`/metrics`)

### `GET /metrics/global`
Provides live dashboard ticker indices: Baltic Dry Index (BDI), average freight rate, VLSFO bunker fuel prices, and charter day rates.
- **Response `200 OK`**:
  ```json
  {
    "bdi_index": 1942,
    "bdi_change_pct": 2.15,
    "current_avg_freight_pmt": 22.30,
    "freight_change_pct": -1.45,
    "bunker_vlsfo_pmt": 612.50,
    "capesize_daily_usd": 24500,
    "panamax_daily_usd": 14200,
    "series": {
      "bdi": [1890, 1910, 1942],
      "freight": [23.10, 22.80, 22.30],
      "bunker": [620, 615, 612.50]
    }
  }
  ```

---

## 4. Broker Vendor Quotes (`/quotes`)

### `GET /quotes`
Returns verified and sample charter quotes from maritime brokers.
- **Response `200 OK`**:
  ```json
  [
    {
      "id": 1,
      "quote_request_label": "QR-2026-001",
      "broker_name": "Clarksons Platou",
      "vessel_type": "Panamax",
      "quoted_rate_usd_per_mt": 21.80,
      "delivery_days": 24,
      "valid_until": "2026-09-30",
      "is_sample_data": true,
      "sample_data_notice": "These quotes are sample data. Real broker integration is not connected."
    }
  ]
  ```

---

## 5. Maritime Routing & Navigation (`/map`)

### `GET /map/route`
Returns geographical coordinates and great-circle sailing distance between origin and destination ports.
- **Query Params**: `origin_locode` (string), `destination_locode` (string)
- **Response `200 OK`**:
  ```json
  {
    "origin_lat": -32.9272,
    "origin_lon": 151.7765,
    "destination_lat": 20.3167,
    "destination_lon": 86.6167,
    "estimated_distance_nm": 5832.4,
    "note": "great-circle approximation"
  }
  ```

### `GET /map/ship-position`
Linearly interpolates simulated vessel progress along a maritime corridor.
- **Query Params**: `origin_lat`, `origin_lon`, `destination_lat`, `destination_lon`, `progress_pct` (0.0 to 1.0)
- **Response `200 OK`**:
  ```json
  {
    "current_lat": -6.3052,
    "current_lon": 119.1966,
    "progress_pct": 0.5,
    "note": "Generated position — not a live AIS feed"
  }
  ```

---

## 6. Administration & Reference Data (`/admin`)

- `GET /admin/users`: List system users
- `POST /admin/users`: Create user with administrative roles
- `PATCH /admin/users/{id}/deactivate`: Deactivate user credentials
- `GET /admin/reference`: Retrieve reference ports and vessel constraints
- `PUT /admin/reference/ports/{id}`: Update port draft and dimensional specifications

---

## 7. Audit Trails & Governance (`/audit-logs`)

### `GET /audit-logs`
Provides an immutable security log of authentication events, user role changes, procurement decisions, and override rationale.
- **Response `200 OK`**: Array of audit log events.

---

## 8. System Health Check

### `GET /health`
Returns system status.
- **Response `200 OK`**: `{"status": "ok", "service": "Astitva Core API"}`
