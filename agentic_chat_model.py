"""
Agentic AI case study — "Deep-Scrape Research Agent", rebuilt from scratch.

This replaced an earlier version (single-shot search tool, prompt-only
"[TOOL COMPLETE]" loop guard, BeautifulSoup scraping) after a real,
notebook-validated rebuild surfaced multiple live bugs in that approach and
a better architecture:

- A prompt instruction alone ("don't call the tool twice") does not
  structurally stop a model from calling a tool repeatedly. Verified live:
  the old design would occasionally over-call. Fixed here by tracking a
  `search_count` in graph state and unbinding the tool after one call, so a
  second call is structurally impossible, not just discouraged.
- BeautifulSoup's naive tag-scraping (h1/h2/h3/p/li) pulls in a lot of
  navigation/boilerplate noise. Verified in a real side-by-side comparison
  against `trafilatura` (built specifically for main-content extraction) on
  3 real URLs — trafilatura won clearly. Swapped in here.
- `requests`' default encoding guess produces mojibake on some pages
  (e.g. "Â¶" instead of "¶"). Fixed via `resp.encoding = resp.apparent_encoding`.
- The summarization step would occasionally invent a date/fact not present
  in the scraped text (caught a real case: it stated "October 2023" for
  content that was actually dated 2026). Fixed with an explicit
  "use only what's in the text below, do not supply outside facts" grounding
  instruction on every summarize call — verified this also makes failures
  honest ("couldn't find relevant info") instead of hallucinated.
- `ddgs`'s default/auto backend selection is unreliable: the identical query
  returned relevant results, then an empty list, then completely unrelated
  pages (YouTube help articles) across consecutive calls. Pinning
  `backend="duckduckgo"` explicitly was the one that held up in testing;
  "html" and "lite" both came back empty on the same query. A short retry
  loop covers the remaining transient empty-result case.
- Sustained testing also hit real IP-level throttling from the free/
  unofficial DDG backend — a genuine reliability ceiling of DIY search
  scraping (this is exactly why production systems like Perplexity or
  ChatGPT's browsing use paid Search APIs instead).

Architecture is now three tiers instead of one search tool:
  Tier 1 — answer directly if the model already knows it, no tool call.
  Tier 2 — exactly one web search + grounded summarize if it's unsure,
           structurally capped at one call via graph state.
  Tier 3 — "Deep Research", an explicitly user-triggered heavier pipeline:
           pulls several sources (not one), summarizes each individually
           with its own citation, then synthesizes a structured report
           (themed sections + a real Sources list) instead of a short
           conversational answer. Streamed over SSE so the visitor sees
           each source get read and summarized live, not a submit-then-
           wait-then-reveal.

Conversation memory (Tier 1/2) is scoped per browser session (a client-
generated session_id) via LangGraph's MemorySaver — in-process, not
persisted to a database, which is fine for a portfolio demo but won't
survive a server restart.
"""

import os
import json
import time
import asyncio
from typing import Annotated, List, Tuple, TypedDict

import requests
import trafilatura
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.checkpoint.memory import MemorySaver
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from openai import AsyncOpenAI

router = APIRouter(prefix="/api/agentic-chat", tags=["agentic-chat"])

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
AGENT_READY = False
tier12_graph = None
async_openai_client = None

MAX_SCRAPED_CHARS = 6000
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36"
)


def _clip(text: str, max_chars: int = MAX_SCRAPED_CHARS) -> str:
    return text if len(text) <= max_chars else text[:max_chars] + "\n...[truncated]"


