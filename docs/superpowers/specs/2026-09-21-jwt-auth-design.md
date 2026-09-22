# Technical Specification: JWT Authentication & Workspace Role Switching

## 1. Overview
This specification details the user authentication and role-switching subsystem for the SIH26006 Intelligent Freight Forecasting platform. The goal is to provide secure access control using JSON Web Tokens (JWT) and enable logistics personnel and port/vendor operators to switch workspaces smoothly. All user-facing text uses plain, natural language without robotic jargon.

## 2. Architecture & Tech Stack
- **Backend**: Python FastAPI with Uvicorn
  - ORM: SQLAlchemy connecting to a local SQLite database (`logistics.db`).
  - Security: PyJWT (or `python-jose`) for token signing (HS256) and `passlib[bcrypt]` for secure password hashing.
- **Frontend**: React (Vite) + Tailwind CSS
  - Design standard: Wise design system (`DESIGN.md`) emphasizing high-contrast readable typography, subtle border framing, and clear buttons.
  - State management: React Auth Context with bearer token storage in `localStorage`.

## 3. Workspaces & Roles
1. **Freight & Chartering Desk (`logistics_planner`)** - *Default Role*
   - Designed for cargo procurement officers and charterers evaluating routes, entry timing, and vessel sizes.
2. **Vessel & Port Operations (`port_operator`)** - *Vendor / Operator Role*
   - Designed for port authorities, ship owners, and berth planners tracking dispatch, draft clearance, and vessel availability.
3. **Workspace Switcher**:
   - Header banner allows instant switching:
     - On Planner view: *"Looking for vessel schedules and port dispatch? Switch to Operations"*
     - On Operations view: *"Ready to review procurement forecasts? Switch to Freight Desk"*
   - Updates the database record and issues a refreshed JWT token.

## 4. API Specification

### 4.1 Endpoints
- `POST /api/auth/signup`
  - **Body**: `{ "full_name": string, "email": string, "password": string, "role": string (optional, default="logistics_planner") }`
  - **Response**: `{ "access_token": string, "token_type": "bearer", "user": UserResponse }`
- `POST /api/auth/login`
  - **Body**: `{ "email": string, "password": string }`
  - **Response**: `{ "access_token": string, "token_type": "bearer", "user": UserResponse }`
- `GET /api/auth/me`
  - **Header**: `Authorization: Bearer <token>`
  - **Response**: `UserResponse`
- `POST /api/auth/switch-role`
  - **Header**: `Authorization: Bearer <token>`
  - **Body**: `{ "target_role": "logistics_planner" | "port_operator" }`
  - **Response**: `{ "access_token": string, "token_type": "bearer", "user": UserResponse }`

### 4.2 Data Models
- **User Schema**:
  - `id`: Integer primary key
  - `email`: String (unique, index)
  - `full_name`: String
  - `hashed_password`: String
  - `role`: String (`logistics_planner` | `port_operator`)
  - `is_active`: Boolean (default True)
  - `created_at`: Datetime

## 5. Security & Verification Strategy
- **Password Strength**: Minimum 8 characters.
- **Token Expiry**: 24 hours validity.
- **Input Validation**: Handled via Pydantic v2 schemas.
- **Error Messages**:
  - Invalid credentials: *"The email or password you entered didn't match. Please try again."*
  - Duplicate email: *"An account with this email address already exists. Try signing in instead."*
  - Expired token: *"Your session expired. Please sign in again to continue."*

## 6. Testing Strategy
- Automated backend unit tests verifying:
  - Account registration and login token issuance.
  - Rejecting incorrect passwords.
  - Role switching and refreshed token generation.
- Automated API test script using Python `pytest` and `httpx`.
