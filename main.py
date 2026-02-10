import os
import json
import uuid
import asyncio
from pathlib import Path
from typing import List, Optional, Dict
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from openai import OpenAI
import chromadb
from langchain_core.messages import HumanMessage, AIMessage

# Background Tasks
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from apscheduler.schedulers.background import BackgroundScheduler
from github import Github

# Import from our engine
from create_embeddings import process_single_file, process_single_repo, DATA_DIR, GITHUB_USERNAME, GITHUB_TOKEN

# ================= CONFIG =================
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
CHROMA_DIR = Path("chroma_db")
PROMPT_FILE = Path("prompt/prompt.txt")

if not OPENAI_API_KEY:
    raise ValueError("Missing OPENAI_API_KEY")

openai_client = OpenAI(api_key=OPENAI_API_KEY)
chroma_client = chromadb.PersistentClient(path=str(CHROMA_DIR))

# Collections (loaded on startup, but also accessed dynamically)
cv_collection = None
github_collection = None

def load_system_prompt():
    if PROMPT_FILE.exists():
        with open(PROMPT_FILE, "r", encoding="utf-8") as f:
            return f.read().strip()
    return "You are a helpful assistant for Saud Ahmad's portfolio."

SYSTEM_PROMPT = load_system_prompt()

# ================= BACKGROUND SERVICES =================
class DataHandler(FileSystemEventHandler):
    """Watch for file changes in data directory"""
    def on_modified(self, event):
        if not event.is_directory and Path(event.src_path).suffix in [".txt", ".md", ".pdf", ".docx", ".doc"]:
            print(f"👀 File modified: {event.src_path}")
            process_single_file(Path(event.src_path))

    def on_created(self, event):
        if not event.is_directory and Path(event.src_path).suffix in [".txt", ".md", ".pdf", ".docx", ".doc"]:
            print(f"👀 File created: {event.src_path}")
            process_single_file(Path(event.src_path))

def poll_github():
    """Poll GitHub for new commits"""
    print("⏰ Polling GitHub for updates...")
    if not GITHUB_TOKEN:
        return
    g = Github(GITHUB_TOKEN)
    try:
        user = g.get_user(GITHUB_USERNAME) if GITHUB_USERNAME else g.get_user()
        for repo in user.get_repos():
            process_single_repo(repo.name)
    except Exception as e:
        print(f"❌ Error polling GitHub: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Load Collections
    global cv_collection, github_collection
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

    # 2. Start File Watcher
    observer = Observer()
    event_handler = DataHandler()
    if DATA_DIR.exists():
        observer.schedule(event_handler, str(DATA_DIR), recursive=False)
        observer.start()
        print(f"👀 Watching {DATA_DIR} for changes...")
    
    # 3. Start GitHub Poller (every hour)
    scheduler = BackgroundScheduler()
    scheduler.add_job(poll_github, 'interval', minutes=60)
    scheduler.start()
    print("⏰ GitHub poller started (60 min interval)")
    
    yield
    
    # Shutdown
    observer.stop()
    observer.join()
    scheduler.shutdown()
    print("🛑 Background services stopped")

# ================= APP =================
app = FastAPI(title="AskSaud API", version="2.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ================= HELPERS =================
def get_embedding(text: str) -> List[float]:
    response = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    return response.data[0].embedding


def search_collections(query: str, n_results: int = 5) -> str:
    query_embedding = get_embedding(query)
    context_parts = []
    
    # Reload collections if needed (in case they were recreated by bg process)
    try:
        current_cv = chroma_client.get_collection("cv_collection")
        results = current_cv.query(query_embeddings=[query_embedding], n_results=n_results)
        if results and results['documents'] and results['documents'][0]:
            context_parts.append("=== CV & EXPERIENCE ===")
            context_parts.extend(results['documents'][0])
    except Exception as e:
        pass
    
    try:
        current_gh = chroma_client.get_collection("github_collection")
        results = current_gh.query(query_embeddings=[query_embedding], n_results=n_results)
        if results and results['documents'] and results['documents'][0]:
            context_parts.append("\n=== GITHUB PROJECTS ===")
            context_parts.extend(results['documents'][0])
    except Exception as e:
        pass
    
    return "\n\n".join(context_parts) if context_parts else "No context found."


# ================= SESSION =================
sessions: Dict[str, List] = {}

def get_or_create_session(session_id: Optional[str] = None) -> str:
    if session_id and session_id in sessions:
        return session_id
    new_id = str(uuid.uuid4())
    sessions[new_id] = []
    return new_id


def build_messages(history: List, context: str) -> List[dict]:
    messages = [{"role": "system", "content": f"{SYSTEM_PROMPT}\n\n--- CONTEXT FROM EMBEDDINGS ---\n{context}\n--- END CONTEXT ---"}]
    for msg in history:
        if isinstance(msg, HumanMessage):
            messages.append({"role": "user", "content": msg.content})
        elif isinstance(msg, AIMessage):
            messages.append({"role": "assistant", "content": msg.content})
    return messages


# ================= MODELS =================
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str

class HealthResponse(BaseModel):
    status: str
    cv_collection: bool
    github_collection: bool
    system_prompt_loaded: bool
    active_sessions: int


# ================= ENDPOINTS =================
@app.get("/")
async def root():
    return {"message": "AskSaud API", "health": "/health"}


@app.get("/health", response_model=HealthResponse)
async def health():
    cv_ok = False
    gh_ok = False
    try:
        chroma_client.get_collection("cv_collection")
        cv_ok = True
        chroma_client.get_collection("github_collection")
        gh_ok = True
    except:
        pass

    return HealthResponse(
        status="healthy",
        cv_collection=cv_ok,
        github_collection=gh_ok,
        system_prompt_loaded=len(SYSTEM_PROMPT) > 0,
        active_sessions=len(sessions)
    )


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        session_id = get_or_create_session(request.session_id)
        history = sessions[session_id]
        history.append(HumanMessage(content=request.message))
        
        context = search_collections(request.message)
        messages = build_messages(history, context)
        
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.7,
            max_tokens=1000
        )
        
        ai_response = response.choices[0].message.content
        history.append(AIMessage(content=ai_response))
        sessions[session_id] = history
        
        return ChatResponse(response=ai_response, session_id=session_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    session_id = get_or_create_session(request.session_id)
    history = sessions[session_id]
    history.append(HumanMessage(content=request.message))
    
    context = search_collections(request.message)
    messages = build_messages(history, context)
    
    def generate():
        full_response = ""
        try:
            yield f"data: {json.dumps({'type': 'session', 'session_id': session_id})}\n\n"
            
            stream = openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                temperature=0.7,
                max_tokens=1000,
                stream=True
            )
            
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    full_response += content
                    yield f"data: {json.dumps({'type': 'content', 'content': content})}\n\n"
            
            history.append(AIMessage(content=full_response))
            sessions[session_id] = history
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"}
    )


@app.delete("/session/{session_id}")
async def clear_session(session_id: str):
    if session_id in sessions:
        sessions[session_id] = []
    return {"message": "Session cleared"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)