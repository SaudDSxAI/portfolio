import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain.schema import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from concurrent.futures import ThreadPoolExecutor, as_completed

# Import your data loaders
from load_embed import load_cv_documents, fetch_repo_list

# ================= CONFIG =================
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("❌ OPENAI_API_KEY not found in .env")

llm = ChatOpenAI(api_key=OPENAI_API_KEY, model="gpt-4o-mini", temperature=0.2)

# ================= SUMMARIZATION =================
def summarize_documents(docs, model="gpt-4o-mini", temperature=0.0, chunk_size=200, chunk_overlap=0):
    summarizer_prompt = """
You are a specialized summarization agent. 
Your task is to create ONE unified summary of a person’s profile, skills, projects, repositories, and education.

Guidelines:
1. Do not drop any repository or project — every single one must appear.
2. Merge duplicates (same repo listed multiple times).
3. Organize content hierarchically into these sections:
   - Profile
   - Skills
   - Projects & Experience
   - Repository Index
   - Education
   - Soft Skills
4. Use clean Markdown format with headings and bullet points.
"""

    local_llm = ChatOpenAI(api_key=OPENAI_API_KEY, temperature=temperature, model=model)

    splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    chunked_docs = splitter.split_documents(docs)

    def extract_notes(doc):
        response = local_llm.invoke([
            {"role": "system", "content": "Extract ALL details in structured bullet-point notes. Do NOT summarize or drop information."},
            {"role": "user", "content": doc.page_content}
        ])
        return response.content.strip()

    num_chunks = len(chunked_docs)
    partial_notes = [None] * num_chunks

    with ThreadPoolExecutor(max_workers=num_chunks) as executor:
        futures = {executor.submit(extract_notes, doc): i for i, doc in enumerate(chunked_docs)}
        for future in as_completed(futures):
            partial_notes[futures[future]] = future.result()

    merge_input = "\n\n".join(partial_notes)
    final_response = local_llm.invoke([
        {"role": "system", "content": summarizer_prompt},
        {"role": "user", "content": merge_input}
    ])
    return final_response.content.strip()

# ================= PRELOAD DATA =================
summary_cache = None

def preload():
    """Load CV + GitHub repos and build unified summary."""
    global summary_cache
    if summary_cache:
        return summary_cache

    print("🔄 Loading CV documents...")
    cv_docs = load_cv_documents()

    print("🔄 Fetching GitHub repositories...")
    repo_file, repo_texts = fetch_repo_list()
    repo_docs = [Document(page_content=text, metadata={"source": repo_file}) for text in repo_texts]

    all_docs = cv_docs + repo_docs
    print(f"📄 Loaded {len(all_docs)} docs")

    print("🔄 Summarizing profile...")
    summary_cache = summarize_documents(all_docs)
    print("✅ Summary cached")
    return summary_cache

# ================= ANSWER =================
def answer(query: str) -> str:
    """Answer user query using preloaded summary as context."""
    summary = preload()

    response = llm.invoke([
        {"role": "system", "content": "You are an assistant answering based on Saud’s CV and GitHub profile summary."},
        {"role": "user", "content": f"Context:\n{summary}\n\nQuestion: {query}"}
    ])
    return response.content.strip()
