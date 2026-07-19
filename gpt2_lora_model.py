"""
Full Fine-Tuning vs. LoRA — fourth Deep Learning case study.

Serves the trained LoRA adapter live (1.7MB checkpoint, loads instantly).
The full-fine-tune model is NOT served here: its checkpoint is ~475MB,
well over GitHub's 100MB per-file limit, so it can't be committed to this
repo without Git LFS. Its real outputs (captured during the actual
training run) are instead shown as static, honestly-labeled examples in
the case study data — a genuine, real-world consequence of the checkpoint
size difference between the two techniques, not a limitation invented for
this demo.
"""

from pathlib import Path

import torch
import torch.nn as nn
from fastapi import APIRouter, HTTPException
from transformers import GPT2LMHeadModel, GPT2Tokenizer

MODEL_DIR = Path(__file__).resolve().parent / "gpt2_lora_model_store"
LORA_PATH = MODEL_DIR / "best_gpt2_lora.pt"

router = APIRouter(prefix="/api/gpt2-lora", tags=["gpt2-lora"])

READY = False
tokenizer = None
model = None


class LoRALinear(nn.Module):
    """Same module used during training — wraps a frozen linear layer
    (GPT-2's Conv1D attention matrices) with a small trainable low-rank
    correction."""

    def __init__(self, original_linear, rank: int = 8, alpha: int = 16):
        super().__init__()
        self.original_linear = original_linear
        for p in self.original_linear.parameters():
            p.requires_grad = False
        if hasattr(original_linear, "in_features"):
            in_features = original_linear.in_features
            out_features = original_linear.out_features
        else:
            in_features = original_linear.weight.shape[0]
            out_features = original_linear.weight.shape[1]
        self.lora_A = nn.Parameter(torch.randn(in_features, rank) * 0.01)
        self.lora_B = nn.Parameter(torch.zeros(rank, out_features))
        self.scaling = alpha / rank

    def forward(self, x):
        original_output = self.original_linear(x)
        lora_correction = (x @ self.lora_A) @ self.lora_B * self.scaling
        return original_output + lora_correction


try:
    tokenizer = GPT2Tokenizer.from_pretrained("gpt2")
    tokenizer.pad_token = tokenizer.eos_token

    model = GPT2LMHeadModel.from_pretrained("gpt2")
    for block in model.transformer.h:
        block.attn.c_attn = LoRALinear(block.attn.c_attn, rank=8, alpha=16)
        block.attn.c_proj = LoRALinear(block.attn.c_proj, rank=8, alpha=16)

    lora_state = torch.load(LORA_PATH, map_location="cpu")
    model.load_state_dict(lora_state, strict=False)
    model.eval()
    READY = True
except Exception as e:
    print(f"gpt2_lora: failed to load model ({e}) — live demo will report unavailable")


@torch.no_grad()
def _generate(prompt: str, max_new_tokens: int = 40) -> str:
    input_ids = tokenizer.encode(prompt, return_tensors="pt")
    output_ids = model.generate(
        input_ids,
        max_new_tokens=max_new_tokens,
        do_sample=False,
        pad_token_id=tokenizer.eos_token_id,
    )
    return tokenizer.decode(output_ids[0], skip_special_tokens=True)


@router.get("/status")
def get_status():
    return {"ready": READY}


@router.post("/generate")
def generate(payload: dict):
    if not READY:
        raise HTTPException(status_code=503, detail="Model not ready (checkpoint not loaded)")
    prompt = (payload.get("prompt") or "").strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="prompt is required")
    if len(prompt) > 200:
        raise HTTPException(status_code=400, detail="prompt too long (max 200 characters)")
    text = _generate(prompt)
    return {"text": text}
