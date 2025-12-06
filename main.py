import os
os.environ["ANONYMIZED_TELEMETRY"] = "False"  # Must be set before importing chromadb

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Dict
from dotenv import load_dotenv
from pathlib import Path
from openai import OpenAI
import chromadb
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from typing import Annotated, TypedDict
from langchain_core.messages import HumanMessage, AIMessage
import uuid
import json
import asyncio

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
cv_collection = None
github_collection = None

try:
    cv_collection = chroma_client.get_collection("cv_collection")
    print("✅ Loaded cv_collection")
except:
    print("⚠️ cv_collection not found")

try:
    github_collection = chroma_client.get_collection("github_collection")
    print("✅ Loaded github_collection")
except:
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


# ================= SESSION MANAGEMENT (In-Memory) =================
sessions: Dict[str, List] = {}


def get_or_create_session(session_id: Optional[str] = None) -> str:
    """Get existing session or create new one"""
    if session_id and session_id in sessions:
        return session_id
    
    new_session_id = str(uuid.uuid4())
    sessions[new_session_id] = []
    return new_session_id


# ================= PYDANTIC MODELS =================
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    session_id: str


class SessionResponse(BaseModel):
    session_id: str
    message_count: int
    created: bool


class HealthResponse(BaseModel):
    status: str
    cv_collection: bool
    github_collection: bool
    system_prompt_loaded: bool
    active_sessions: int


# ================= FASTAPI APP =================
app = FastAPI(
    title="Portfolio Chat API",
    description="AI-powered chat assistant for Saud Ahmad's portfolio",
    version="2.0.0"
)

# CORS middleware - allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ================= HELPER FUNCTIONS =================
def build_openai_messages(conversation_history: List, context: str) -> List[dict]:
    """Build OpenAI messages from conversation history"""
    openai_messages = [
        {"role": "system", "content": f"{SYSTEM_PROMPT}\n\n--- CONTEXT ---\n{context}\n--- END CONTEXT ---"}
    ]
    
    for msg in conversation_history:
        if isinstance(msg, HumanMessage):
            openai_messages.append({"role": "user", "content": msg.content})
        elif isinstance(msg, AIMessage):
            openai_messages.append({"role": "assistant", "content": msg.content})
        elif hasattr(msg, 'type'):
            if msg.type == "human":
                openai_messages.append({"role": "user", "content": msg.content})
            elif msg.type == "ai":
                openai_messages.append({"role": "assistant", "content": msg.content})
    
    return openai_messages


# ================= API ENDPOINTS =================
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint"""
    return {
        "message": "Portfolio Chat API",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        cv_collection=cv_collection is not None,
        github_collection=github_collection is not None,
        system_prompt_loaded=len(SYSTEM_PROMPT) > 0,
        active_sessions=len(sessions)
    )


@app.post("/chat", response_model=ChatResponse, tags=["Chat"])
async def chat(request: ChatRequest):
    """Send a message and get AI response (non-streaming)"""
    try:
        # Get or create session
        session_id = get_or_create_session(request.session_id)
        
        # Get conversation history
        conversation_history = sessions[session_id]
        
        # Add user message to history
        conversation_history.append(HumanMessage(content=request.message))
        
        # Get context from RAG
        context = search_collections(request.message)
        
        # Build OpenAI messages
        openai_messages = build_openai_messages(conversation_history, context)
        
        # Generate response
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=openai_messages,
            temperature=0.7,
            max_tokens=1000
        )
        
        ai_response = response.choices[0].message.content
        
        # Add AI response to history
        conversation_history.append(AIMessage(content=ai_response))
        
        # Update session
        sessions[session_id] = conversation_history
        
        return ChatResponse(
            response=ai_response,
            session_id=session_id
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat/stream", tags=["Chat"])
async def chat_stream(request: ChatRequest):
    """Send a message and get AI response with streaming (GPT-like typewriter effect)"""
    
    # Get or create session
    session_id = get_or_create_session(request.session_id)
    
    # Get conversation history
    conversation_history = sessions[session_id]
    
    # Add user message to history
    conversation_history.append(HumanMessage(content=request.message))
    
    # Get context from RAG
    context = search_collections(request.message)
    
    # Build OpenAI messages
    openai_messages = build_openai_messages(conversation_history, context)
    
    async def generate():
        full_response = ""
        
        try:
            # Send session_id first
            yield f"data: {json.dumps({'type': 'session', 'session_id': session_id})}\n\n"
            
            # Create streaming response
            stream = openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=openai_messages,
                temperature=0.7,
                max_tokens=1000,
                stream=True
            )
            
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    full_response += content
                    yield f"data: {json.dumps({'type': 'content', 'content': content})}\n\n"
            
            # Add complete response to history
            conversation_history.append(AIMessage(content=full_response))
            sessions[session_id] = conversation_history
            
            # Send done signal
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@app.post("/session/new", response_model=SessionResponse, tags=["Session"])
async def create_session():
    """Create a new chat session"""
    session_id = get_or_create_session()
    return SessionResponse(
        session_id=session_id,
        message_count=0,
        created=True
    )


@app.get("/session/{session_id}", response_model=SessionResponse, tags=["Session"])
async def get_session(session_id: str):
    """Get session info"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return SessionResponse(
        session_id=session_id,
        message_count=len(sessions[session_id]),
        created=False
    )


@app.delete("/session/{session_id}", tags=["Session"])
async def clear_session(session_id: str):
    """Clear a chat session"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    sessions[session_id] = []
    return {"message": "Session cleared", "session_id": session_id}


@app.get("/sessions", tags=["Session"])
async def list_sessions():
    """List all active sessions"""
    return {
        "sessions": [
            {"session_id": sid, "message_count": len(msgs)}
            for sid, msgs in sessions.items()
        ],
        "total": len(sessions)
    }


# ================= RUN SERVER =================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)