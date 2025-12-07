# AskSaud — AI Portfolio Assistant

An AI-powered chatbot that answers questions about my skills, projects, and experience in real-time using RAG (Retrieval-Augmented Generation) and streaming responses.

<p align="center">
  <a href="https://saudassist.up.railway.app/">
    <img src="https://img.shields.io/badge/Live_Demo-10B981?style=for-the-badge&logo=openai&logoColor=white" alt="Live Demo"/>
  </a>
  <a href="https://github.com/SaudDSxAI">
    <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"/>
  </a>
  <a href="https://www.linkedin.com/in/saud-ahmad-286000229/">
    <img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn"/>
  </a>
</p>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [How It Works](#how-it-works)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Setup & Installation](#setup--installation)
- [Deployment](#deployment)
- [Screenshots](#screenshots)
- [Future Improvements](#future-improvements)
- [Contact](#contact)

---

## Overview

**Problem:** Traditional resumes are static, limited, and don't allow recruiters to explore specific areas of interest.

**Solution:** AskSaud is a conversational AI assistant that:
- Retrieves relevant context from my CV and 34 GitHub repositories
- Generates accurate, recruiter-ready responses using GPT-4o-mini
- Streams responses in real-time (GPT-like typewriter effect)
- Provides a mobile-first, WhatsApp-like chat experience

---

## Features

| Feature | Description |
|---------|-------------|
| **RAG Pipeline** | Retrieves context from CV and GitHub repos using vector embeddings |
| **Streaming Responses** | Real-time typewriter effect using Server-Sent Events (SSE) |
| **Session Memory** | Multi-turn conversation support with session management |
| **Mobile-First UI** | WhatsApp-like interface with fixed header/footer |
| **Markdown Rendering** | Supports bold, italic, lists, code blocks, and links |
| **Unicode Formatting** | Professional responses with structured formatting |
| **Fallback Support** | Falls back to non-streaming if SSE fails |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           USER (Browser)                            │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │  Chat UI    │  │  Streaming  │  │  Markdown   │                 │
│  │  Components │  │  Handler    │  │  Renderer   │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ HTTP / SSE
┌─────────────────────────────────────────────────────────────────────┐
│                        BACKEND (FastAPI)                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │  /chat      │  │  /chat/     │  │  /health    │                 │
│  │  (REST)     │  │  stream     │  │  (Status)   │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
┌───────────────────────────┐       ┌───────────────────────────────┐
│      RETRIEVAL (RAG)      │       │      GENERATION (LLM)         │
│  ┌─────────────────────┐  │       │  ┌─────────────────────────┐  │
│  │  ChromaDB           │  │       │  │  OpenAI GPT-5-mini     │  │
│  │  - CV Collection    │  │       │  │  - Streaming enabled    │  │
│  │  - GitHub Collection│  │       │  │  - Context injection    │  │
│  └─────────────────────┘  │       │  └─────────────────────────┘  │
│  ┌─────────────────────┐  │       └───────────────────────────────┘
│  │  OpenAI Embeddings  │  │
│  │  text-embedding-3-  │  │
│  │  small              │  │
│  └─────────────────────┘  │
└───────────────────────────┘
```

---

## Tech Stack

### Backend

| Technology | Purpose |
|------------|---------|
| **FastAPI** | Async REST API framework |
| **Python 3.11+** | Backend language |
| **OpenAI API** | GPT-4o-mini for generation, text-embedding-3-small for embeddings |
| **ChromaDB** | Vector database for storing embeddings |
| **Uvicorn** | ASGI server |
| **SSE (Server-Sent Events)** | Real-time streaming responses |

### Frontend

| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **Vite** | Build tool and dev server |
| **Tailwind CSS** | Utility-first styling |
| **JavaScript (ES6+)** | Frontend language |

### Deployment

| Service | Purpose |
|---------|---------|
| **Railway** | Hosting for both backend and frontend |
| **GitHub** | Version control and CI/CD trigger |

### Data Sources

| Source | Content |
|--------|---------|
| **CV (PDF)** | Skills, experience, education, certifications |
| **GitHub Repos (34)** | Project descriptions, README files, code context |

---

## How It Works

### 1. Embedding Pipeline (`create_embeddings.py`)

```python
# Loads CV and GitHub data
# Chunks text using RecursiveCharacterTextSplitter
# Generates embeddings using OpenAI text-embedding-3-small
# Stores in ChromaDB collections
```

**Process:**
1. Parse CV (PDF) using pdfplumber
2. Fetch GitHub repos via PyGithub API
3. Chunk documents (1000 chars, 200 overlap)
4. Generate embeddings for each chunk
5. Store in ChromaDB (cv_collection, github_collection)

### 2. RAG Retrieval

```python
# User query → Embedding → Vector search → Top 5 results
context = search_collections(user_query, n_results=5)
```

**Process:**
1. Convert user query to embedding
2. Search both collections (CV + GitHub)
3. Return top 5 most relevant chunks
4. Inject context into system prompt

### 3. Streaming Generation

```python
# OpenAI streaming with SSE
stream = openai_client.chat.completions.create(
    model="gpt-5-mini",
    messages=messages,
    stream=True
)

for chunk in stream:
    yield f"data: {json.dumps({'type': 'content', 'content': chunk})}\n\n"
```

**Process:**
1. Build messages with system prompt + context + history
2. Call OpenAI with `stream=True`
3. Yield chunks via Server-Sent Events
4. Frontend updates UI in real-time

### 4. Frontend Streaming Handler

```javascript
const reader = res.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  // Parse SSE data and update message content
  const data = JSON.parse(line.slice(6));
  if (data.type === 'content') {
    fullContent += data.content;
    setMessages(prev => /* update last message */);
  }
}
```

---

## Project Structure

```
portfolio/
├── main.py                    # FastAPI backend with streaming
├── create_embeddings.py       # Embedding generation pipeline
├── requirements.txt           # Python dependencies
├── .env                       # Environment variables (not in repo)
├── .gitignore
│
├── chroma_db/                 # Vector database (persisted)
│   ├── cv_collection/
│   └── github_collection/
│
├── prompt/
│   └── prompt.txt             # System prompt for AI assistant
│
├── data/
│   └── Saud_Ahmad_CV.pdf      # Source CV document
│
└── frontend/
    ├── src/
    │   ├── App.jsx            # Main React component
    │   ├── main.jsx           # React entry point
    │   └── index.css          # Global styles
    ├── public/
    │   ├── saud.jpeg          # Profile photo
    │   └── favicon.svg
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── index.html
```

---

## API Endpoints

### Health Check

```
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "cv_collection": true,
  "github_collection": true,
  "system_prompt_loaded": true,
  "active_sessions": 5
}
```

### Chat (Non-Streaming)

```
POST /chat
Content-Type: application/json

{
  "message": "What are Saud's skills?",
  "session_id": "optional-uuid"
}
```

**Response:**
```json
{
  "response": "Saud's core skills include...",
  "session_id": "uuid"
}
```

### Chat (Streaming)

```
POST /chat/stream
Content-Type: application/json

{
  "message": "Tell me about his projects",
  "session_id": "optional-uuid"
}
```

**Response (SSE):**
```
data: {"type": "session", "session_id": "uuid"}
data: {"type": "content", "content": "Saud"}
data: {"type": "content", "content": " has"}
data: {"type": "content", "content": " built"}
...
data: {"type": "done"}
```

### Session Management

```
DELETE /session/{session_id}   # Clear session history
```

---

## Setup & Installation

### Prerequisites

- Python 3.11+
- Node.js 18+
- OpenAI API key
- GitHub token (for fetching repos)

### Backend Setup

```bash
# Clone repository
git clone https://github.com/SaudDSxAI/portfolio.git
cd portfolio

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Create .env file
echo "OPENAI_API_KEY=your_key_here" > .env
echo "GITHUB_TOKEN=your_token_here" >> .env
echo "GITHUB_USERNAME=SaudDSxAI" >> .env

# Generate embeddings (first time only)
python create_embeddings.py

# Run backend
python main.py
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file (for development)
echo "VITE_API_URL=http://localhost:8000" > .env

# Run development server
npm run dev
```

### Environment Variables

**Backend (.env):**
```
OPENAI_API_KEY=sk-...
GITHUB_TOKEN=ghp_...
GITHUB_USERNAME=SaudDSxAI
```

**Frontend (.env):**
```
VITE_API_URL=https://asksaud.up.railway.app
```

---

## Deployment

### Railway Deployment

**Backend Service:**
1. Connect GitHub repo to Railway
2. Set root directory: `/`
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables (OPENAI_API_KEY, GITHUB_TOKEN, GITHUB_USERNAME)

**Frontend Service:**
1. Create new service in same project
2. Set root directory: `/frontend`
3. Set build command: `npm install && npm run build`
4. Set start command: `npx serve dist -l $PORT`
5. Add environment variable: `VITE_API_URL=https://your-backend.up.railway.app`

### Manual Deployment

```bash
# Build frontend
cd frontend
npm run build

# The dist/ folder contains static files
# Deploy to any static hosting (Netlify, Vercel, etc.)
```

---

## Screenshots

### Desktop View
- Clean chat interface with gradient background
- Fixed header with profile photo and status
- Streaming responses with typing indicator
- Markdown-formatted AI responses

### Mobile View
- WhatsApp-like responsive design
- Fixed header and input area
- Smooth scrolling chat area
- Touch-optimized buttons

---

## Future Improvements

- [ ] Voice input/output support
- [ ] Multi-language support
- [ ] PostgreSQL for persistent chat history
- [ ] Analytics dashboard
- [ ] Custom domain (chat.saudahmad.com)
- [ ] Rate limiting
- [ ] User authentication
- [ ] Export chat as PDF

---

## Contact

**Saud Ahmad**  
Data Scientist & AI Engineer

- **Email:** sauds6446@gmail.com
- **LinkedIn:** [linkedin.com/in/saud-ahmad-286000229](https://www.linkedin.com/in/saud-ahmad-286000229/)
- **GitHub:** [github.com/SaudDSxAI](https://github.com/SaudDSxAI)
- **Portfolio:** [saudassist.up.railway.app](https://saudassist.up.railway.app/)


---

<p align="center">
  <b>Built with LangGraph, FastAPI, React, and OpenAI</b>
</p>
