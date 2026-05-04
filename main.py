import os
import json
import uuid
import asyncio
import time
from pathlib import Path
from typing import List, Optional, Dict, Any
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from openai import OpenAI
import io
try:
    from jinja2 import Environment, FileSystemLoader
    import weasyprint
except ImportError:
    pass
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
    print("⚠️ Missing OPENAI_API_KEY - AI chat features will be limited")

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

# ================= PROJECTS CACHE =================
# { "data": [...], "fetched_at": float }
_projects_cache: Dict[str, Any] = {}
PROJECTS_CACHE_TTL = 3600  # 1 hour

# Disk persistence: survives restarts. Manual sync writes here.
PROJECTS_FILE = Path("data") / "projects_cache.json"


def _bust_projects_cache():
    """Clear the in-memory projects cache so next request re-fetches from GitHub"""
    global _projects_cache
    _projects_cache = {}
    print("🗑️  Projects cache cleared (in-memory)")


def _load_projects_from_disk() -> Dict[str, Any]:
    """Load the persisted project cache from disk, if present."""
    if not PROJECTS_FILE.exists():
        return {}
    try:
        with open(PROJECTS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, dict) and "data" in data:
            print(f"💾 Loaded {len(data['data'])} projects from disk")
            return data
    except Exception as e:
        print(f"⚠️ Failed to load projects from disk: {e}")
    return {}


def _save_projects_to_disk(payload: Dict[str, Any]) -> None:
    """Persist the project cache to disk so it survives restarts."""
    try:
        PROJECTS_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(PROJECTS_FILE, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2, ensure_ascii=False)
        print(f"💾 Saved {len(payload.get('data', []))} projects to {PROJECTS_FILE}")
    except Exception as e:
        print(f"⚠️ Failed to save projects to disk: {e}")


CATEGORY_PROMPT = """
You are a senior portfolio curator for an AI engineer. Given a GitHub repo's
metadata, write a polished project card. Be precise. Be specific. No fluff.

Return ONLY a valid JSON object with these exact keys:

- "title": 2–5 words, Title Case, *describes the actual product*. NO generic
  words like "AI Project", "Cool App", "Awesome Tool", "ML Demo". Use a real
  product-style name. Examples: "Resume Screener Bot", "PDF Q&A Agent",
  "Crypto Sentiment Tracker", "GPT-4 Code Reviewer". If the repo already has
  a clear product name, keep it.

- "description": 1–2 sentences, max 200 chars. State *what it does* and *for
  whom*, not how it was built. Skip "this project", "this repo", "leverages",
  "utilizes". Start with a verb when possible. Example:
  "Screens resumes against a job description and ranks candidates by fit,
  with explainable scoring."

- "impact": one short line (≤80 chars) about the value. Real metrics if the
  README has them ("3,500+ CVs processed · 80% faster screening"). Otherwise
  state the concrete user-facing benefit ("Cuts manual review time").

- "tech": array of 3–6 specific technologies actually used (e.g. "FastAPI",
  "OpenAI", "ChromaDB", "React", "PyTorch"). Skip generic words like "AI",
  "Machine Learning", "Backend".

- "category": EXACTLY ONE of the following. Read the definitions and pick
  the single best match. Default to "Experiments" only if nothing else fits.

    * "Agentic AI" — autonomous agents, multi-step task execution, tool use,
      LangGraph/CrewAI/AutoGPT-style flows, planning + acting loops.
    * "LLM Apps & RAG" — chatbots, document Q&A, retrieval-augmented
      generation, semantic search, prompt-engineered LLM features. Not
      autonomous agents.
    * "Machine Learning" — classical ML, deep learning, computer vision,
      NLP modeling, training pipelines, predictive models. Not LLM wrappers.
    * "Data Engineering" — ETL, scrapers, data pipelines, embeddings
      generation, feature stores, dataset builders, batch jobs.
    * "Developer Tools" — CLI tools, libraries, SDKs, dev utilities,
      automation scripts intended for other engineers.
    * "Web Apps" — full-stack web applications, SaaS products, dashboards,
      portfolios, marketing sites. Not pure backends.
    * "Experiments" — learning exercises, demos, half-finished prototypes,
      tutorial follow-alongs, single-purpose scripts, rough notebooks.

- "icon": a single relevant emoji (kept for legacy data; the UI no longer
  renders it but include one anyway).

- "featured": true ONLY if the repo looks substantial — has a real README,
  meaningful description, multiple commits, and represents production-style
  work. False for experiments, tutorials, and one-off scripts.

Do NOT wrap in markdown. Output raw JSON only.
"""

