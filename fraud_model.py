"""
Credit card fraud detection model serving — same pattern as churn_model.py
and heart_model.py, mounted into the main AskSaud API.

Model: XGBoost with scale_pos_weight (no SMOTE) — decisively outperformed
Logistic Regression (with/without SMOTE) and Random Forest on this dataset,
unlike the other two ML case studies where a simpler model won or tied.

Unlike churn and heart disease, this dataset's features (V1-V28) are PCA
components anonymized by the card issuer before public release — there's no
meaningful way for a visitor to hand-enter realistic values for them, so
the live demo works differently: pick a real example transaction from the
held-out test set (including a genuine false alarm and a genuine missed
fraud, not just cherry-picked successes) rather than a free-form form.
"""

import json
from pathlib import Path

import joblib
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

MODEL_DIR = Path(__file__).resolve().parent / "fraud_model_store"

router = APIRouter(prefix="/api/fraud", tags=["fraud"])

model = joblib.load(MODEL_DIR / "xgboost_model.pkl")
feature_names: list[str] = json.load(open(MODEL_DIR / "feature_names.json"))
metrics: dict = json.load(open(MODEL_DIR / "metrics.json"))
examples: list[dict] = json.load(open(MODEL_DIR / "example_transactions.json"))

THRESHOLD = metrics["final_metrics"]["threshold"]


class PredictRequest(BaseModel):
    example_index: int


class PredictionResponse(BaseModel):
    label: str
    amount: float
    true_label: int
    fraud_probability: float
    prediction: str
    threshold_used: float
    correct: bool


@router.get("/metrics")
def get_metrics():
    return metrics


@router.get("/examples")
def get_examples():
    """Real, held-out test-set transactions for the live demo — includes an
    actual false alarm and an actual missed fraud, not just cherry-picked
    correct predictions, since the features can't be hand-entered."""
    return [
        {"index": i, "label": e["label"], "amount": e["amount"], "true_label": e["true_label"]}
        for i, e in enumerate(examples)
    ]


@router.post("/predict", response_model=PredictionResponse)
def predict(payload: PredictRequest):
    if payload.example_index < 0 or payload.example_index >= len(examples):
        raise HTTPException(status_code=400, detail="Invalid example_index")

    example = examples[payload.example_index]
    try:
        row = [[example["features"][f] for f in feature_names]]
        prob = float(model.predict_proba(row)[:, 1][0])
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction failed: {e}")

    prediction = "Fraud" if prob >= THRESHOLD else "Legitimate"
    actual = "Fraud" if example["true_label"] == 1 else "Legitimate"

    return PredictionResponse(
        label=example["label"],
        amount=example["amount"],
        true_label=example["true_label"],
        fraud_probability=round(prob, 4),
        prediction=prediction,
        threshold_used=THRESHOLD,
        correct=(prediction == actual),
    )
