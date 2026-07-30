"""
Private portal — a single-user, password-gated area of the portfolio's own
backend, completely separate from every client-facing case study demo. Not
linked anywhere in the site nav; reachable only if you know the URL and the
password. Everything persists to flat JSON files under private_store/, the
same lightweight pattern used by every other *_store/ directory in this
backend, since a single user with a handful of records doesn't need a real
database.

Auth: an email + password pair (PRIVATE_PORTAL_EMAIL / PRIVATE_PORTAL_PASSWORD,
set as env vars, never committed) checked against a login request, which
returns an HMAC-signed, time-limited token (PRIVATE_PORTAL_SECRET signs it).
Every other route requires that token as a Bearer header. Tokens expire after
TOKEN_LIFETIME_SECONDS (a real server-enforced session timeout, not just a
frontend idle timer) and the frontend adds its own shorter inactivity logout
on top of that. This is not meant to withstand a serious attacker, it's meant
to keep casual visitors and search engines out of a personal tracker sitting
on a public domain.
"""

import base64
import datetime
import hashlib
import hmac
import json
import os
import time
import uuid
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel

STORE_DIR = Path(__file__).resolve().parent / "private_store"
STORE_DIR.mkdir(exist_ok=True)

APPLICATIONS_FILE = STORE_DIR / "applications.json"
NOTES_FILE = STORE_DIR / "notes.json"
PREP_FILE = STORE_DIR / "prep.json"

PRIVATE_EMAIL = os.getenv("PRIVATE_PORTAL_EMAIL", "")
PRIVATE_PASSWORD = os.getenv("PRIVATE_PORTAL_PASSWORD", "")
PRIVATE_SECRET = os.getenv("PRIVATE_PORTAL_SECRET", "")

# Server-enforced session length. A logged-in token simply stops working
# after this, regardless of what the frontend does.
TOKEN_LIFETIME_SECONDS = 60 * 60 * 2  # 2 hours

router = APIRouter(prefix="/api/private", tags=["private"])


# ---------- storage helpers ----------

def _load(path: Path, default):
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return default