# Bumped whenever the prompt or category list changes — forces re-enrichment
# of any cards saved under an older schema on next sync.
PROMPT_SCHEMA_VERSION = 2

# Allowed categories (matches the prompt). Used to validate LLM output.
ALLOWED_CATEGORIES = {
    "Agentic AI",
    "LLM Apps & RAG",
    "Machine Learning",
    "Data Engineering",
    "Developer Tools",
    "Web Apps",
    "Experiments",
}


def _enrich_repo_with_llm(repo) -> Optional[Dict]:
    """Call GPT-4o-mini to turn raw GitHub repo data into a polished project card."""
    if not OPENAI_API_KEY:
        return None
    try:
        # Build a compact context for the LLM
        readme_snippet = ""
        try:
            raw = repo.get_readme().decoded_content.decode("utf-8")
            readme_snippet = raw[:800]  # first 800 chars
        except:
            pass

        topics = ", ".join(repo.get_topics()) if repo.get_topics() else "none"
        user_prompt = (
            f"Repo name: {repo.name}\n"
            f"GitHub description: {repo.description or 'none'}\n"
            f"Primary language: {repo.language or 'unknown'}\n"
            f"Stars: {repo.stargazers_count}\n"
            f"Topics: {topics}\n"
            f"README snippet:\n{readme_snippet}"
        )

        resp = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": CATEGORY_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
            max_tokens=400,
        )
        enriched = json.loads(resp.choices[0].message.content)
        return enriched
    except Exception as e:
        print(f"  ⚠️ LLM enrichment failed for {repo.name}: {e}")
        return None


# Legacy gradient/border keys kept for payload shape compatibility.
# The frontend now uses GenerativeArt seeded by repoName instead.
_GRADIENTS = {cat: ("border-primary-600", "bg-primary-800 text-white") for cat in ALLOWED_CATEGORIES}


def _project_from_enriched(enriched: Dict, repo, idx: int) -> Dict:
    """Combine an LLM-enriched dict with raw repo metadata into a card payload."""
    cat = enriched.get("category", "Experiments")
    if cat not in ALLOWED_CATEGORIES:
        cat = "Experiments"
    gradient, border = _GRADIENTS.get(cat, ("border-primary-600", "bg-primary-800 text-white"))
    return {
        "id": idx + 1,
        "title": enriched.get("title", repo.name),
        "description": enriched.get("description", ""),
        "impact": enriched.get("impact", ""),
        "tech": enriched.get("tech", []),
        "category": cat,
        "github": repo.html_url,
        "featured": enriched.get("featured", False),
        "gradient": gradient,
        "borderGradient": border,
        "icon": enriched.get("icon", "💻"),
        "stars": repo.stargazers_count,
        "updatedAt": repo.pushed_at.isoformat() if repo.pushed_at else None,
        "repoName": repo.name,
        "schemaVersion": PROMPT_SCHEMA_VERSION,
    }


