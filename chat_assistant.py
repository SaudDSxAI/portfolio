import os
os.environ["ANONYMIZED_TELEMETRY"] = "False"  # Must be set before importing chromadb

import json
from dotenv import load_dotenv
from pathlib import Path
from typing import Annotated, TypedDict, List, Dict, Any
from openai import OpenAI
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage

# ================= CONFIG =================
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
PROMPT_FILE = Path("prompt/prompt.txt")
PROJECTS_DATA_FILE = Path("data") / "projects.json"

if not OPENAI_API_KEY:
    raise ValueError("❌ Missing OPENAI_API_KEY in .env")

openai_client = OpenAI(api_key=OPENAI_API_KEY)


# ================= LOAD SYSTEM PROMPT =================
def load_system_prompt():
    """Load system prompt from prompt/prompt.txt"""
    if PROMPT_FILE.exists():
        with open(PROMPT_FILE, "r", encoding="utf-8") as f:
            prompt = f.read().strip()
            print(f"✅ Loaded system prompt ({len(prompt)} characters)")
            return prompt
    else:
        print("⚠️ prompt/prompt.txt not found, using default prompt")
        return "You are a helpful assistant that answers questions about Saud Ahmad."


SYSTEM_PROMPT = load_system_prompt()


# ================= PROJECT TOOL-CALLING =================
# Same architecture as main.py (the actual live backend): the model gets a
# compact index of every project up front, plus a get_project_details tool
# it can call for the full write-up. Both read from data/projects.json,
# exported from frontend/src/data/caseStudies.js via
# scripts/export_projects.mjs — that JS file is the single source of truth,
# this backend never hardcodes project descriptions.
def load_projects_data() -> Dict[str, Any]:
    if not PROJECTS_DATA_FILE.exists():
        print(f"⚠️ {PROJECTS_DATA_FILE} not found — run scripts/export_projects.mjs")
        return {"index": [], "pointers": {}}
    try:
        with open(PROJECTS_DATA_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        return {"index": data.get("index", []), "pointers": data.get("pointers", {})}
    except Exception as e:
        print(f"⚠️ Failed to load {PROJECTS_DATA_FILE}: {e}")
        return {"index": [], "pointers": {}}


def format_project_index(index: List[Dict[str, Any]]) -> str:
    if not index:
        return "PROJECT INDEX: (none currently loaded)"
    lines = ["PROJECT INDEX (slug — title (category): tagline):"]
    for item in index:
        lines.append(
            f"- {item.get('slug')} — {item.get('title')} ({item.get('categoryLabel')}): {item.get('tagline')}"
        )
    return "\n".join(lines)


def get_project_details(slug: str) -> str:
    data = load_projects_data()
    pointer = data["pointers"].get(slug)
    if pointer:
        return pointer
    available = ", ".join(data["pointers"].keys()) or "(none loaded)"
    return f"No project found with slug '{slug}'. Available slugs: {available}"


PROJECT_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_project_details",
            "description": (
                "Get the complete write-up for one specific project — full narrative, "
                "tech stack, real metrics, and skills demonstrated. Call this with the "
                "project's exact slug from the PROJECT INDEX whenever the user asks about "
                "a specific project by name, or asks something a specific project would "
                "answer better than a generic summary."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "slug": {
                        "type": "string",
                        "description": "The project's exact slug from the PROJECT INDEX, e.g. 'coter-global-recruitment-agent'",
                    }
                },
                "required": ["slug"],
            },
        },
    }
]


def build_full_system_prompt() -> str:
    project_index_text = format_project_index(load_projects_data()["index"])
    return f"{SYSTEM_PROMPT}\n\n---\n\n{project_index_text}"


# ================= LANGGRAPH STATE =================
class State(TypedDict):
    messages: Annotated[list, add_messages]


