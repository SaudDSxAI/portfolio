"""
Diffusion vs. GAN — third Deep Learning case study, and the only one on this
site comparing two fundamentally different training approaches on the exact
same task: generating handwritten digits (MNIST) from scratch, no pretrained
components anywhere in either model.

Both networks are trained completely from zero here — nothing frozen,
nothing reused from another project. The DDPM (denoising diffusion) learns
by a simple, stable "predict the noise, compare to real noise" loss. The
GAN learns through an adversarial contest between a Generator and a
Discriminator, which is faster to generate from (one shot vs. 300 steps)
but meaningfully harder to train and read — the two networks' losses don't
straightforwardly indicate generation quality the way the DDPM's does.
"""

import math
from pathlib import Path

import torch
import torch.nn as nn
from fastapi import APIRouter, HTTPException

MODEL_DIR = Path(__file__).resolve().parent / "diffusion_gan_model_store"
router = APIRouter(prefix="/api/diffusion-gan", tags=["diffusion-gan"])

READY = False
unet = None
generator = None

T = 300
betas = torch.linspace(1e-4, 0.02, T)
alphas = 1.0 - betas
alpha_bars = torch.cumprod(alphas, dim=0)


class TimeEmbedding(nn.Module):
    def __init__(self, dim=32):
        super().__init__()
        self.dim = dim
        self.mlp = nn.Sequential(nn.Linear(dim, 128), nn.SiLU(), nn.Linear(128, 128))

    def forward(self, t):
        half = self.dim // 2
        freqs = torch.exp(-math.log(10000) * torch.arange(half, device=t.device) / half)
        args = t[:, None].float() * freqs[None, :]
        emb = torch.cat([torch.sin(args), torch.cos(args)], dim=-1)
        return self.mlp(emb)


class ConvBlock(nn.Module):
    def __init__(self, in_ch, out_ch, time_dim=128):
        super().__init__()
        self.conv1 = nn.Conv2d(in_ch, out_ch, 3, padding=1)
        self.conv2 = nn.Conv2d(out_ch, out_ch, 3, padding=1)
        self.norm1 = nn.GroupNorm(8, out_ch)
        self.norm2 = nn.GroupNorm(8, out_ch)
        self.time_proj = nn.Linear(time_dim, out_ch)
        self.act = nn.SiLU()
        self.skip = nn.Conv2d(in_ch, out_ch, 1) if in_ch != out_ch else nn.Identity()

    def forward(self, x, t_emb):
        h = self.act(self.norm1(self.conv1(x)))
        h = h + self.time_proj(t_emb)[:, :, None, None]
        h = self.act(self.norm2(self.conv2(h)))
        return h + self.skip(x)


class SimpleUNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.time_embed = TimeEmbedding()
        self.down1 = ConvBlock(1, 32)
        self.down2 = ConvBlock(32, 64)
        self.pool = nn.MaxPool2d(2)
        self.bottleneck = ConvBlock(64, 128)
        self.up1 = nn.ConvTranspose2d(128, 64, 2, stride=2)
        self.up_block1 = ConvBlock(128, 64)
        self.up2 = nn.ConvTranspose2d(64, 32, 2, stride=2)
        self.up_block2 = ConvBlock(64, 32)
        self.out = nn.Conv2d(32, 1, 1)

    def forward(self, x, t):
        t_emb = self.time_embed(t)
        d1 = self.down1(x, t_emb)
        d2 = self.down2(self.pool(d1), t_emb)
        b = self.bottleneck(self.pool(d2), t_emb)
        u1 = self.up1(b)
        u1 = self.up_block1(torch.cat([u1, d2], dim=1), t_emb)
        u2 = self.up2(u1)
        u2 = self.up_block2(torch.cat([u2, d1], dim=1), t_emb)
        return self.out(u2)


class Generator(nn.Module):
    def __init__(self, noise_dim=100):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(noise_dim, 128 * 7 * 7),
            nn.BatchNorm1d(128 * 7 * 7),
            nn.ReLU(),
            nn.Unflatten(1, (128, 7, 7)),
            nn.ConvTranspose2d(128, 64, 4, stride=2, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.ConvTranspose2d(64, 1, 4, stride=2, padding=1),
            nn.Tanh(),
        )

    def forward(self, z):
        return self.net(z)


try:
    unet = SimpleUNet()
    unet.load_state_dict(torch.load(MODEL_DIR / "ddpm_unet.pt", map_location="cpu"))
    unet.eval()

    generator = Generator()
    generator.load_state_dict(torch.load(MODEL_DIR / "gan_generator.pt", map_location="cpu"))
    generator.eval()

    READY = True
except Exception as e:
    print(f"diffusion_gan: failed to load models ({e}) — generation demo will report unavailable")


@torch.no_grad()
def _generate_ddpm(n=6):
    x = torch.randn(n, 1, 28, 28)
    for t in reversed(range(T)):
        t_batch = torch.full((n,), t, dtype=torch.long)
        predicted_noise = unet(x, t_batch)
        alpha_t, alpha_bar_t, beta_t = alphas[t], alpha_bars[t], betas[t]
        x = (1 / alpha_t.sqrt()) * (x - (beta_t / (1 - alpha_bar_t).sqrt()) * predicted_noise)
        if t > 0:
            x = x + beta_t.sqrt() * torch.randn_like(x)
    return x


@torch.no_grad()
def _generate_gan(n=6):
    noise = torch.randn(n, 100)
    return generator(noise)


def _tensor_to_base64_grid(images):
    import base64
    import io

    import matplotlib.pyplot as plt

    n = images.shape[0]
    fig, axes = plt.subplots(1, n, figsize=(2 * n, 2))
    if n == 1:
        axes = [axes]
    for ax, img in zip(axes, images):
        ax.imshow(img[0].clamp(-1, 1), cmap="gray")
        ax.axis("off")
    plt.tight_layout()

    buf = io.BytesIO()
    plt.savefig(buf, format="png", dpi=100)
    plt.close(fig)
    buf.seek(0)
    return base64.b64encode(buf.read()).decode("utf-8")


@router.get("/status")
def get_status():
    return {"ready": READY}


@router.post("/generate")
def generate(payload: dict):
    if not READY:
        raise HTTPException(status_code=503, detail="Models not ready (no trained checkpoints loaded)")
    model_type = payload.get("model", "ddpm")
    n = min(int(payload.get("count", 6)), 8)

    if model_type == "ddpm":
        images = _generate_ddpm(n)
    elif model_type == "gan":
        images = _generate_gan(n)
    else:
        raise HTTPException(status_code=400, detail="model must be 'ddpm' or 'gan'")

    image_b64 = _tensor_to_base64_grid(images)
    return {"model": model_type, "image_base64": image_b64}
