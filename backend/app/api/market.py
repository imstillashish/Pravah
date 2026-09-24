"""
Market Indicators Router for SIH26006.
Exposes endpoints for Baltic Dry Indices (BDI/BCI/BPI/BSI),
Commodity Price Benchmarks (Coking Coal FOB, Iron Ore, Domestic Coal parity),
and Global Macroeconomic Indicators.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.connectors.market_indicators_connector import fetch_market_indicators

router = APIRouter(prefix="/market", tags=["market"])


@router.get("/indicators")
async def get_market_indicators(db: Session = Depends(get_db)):
    """
    Returns real-time and calibrated benchmark market indicators across
    freight lanes, bulk raw materials, and global manufacturing health.
    """
    indicators = await fetch_market_indicators()
    return indicators
