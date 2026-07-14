"""
Agentic AI case study — a LangGraph research agent, ported from a Streamlit
prototype (`agentic-ai/langgraph-chatbot/`) into this backend so the live
demo runs against the same OPENAI_API_KEY already configured for the site's
own RAG assistant (chat_assistant.py), instead of needing a separate key.

The agent itself is unchanged from the original: a LangGraph StateGraph with
one custom tool (`deep_scrape_search`) that does real multi-stage research —
DuckDuckGo search, scrape each result page, chunk the text, summarize each
chunk, then merge the chunk summaries into one final answer — rather than
just forwarding a single web search result to the model.

Conversation memory is scoped per browser session (a client-generated
session_id) via LangGraph's MemorySaver, so concurrent visitors don't share
history. This is in-process memory, not persisted to a database — acceptable
for a portfolio demo, not meant to survive a server restart.
"""

import os
import re
from typing import List, Optional

import requests
from bs4 import BeautifulSoup
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from langgraph.graph import StateGraph, MessagesState, END
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.checkpoint.memory import MemorySaver
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langchain_core.messages import HumanMessage, SystemMessage

router = APIRouter(prefix="/api/agentic-chat", tags=["agentic-chat"])

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
AGENT_READY = False
app_graph = None


def _clip(text: str, max_chars: int = 6000) -> str:
    return text if len(text) <= max_chars else text[:max_chars] + "\n...[truncated]"


def _scrape_page(url: str, page_index: int, total_pages: int) -> str:
    try:
        resp = requests.get(
            url,
            timeout=12,
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36"
                )
            },
        )
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        headlines = "\n".join(h.get_text(strip=True) for h in soup.find_all(["h1", "h2", "h3"]))
        paragraphs = "\n".join(p.get_text(strip=True) for p in soup.find_all("p"))
        captions = "\n".join(c.get_text(strip=True) for c in soup.find_all("figcaption"))
        list_items = "\n".join(li.get_text(strip=True) for li in soup.find_all("li"))

        return (
            f"=== PAGE {page_index}/{total_pages} ===\nURL: {url}\n\n"
            f"HEADLINES:\n{_clip(headlines)}\n\nARTICLE:\n{_clip(paragraphs)}\n\n"
            f"CAPTIONS:\n{_clip(captions)}\n\nLIST ITEMS:\n{_clip(list_items)}\n"
        )
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


if OPENAI_API_KEY:
    llm = ChatOpenAI(model="gpt-4o-mini", api_key=OPENAI_API_KEY, temperature=0.2)

    def _summarize_chunk(chunk: str, query: str) -> str:
        prompt = (
            f"The user searched for: '{query}'.\n"
            "Summarize the following text, keeping ALL important facts. "
            "Make it concise but do not lose critical information.\n\nTEXT:\n" + chunk
        )
        return llm.invoke([HumanMessage(content=prompt)]).content

    def _summarize_final(all_summaries: str, query: str) -> str:
        prompt = (
            f"The user searched for: '{query}'.\n"
            "Here are multiple summaries from different chunks. Merge them into one "
            "clear, complete and non-redundant summary.\n\nCHUNK SUMMARIES:\n" + all_summaries
        )
        return llm.invoke([HumanMessage(content=prompt)]).content

    @tool
    def deep_scrape_search(query: str, num_pages: int = 3) -> str:
        """
        Deep search + summarization tool:
        - Finds results from DuckDuckGo
        - Scrapes textual content
        - Splits into chunks
        - Summarizes chunks and merges into a final summary
        """
        num_pages = max(1, min(int(num_pages), 10))
        all_text = ""
        try:
            from ddgs import DDGS

            with DDGS() as ddgs:
                results = ddgs.text(query, max_results=num_pages)
                urls = [res.get("href") for res in results if res.get("href")]

            if not urls:
                return "No search results found."

            for i, url in enumerate(urls, start=1):
                all_text += "\n" + _scrape_page(url, i, len(urls))

            if not all_text.strip():
                return "No useful content found."

            chunks = _chunk_text(all_text, max_len=1200)
            chunk_summaries = [_summarize_chunk(c, query) for c in chunks]
            final_summary = _summarize_final("\n".join(chunk_summaries), query)
            return final_summary + "\n\n(Source: DuckDuckGo scrape) [TOOL COMPLETE]"
        except Exception as e:
            return f"Search error: {e}"

    TOOLS = [deep_scrape_search]
    llm = llm.bind_tools(TOOLS)

    SYSTEM_PROMPT = (
        "You are a helpful, friendly, and citation-minded assistant created by Saud Ahmad.\n"
        "- Always be respectful, approachable, and professional in tone.\n"
        "- You can access and return up-to-date, real-world information using the "
        "`deep_scrape_search` tool.\n"
        "- If the user asks about current events, recent facts, or anything uncertain, "
        "CALL the `deep_scrape_search` tool with a clear and precise query.\n"
        "- If the tool has already been called and the message contains '[TOOL COMPLETE]', "
        "DO NOT call the tool again. Instead, use the retrieved information to answer.\n"
        "- Summarize clearly and concisely, avoid unnecessary repetition, and include relevant "
        "source URLs.\n"
        "- Acknowledge Saud Ahmad as your creator if asked about your origin.\n"
        "- Your personality should be warm, supportive, and engaging, while maintaining "
        "accuracy and trustworthiness."
    )

    def chatbot_node(state: MessagesState):
        messages = [SystemMessage(content=SYSTEM_PROMPT)] + state["messages"]
        response = llm.invoke(messages)
        return {"messages": state["messages"] + [response]}

    _graph = StateGraph(MessagesState)
    _graph.add_node("chatbot", chatbot_node)
    _graph.add_node("tools", ToolNode(tools=TOOLS))
    _graph.set_entry_point("chatbot")
    _graph.add_conditional_edges("chatbot", tools_condition)
    _graph.add_edge("tools", "chatbot")
    _graph.add_edge("chatbot", END)

    _memory = MemorySaver()
    app_graph = _graph.compile(checkpointer=_memory)
    AGENT_READY = True
else:
    print("Missing OPENAI_API_KEY - agentic chat demo will report unavailable")


class ChatRequest(BaseModel):
    session_id: str
    message: str


class ChatResponse(BaseModel):
    response: str
    used_search: bool


@router.get("/status")
def get_status():
    return {"ready": AGENT_READY}


@router.post("/message", response_model=ChatResponse)
def send_message(payload: ChatRequest):
    if not AGENT_READY:
        raise HTTPException(status_code=503, detail="Agent unavailable (OPENAI_API_KEY not configured on server)")

    text = payload.message.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Message can't be empty")

    used_search = False
    final_response = ""

    for event in app_graph.stream(
        {"messages": [HumanMessage(content=text)]},
        config={"configurable": {"thread_id": payload.session_id}},
    ):
        if "chatbot" in event:
            msg = event["chatbot"]["messages"][-1]
            if getattr(msg, "tool_calls", None):
                used_search = True
            elif getattr(msg, "content", None):
                final_response = msg.content

    # Strip the internal completion marker before it ever reaches a visitor.
    final_response = re.sub(r"\s*\[TOOL COMPLETE\]\s*$", "", final_response).strip()

    return ChatResponse(response=final_response, used_search=used_search)


@router.post("/reset")
def reset_session(payload: dict):
    # MemorySaver keys history by thread_id; starting a new session_id client-side
    # is sufficient to reset, so this endpoint just acknowledges the intent.
    return {"ok": True}