def _save(path: Path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def new_id() -> str:
    return uuid.uuid4().hex[:12]


def now_iso() -> str:
    return datetime.datetime.utcnow().isoformat()


# ---------- auth ----------

def make_token() -> str:
    expiry = str(int(time.time()) + TOKEN_LIFETIME_SECONDS)
    sig = hmac.new(PRIVATE_SECRET.encode(), expiry.encode(), hashlib.sha256).hexdigest()
    raw = f"{expiry}.{sig}"
    return base64.urlsafe_b64encode(raw.encode()).decode()


def verify_token(token: str) -> bool:
    try:
        raw = base64.urlsafe_b64decode(token.encode()).decode()
        expiry, sig = raw.split(".", 1)
        expected = hmac.new(PRIVATE_SECRET.encode(), expiry.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected):
            return False
        return int(expiry) > time.time()
    except Exception:
        return False


def require_auth(authorization: Optional[str] = Header(None)) -> bool:
    if not PRIVATE_EMAIL or not PRIVATE_PASSWORD or not PRIVATE_SECRET:
        raise HTTPException(status_code=500, detail="Private portal is not configured on the server")
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token = authorization.split(" ", 1)[1]
    if not verify_token(token):
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return True


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login")
def login(payload: LoginRequest):
    if not PRIVATE_EMAIL or not PRIVATE_PASSWORD or not PRIVATE_SECRET:
        raise HTTPException(status_code=500, detail="Private portal is not configured on the server")
    email_ok = hmac.compare_digest(payload.email.strip().lower(), PRIVATE_EMAIL.strip().lower())
    password_ok = hmac.compare_digest(payload.password, PRIVATE_PASSWORD)
    if not email_ok or not password_ok:
        raise HTTPException(status_code=401, detail="Wrong email or password")
    return {"token": make_token(), "expires_in": TOKEN_LIFETIME_SECONDS}


# ---------- models ----------

class Application(BaseModel):
    id: Optional[str] = None
    company: str
    role: str
    status: str = "Applied"  # Applied, Interviewing, Offer, Rejected, Ghosted
    date_applied: Optional[str] = None
    link: Optional[str] = ""
    notes: Optional[str] = ""


class Note(BaseModel):
    id: Optional[str] = None
    title: str
    body: str = ""
    tag: Optional[str] = ""
    created_at: Optional[str] = None


class PrepItem(BaseModel):
    id: Optional[str] = None
    title: str
    category: str = "General"
    done: bool = False
    notes: Optional[str] = ""


# ---------- applications ----------

@router.get("/applications")
def list_applications(_: bool = Depends(require_auth)):
    return _load(APPLICATIONS_FILE, [])


@router.post("/applications")
def create_application(app: Application, _: bool = Depends(require_auth)):
    apps = _load(APPLICATIONS_FILE, [])
    app.id = new_id()
    if not app.date_applied:
        app.date_applied = now_iso()[:10]
    apps.insert(0, app.dict())
    _save(APPLICATIONS_FILE, apps)
    return app


@router.put("/applications/{app_id}")
def update_application(app_id: str, app: Application, _: bool = Depends(require_auth)):
    apps = _load(APPLICATIONS_FILE, [])
    for i, a in enumerate(apps):
        if a["id"] == app_id:
            app.id = app_id
            apps[i] = app.dict()
            _save(APPLICATIONS_FILE, apps)
            return app
    raise HTTPException(status_code=404, detail="Not found")


@router.delete("/applications/{app_id}")
def delete_application(app_id: str, _: bool = Depends(require_auth)):
    apps = _load(APPLICATIONS_FILE, [])
    apps = [a for a in apps if a["id"] != app_id]
    _save(APPLICATIONS_FILE, apps)
    return {"ok": True}


# ---------- notes ----------

@router.get("/notes")
def list_notes(_: bool = Depends(require_auth)):
    return _load(NOTES_FILE, [])


@router.post("/notes")
def create_note(note: Note, _: bool = Depends(require_auth)):
    notes = _load(NOTES_FILE, [])
    note.id = new_id()
    note.created_at = now_iso()
    notes.insert(0, note.dict())
    _save(NOTES_FILE, notes)
    return note


@router.put("/notes/{note_id}")
def update_note(note_id: str, note: Note, _: bool = Depends(require_auth)):
    notes = _load(NOTES_FILE, [])
    for i, n in enumerate(notes):
        if n["id"] == note_id:
            note.id = note_id
            note.created_at = n.get("created_at")
            notes[i] = note.dict()
            _save(NOTES_FILE, notes)
            return note
    raise HTTPException(status_code=404, detail="Not found")


@router.delete("/notes/{note_id}")
def delete_note(note_id: str, _: bool = Depends(require_auth)):
    notes = _load(NOTES_FILE, [])
    notes = [n for n in notes if n["id"] != note_id]
    _save(NOTES_FILE, notes)
    return {"ok": True}


# ---------- prep checklist ----------

@router.get("/prep")
def list_prep(_: bool = Depends(require_auth)):
    return _load(PREP_FILE, [])


@router.post("/prep")
def create_prep(item: PrepItem, _: bool = Depends(require_auth)):
    items = _load(PREP_FILE, [])
    item.id = new_id()
    items.append(item.dict())
    _save(PREP_FILE, items)
    return item


@router.put("/prep/{item_id}")
def update_prep(item_id: str, item: PrepItem, _: bool = Depends(require_auth)):
    items = _load(PREP_FILE, [])
    for i, p in enumerate(items):
        if p["id"] == item_id:
            item.id = item_id
            items[i] = item.dict()
            _save(PREP_FILE, items)
            return item
    raise HTTPException(status_code=404, detail="Not found")


@router.delete("/prep/{item_id}")
def delete_prep(item_id: str, _: bool = Depends(require_auth)):
    items = _load(PREP_FILE, [])
    items = [p for p in items if p["id"] != item_id]
    _save(PREP_FILE, items)
    return {"ok": True}


# ---------- summary / analytics ----------

@router.get("/summary")
def summary(_: bool = Depends(require_auth)):
    apps = _load(APPLICATIONS_FILE, [])
    prep = _load(PREP_FILE, [])
    notes = _load(NOTES_FILE, [])

    status_counts: dict = {}
    for a in apps:
        status_counts[a["status"]] = status_counts.get(a["status"], 0) + 1

    total_apps = len(apps)
    advanced = sum(1 for a in apps if a["status"] in ("Interviewing", "Offer"))
    response_rate = round((advanced / total_apps) * 100, 1) if total_apps else 0.0

    prep_done = sum(1 for p in prep if p["done"])
    prep_total = len(prep)
    prep_pct = round((prep_done / prep_total) * 100, 1) if prep_total else 0.0

    return {
        "total_applications": total_apps,
        "status_counts": status_counts,
        "response_rate": response_rate,
        "prep_completed": prep_done,
        "prep_total": prep_total,
        "prep_pct": prep_pct,
        "total_notes": len(notes),
    }
