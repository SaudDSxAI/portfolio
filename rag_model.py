"""
Comparative RAG — fifth Deep Learning / AI Engineering case study.

Serves five RAG techniques live (Naive, Hybrid, Re-ranked, HyDE, Agentic),
all built from scratch, all sharing the same corpus: this portfolio's 24
project write-ups plus Saud's personal profile (background, Oval Labs
attribution, contact, skills), chunked and embedded with all-MiniLM-L6-v2.

Each technique streams its own answer over Server-Sent Events, independently,
so a visitor watching the live demo sees all five generating in parallel in
real time instead of submitting a query and waiting for a single finished
response.

Re-ranked RAG retrieves a wider candidate set (top-15) with plain embedding
search, then re-scores each (query, chunk) pair directly with a cross-encoder
(cross-encoder/ms-marco-MiniLM-L-6-v2) before taking the top-3. Notebook
testing found it matched or improved on Naive/Hybrid every time, and that the
cross-encoder's raw score is itself a useful signal: negative scores reliably
flagged retrievals that genuinely weren't relevant, which is used here to
answer honestly ("couldn't find reliable information") instead of forcing an
answer out of weak matches.

Generation uses the same OpenAI API already configured for chat_assistant.py
(gpt-5-mini) — the technique being demonstrated is retrieval engineering,
not the LLM itself.
"""

import asyncio
import json
import os
import pickle
from pathlib import Path

import numpy as np
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from openai import AsyncOpenAI, OpenAI
from rank_bm25 import BM25Okapi
from sentence_transformers import CrossEncoder, SentenceTransformer

load_dotenv()

CORPUS_PATH = Path(__file__).resolve().parent / "rag_model_store" / "rag_corpus.pkl"
RERANK_LOW_CONFIDENCE_THRESHOLD = 0.0  # cross-encoder scores below this = probably not relevant

router = APIRouter(prefix="/api/rag", tags=["rag"])

READY = False
embed_model = None
cross_encoder = None
bm25 = None
chunks = []
chunk_sources = []
chunk_embeddings = None
openai_client = None
openai_async_client = None

try:
    with open(CORPUS_PATH, "rb") as f:
        corpus = pickle.load(f)
    chunks = corpus["chunks"]
    chunk_sources = corpus["chunk_sources"]
    chunk_embeddings = corpus["chunk_embeddings"]

    embed_model = SentenceTransformer("all-MiniLM-L6-v2")
    cross_encoder = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
    bm25 = BM25Okapi([c.lower().split() for c in chunks])

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("Missing OPENAI_API_KEY")
    openai_client = OpenAI(api_key=api_key)
    openai_async_client = AsyncOpenAI(api_key=api_key)

    READY = True
except Exception as e:
    print(f"rag: failed to initialize ({e}) — live demo will report unavailable")


# ================= SHARED HELPERS =================
def _cosine_sim(a, b):
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


def _format_hits(indices, scores):
    return [
        {
            "title": chunk_sources[i]["title"],
            "score": round(float(scores[i]), 3),
            "text": chunks[i][:300],
        }
        for i in indices
    ]


def _sse(event_type: str, data: dict) -> str:
    return f"data: {json.dumps({'type': event_type, **data})}\n\n"


def _answer_prompt(query, indices):
    context = "\n\n---\n\n".join(chunks[i] for i in indices)
    return f"""Answer the question using ONLY the context below. If the context doesn't contain the answer, say so.

Context:
{context}

Question: {query}

Answer:"""


async def _stream_answer(prompt):
    """Shared tail: streams an OpenAI completion as SSE 'token' events."""
    stream = await openai_async_client.chat.completions.create(
        model="gpt-5-mini",
        messages=[{"role": "user", "content": prompt}],
        stream=True,
    )
    async for chunk in stream:
        delta = chunk.choices[0].delta.content if chunk.choices else None
        if delta:
            yield _sse("token", {"text": delta})


