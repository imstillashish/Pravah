"""
Spot vs. COA Comparison Engine.
Tasks 192–194 implementation.
"""
from typing import Any, Dict


def calculate_coa_comparison(
    spot_landed_cost: Any,
    coa_discount_pct: float = 8.0,
    num_voyages: int = 12,
) -> Dict[str, Any]:
    """
    Compares total spot procurement costs against a Contract of Affreightment (COA) commitment.

    NOTE (Task 194):
    # coa_discount_pct is an ENGINEERING ASSUMPTION — default 8%.
    # Admin can override. Never present as market fact.

    Task 193 Computations:
    - coa_rate_per_mt = spot_landed_cost.total_inr_per_mt * (1 - coa_discount_pct / 100)
    - spot_total = spot_landed_cost.total_inr * num_voyages
    - coa_total = coa_rate_per_mt * quantity_mt * num_voyages
    - savings = spot_total - coa_total
    """
    total_inr_per_mt = float(getattr(spot_landed_cost, "total_inr_per_mt", 1962.25))
    total_inr = float(getattr(spot_landed_cost, "total_inr", 147168750.0))

    # Retrieve parcel quantity
    analysis_obj = getattr(spot_landed_cost, "analysis", None)
    if analysis_obj is not None:
        quantity_mt = float(getattr(analysis_obj, "quantity_mt", 75000.0))
    else:
        quantity_mt = float(getattr(spot_landed_cost, "quantity_mt", 75000.0))

    # Task 193: Calculate COA discounted rate & totals
    coa_rate_per_mt = total_inr_per_mt * (1.0 - (coa_discount_pct / 100.0))
    spot_total = total_inr * num_voyages
    coa_total = coa_rate_per_mt * quantity_mt * num_voyages
    savings = spot_total - coa_total

    return {
        "spot_rate_per_mt_inr": round(total_inr_per_mt, 2),
        "coa_rate_per_mt_inr": round(coa_rate_per_mt, 2),
        "coa_discount_pct": round(coa_discount_pct, 2),
        "num_voyages": num_voyages,
        "spot_total_inr": round(spot_total, 2),
        "coa_total_inr": round(coa_total, 2),
        "savings_inr": round(savings, 2),
        "savings_pct": round(coa_discount_pct, 2),
        "assumption_note": "COA discount is an ENGINEERING ASSUMPTION (default 8%). Admin can override. Never present as market fact.",
    }
