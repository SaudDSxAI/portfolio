"""
Movie recommender serving — same pattern as the other model routers, but a
genuinely different shape of problem: no single row to score, just movies
and their learned similarity to each other.

Analysis used scikit-surprise's SVD (beat a baseline-only model and KNN,
though only marginally — see /metrics). The deployed API reimplements the
same core matrix factorization idea with scikit-learn's TruncatedSVD
instead, and precomputes item-item similarity at training time rather than
scoring live — recommendations are a lookup, not a runtime computation,
which keeps this endpoint fast and dependency-light.
"""

import json
from collections import defaultdict
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

MODEL_DIR = Path(__file__).resolve().parent / "movie_model_store"

router = APIRouter(prefix="/api/movies", tags=["movies"])

catalog: list[dict] = json.load(open(MODEL_DIR / "catalog.json"))
similar_movies: dict = json.load(open(MODEL_DIR / "similar_movies.json"))
metrics: dict = json.load(open(MODEL_DIR / "metrics.json"))

catalog_by_id = {m["movieId"]: m for m in catalog}


class RecommendRequest(BaseModel):
    movie_ids: list[int]


@router.get("/metrics")
def get_metrics():
    return metrics


@router.get("/search")
def search_movies(q: str = "", limit: int = 20):
    """Simple title search for the picker UI's autocomplete."""
    if not q or len(q) < 2:
        # No query yet -- return the most-rated movies as good defaults to browse
        return catalog[:limit]
    q_lower = q.lower()
    matches = [m for m in catalog if q_lower in m["title"].lower()]
    return matches[:limit]


@router.post("/recommend")
def recommend(payload: RecommendRequest):
    if not payload.movie_ids:
        raise HTTPException(status_code=400, detail="Pick at least one movie")

    for mid in payload.movie_ids:
        if str(mid) not in similar_movies:
            raise HTTPException(status_code=400, detail=f"Unknown movie id {mid}")

    # Aggregate similarity scores across all picked movies -- a candidate
    # that's similar to multiple picks ranks higher than one only similar
    # to a single pick.
    scores = defaultdict(float)
    for mid in payload.movie_ids:
        for entry in similar_movies[str(mid)]:
            if entry["movieId"] not in payload.movie_ids:
                scores[entry["movieId"]] += entry["similarity"]

    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:12]

    results = []
    for movie_id, score in ranked:
        info = catalog_by_id.get(movie_id)
        if info:
            results.append({**info, "matchScore": round(score / len(payload.movie_ids), 3)})

    return {"recommendations": results}
