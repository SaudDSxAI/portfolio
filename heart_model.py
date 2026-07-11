"""
Heart disease prediction model serving — same pattern as churn_model.py,
mounted into the main AskSaud API so the "Try it live" demo on the ML
case study page works same-origin with no separate deployment.

Model: Logistic Regression, chosen over Random Forest despite a
statistically tied cross-validated ROC-AUC (paired t-test p=0.419) —
picked for interpretability when performance is equivalent, not because
it "won". Random Forest is also served here so visitors can compare both.
"""

import json
from pathlib import Path
from typing import Literal

import joblib
import pandas as pd
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

MODEL_DIR = Path(__file__).resolve().parent / "heart_model_store"

router = APIRouter(prefix="/api/heart", tags=["heart"])

# ---------------------------------------------------------------------------
# Load model artifacts once at import time
# ---------------------------------------------------------------------------
# Logistic Regression is saved as a full sklearn Pipeline (scaler + classifier
# bundled together), since scaling was fit inside cross-validation — loading
# the pipeline reproduces that exactly, no separate scaler object needed.
lr_pipeline = joblib.load(MODEL_DIR / "logistic_regression_pipeline.pkl")
rf_model = joblib.load(MODEL_DIR / "random_forest_model.pkl")

feature_names: list[str] = json.load(open(MODEL_DIR / "feature_names.json"))
metrics: dict = json.load(open(MODEL_DIR / "metrics.json"))

MODEL_REGISTRY = {
    "logistic_regression": {
        "label": "Logistic Regression",
        "estimator": lr_pipeline,
        "roc_auc": metrics["final_metrics"]["roc_auc"],
    },
    "random_forest": {
        "label": "Random Forest",
        "estimator": rf_model,
        "roc_auc": metrics["comparison"]["random_forest"]["roc_auc"],
    },
}

CATEGORICAL_NOMINAL = ["chest_pain_type", "resting_ecg", "ST_slope"]
ModelKey = Literal["logistic_regression", "random_forest"]


class PatientInput(BaseModel):
    model: ModelKey = "logistic_regression"
    age: int = Field(54, ge=1, le=120)
    sex: Literal[0, 1] = 1  # 0 = female, 1 = male
    chest_pain_type: Literal[1, 2, 3, 4] = 4  # 1=typical angina .. 4=asymptomatic
    resting_bp_s: int = Field(130, ge=0, le=300)
    cholesterol: int = Field(240, ge=0, le=700)
    fasting_blood_sugar: Literal[0, 1] = 0  # 1 = fasting blood sugar > 120 mg/dl
    resting_ecg: Literal[0, 1, 2] = 0
    max_heart_rate: int = Field(140, ge=50, le=250)
    exercise_angina: Literal[0, 1] = 0
    oldpeak: float = Field(1.0, ge=-5, le=10)
    ST_slope: Literal[1, 2, 3] = 2  # 1=upsloping, 2=flat, 3=downsloping


class PredictionResponse(BaseModel):
    model_used: str
    disease_probability: float
    prediction_at_threshold: Literal["Yes", "No"]
    threshold_used: float = 0.5


def preprocess(payload: PatientInput) -> pd.DataFrame:
    row = payload.model_dump(exclude={"model"})
    encoded = {
        "age": row["age"], "sex": row["sex"], "resting_bp_s": row["resting_bp_s"],
        "cholesterol": row["cholesterol"], "fasting_blood_sugar": row["fasting_blood_sugar"],
        "max_heart_rate": row["max_heart_rate"], "exercise_angina": row["exercise_angina"],
        "oldpeak": row["oldpeak"],
    }
    # Same manual one-hot approach as churn's preprocess() — get_dummies on a
    # single row breaks with drop_first (see churn_model.py for the full
    # explanation), so dummy columns are set explicitly against the known
    # training-time feature set instead.
    for col in CATEGORICAL_NOMINAL:
        dummy_col = f"{col}_{float(row[col])}"
        if dummy_col in feature_names:
            encoded[dummy_col] = 1

    df = pd.DataFrame([encoded])
    df = df.reindex(columns=feature_names, fill_value=0)
    return df


@router.get("/models")
def get_models():
    return {key: {"label": v["label"], "roc_auc": v["roc_auc"]} for key, v in MODEL_REGISTRY.items()}


@router.get("/metrics")
def get_metrics():
    return metrics


@router.post("/predict", response_model=PredictionResponse)
def predict(payload: PatientInput):
    config = MODEL_REGISTRY[payload.model]
    try:
        X = preprocess(payload)
        prob = float(config["estimator"].predict_proba(X)[:, 1][0])
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction failed: {e}")

    return PredictionResponse(
        model_used=config["label"],
        disease_probability=round(prob, 4),
        prediction_at_threshold="Yes" if prob >= 0.5 else "No",
    )
