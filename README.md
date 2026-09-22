# ASTITVA — Advanced Shipping & Transport Intelligence for Tracking Vessel Availability

ASTITVA is an intelligent maritime logistics and vessel tracking platform designed to optimize port operations, monitor vessel availability, track cargo lifecycles, and streamline vessel-to-berth allocation.

## Architecture

- **Backend**: FastAPI (Python), SQLAlchemy, Pydantic, SQLite (local dev)
- **Frontend**: React 19, TypeScript, TailwindCSS, Vite, Lucide Icons

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+ and npm

### Quick Start

Run both frontend and backend concurrently:

```bash
chmod +x dev.sh
./dev.sh
```

Or start them individually:

#### Backend
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Documentation

- Architecture & Design System: [DESIGN.md](DESIGN.md)
- Feature Specifications: [docs/Features.md](docs/Features.md)