def _build_projects_list(existing: Optional[List[Dict]] = None) -> List[Dict]:
    """
    Fetch all GitHub repos and enrich each one via LLM.

    If `existing` is provided, repos that haven't changed since last enrichment
    (matched by repoName + updatedAt) are reused as-is — only new or modified
    repos are passed to the LLM. This keeps OpenAI cost / latency near zero
    for routine syncs.
    """
    if not GITHUB_TOKEN:
        print("⚠️ No GITHUB_TOKEN — cannot build projects list")
        return existing or []

    g = Github(GITHUB_TOKEN)
    try:
        user = g.get_user(GITHUB_USERNAME) if GITHUB_USERNAME else g.get_user()
        repos = list(user.get_repos(type="owner", sort="updated"))
    except Exception as e:
        print(f"❌ Error fetching repos: {e}")
        return existing or []

    # Index existing enriched cards by repoName for O(1) lookup
    existing_by_name: Dict[str, Dict] = {}
    if existing:
        for p in existing:
            if p.get("repoName"):
                existing_by_name[p["repoName"]] = p

    projects: List[Dict] = []
    reused = 0
    enriched_new = 0
    for idx, repo in enumerate(repos):
        if repo.fork:
            continue

        pushed_at_iso = repo.pushed_at.isoformat() if repo.pushed_at else None
        prev = existing_by_name.get(repo.name)

        # Reuse only if (a) repo unchanged since last enrichment AND
        # (b) we enriched it under the current prompt schema.
        prev_schema = prev.get("schemaVersion") if prev else None
        if (
            prev
            and prev.get("updatedAt") == pushed_at_iso
            and prev_schema == PROMPT_SCHEMA_VERSION
        ):
            updated = dict(prev)
            updated["id"] = idx + 1
            updated["stars"] = repo.stargazers_count
            updated["github"] = repo.html_url
            projects.append(updated)
            reused += 1
            continue

        enriched = _enrich_repo_with_llm(repo)
        if not enriched:
            enriched = {
                "title": repo.name.replace("-", " ").replace("_", " ").title(),
                "description": repo.description or "No description available.",
                "impact": f"{repo.stargazers_count} ⭐ · {repo.language or 'Code'}",
                "tech": [repo.language] if repo.language else [],
                "category": "Experiments",
                "icon": "💻",
                "featured": repo.stargazers_count > 2,
            }
        projects.append(_project_from_enriched(enriched, repo, idx))
        enriched_new += 1

    print(f"🔄 Built projects: {reused} reused, {enriched_new} newly enriched")

    # Sort: featured first, then by stars desc
    projects.sort(key=lambda p: (not p["featured"], -p["stars"]))
    return projects


def poll_github():
    """Hourly job: refresh embeddings and incrementally rebuild projects list."""
    print("⏰ Polling GitHub for updates...")
    if not GITHUB_TOKEN:
        return
    g = Github(GITHUB_TOKEN)
    try:
        user = g.get_user(GITHUB_USERNAME) if GITHUB_USERNAME else g.get_user()
        for repo in user.get_repos():
            process_single_repo(repo.name)
        # Incrementally update projects (no LLM call unless something changed)
        global _projects_cache
        existing = _projects_cache.get("data") if isinstance(_projects_cache, dict) else None
        projects = _build_projects_list(existing)
        _projects_cache = {"data": projects, "fetched_at": time.time()}
        _save_projects_to_disk(_projects_cache)
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
    
    # 2.5 Load persisted projects cache from disk (survives restarts)
    global _projects_cache
    _projects_cache = _load_projects_from_disk()

    # 3. Start GitHub Poller (every hour, incremental)
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

# Add health check for Railway
@app.get("/health")
async def health():
    return {"status": "healthy"}

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
    current_system_prompt = load_system_prompt()
    messages = [{"role": "system", "content": f"{current_system_prompt}\n\n--- CONTEXT FROM EMBEDDINGS ---\n{context}\n--- END CONTEXT ---"}]
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

class GenerateCVRequest(BaseModel):
    job_description: str

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


