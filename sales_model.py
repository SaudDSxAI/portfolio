"""
Sales forecasting model serving — same pattern as the other model routers,
mounted into the main AskSaud API.

Analysis compared Prophet and SARIMA (tied on accuracy — see /metrics for
the real numbers). The deployed API uses a lightweight trend + seasonal
decomposition implementation instead of either: same core idea (linear
trend + repeating monthly pattern) both models rely on, with zero extra
dependencies, verified at comparable accuracy on the same held-out test.
Live forecasts are precomputed at training time (this is a monthly
forecast, not a per-row prediction — there's no "user input" to score
against, so unlike the other three model routers, /predict just serves
the already-computed future forecast and historical series).
"""

import json
from pathlib import Path

from fastapi import APIRouter

MODEL_DIR = Path(__file__).resolve().parent / "sales_model_store"

router = APIRouter(prefix="/api/sales", tags=["sales"])

full_history: list[dict] = json.load(open(MODEL_DIR / "full_history.json"))
future_forecast: list[dict] = json.load(open(MODEL_DIR / "future_forecast.json"))
model_params: dict = json.load(open(MODEL_DIR / "model_params.json"))
metrics: dict = json.load(open(MODEL_DIR / "metrics.json"))


@router.get("/metrics")
def get_metrics():
    return metrics


@router.get("/forecast")
def get_forecast():
    """History + future forecast for the live demo chart."""
    return {
        "history": full_history,
        "forecast": future_forecast,
        "trend_dollars_per_month": model_params["trend_slope"],
    }
