from fastapi import APIRouter
from app.schemas import GlobalMetricsResponse, MetricsSeries
from app.metrics_service import generate_series

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
        series=MetricsSeries(
            bdi=generate_series("bdi", 1842, vol=0.025),
            freight=generate_series("freight", 14.85, vol=0.018),
            bunker=generate_series("bunker", 612.50, vol=0.012),
        ),
    )