# ================= PROJECTS ENDPOINT =================
@app.get("/api/projects")
async def get_projects(refresh: bool = False):
    """
    Returns all GitHub projects enriched by LLM.
    Results are cached for 1 hour. Pass ?refresh=true to force a rebuild.
    """
    global _projects_cache
    now = time.time()

    # Always serve from cache when available (in-memory or disk-loaded).
    # Refresh is now an explicit user action via /api/projects/refresh.
    if not refresh and _projects_cache.get("data"):
        return {
            "projects": _projects_cache["data"],
            "cached": True,
            "fetched_at": _projects_cache.get("fetched_at", now),
            "total": len(_projects_cache["data"]),
        }

    # Build fresh (incremental — only LLM-enrich new/changed repos)
    loop = asyncio.get_event_loop()
    existing = _projects_cache.get("data") if isinstance(_projects_cache, dict) else None
    projects = await loop.run_in_executor(None, _build_projects_list, existing)

    _projects_cache = {"data": projects, "fetched_at": now}
    _save_projects_to_disk(_projects_cache)
    return {
        "projects": projects,
        "cached": False,
        "fetched_at": now,
        "total": len(projects),
    }


@app.post("/api/projects/refresh")
async def refresh_projects():
    """
    Manual sync. Pulls the latest repo list from GitHub and incrementally
    enriches only new/changed repos with the LLM. Persists result to disk.
    Existing repos that haven't changed are reused (no LLM call).
    """
    global _projects_cache
    loop = asyncio.get_event_loop()
    existing = _projects_cache.get("data") if isinstance(_projects_cache, dict) else None
    projects = await loop.run_in_executor(None, _build_projects_list, existing)
    _projects_cache = {"data": projects, "fetched_at": time.time()}
    _save_projects_to_disk(_projects_cache)
    return {
        "message": "Projects synced",
        "total": len(projects),
        "fetched_at": _projects_cache["fetched_at"],
    }


@app.post("/generate-cv")
async def generate_cv(request: GenerateCVRequest):
    if not request.job_description or len(request.job_description) < 10:
        raise HTTPException(status_code=400, detail="Job description too short")

    try:
        # Retrieve context based on JD
        context = search_collections(request.job_description, n_results=10)
        
        # Ask LLM to generate the CV JSON
        sys_prompt = (
            "You are a professional CV writer. Given Saud Ahmad's context and a Job Description, "
            "generate a tailored CV JSON matching the Jinja template format. Output ONLY valid JSON containing: "
            "name, email, phone, location, linkedin, github, summary, "
            "experience (list of {title, company, date, bullets}), "
            "projects (list of {title, tech_stack, bullets}), "
            "skills (list of {category, items}), "
            "education (list of {degree, institution, date}). DO NOT wrap in markdown blocks, output raw JSON."
        )
        user_prompt = f"Job Description:\n{request.job_description}\n\nSaud's Context:\n{context}"
        
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={ "type": "json_object" },
            messages=[
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.4,
            max_tokens=2500
        )
        
        cv_data_str = response.choices[0].message.content
        cv_data = json.loads(cv_data_str)
        
        # Ensure weasyprint and jinja2 are available
        try:
            import weasyprint
            from jinja2 import Environment, FileSystemLoader
        except ImportError:
            raise HTTPException(status_code=500, detail="PDF generation dependencies not installed. Please try again.")

        # Render HTML
        env = Environment(loader=FileSystemLoader("cv_templates"))
        template = env.get_template("cv_template.html")
        html_out = template.render(data=cv_data)
        
        # Generate PDF
        pdf_bytes = weasyprint.HTML(string=html_out).write_pdf()
        
        # Return PDF
        return StreamingResponse(
            io.BytesIO(pdf_bytes), 
            media_type="application/pdf", 
            headers={"Content-Disposition": "attachment; filename=Saud_Ahmad_CV.pdf"}
        )
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating CV: {e}")

# Serve React frontend static files
frontend_dist = Path("frontend/dist")
if frontend_dist.exists():
    app.mount("/assets", StaticFiles(directory=frontend_dist / "assets"), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Serve index.html for all unknown routes (SPA fallback)
        # Check if the requested file exists in dist
        path = frontend_dist / full_path
        if path.is_file():
            return FileResponse(path)
        return FileResponse(frontend_dist / "index.html")
else:
    print("⚠️ Frontend dist directory not found. Please run 'npm run build' in the frontend folder.")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)