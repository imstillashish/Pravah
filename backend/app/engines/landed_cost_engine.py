"""
Landed Cost Calculator Engine.
Tasks 184–186 implementation.
"""
from datetime import datetime, timezone
from typing import Any, Dict, Optional


try:
    from app.models import LandedCost
except (ImportError, AttributeError):
    try:
        from models import LandedCost
    except (ImportError, AttributeError):
        class LandedCost:
            """LandedCost ORM/Model representation."""

            def __init__(
                self,
                analysis_id=None,
                freight_rate_usd_per_mt: float = 0.0,
                baf_surcharge_usd_per_mt: float = 0.0,
                usd_inr_rate: float = 83.5,
                total_usd_per_mt: float = 0.0,
                total_inr_per_mt: float = 0.0,
                total_inr: float = 0.0,
                computed_at: Optional[datetime] = None,
                **kwargs,
            ):
                self.analysis_id = analysis_id
                self.freight_rate_usd_per_mt = freight_rate_usd_per_mt
                self.baf_surcharge_usd_per_mt = baf_surcharge_usd_per_mt
                self.usd_inr_rate = usd_inr_rate
                self.total_usd_per_mt = total_usd_per_mt
                self.total_inr_per_mt = total_inr_per_mt
                self.total_inr = total_inr
                self.computed_at = computed_at or datetime.now(timezone.utc)
                for k, v in kwargs.items():
                    setattr(self, k, v)

            def to_dict(self) -> Dict[str, Any]:
                return {
                    "freight_rate_usd_per_mt": round(self.freight_rate_usd_per_mt, 2),
                    "baf_surcharge_usd_per_mt": round(self.baf_surcharge_usd_per_mt, 2),
                    "usd_inr_rate": round(self.usd_inr_rate, 2),
                    "total_usd_per_mt": round(self.total_usd_per_mt, 2),
                    "total_inr_per_mt": round(self.total_inr_per_mt, 2),
                    "total_inr": round(self.total_inr, 2),
                    "computed_at": self.computed_at.isoformat() if self.computed_at else None,
                }

            def __repr__(self) -> str:
                return (
                    f"<LandedCost total_usd={self.total_usd_per_mt:.2f} "
                    f"total_inr_pmt={self.total_inr_per_mt:.2f} total_inr={self.total_inr:,.0f}>"
                )


def calculate_landed_cost(
    analysis: Any,
    forecast: Any,
    enrichment_data: Dict[str, Any],
) -> LandedCost:
    """
    Computes total landed logistics cost:
    - Freight Rate (p50 forecast)
    - Bunker Adjustment Factor (BAF = 5% of bunker price, labeled ENGINEERING ASSUMPTION)
    - USD to INR forex conversion
    - Total per MT and total across whole cargo parcel

    Task 185: Extract rates & BAF approximation.
    Task 186: Compute total_usd_per_mt, total_inr_per_mt, total_inr.
    """
    analysis_id = getattr(analysis, "id", None)
    quantity_mt = float(
        getattr(analysis, "quantity_mt", None)
        or getattr(analysis, "parcel_tonnage", None)
        or 75000.0
    )

    # 1. Freight rate from p50 forecast
    freight_rate_usd_per_mt = float(
        getattr(forecast, "p50_usd_per_mt", None)
        or getattr(forecast, "p50", None)
        or 22.3
    )

    # 2. BAF Surcharge (5% of bunker price, default 24.0 -> BAF 1.2 USD/MT)
    # Note: 5% of bunker price is an ENGINEERING ASSUMPTION
    bunker_price = enrichment_data.get("bunker_price_usd_per_mt")
    if bunker_price is not None and bunker_price > 0:
        baf_surcharge_usd_per_mt = float(bunker_price) * 0.05
    else:
        baf_surcharge_usd_per_mt = 1.2  # Golden demo standard BAF

    # 3. USD to INR conversion rate (default 83.5)
    usd_inr_rate = float(enrichment_data.get("usd_inr_rate") or 83.5)

    # 4. Task 186 Computations
    total_usd_per_mt = freight_rate_usd_per_mt + baf_surcharge_usd_per_mt
    total_inr_per_mt = total_usd_per_mt * usd_inr_rate
    total_inr = total_inr_per_mt * quantity_mt

    return LandedCost(
        analysis_id=analysis_id,
        freight_rate_usd_per_mt=freight_rate_usd_per_mt,
        baf_surcharge_usd_per_mt=baf_surcharge_usd_per_mt,
        usd_inr_rate=usd_inr_rate,
        total_usd_per_mt=total_usd_per_mt,
        total_inr_per_mt=total_inr_per_mt,
        total_inr=total_inr,
        computed_at=datetime.now(timezone.utc),
    )