# ================= RETRIEVAL VARIANTS (sync, run via asyncio.to_thread) =================
def _retrieve_naive(query, k=3):
    q_emb = embed_model.encode(query)
    scores = np.array([_cosine_sim(q_emb, c) for c in chunk_embeddings])
    top_idx = list(np.argsort(scores)[::-1][:k])
    return top_idx, scores


def _retrieve_hybrid(query, k=3, rrf_k=60):
    q_emb = embed_model.encode(query)
    emb_scores = np.array([_cosine_sim(q_emb, c) for c in chunk_embeddings])
    emb_ranking = np.argsort(emb_scores)[::-1]

    bm25_scores = bm25.get_scores(query.lower().split())
    bm25_ranking = np.argsort(bm25_scores)[::-1]

    rrf_scores = {}
    for rank, idx in enumerate(emb_ranking):
        rrf_scores[idx] = rrf_scores.get(idx, 0) + 1 / (rrf_k + rank)
    for rank, idx in enumerate(bm25_ranking):
        rrf_scores[idx] = rrf_scores.get(idx, 0) + 1 / (rrf_k + rank)

    top_idx = sorted(rrf_scores, key=rrf_scores.get, reverse=True)[:k]
    scores = np.zeros(len(chunks))
    for i in top_idx:
        scores[i] = rrf_scores[i]
    return top_idx, scores


def _retrieve_reranked(query, wide_k=15, k=3):
    q_emb = embed_model.encode(query)
    emb_scores = np.array([_cosine_sim(q_emb, c) for c in chunk_embeddings])
    wide_idx = list(np.argsort(emb_scores)[::-1][:wide_k])

    pairs = [[query, chunks[i]] for i in wide_idx]
    ce_scores = cross_encoder.predict(pairs)

    reranked = sorted(zip(wide_idx, ce_scores), key=lambda x: x[1], reverse=True)[:k]
    top_idx = [i for i, _ in reranked]
    scores = np.zeros(len(chunks))
    for i, s in reranked:
        scores[i] = s
    return top_idx, scores


AGENTIC_TOOL = [{
    "type": "function",
    "function": {
        "name": "search_corpus",
        "description": (
            "Search Saud's project write-ups and personal profile for relevant "
            "information. Can be called more than once with different queries "
            "if the first search isn't enough."
        ),
        "parameters": {
            "type": "object",
            "properties": {"query": {"type": "string", "description": "search query"}},
            "required": ["query"],
        },
    },
}]


# ================= STREAMING GENERATORS (one per technique) =================
async def _stream_naive_gen(query):
    idx, scores = await asyncio.to_thread(_retrieve_naive, query)
    yield _sse("retrieved", {"hits": _format_hits(idx, scores)})
    async for event in _stream_answer(_answer_prompt(query, idx)):
        yield event
    yield _sse("done", {})


async def _stream_hybrid_gen(query):
    idx, scores = await asyncio.to_thread(_retrieve_hybrid, query)
    yield _sse("retrieved", {"hits": _format_hits(idx, scores)})
    async for event in _stream_answer(_answer_prompt(query, idx)):
        yield event
    yield _sse("done", {})


async def _stream_reranked_gen(query):
    idx, scores = await asyncio.to_thread(_retrieve_reranked, query)
    top_score = float(scores[idx[0]]) if idx else -999
    low_confidence = top_score < RERANK_LOW_CONFIDENCE_THRESHOLD

    yield _sse("retrieved", {"hits": _format_hits(idx, scores), "low_confidence": low_confidence})

    if low_confidence:
        # The cross-encoder's own score is a genuine confidence signal (verified
        # in notebook testing: negative scores reliably meant "not relevant") —
        # answer honestly instead of forcing a response out of weak matches.
        for word in "I couldn't find reliably relevant information for this in the corpus. ".split(" "):
            yield _sse("token", {"text": word + " "})
        yield _sse("done", {})
        return

    async for event in _stream_answer(_answer_prompt(query, idx)):
        yield event
    yield _sse("done", {})


