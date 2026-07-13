"""
Movie review sentiment serving — the first Deep Learning case study, and a
different shape of model than every other router in this backend: a PyTorch
LSTM with pretrained (frozen) GloVe word embeddings, instead of an sklearn/
XGBoost model on tabular features.

Trained on 50,000 IMDB reviews, checkpointed on test accuracy every epoch to
avoid shipping an overfit snapshot (an earlier run without checkpointing
overfit past its best point and the good weights were unrecoverable -- see
the case study narrative). Best checkpoint: epoch 12, 87.28% test accuracy.

Honestly reported alongside a classical TF-IDF + Logistic Regression
baseline, which actually scored higher (89.7%) on the identical split --
see /metrics. The LSTM is still what's deployed here, since the point of
this project is demonstrating the transfer-learning + sequence-model
technique itself, not chasing the single highest accuracy number.
"""

import json
import re
from pathlib import Path

import torch
import torch.nn as nn
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

MODEL_DIR = Path(__file__).resolve().parent / "sentiment_model_store"
device = torch.device("cpu")

router = APIRouter(prefix="/api/sentiment", tags=["sentiment"])

with open(MODEL_DIR / "vocab.json") as f:
    vocab: dict = json.load(f)
with open(MODEL_DIR / "config.json") as f:
    config: dict = json.load(f)
with open(MODEL_DIR / "metrics.json") as f:
    metrics: dict = json.load(f)
with open(MODEL_DIR / "examples.json") as f:
    examples: list = json.load(f)

MAX_LEN = config["max_len"]


class SentimentLSTM(nn.Module):
    """Same architecture used in training -- must match exactly for the
    saved weights to load correctly."""

    def __init__(self, vocab_size, embed_dim=100, hidden_dim=64):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.lstm = nn.LSTM(embed_dim, hidden_dim, batch_first=True)
        self.fc = nn.Linear(hidden_dim, 1)

    def forward(self, x):
        embedded = self.embedding(x)
        _, (hidden, _) = self.lstm(embedded)
        out = self.fc(hidden.squeeze(0))
        return out.squeeze(1)


model = SentimentLSTM(
    vocab_size=config["vocab_size"],
    embed_dim=config["embed_dim"],
    hidden_dim=config["hidden_dim"],
)
model.load_state_dict(torch.load(MODEL_DIR / "best_sentiment_model.pt", map_location=device))
model.eval()


def clean_text(text: str) -> str:
    text = re.sub(r"<br\s*/?>", " ", text)
    text = re.sub(r"<.*?>", " ", text)
    text = re.sub(r"[^a-zA-Z\s]", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text.lower()


def text_to_sequence(text: str, max_len: int = MAX_LEN) -> list[int]:
    tokens = clean_text(text).split()
    ids = [vocab.get(word, vocab["<unk>"]) for word in tokens]
    ids = ids[:max_len]
    ids = ids + [vocab["<pad>"]] * (max_len - len(ids))
    return ids


class PredictRequest(BaseModel):
    text: str


@router.get("/metrics")
def get_metrics():
    return metrics


@router.get("/examples")
def get_examples():
    return examples


@router.post("/predict")
def predict(payload: PredictRequest):
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Review text can't be empty")

    cleaned = clean_text(text)
    word_count = len(cleaned.split())
    if word_count == 0:
        raise HTTPException(status_code=400, detail="No usable words found in that text")

    sequence = text_to_sequence(text)
    tensor = torch.tensor([sequence], dtype=torch.long)

    with torch.no_grad():
        output = model(tensor)
        probability = torch.sigmoid(output).item()

    sentiment = "positive" if probability > 0.5 else "negative"
    confidence = probability if sentiment == "positive" else 1 - probability
    truncated = word_count > MAX_LEN

    return {
        "sentiment": sentiment,
        "positive_probability": round(probability, 4),
        "confidence": round(confidence, 4),
        "word_count": word_count,
        "truncated": truncated,
    }
