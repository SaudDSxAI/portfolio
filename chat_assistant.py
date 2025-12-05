import os
os.environ["ANONYMIZED_TELEMETRY"] = "False"  # Must be set before importing chromadb

from dotenv import load_dotenv
from pathlib import Path
from typing import Annotated, TypedDict, List
from openai import OpenAI
import chromadb
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages

# ================= CONFIG =================
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
CHROMA_DIR = Path("chroma_db")
PROMPT_FILE = Path("prompt/prompt.txt")

if not OPENAI_API_KEY:
    raise ValueError("❌ Missing OPENAI_API_KEY in .env")

# Initialize OpenAI client
openai_client = OpenAI(api_key=OPENAI_API_KEY)

# Initialize ChromaDB client
chroma_client = chromadb.PersistentClient(path=str(CHROMA_DIR))

# Load collections
try:
    cv_collection = chroma_client.get_collection("cv_collection")
    print("✅ Loaded cv_collection")
except:
    cv_collection = None
    print("⚠️ cv_collection not found")

try:
    github_collection = chroma_client.get_collection("github_collection")
    print("✅ Loaded github_collection")
except:
    github_collection = None
    print("⚠️ github_collection not found")


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
        return "You are a helpful assistant that answers questions about Saud Ahmad's CV, skills, and GitHub projects."


SYSTEM_PROMPT = load_system_prompt()


# ================= EMBEDDING & RETRIEVAL =================
def get_embedding(text: str) -> List[float]:
    """Get embedding for a query"""
    response = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    return response.data[0].embedding


def search_collections(query: str, n_results: int = 5) -> str:
    """Search both CV and GitHub collections for relevant context"""
    query_embedding = get_embedding(query)
    
    context_parts = []
    
    # Search CV collection
    if cv_collection:
        try:
            cv_results = cv_collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results
            )
            if cv_results and cv_results['documents'] and cv_results['documents'][0]:
                context_parts.append("=== CV & Personal Info ===")
                for doc in cv_results['documents'][0]:
                    context_parts.append(doc)
        except Exception as e:
            print(f"⚠️ Error searching CV collection: {e}")
    
    # Search GitHub collection
    if github_collection:
        try:
            github_results = github_collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results
            )
            if github_results and github_results['documents'] and github_results['documents'][0]:
                context_parts.append("\n=== GitHub Projects ===")
                for doc in github_results['documents'][0]:
                    context_parts.append(doc)
        except Exception as e:
            print(f"⚠️ Error searching GitHub collection: {e}")
    
    return "\n\n".join(context_parts) if context_parts else "No relevant context found."


# ================= LANGGRAPH STATE =================
class State(TypedDict):
    messages: Annotated[list, add_messages]
    context: str


# ================= LANGGRAPH NODES =================
def retrieve_context(state: State) -> State:
    """Retrieve relevant context from embeddings based on user query"""
    messages = state["messages"]
    
    # Get the last user message
    last_message = None
    for msg in reversed(messages):
        if msg.type == "human":
            last_message = msg.content
            break
    
    if last_message:
        context = search_collections(last_message)
        print(f"\n📚 Retrieved context ({len(context)} characters)")
    else:
        context = ""
    
    return {"context": context}


def generate_response(state: State) -> State:
    """Generate response using OpenAI with retrieved context"""
    messages = state["messages"]
    context = state.get("context", "")
    
    # Build messages for OpenAI
    openai_messages = [
        {"role": "system", "content": f"{SYSTEM_PROMPT}\n\n--- CONTEXT ---\n{context}\n--- END CONTEXT ---"}
    ]
    
    # Add conversation history
    for msg in messages:
        if msg.type == "human":
            openai_messages.append({"role": "user", "content": msg.content})
        elif msg.type == "ai":
            openai_messages.append({"role": "assistant", "content": msg.content})
    
    # Generate response
    response = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=openai_messages,
        temperature=0.7,
        max_tokens=1000
    )
    
    ai_response = response.choices[0].message.content
    
    return {"messages": [{"role": "assistant", "content": ai_response}]}


# ================= BUILD LANGGRAPH =================
def build_graph():
    """Build the LangGraph workflow"""
    graph = StateGraph(State)
    
    # Add nodes
    graph.add_node("retrieve", retrieve_context)
    graph.add_node("generate", generate_response)
    
    # Set entry point
    graph.set_entry_point("retrieve")
    
    # Add edges
    graph.add_edge("retrieve", "generate")
    graph.add_edge("generate", END)
    
    return graph.compile()


# ================= CHAT INTERFACE =================
def chat():
    """Interactive chat interface"""
    print("\n" + "=" * 60)
    print("🤖 PORTFOLIO CHAT ASSISTANT")
    print("=" * 60)
    print("Ask questions about Saud's CV, skills, or GitHub projects.")
    print("Type 'quit' or 'exit' to end the conversation.")
    print("Type 'clear' to clear conversation history.")
    print("=" * 60 + "\n")
    
    # Build graph
    app = build_graph()
    
    # Conversation history
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
            
            # Add user message to history
            from langchain_core.messages import HumanMessage
            conversation_history.append(HumanMessage(content=user_input))
            
            # Run the graph
            result = app.invoke({
                "messages": conversation_history,
                "context": ""
            })
            
            # Get AI response
            ai_response = result["messages"][-1].content
            
            # Add AI response to history
            from langchain_core.messages import AIMessage
            conversation_history.append(AIMessage(content=ai_response))
            
            print(f"\n🤖 Assistant: {ai_response}")
            
        except KeyboardInterrupt:
            print("\n\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"\n❌ Error: {e}")


# ================= MAIN =================
if __name__ == "__main__":
    chat()