"""
CLIP-based multimodal search — the first VLM & Multimodal AI case study.

Unlike every other router in this backend, CLIP is never trained here at
all — it's used purely for inference. The engineering work is the retrieval
pipeline built around it: embed a folder of real images once at startup,
then compare a text (or image) query against those cached vectors using
cosine similarity to find the closest matches.

Images live in clip_model_store/images/ — drop any real photos in that
folder and they become searchable automatically on the next server start,
no code changes needed.
"""

import json
from pathlib import Path

import torch
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from PIL import Image
from transformers import CLIPModel, CLIPProcessor

MODEL_DIR = Path(__file__).resolve().parent / "clip_model_store"
IMAGE_DIR = MODEL_DIR / "images"
VALID_EXTS = {".jpg", ".jpeg", ".png", ".webp"}

router = APIRouter(prefix="/api/clip-search", tags=["clip-search"])

READY = False
model = None
processor = None
image_paths: list[Path] = []
image_embeddings = None  # [N, 512], L2-normalized


def _load_images():
    if not IMAGE_DIR.exists():
        return []
    return sorted([p for p in IMAGE_DIR.iterdir() if p.suffix.lower() in VALID_EXTS])


def _embed_images(paths, batch_size=8):
    all_embeds = []
    with torch.no_grad():
        for i in range(0, len(paths), batch_size):
            batch = [Image.open(p).convert("RGB") for p in paths[i : i + batch_size]]
            inputs = processor(images=batch, return_tensors="pt")
            features = model.get_image_features(**inputs)
            features = features / features.norm(dim=-1, keepdim=True)
            all_embeds.append(features)
    return torch.cat(all_embeds, dim=0) if all_embeds else None


LOAD_ATTEMPTED = False


def _ensure_loaded():
    """
    Loaded lazily, on first real request, not at container startup — same
    reasoning as the other model-serving routers in this backend (see
    rag_model.py's _ensure_loaded for the full explanation). This one goes
    a step further: it also checks for real images FIRST, before loading the
    ~600MB CLIP model at all, since there's currently nothing in
    clip_model_store/images/ for it to search over. No point holding a full
    CLIP model in memory for a feature that has no content to serve yet.
    """
    global READY, LOAD_ATTEMPTED, model, processor, image_paths, image_embeddings

    if LOAD_ATTEMPTED:
        return
    LOAD_ATTEMPTED = True

    image_paths = _load_images()
    if not image_paths:
        print("clip_search: no images found in clip_model_store/images/ — search disabled until images are added")
        return

    try:
        model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        model.eval()
        image_embeddings = _embed_images(image_paths)
        READY = True
    except Exception as e:
        print(f"clip_search: failed to load CLIP ({e}) — search demo will report unavailable")


@router.get("/status")
def get_status():
    _ensure_loaded()
    return {"ready": READY, "image_count": len(image_paths)}


@router.get("/images")
def list_images():
    _ensure_loaded()
    if not READY:
        raise HTTPException(status_code=503, detail="CLIP search not ready (no images loaded)")
    return [{"id": i, "filename": p.name} for i, p in enumerate(image_paths)]


@router.get("/image/{image_id}")
def get_image(image_id: int):
    _ensure_loaded()
    if not READY or image_id < 0 or image_id >= len(image_paths):
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(image_paths[image_id])


@router.post("/text-search")
def text_search(payload: dict):
    _ensure_loaded()
    if not READY:
        raise HTTPException(status_code=503, detail="CLIP search not ready (no images loaded)")
    query = (payload.get("query") or "").strip()
    top_k = min(int(payload.get("top_k", 6)), len(image_paths))
    if not query:
        raise HTTPException(status_code=400, detail="query is required")

    with torch.no_grad():
        inputs = processor(text=[query], return_tensors="pt", padding=True)
        text_features = model.get_text_features(**inputs)
        text_features = text_features / text_features.norm(dim=-1, keepdim=True)

    similarities = (image_embeddings @ text_features.T).squeeze(1)
    top = similarities.topk(top_k)

    return {
        "query": query,
        "results": [
            {"id": idx.item(), "filename": image_paths[idx.item()].name, "score": round(score.item(), 4)}
            for score, idx in zip(top.values, top.indices)
        ],
    }


@router.post("/image-search")
def image_search(payload: dict):
    _ensure_loaded()
    if not READY:
        raise HTTPException(status_code=503, detail="CLIP search not ready (no images loaded)")
    image_id = payload.get("image_id")
    top_k = min(int(payload.get("top_k", 6)), len(image_paths))
    if image_id is None or image_id < 0 or image_id >= len(image_paths):
        raise HTTPException(status_code=400, detail="valid image_id is required")

    query_vec = image_embeddings[image_id : image_id + 1]
    similarities = (image_embeddings @ query_vec.T).squeeze(1)
    # include one extra result since the query image will always match itself with score 1.0
    top = similarities.topk(min(top_k + 1, len(image_paths)))

    results = [
        {"id": idx.item(), "filename": image_paths[idx.item()].name, "score": round(score.item(), 4)}
        for score, idx in zip(top.values, top.indices)
        if idx.item() != image_id
    ][:top_k]

    return {"query_image_id": image_id, "results": results}
