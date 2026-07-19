"""
Network anomaly detection serving — the second Deep Learning case study,
and a different shape of model than every other router: an unsupervised
autoencoder that was trained ONLY on normal network traffic (NSL-KDD),
never shown a single labeled attack, and flags anything it reconstructs
poorly as suspicious.

The 12 example rows (with real, pre-computed predictions) come straight
from the same held-out test set used during training/evaluation — including
two genuine misclassifications, kept deliberately rather than cherry-picked
away, matching the same "show real failures" approach used in the fraud
detection case study.
"""

import json
from pathlib import Path

import joblib
import pandas as pd
import torch
import torch.nn as nn
from fastapi import APIRouter, HTTPException

MODEL_DIR = Path(__file__).resolve().parent / "anomaly_model_store"
device = torch.device("cpu")

router = APIRouter(prefix="/api/anomaly", tags=["anomaly"])

with open(MODEL_DIR / "config.json") as f:
    config: dict = json.load(f)
with open(MODEL_DIR / "feature_columns.json") as f:
    feature_columns: list = json.load(f)
with open(MODEL_DIR / "metrics.json") as f:
    metrics: dict = json.load(f)
with open(MODEL_DIR / "examples.json") as f:
    examples: list = json.load(f)

scaler = joblib.load(MODEL_DIR / "scaler.pkl")
THRESHOLD = config["threshold"]
CATEGORICAL_COLS = config["categorical_cols"]


class Autoencoder(nn.Module):
    """Same architecture used in training — must match exactly for the
    saved weights to load correctly."""

    def __init__(self, input_dim):
        super().__init__()
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, 64),
            nn.ReLU(),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, 8),
            nn.ReLU(),
        )
        self.decoder = nn.Sequential(
            nn.Linear(8, 32),
            nn.ReLU(),
            nn.Linear(32, 64),
            nn.ReLU(),
            nn.Linear(64, input_dim),
        )

    def forward(self, x):
        return self.decoder(self.encoder(x))


model = Autoencoder(config["input_dim"])
model.load_state_dict(torch.load(MODEL_DIR / "best_autoencoder.pt", map_location=device))
model.eval()


def _reconstruction_error(row: dict) -> float:
    """Preprocess one raw NSL-KDD-style row exactly like training did
    (one-hot encode, align to the saved 122-column layout, scale), then
    return the model's reconstruction error for it."""
    df = pd.DataFrame([row])
    encoded = pd.get_dummies(df, columns=CATEGORICAL_COLS)
    encoded = encoded.reindex(columns=feature_columns, fill_value=0)
    scaled = scaler.transform(encoded)

    tensor = torch.tensor(scaled, dtype=torch.float32)
    with torch.no_grad():
        reconstructed = model(tensor)
        error = torch.mean((tensor - reconstructed) ** 2, dim=1).item()
    return error


@router.get("/metrics")
def get_metrics():
    return metrics


@router.get("/examples")
def get_examples():
    # Don't leak the answer to the frontend before the user runs it.
    return [
        {k: v for k, v in ex.items() if k not in ("predicted_label", "reconstruction_error", "correct")}
        for ex in examples
    ]


@router.post("/predict")
def predict(payload: dict):
    index = payload.get("index")
    match = next((ex for ex in examples if ex["index"] == index), None)
    if match is None:
        raise HTTPException(status_code=400, detail=f"Unknown example index {index}")

    row = {k: v for k, v in match.items() if k not in ("index", "true_label", "predicted_label", "reconstruction_error", "correct")}

    try:
        error = _reconstruction_error(row)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failed: {e}")

    predicted_label = "anomaly" if error > THRESHOLD else "normal"

    return {
        "index": index,
        "true_label": match["true_label"],
        "predicted_label": predicted_label,
        "reconstruction_error": round(error, 4),
        "threshold": round(THRESHOLD, 4),
        "correct": predicted_label == match["true_label"],
    }
