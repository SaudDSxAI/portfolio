RAG AI Assistant – CV & GitHub Helper

An AI-powered RAG AI assistant that reads your CV, documents, and GitHub repositories to provide recruiter-ready answers.
This project uses FAISS, OpenAI GPT, and a Knowledge Graph to generate structured summaries and an interactive AI assistant.

Features

RAG AI Assistant: Reads CVs, combined documents, and GitHub repos to answer recruiter queries.

FAISS Vector Store: Fast semantic search of documents and code.

Knowledge Graph: Structured Q&A based on summarized content.

Automatic Updates: Detects new or updated files and refreshes the summary automatically.

Interactive Chatbot: Terminal-based interface for recruiters to query Saud’s skills, projects, and experience.

Asynchronous Summarization: Multi-step, parallel extraction of structured notes from CVs and repos.

Structured Output: Summary organized into Profile, Skills, Projects, Repositories, Education, Soft Skills.

Project Structure

cv_assistant.py – Terminal chatbot to answer recruiter queries using pre-summarized context.

loader_summarizer.py – Loads CV files and GitHub repos, combines them, and generates structured summaries.

summarizer_agent.py – Async summarization engine creating a unified summary of all documents and repositories.

mydata/ – Folder containing CV documents, GitHub repo data, combined text, and final summaries.