async def _stream_hyde_gen(query):
    yield _sse("status", {"text": "Generating a hypothetical answer…"})
    hyde_prompt = (
        f"Write a short, plausible-sounding answer to this question, "
        f"even if you're not sure it's correct:\n\n{query}"
    )
    resp = await openai_async_client.chat.completions.create(
        model="gpt-5-mini",
        messages=[{"role": "user", "content": hyde_prompt}],
    )
    hypothetical = resp.choices[0].message.content
    yield _sse("hypothetical", {"text": hypothetical})

    def _retrieve_with_hypothetical():
        hyde_emb = embed_model.encode(hypothetical)
        scores = np.array([_cosine_sim(hyde_emb, c) for c in chunk_embeddings])
        return list(np.argsort(scores)[::-1][:3]), scores

    idx, scores = await asyncio.to_thread(_retrieve_with_hypothetical)
    yield _sse("retrieved", {"hits": _format_hits(idx, scores)})
    async for event in _stream_answer(_answer_prompt(query, idx)):
        yield event
    yield _sse("done", {})


async def _stream_agentic_gen(query, max_turns=4):
    messages = [
        {
            "role": "system",
            "content": (
                "Answer questions about Saud's projects and background. Use "
                "search_corpus to find relevant information before answering. "
                "You may search more than once if needed."
            ),
        },
        {"role": "user", "content": query},
    ]
    all_hits = []

    for _ in range(max_turns):
        resp = await openai_async_client.chat.completions.create(
            model="gpt-5-mini",
            messages=messages,
            tools=AGENTIC_TOOL,
            tool_choice="auto",
        )
        msg = resp.choices[0].message

        if not msg.tool_calls:
            # Stream the already-decided answer word by word so it still
            # feels live even though this call itself wasn't streamed
            # (tool-calling responses can't be streamed and inspected for
            # tool_calls at the same time).
            if all_hits:
                yield _sse("retrieved", {"hits": all_hits})
            for word in (msg.content or "").split(" "):
                yield _sse("token", {"text": word + " "})
            yield _sse("done", {})
            return

        messages.append({
            "role": "assistant",
            "content": msg.content or "",
            "tool_calls": msg.tool_calls,
        })
        for tc in msg.tool_calls:
            search_query = json.loads(tc.function.arguments).get("query", query)
            yield _sse("status", {"text": f"Searching: {search_query}"})
            idx, scores = await asyncio.to_thread(_retrieve_naive, search_query, 3)
            hits = _format_hits(idx, scores)
            all_hits.extend(hits)

            result_text = "\n\n".join(f"{h['title']}: {h['text']}" for h in hits)
            messages.append({"role": "tool", "tool_call_id": tc.id, "content": result_text})

    if all_hits:
        yield _sse("retrieved", {"hits": all_hits})
    yield _sse("token", {"text": "Reached max search turns without a final answer."})
    yield _sse("done", {})


STREAM_GENERATORS = {
    "naive": _stream_naive_gen,
    "hybrid": _stream_hybrid_gen,
    "reranked": _stream_reranked_gen,
    "hyde": _stream_hyde_gen,
    "agentic": _stream_agentic_gen,
}


# ================= ROUTES =================
@router.get("/status")
def get_status():
    return {"ready": READY, "chunks": len(chunks)}


@router.post("/stream/{variant}")
async def stream_variant(variant: str, payload: dict):
    if not READY:
        raise HTTPException(status_code=503, detail="RAG corpus/model not ready")
    if variant not in STREAM_GENERATORS:
        raise HTTPException(status_code=404, detail=f"Unknown variant: {variant}")
    query = (payload.get("query") or "").strip()
    if not query:
        raise HTTPException(status_code=400, detail="query is required")
    if len(query) > 300:
        raise HTTPException(status_code=400, detail="query too long (max 300 characters)")

    generator = STREAM_GENERATORS[variant](query)
    return StreamingResponse(
        generator,
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