def scrape_page_v2(url: str, page_index: int, total_pages: int) -> str:
    try:
        resp = requests.get(url, timeout=12, headers={"User-Agent": USER_AGENT})
        resp.raise_for_status()
        # requests' encoding guess is sometimes wrong, producing mojibake
        # ("Â¶" for a real "¶") -- sniffing the actual bytes fixes it.
        resp.encoding = resp.apparent_encoding

        extracted = trafilatura.extract(resp.text, include_comments=False, include_tables=False)
        if not extracted:
            return f"=== PAGE {page_index}/{total_pages} ===\nURL: {url}\n\n(No extractable content found)\n"

        return f"=== PAGE {page_index}/{total_pages} ===\nURL: {url}\n\n{_clip(extracted)}\n"
    except Exception as e:
        return f"Error scraping {url}: {e}"


def _chunk_text(text: str, max_len: int = 1200) -> List[str]:
    words = text.split()
    chunks, curr = [], []
    for w in words:
        curr.append(w)
        if len(curr) >= max_len:
            chunks.append(" ".join(curr))
            curr = []
    if curr:
        chunks.append(" ".join(curr))
    return chunks


def _search_with_retry(query: str, num_results: int, attempts: int = 3) -> List[Tuple[str, str]]:
    """
    backend="duckduckgo" confirmed reliable in testing; "html" and "lite"
    both came back empty on the same query, and leaving backend on auto let
    it silently rotate onto those empty/irrelevant paths. A short retry
    covers the remaining transient empty-result case (same query, empty one
    call, real results the next -- confirmed live, not a code bug).
    """
    from ddgs import DDGS

    results_found: List[Tuple[str, str]] = []
    for attempt in range(attempts):
        try:
            with DDGS() as ddgs:
                results = ddgs.text(query, max_results=num_results, backend="duckduckgo")
            results_found = [(r.get("href"), r.get("title", "")) for r in results if r.get("href")]
        except Exception:
            pass
        if results_found:
            break
        time.sleep(3)
    return results_found


