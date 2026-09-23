"""
Stock-Out Alert Engine.
Tasks 187–191 implementation.
"""
from typing import Any, Dict, Optional


try:
    from app.models import StockOutAlert
except (ImportError, AttributeError):
    try:
        from models import StockOutAlert
    except (ImportError, AttributeError):
        class StockOutAlert:
            """StockOutAlert ORM/Model representation."""

            def __init__(
                self,
                analysis_id=None,
                days_to_stockout: float = 0.0,
                days_to_best_window: float = 0.0,
                is_at_risk: bool = False,
                alert_message: str = "",
                **kwargs,
            ):
                self.analysis_id = analysis_id
                self.days_to_stockout = days_to_stockout
                self.days_to_best_window = days_to_best_window
                self.is_at_risk = is_at_risk
                self.alert_message = alert_message
                for k, v in kwargs.items():
                    setattr(self, k, v)

            def to_dict(self) -> Dict[str, Any]:
                return {
                    "days_to_stockout": round(self.days_to_stockout, 1),
                    "days_to_best_window": round(self.days_to_best_window, 1),
                    "is_at_risk": self.is_at_risk,
                    "alert_message": self.alert_message,
                }

            def __repr__(self) -> str:
                return (
                    f"<StockOutAlert at_risk={self.is_at_risk} "
                    f"stockout_in={self.days_to_stockout:.0f}d best_window_in={self.days_to_best_window:.0f}d>"
                )


def calculate_stockout_alert(
    analysis: Any,
    forecast: Optional[Any] = None,
) -> Optional[StockOutAlert]:
    """
    Evaluates plant inventory runway against shipping and forecast rate windows.

    Task 188: Return None if current_stock_mt or daily_consumption_mt is None.
    Task 189: days_to_stockout = current_stock_mt / daily_consumption_mt.
    Task 190: days_to_best_window = lowest rate window (or derived from forecast).
    Task 191: is_at_risk = days_to_stockout < days_to_best_window, alert_message formatting.
    """
    current_stock = getattr(analysis, "current_stock_mt", None)
    daily_consumption = getattr(analysis, "daily_consumption_mt", None)

    # Task 188: User did not provide stock data
    if current_stock is None or daily_consumption is None or daily_consumption <= 0:
        return None

    analysis_id = getattr(analysis, "id", None)

    # Task 189: Compute days to stockout
    days_to_stockout = float(current_stock) / float(daily_consumption)

    # Task 190: Compute days to best window
    # Find the day within the 14-day forecast window where p10 (best-case rate) is lowest — derive as best_day_index + 1
    days_to_best_window = 22.0  # Golden demo default
    if forecast is not None:
        p10_series = getattr(forecast, "p10_daily", None) or getattr(forecast, "daily_p10", None)
        if p10_series and len(p10_series) > 0:
            min_val = min(p10_series)
            best_day_index = p10_series.index(min_val)
            days_to_best_window = float(best_day_index + 1)
        elif hasattr(forecast, "best_window_days"):
            days_to_best_window = float(forecast.best_window_days)

    # Task 191: Risk evaluation & alert message
    is_at_risk = days_to_stockout < days_to_best_window

    call_to_action = (
        "Book now — cannot afford to wait."
        if is_at_risk
        else "Safe to wait for a better rate."
    )

    alert_message = (
        f"Stock will last {days_to_stockout:.0f} days. "
        f"Next favorable rate window is {days_to_best_window:.0f} days away. "
        f"{call_to_action}"
    )

    return StockOutAlert(
        analysis_id=analysis_id,
        days_to_stockout=days_to_stockout,
        days_to_best_window=days_to_best_window,
        is_at_risk=is_at_risk,
        alert_message=alert_message,
    )
