from fastapi import APIRouter
from app.schemas import GlobalMetricsResponse

router = APIRouter(prefix="/api/metrics", tags=["metrics"])

@router.get("/global", response_model=GlobalMetricsResponse)
def get_global_metrics():
    return GlobalMetricsResponse(
        bdi_index=1842,
        bdi_change_pct=2.4,
        current_avg_freight_pmt=14.85,
        freight_change_pct=-6.8,
        bunker_vlsfo_pmt=612.50,
        capesize_daily_usd=22450,
        panamax_daily_usd=14120,
    )
