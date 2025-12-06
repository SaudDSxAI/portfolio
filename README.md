<h1 align="center">AskSaud — AI Portfolio Assistant</h1>

<p align="center">
  <img src="https://readme-typing-svg.herokuapp.com?font=Inter&weight=600&size=20&pause=1000&color=10B981&center=true&vCenter=true&width=500&lines=Chat+with+my+AI+assistant;Ask+about+my+skills+and+projects;Powered+by+LangGraph+%26+RAG" alt="Typing SVG" />
</p>

<p align="center">
  <a href="https://saudassist.up.railway.app/">
    <img src="https://img.shields.io/badge/Try_Live_Demo-10B981?style=for-the-badge&logo=openai&logoColor=white" alt="Live Demo"/>
  </a>
  <a href="https://github.com/SaudDSxAI">
    <img src="https://img.shields.io/badge/View_Code-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"/>
  </a>
</p>

---

## The Problem

Resumes are static. Recruiters skim. Context gets lost.

## The Solution

A conversational AI that retrieves relevant context from my CV and **34 GitHub repositories** — then generates accurate, recruiter-ready responses with **GPT-like streaming**.

---

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                        USER QUERY                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    LANGGRAPH PIPELINE                       │
│  ┌─────────────────┐         ┌─────────────────────────┐   │
│  │  Retrieve Node  │ ──────► │  Generate Node          │   │
│  │  (ChromaDB)     │         │  (OpenAI GPT-4o-mini)   │   │
│  └─────────────────┘         └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               STREAMING RESPONSE (SSE)                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

<table>
<tr>
<td align="center" width="50%">

### Backend

![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)

- FastAPI with async streaming
- Server-Sent Events (SSE)
- Session management

</td>
<td align="center" width="50%">

### AI / RAG

![LangGraph](https://img.shields.io/badge/LangGraph-4B0082?style=for-the-badge)
![ChromaDB](https://img.shields.io/badge/ChromaDB-FF4500?style=for-the-badge)

- LangGraph orchestration
- ChromaDB vector store
- OpenAI embeddings
- GPT-4o-mini generation

</td>
</tr>
<tr>
<td align="center" width="50%">

### Frontend

![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Tailwind](https://img.shields.io/badge/Tailwind-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

- Mobile-first design
- Real-time streaming UI
- Markdown rendering

</td>
<td align="center" width="50%">

### Deployment

![Railway](https://img.shields.io/badge/Railway-0B0D0E?style=for-the-badge&logo=railway&logoColor=white)

- Backend + Frontend on Railway
- Auto-deploy from GitHub
- Environment variables

</td>
</tr>
</table>

---

## Key Features

| Feature | Description |
|---------|-------------|
| **Streaming Responses** | GPT-like typewriter effect with SSE |
| **RAG Pipeline** | Retrieves context from CV + 34 GitHub repos |
| **LangGraph** | Two-node workflow: Retrieve → Generate |
| **Session Memory** | Multi-turn conversation support |
| **Mobile UX** | Keyboard handling, viewport fixes, smooth scroll |
| **Unicode Formatting** | Professional, structured responses |

---

## Architecture

```
portfolio/
├── main.py                 # FastAPI backend + streaming
├── create_embeddings.py    # CV & GitHub embedding pipeline
├── chroma_db/              # Vector database
├── prompt/
│   └── prompt.txt          # System prompt
└── frontend/
    ├── src/
    │   └── App.jsx         # React chat interface
    └── package.json
```

---

## Results

- **Real-time** streaming responses
- **Context-aware** answers from personal data
- **Production-ready** deployment
- **Mobile-optimized** experience

---

## Try It

<p align="center">
  <a href="https://saudassist.up.railway.app/">
    <img src="https://img.shields.io/badge/>>>_Chat_with_AskSaud_<<<-10B981?style=for-the-badge&logo=openai&logoColor=white" alt="Try Demo"/>
  </a>
</p>

<p align="center">
  Ask about my <b>skills</b> | <b>projects</b> | <b>experience</b>
</p>

---

## Connect

<p align="center">
  <a href="https://www.linkedin.com/in/saud-ahmad-286000229/">
    <img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white"/>
  </a>
  <a href="https://github.com/SaudDSxAI">
    <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white"/>
  </a>
  <a href="mailto:sauds6446@gmail.com">
    <img src="https://img.shields.io/badge/Email-EA4335?style=for-the-badge&logo=gmail&logoColor=white"/>
  </a>
</p>

---

<p align="center">
  <b>Built by Saud Ahmad</b><br/>
  AI/ML Engineer | LLM Developer | RAG Architect
</p>