# ================= MESSAGE CONVERSION =================
def lc_messages_to_openai(messages: list, system_prompt: str) -> List[dict]:
    """Convert the LangChain message list (Human/AI/Tool) into the plain
    dicts the OpenAI SDK expects, including tool_calls / tool_call_id."""
    openai_messages = [{"role": "system", "content": system_prompt}]
    for msg in messages:
        if isinstance(msg, HumanMessage):
            openai_messages.append({"role": "user", "content": msg.content})
        elif isinstance(msg, ToolMessage):
            openai_messages.append({
                "role": "tool",
                "tool_call_id": msg.tool_call_id,
                "content": msg.content,
            })
        elif isinstance(msg, AIMessage):
            entry = {"role": "assistant", "content": msg.content or ""}
            if msg.tool_calls:
                entry["tool_calls"] = [
                    {
                        "id": tc["id"],
                        "type": "function",
                        "function": {"name": tc["name"], "arguments": json.dumps(tc["args"])},
                    }
                    for tc in msg.tool_calls
                ]
            openai_messages.append(entry)
    return openai_messages


# ================= LANGGRAPH NODES =================
def call_model(state: State) -> State:
    """Ask the model for its next move — either a text answer, or a request
    to call get_project_details for a specific project's full detail."""
    openai_messages = lc_messages_to_openai(state["messages"], build_full_system_prompt())

    response = openai_client.chat.completions.create(
        model="gpt-5-mini",
        messages=openai_messages,
        tools=PROJECT_TOOLS,
        tool_choice="auto",
        temperature=1,
        max_tokens=1000,
    )
    choice = response.choices[0].message

    if choice.tool_calls:
        tool_calls = [
            {"id": tc.id, "name": tc.function.name, "args": json.loads(tc.function.arguments or "{}")}
            for tc in choice.tool_calls
        ]
        return {"messages": [AIMessage(content=choice.content or "", tool_calls=tool_calls)]}

    return {"messages": [AIMessage(content=choice.content or "")]}


def execute_tools(state: State) -> State:
    """Run whatever tool(s) the last AI message requested, and feed the
    results back in as ToolMessages so the model can use them next turn."""
    last = state["messages"][-1]
    tool_messages = []
    for tc in last.tool_calls:
        if tc["name"] == "get_project_details":
            result = get_project_details(tc["args"].get("slug", ""))
        else:
            result = f"Unknown tool: {tc['name']}"
        tool_messages.append(ToolMessage(content=result, tool_call_id=tc["id"]))
    return {"messages": tool_messages}


def should_continue(state: State) -> str:
    last = state["messages"][-1]
    if isinstance(last, AIMessage) and last.tool_calls:
        return "tools"
    return END


# ================= BUILD LANGGRAPH =================
def build_graph():
    """Standard ReAct-style tool loop: agent decides -> tools run if
    requested -> back to agent with the results -> repeat until it answers
    with plain text."""
    graph = StateGraph(State)

    graph.add_node("agent", call_model)
    graph.add_node("tools", execute_tools)

    graph.set_entry_point("agent")
    graph.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
    graph.add_edge("tools", "agent")

    return graph.compile()


# ================= CHAT INTERFACE =================
def chat():
    """Interactive chat interface"""
    print("\n" + "=" * 60)
    print("🤖 PORTFOLIO CHAT ASSISTANT")
    print("=" * 60)
    print("Ask questions about Saud — background, skills, or any specific project.")
    print("Type 'quit' or 'exit' to end the conversation.")
    print("Type 'clear' to clear conversation history.")
    print("=" * 60 + "\n")

    app = build_graph()
    conversation_history = []

    while True:
        try:
            user_input = input("\n👤 You: ").strip()

            if not user_input:
                continue
            if user_input.lower() in ["quit", "exit"]:
                print("\n👋 Goodbye!")
                break
            if user_input.lower() == "clear":
                conversation_history = []
                print("🗑️ Conversation cleared!")
                continue

            conversation_history.append(HumanMessage(content=user_input))

            result = app.invoke({"messages": conversation_history})

            # Walk back from the end to find the final plain-text AI reply
            # (there may be ToolMessages / tool-call AIMessages after the
            # last real user turn if the model used a tool this round).
            ai_response = ""
            for msg in reversed(result["messages"]):
                if isinstance(msg, AIMessage) and msg.content:
                    ai_response = msg.content
                    break

            conversation_history = result["messages"]

            print(f"\n🤖 Assistant: {ai_response}")

        except KeyboardInterrupt:
            print("\n\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"\n❌ Error: {e}")


# ================= MAIN =================
if __name__ == "__main__":
    chat()
