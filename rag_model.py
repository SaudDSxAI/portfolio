"""
Comparative RAG — fifth Deep Learning / AI Engineering case study.

Serves four RAG techniques live (Naive, Hybrid, HyDE, Agentic), all built
from scratch, all sharing the same corpus: this portfolio's 24 project
write-ups plus Saud's personal profile (background, Oval Labs attribution,
contact, skills), chunked and embedded with all-MiniLM-L6-v2. A single query
runs all four concurrently so the retrieval and answer differences are
visible side by side.

Re-ranked RAG (cross-encoder re-scoring) was built and evaluated in the
companion notebook but isn't served live here — see the notebook for that
comparison and the real reasons it was left out of the live demo.

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
from openai import OpenAI
from rank_bm25 import BM25Okapi
from sentence_transformers import SentenceTransformer

load_dotenv()

CORPUS_PATH = Path(__file__).resolve().parent / "rag_model_store" / "rag_corpus.pkl"

router = APIRouter(prefix="/api/rag", tags=["rag"])

READY = False
embed_model = None
bm25 = None
chunks = []
chunk_sources = []
chunk_embeddings = None
openai_client = None

try:
    with open(CORPUS_PATH, "rb") as f:
        corpus = pickle.load(f)
    chunks = corpus["chunks"]
    chunk_sources = corpus["chunk_sources"]
    chunk_embeddings = corpus["chunk_embeddings"]

    embed_model = SentenceTransformer("all-MiniLM-L6-v2")
    bm25 = BM25Okapi([c.lower().split() for c in chunks])

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("Missing OPENAI_API_KEY")
    openai_client = OpenAI(api_key=api_key)

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


def _answer_from_hits(query, indices):
    context = "\n\n---\n\n".join(chunks[i] for i in indices)
    prompt = f"""Answer the question using ONLY the context below. If the context doesn't contain the answer, say so.

Context:
{context}

Question: {query}

Answer:"""
    resp = openai_client.chat.completions.create(
        model="gpt-5-mini",
        messages=[{"role": "user", "content": prompt}],
    )
    return resp.choices[0].message.content


# ================= RETRIEVAL VARIANTS =================
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


def _retrieve_hyde(query, k=3):
    hyde_prompt = (
        f"Write a short, plausible-sounding answer to this question, "
        f"even if you're not sure it's correct:\n\n{query}"
    )
    resp = openai_client.chat.completions.create(
        model="gpt-5-mini",
        messages=[{"role": "user", "content": hyde_prompt}],
    )
    hypothetical = resp.choices[0].message.content
    hyde_emb = embed_model.encode(hypothetical)
    scores = np.array([_cosine_sim(hyde_emb, c) for c in chunk_embeddings])
    top_idx = list(np.argsort(scores)[::-1][:k])
    return top_idx, scores, hypothetical


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


# ================= PER-VARIANT RUNNERS (each returns one panel) =================
def _run_naive(query):
    idx, scores = _retrieve_naive(query)
    answer = _answer_from_hits(query, idx)
    return {"variant": "naive", "answer": answer, "retrieved": _format_hits(idx, scores)}


def _run_hybrid(query):
    idx, scores = _retrieve_hybrid(query)
    answer = _answer_from_hits(query, idx)
    return {"variant": "hybrid", "answer": answer, "retrieved": _format_hits(idx, scores)}


def _run_hyde(query):
    idx, scores, hypothetical = _retrieve_hyde(query)
    answer = _answer_from_hits(query, idx)
    return {
        "variant": "hyde",
        "answer": answer,
        "retrieved": _format_hits(idx, scores),
        "hypothetical_answer": hypothetical,
    }


def _run_agentic(query, max_turns=4):
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
        resp = openai_client.chat.completions.create(
            model="gpt-5-mini",
            messages=messages,
            tools=AGENTIC_TOOL,
            tool_choice="auto",
        )
        msg = resp.choices[0].message

        if not msg.tool_calls:
            return {"variant": "agentic", "answer": msg.content, "retrieved": all_hits}

        messages.append({
            "role": "assistant",
            "content": msg.content or "",
            "tool_calls": msg.tool_calls,
        })
        for tc in msg.tool_calls:
            search_query = json.loads(tc.function.arguments).get("query", query)
            idx, scores = _retrieve_naive(search_query, k=3)
            hits = _format_hits(idx, scores)
            all_hits.extend(hits)

            result_text = "\n\n".join(f"{h['title']}: {h['text']}" for h in hits)
            messages.append({"role": "tool", "tool_call_id": tc.id, "content": result_text})

    return {
        "variant": "agentic",
        "answer": "Reached max search turns without a final answer.",
        "retrieved": all_hits,
    }


# ================= ROUTES =================
@router.get("/status")
def get_status():
    return {"ready": READY, "chunks": len(chunks)}


@router.post("/compare")
async def compare(payload: dict):
    if not READY:
        raise HTTPException(status_code=503, detail="RAG corpus/model not ready")
    query = (payload.get("query") or "").strip()
    if not query:
        raise HTTPException(status_code=400, detail="query is required")
    if len(query) > 300:
        raise HTTPException(status_code=400, detail="query too long (max 300 characters)")

    results = await asyncio.gather(
        asyncio.to_thread(_run_naive, query),
        asyncio.to_thread(_run_hybrid, query),
        asyncio.to_thread(_run_hyde, query),
        asyncio.to_thread(_run_agentic, query),
    )
    return {"query": query, "results": list(results)}
