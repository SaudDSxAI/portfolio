"""
Mini-LLaVA — the second VLM & Multimodal AI case study, and the flagship of
the series: an actual vision-tower + projector + LLM pipeline, mirroring how
real models like LLaVA are built.

Two pieces stay completely frozen, exactly as released: CLIP's vision
encoder (sees the image) and GPT-2 (writes the caption). The only trained
component is the projector — a small MLP that translates CLIP's 49 patch
vectors per image into a form GPT-2 can read as if they were input tokens.
Training used teacher forcing (the real caption fed in alongside the image,
GPT-2's per-position confidence scores compared against the real next word)
and checkpointing (only saving the projector when held-out validation loss
actually improved, not just the latest epoch).

Unlike CLIP search, generation at request time is genuinely sequential —
GPT-2 has no known answer to lean on for a brand-new image, so it produces
one real word at a time, feeding its own previous output back in to predict
the next, until it produces its own learned end-of-caption signal.
"""

import io
import json
from pathlib import Path

import torch
import torch.nn as nn
from fastapi import APIRouter, File, HTTPException, UploadFile
from PIL import Image
from transformers import CLIPModel, CLIPProcessor, GPT2LMHeadModel, GPT2Tokenizer

MODEL_DIR = Path(__file__).resolve().parent / "mini_llava_model_store"
PROJECTOR_PATH = MODEL_DIR / "projector.pt"
METRICS_PATH = MODEL_DIR / "metrics.json"

router = APIRouter(prefix="/api/mini-llava", tags=["mini-llava"])

READY = False
clip_model = None
clip_processor = None
gpt2 = None
tokenizer = None
projector = None
metrics = {}


class Projector(nn.Module):
    """The only trained component in this whole pipeline — everything else
    (CLIP, GPT-2) stays frozen. Roughly 1.2M parameters, translating CLIP's
    768-number patch vectors into GPT-2's 768-number input format."""

    def __init__(self, dim=768):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(dim, dim),
            nn.GELU(),
            nn.Linear(dim, dim),
        )

    def forward(self, x):
        return self.net(x)


def _load_metrics():
    if METRICS_PATH.exists():
        with open(METRICS_PATH) as f:
            return json.load(f)
    return {}


LOAD_ATTEMPTED = False


def _ensure_loaded():
    """
    Loaded lazily on first real request instead of at container startup —
    see rag_model.py's _ensure_loaded for the full reasoning. This router in
    particular used to load a full separate CLIP model AND a full separate
    GPT-2 at import time, on top of the other routers doing the same thing
    with their own copies — real, avoidable memory duplication that was
    contributing to the container getting OOM-killed before it could even
    answer a healthcheck.
    """
    global READY, LOAD_ATTEMPTED, clip_model, clip_processor, gpt2, tokenizer, projector, metrics

    if LOAD_ATTEMPTED:
        return
    LOAD_ATTEMPTED = True

    if not PROJECTOR_PATH.exists():
        print("mini_llava: no trained projector found at mini_llava_model_store/projector.pt — demo disabled until it's added")
        return

    try:
        clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        clip_model.eval()

        gpt2 = GPT2LMHeadModel.from_pretrained("gpt2")
        tokenizer = GPT2Tokenizer.from_pretrained("gpt2")
        tokenizer.pad_token = tokenizer.eos_token
        gpt2.eval()

        projector = Projector()
        projector.load_state_dict(torch.load(PROJECTOR_PATH, map_location="cpu"))
        projector.eval()
        metrics = _load_metrics()
        READY = True
    except Exception as e:
        print(f"mini_llava: failed to load models ({e}) — caption demo will report unavailable")


def _get_patch_embeddings(pil_image):
    with torch.no_grad():
        inputs = clip_processor(images=[pil_image.convert("RGB")], return_tensors="pt")
        vision_outputs = clip_model.vision_model(**inputs)
        return vision_outputs.last_hidden_state[:, 1:, :]  # drop CLS token, keep the 49 real patches


def _generate_caption(pil_image, max_new_tokens=25):
    with torch.no_grad():
        patches = _get_patch_embeddings(pil_image)
        current_embeds = projector(patches)  # starts as just the 49 translated image pieces

        generated_ids = []
        for _ in range(max_new_tokens):
            outputs = gpt2(inputs_embeds=current_embeds)
            next_token_id = outputs.logits[0, -1, :].argmax().item()
            if next_token_id == tokenizer.eos_token_id:
                break
            generated_ids.append(next_token_id)
            next_embed = gpt2.transformer.wte(torch.tensor([[next_token_id]]))
            current_embeds = torch.cat([current_embeds, next_embed], dim=1)

    return tokenizer.decode(generated_ids, skip_special_tokens=True).strip()


@router.get("/status")
def get_status():
    _ensure_loaded()
    return {"ready": READY}


@router.get("/metrics")
def get_metrics():
    _ensure_loaded()
    if not READY:
        raise HTTPException(status_code=503, detail="Mini-LLaVA not ready (no trained projector loaded)")
    return metrics


@router.post("/caption")
async def caption_image(file: UploadFile = File(...)):
    _ensure_loaded()
    if not READY:
        raise HTTPException(status_code=503, detail="Mini-LLaVA not ready (no trained projector loaded)")
    try:
        image_bytes = await file.read()
        pil_image = Image.open(io.BytesIO(image_bytes))
    except Exception:
        raise HTTPException(status_code=400, detail="Could not read uploaded image")

    try:
        caption = _generate_caption(pil_image)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {e}")

    return {"caption": caption}
