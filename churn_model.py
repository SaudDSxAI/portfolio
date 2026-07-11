"""
Churn prediction model serving — mounted into the main AskSaud API so the
portfolio's "Try it live" demo (on the ML case study page) can call a
same-origin endpoint instead of standing up and maintaining a separate
deployed service.

Models were trained/benchmarked in the companion churn-prediction project
(see my-ml/churn-prediction). Artifacts are re-serialized here for the
scikit-learn/xgboost versions pinned in this backend's requirements.txt.
"""

import json
from pathlib import Path
from typing import Literal

import joblib
import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from xgboost import XGBClassifier

MODEL_DIR = Path(__file__).resolve().parent / "churn_model_store"

router = APIRouter(prefix="/api/churn", tags=["churn"])

# ---------------------------------------------------------------------------
# Load model artifacts once at import time
# ---------------------------------------------------------------------------
lr_model = joblib.load(MODEL_DIR / "logistic_regression_model.pkl")
scaler = joblib.load(MODEL_DIR / "scaler.pkl")
rf_model = joblib.load(MODEL_DIR / "random_forest_model.pkl")

xgb_model = XGBClassifier()
xgb_model.load_model(MODEL_DIR / "xgboost_model.json")

feature_names: list[str] = json.load(open(MODEL_DIR / "feature_names.json"))
metrics: dict = json.load(open(MODEL_DIR / "metrics.json"))
live_thresholds: dict = json.load(open(MODEL_DIR / "live_model_thresholds.json"))

MODEL_REGISTRY = {
    "logistic_regression": {
        "label": "Logistic Regression",
        "estimator": lr_model,
        "needs_scaling": True,
        "threshold": metrics["threshold"],
        "roc_auc": metrics["final_metrics"]["roc_auc"],
    },
    "random_forest": {
        "label": "Random Forest",
        "estimator": rf_model,
        "needs_scaling": False,
        "threshold": live_thresholds["random_forest"]["threshold"],
        "roc_auc": live_thresholds["random_forest"]["roc_auc"],
    },
    "xgboost": {
        "label": "XGBoost",
        "estimator": xgb_model,
        "needs_scaling": False,
        "threshold": live_thresholds["xgboost"]["threshold"],
        "roc_auc": live_thresholds["xgboost"]["roc_auc"],
    },
}

BINARY_COLS = ["Partner", "Dependents", "PhoneService", "PaperlessBilling"]
MULTI_CAT_COLS = [
    "MultipleLines", "InternetService", "OnlineSecurity", "OnlineBackup",
    "DeviceProtection", "TechSupport", "StreamingTV", "StreamingMovies",
    "Contract", "PaymentMethod",
]

ModelKey = Literal["logistic_regression", "random_forest", "xgboost"]


class CustomerInput(BaseModel):
    model: ModelKey = "logistic_regression"
    gender: Literal["Male", "Female"] = "Female"
    SeniorCitizen: Literal[0, 1] = 0
    Partner: Literal["Yes", "No"] = "No"
    Dependents: Literal["Yes", "No"] = "No"
    tenure: int = Field(12, ge=0, le=100)
    PhoneService: Literal["Yes", "No"] = "Yes"
    MultipleLines: Literal["Yes", "No", "No phone service"] = "No"
    InternetService: Literal["DSL", "Fiber optic", "No"] = "Fiber optic"
    OnlineSecurity: Literal["Yes", "No", "No internet service"] = "No"
    OnlineBackup: Literal["Yes", "No", "No internet service"] = "No"
    DeviceProtection: Literal["Yes", "No", "No internet service"] = "No"
    TechSupport: Literal["Yes", "No", "No internet service"] = "No"
    StreamingTV: Literal["Yes", "No", "No internet service"] = "No"
    StreamingMovies: Literal["Yes", "No", "No internet service"] = "No"
    Contract: Literal["Month-to-month", "One year", "Two year"] = "Month-to-month"
    PaperlessBilling: Literal["Yes", "No"] = "Yes"
    PaymentMethod: Literal[
        "Electronic check", "Mailed check", "Bank transfer (automatic)", "Credit card (automatic)"
    ] = "Electronic check"
    MonthlyCharges: float = Field(70.0, ge=0)
    TotalCharges: float = Field(840.0, ge=0)


class PredictionResponse(BaseModel):
    model_used: str
    churn_probability: float
    recommended_threshold: float
    prediction_at_recommended: Literal["Yes", "No"]


def preprocess(payload: CustomerInput, needs_scaling: bool):
    """
    pd.get_dummies(drop_first=True) can't be used on a single-row request —
    with one row, every categorical column has one unique value, so
    drop_first strips it entirely regardless of what the value actually is.
    Build the one-hot columns manually against the known training-time
    feature set instead (see the original bugfix in the companion project).
    """
    row = payload.model_dump()
    encoded: dict[str, float] = {
        "gender": 1 if row["gender"] == "Male" else 0,
        "SeniorCitizen": row["SeniorCitizen"],
        "tenure": row["tenure"],
        "MonthlyCharges": row["MonthlyCharges"],
        "TotalCharges": row["TotalCharges"],
    }
    for col in BINARY_COLS:
        encoded[col] = 1 if row[col] == "Yes" else 0

    for col in MULTI_CAT_COLS:
        dummy_col = f"{col}_{row[col]}"
        if dummy_col in feature_names:
            encoded[dummy_col] = 1

    df = pd.DataFrame([encoded])
    df = df.reindex(columns=feature_names, fill_value=0)

    return scaler.transform(df) if needs_scaling else df


@router.get("/models")
def get_models():
    return {
        key: {"label": v["label"], "threshold": v["threshold"], "roc_auc": v["roc_auc"]}
        for key, v in MODEL_REGISTRY.items()
    }


@router.get("/metrics")
def get_metrics():
    return metrics


@router.post("/predict", response_model=PredictionResponse)
def predict(payload: CustomerInput):
    config = MODEL_REGISTRY[payload.model]
    try:
        X = preprocess(payload, needs_scaling=config["needs_scaling"])
        prob = float(config["estimator"].predict_proba(X)[:, 1][0])
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction failed: {e}")

    threshold = config["threshold"]
    return PredictionResponse(
        model_used=config["label"],
        churn_probability=round(prob, 4),
        recommended_threshold=threshold,
        prediction_at_recommended="Yes" if prob >= threshold else "No",
    )