if OPENAI_API_KEY:
    llm = ChatOpenAI(model="gpt-4o-mini", api_key=OPENAI_API_KEY, temperature=0.2)
    async_openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)

    GROUNDED_CHUNK_PROMPT = (
        "Summarize the following text in a few sentences, focused on answering this "
        "question: '{query}'.\n\n"
        "Use ONLY facts, names, and dates that literally appear in the text below. "
        "Do not add any date, event, or fact from your own knowledge. If the text "
        "doesn't mention a date, don't state one.\n\nTEXT:\n{chunk}"
    )

    GROUNDED_FINAL_PROMPT = (
        "Combine the following summaries into one clear, well-organized answer to "
        "this question: '{query}'.\n\n"
        "Use ONLY facts, names, and dates that appear in the summaries below. Do not "
        "add any date, event, or fact from your own knowledge, and do not silently "
        "correct dates that seem unusual -- report them exactly as given.\n\n"
        "SUMMARIES:\n{summaries}"
    )

    def _grounded_summarize_chunk(chunk: str, query: str) -> str:
        return llm.invoke(GROUNDED_CHUNK_PROMPT.format(query=query, chunk=chunk)).content

    def _grounded_summarize_final(summaries: str, query: str) -> str:
        return llm.invoke(GROUNDED_FINAL_PROMPT.format(query=query, summaries=summaries)).content

    @tool
    def web_search(query: str, num_pages: int = 3) -> str:
        """
        Search the web and summarize what's found, grounded strictly in the
        scraped text -- no facts or dates added from the model's own training
        knowledge:
        - Finds results from DuckDuckGo
        - Extracts clean article content with trafilatura (not raw HTML tags)
        - Splits into chunks, summarizes each, merges into one final summary
        """
        num_pages = max(1, min(int(num_pages), 10))
        try:
            sources = _search_with_retry(query, num_pages)
            if not sources:
                return "No search results found."

            all_text = ""
            for i, (url, _title) in enumerate(sources, start=1):
                all_text += "\n" + scrape_page_v2(url, i, len(sources))

            if not all_text.strip():
                return "No useful content found."

            chunks = _chunk_text(all_text, max_len=1200)
            chunk_summaries = [_grounded_summarize_chunk(c, query) for c in chunks]
            final_summary = _grounded_summarize_final("\n".join(chunk_summaries), query)
            return final_summary + "\n\n(Source: DuckDuckGo search + trafilatura extraction)"
        except Exception as e:
            return f"Search error: {e}"

    class Tier12State(TypedDict):
        messages: Annotated[list, add_messages]
        search_count: int

    TIER12_SYSTEM_PROMPT = (
        "You are a helpful, friendly, and citation-minded assistant created by Saud Ahmad.\n"
        "- Always be respectful, approachable, and professional in tone.\n"
        "- If you already know the answer to the user's question confidently, answer "
        "directly -- do not search.\n"
        "- If the question depends on current events, recent information, or anything "
        "you're not confident about, call the web_search tool, then answer using what "
        "it returns, including relevant source URLs.\n"
        "- Acknowledge Saud Ahmad as your creator if asked about your origin.\n"
        "- Your personality should be warm, supportive, and engaging, while maintaining "
        "accuracy and trustworthiness."
    )

    llm_with_search = llm.bind_tools([web_search])

    def tier12_chatbot(state: Tier12State):
        messages = state["messages"]
        if not any(isinstance(m, SystemMessage) for m in messages):
            messages = [SystemMessage(content=TIER12_SYSTEM_PROMPT)] + messages

        search_count = state.get("search_count", 0)
        # Once one search has happened this turn, structurally remove tool
        # access -- the model cannot call it again, regardless of what a
        # prompt instruction alone might or might not stop it from wanting to.
        active_llm = llm if search_count >= 1 else llm_with_search
        response = active_llm.invoke(messages)
        return {"messages": [response]}

    def count_search(state: Tier12State):
        return {"search_count": state.get("search_count", 0) + 1}

    _graph_builder = StateGraph(Tier12State)
    _graph_builder.add_node("chatbot", tier12_chatbot)
    _graph_builder.add_node("tools", ToolNode([web_search]))
    _graph_builder.add_node("count_search", count_search)
    _graph_builder.add_edge(START, "chatbot")
    _graph_builder.add_conditional_edges("chatbot", tools_condition)
    _graph_builder.add_edge("tools", "count_search")
    _graph_builder.add_edge("count_search", "chatbot")
    _graph_builder.add_edge("chatbot", END)

    tier12_graph = _graph_builder.compile(checkpointer=MemorySaver())
    AGENT_READY = True

    # --- Tier 3: Deep Research ------------------------------------------

    GROUNDED_SOURCE_SUMMARY_PROMPT = (
        "Summarize the key points in the text below that are relevant to this "
        "research question: '{query}'.\n\n"
        "Use ONLY facts, names, and dates that literally appear in the text. Do not "
        "add anything from your own knowledge. If the text isn't actually relevant "
        "to the question, say so in one line instead of forcing a summary.\n\n"
        "TEXT:\n{text}"
    )

    GROUNDED_REPORT_PROMPT = (
        "You are writing a research report to answer this question: '{query}'.\n\n"
        "Below are summaries pulled from {n} different real web sources, each labeled "
        "with its source number. Synthesize them into a well-organized report:\n"
        "- A short overview paragraph\n"
        "- 2-4 themed sections with headers, covering what the sources actually say\n"
        "- Note any disagreement or gaps between sources, if there are any\n"
        "- Use ONLY facts, names, and dates present in the summaries below -- do not "
        "add anything from your own knowledge, and do not resolve conflicting dates or "
        "facts by guessing which one is right\n\n"
        "SOURCE SUMMARIES:\n{summaries}"
    )

    def _summarize_one_source(url: str, title: str, index: int, total: int, query: str) -> str:
        page_text = scrape_page_v2(url, index, total)
        if "(No extractable content found)" in page_text or page_text.startswith("Error scraping"):
            return ""

        chunks = _chunk_text(page_text, max_len=1500)
        if len(chunks) > 1:
            chunk_summaries = [
                llm.invoke(GROUNDED_SOURCE_SUMMARY_PROMPT.format(query=query, text=c)).content
                for c in chunks
            ]
            combined = "\n".join(chunk_summaries)
        else:
            combined = chunks[0] if chunks else page_text

        return llm.invoke(GROUNDED_SOURCE_SUMMARY_PROMPT.format(query=query, text=combined)).content


