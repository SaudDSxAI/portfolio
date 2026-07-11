"""
House price prediction model serving — same pattern as the other three
model routers, mounted into the main AskSaud API.

Model: Lasso Regression, statistically tied with XGBoost (paired t-test on
R2, p=0.2152) — chosen for interpretability and its built-in feature
selection (zeroed out 68 of 216 one-hot columns automatically).

This dataset has 216 features after encoding, far too many for a usable
live-demo form. The live demo exposes the dozen or so features that
actually matter (per the model's own coefficients) and fills everything
else from a "typical house" profile (median/mode across the training set)
— an honest tradeoff given the feature count, not an attempt to hide it.
"""

import json
from pathlib import Path
from typing import Literal

import joblib
import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

MODEL_DIR = Path(__file__).resolve().parent / "house_model_store"

router = APIRouter(prefix="/api/house", tags=["house"])

model = joblib.load(MODEL_DIR / "lasso_model.pkl")
feature_names: list[str] = json.load(open(MODEL_DIR / "feature_names.json"))
metrics: dict = json.load(open(MODEL_DIR / "metrics.json"))
default_profile: dict = json.load(open(MODEL_DIR / "default_profile.json"))

ORDINAL_MAPS = {
    'Exter Qual': {'Po': 1, 'Fa': 2, 'TA': 3, 'Gd': 4, 'Ex': 5},
    'Kitchen Qual': {'Po': 1, 'Fa': 2, 'TA': 3, 'Gd': 4, 'Ex': 5},
    'Bsmt Qual': {'None': 0, 'Po': 1, 'Fa': 2, 'TA': 3, 'Gd': 4, 'Ex': 5},
}

NOMINAL_COLS_WITH_DUMMIES = set()
for f in feature_names:
    for col in ['MS Zoning', 'Neighborhood', 'Bldg Type', 'House Style', 'Sale Condition', 'Foundation']:
        if f.startswith(col + '_'):
            NOMINAL_COLS_WITH_DUMMIES.add(col)


class HouseInput(BaseModel):
    gr_liv_area: int = Field(1500, ge=300, le=6000, description="Above-ground living area (sq ft)")
    overall_qual: int = Field(6, ge=1, le=10, description="Overall material/finish quality (1-10)")
    overall_cond: int = Field(5, ge=1, le=10, description="Overall condition (1-10)")
    year_built: int = Field(2000, ge=1870, le=2026)
    total_bsmt_sf: int = Field(1000, ge=0, le=6000)
    garage_cars: int = Field(2, ge=0, le=5)
    full_bath: int = Field(2, ge=0, le=4)
    bedroom_abvgr: int = Field(3, ge=0, le=8)
    lot_area: int = Field(9500, ge=1000, le=50000)
    neighborhood: str = Field("NAmes")
    kitchen_qual: Literal["Po", "Fa", "TA", "Gd", "Ex"] = "TA"
    exter_qual: Literal["Po", "Fa", "TA", "Gd", "Ex"] = "TA"


class PredictionResponse(BaseModel):
    predicted_price: float
    price_range_low: float
    price_range_high: float
    mae_dollars: float


@router.get("/metrics")
def get_metrics():
    return metrics


@router.get("/neighborhoods")
def get_neighborhoods():
    """Real neighborhood names from the training data, for the dropdown."""
    return sorted({f.split('Neighborhood_')[1] for f in feature_names if f.startswith('Neighborhood_')} | {"NAmes"})


def preprocess(payload: HouseInput) -> pd.DataFrame:
    row = dict(default_profile)  # start from the "typical house" baseline

    row['Gr Liv Area'] = payload.gr_liv_area
    row['Overall Qual'] = payload.overall_qual
    row['Overall Cond'] = payload.overall_cond
    row['Year Built'] = payload.year_built
    row['Total Bsmt SF'] = payload.total_bsmt_sf
    row['Garage Cars'] = payload.garage_cars
    row['Full Bath'] = payload.full_bath
    row['Bedroom AbvGr'] = payload.bedroom_abvgr
    row['Lot Area'] = payload.lot_area
    row['Neighborhood'] = payload.neighborhood
    row['Kitchen Qual'] = ORDINAL_MAPS['Kitchen Qual'][payload.kitchen_qual]
    row['Exter Qual'] = ORDINAL_MAPS['Exter Qual'][payload.exter_qual]

    # Manual one-hot against the known training-time feature set — same
    # single-row drop_first pitfall as every other project in this series.
    encoded = {}
    for key, value in row.items():
        if isinstance(value, str):
            dummy_col = f"{key}_{value}"
            if dummy_col in feature_names:
                encoded[dummy_col] = 1
            # else: this value is the reference/dropped category — every
            # dummy for this field correctly stays 0 via reindex below.
        else:
            encoded[key] = value

    df = pd.DataFrame([encoded])
    df = df.reindex(columns=feature_names, fill_value=0)
    return df


@router.post("/predict", response_model=PredictionResponse)
def predict(payload: HouseInput):
    try:
        X = preprocess(payload)
        log_price = float(model.predict(X)[0])
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction failed: {e}")

    price = float(np.expm1(log_price))
    mae_dollars = metrics["final_metrics"]["mae_dollars"]

    return PredictionResponse(
        predicted_price=round(price, 2),
        price_range_low=round(max(0, price - mae_dollars), 2),
        price_range_high=round(price + mae_dollars, 2),
        mae_dollars=round(mae_dollars, 2),
    )