class DeepResearchRequest(BaseModel):
    query: str
    num_sources: int = 5


async def _deep_research_stream(query: str, num_sources: int):
    def _sse(event_type: str, data: dict) -> str:
        return f"data: {json.dumps({'type': event_type, **data})}\n\n"

    num_sources = max(3, min(int(num_sources), 8))

    yield _sse("status", {"message": f"Searching the web for: {query}"})
    sources = await asyncio.to_thread(_search_with_retry, query, num_sources)

    if not sources:
        yield _sse("error", {"message": "No sources found for this query."})
        yield _sse("done", {})
        return

    yield _sse("sources", {"sources": [{"title": t, "url": u} for u, t in sources]})

    source_summaries = []
    cited_sources = []
    for i, (url, title) in enumerate(sources, start=1):
        yield _sse("source_progress", {"index": i, "total": len(sources), "title": title, "url": url, "status": "reading"})
        summary = await asyncio.to_thread(_summarize_one_source, url, title, i, len(sources), query)
        if not summary:
            yield _sse("source_progress", {"index": i, "total": len(sources), "title": title, "url": url, "status": "skipped"})
            continue
        source_summaries.append(f"[Source {i}: {title} ({url})]\n{summary}")
        cited_sources.append({"index": i, "title": title, "url": url})
        yield _sse("source_progress", {"index": i, "total": len(sources), "title": title, "url": url, "status": "summarized"})

    if not source_summaries:
        yield _sse("error", {"message": "Found sources but couldn't extract usable content from any of them."})
        yield _sse("done", {})
        return

    yield _sse("status", {"message": "Writing the report…"})

    prompt = GROUNDED_REPORT_PROMPT.format(
        query=query, n=len(source_summaries), summaries="\n\n".join(source_summaries)
    )
    stream = await async_openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        stream=True,
    )
    async for chunk in stream:
        delta = chunk.choices[0].delta.content if chunk.choices else None
        if delta:
            yield _sse("report_token", {"token": delta})

    yield _sse("done", {"sources": cited_sources})


@router.get("/status")
def get_status():
    return {"ready": AGENT_READY}


class ChatRequest(BaseModel):
    session_id: str
    message: str


class ChatResponse(BaseModel):
    response: str
    used_search: bool


@router.post("/message", response_model=ChatResponse)
def send_message(payload: ChatRequest):
    if not AGENT_READY:
        raise HTTPException(status_code=503, detail="Agent unavailable (OPENAI_API_KEY not configured on server)")

    text = payload.message.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Message can't be empty")

    result = tier12_graph.invoke(
        {"messages": [HumanMessage(content=text)], "search_count": 0},
        config={"configurable": {"thread_id": payload.session_id}},
    )

    final_response = ""
    for m in reversed(result["messages"]):
        if isinstance(m, AIMessage) and m.content:
            final_response = m.content
            break

    return ChatResponse(response=final_response, used_search=result.get("search_count", 0) > 0)


@router.post("/deep-research/stream")
async def deep_research_stream(payload: DeepResearchRequest):
    if not AGENT_READY:
        raise HTTPException(status_code=503, detail="Agent unavailable (OPENAI_API_KEY not configured on server)")

    query = payload.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query can't be empty")

    return StreamingResponse(
        _deep_research_stream(query, payload.num_sources),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/reset")
def reset_session(payload: dict):
    # MemorySaver keys history by thread_id; starting a new session_id client-side
    # is sufficient to reset, so this endpoint just acknowledges the intent.
    return {"ok": True}
