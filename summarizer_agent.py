import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from langchain_openai import ChatOpenAI
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.schema import Document

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
SUMMARY_PATH = "mydata/summaries.txt"

def summarize_documents(docs, model="gpt-4o-mini", temperature=0.0, chunk_size=200, chunk_overlap=0):
    """
    Two-pass summarization:
    1. Extract structured notes from each chunk (lossless compression).
    2. Merge all notes into one unified summary.
    Parallelizes the first stage across all chunks.
    """

    if os.path.exists(SUMMARY_PATH):
        print(f"📂 Loading existing summary from {SUMMARY_PATH}")
        with open(SUMMARY_PATH, "r", encoding="utf-8") as f:
            text = f.read().strip()
        return [Document(page_content=text, metadata={"source": "summaries.txt"})]

    # Final summarizer prompt
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
...
6. Keep the final output in clean Markdown format with headings and bullet points.
"""

    llm = ChatOpenAI(openai_api_key=OPENAI_API_KEY, temperature=temperature, model=model)

    # 1️⃣ Split into chunks
    splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    chunked_docs = splitter.split_documents(docs)

    # 2️⃣ Extract structured notes in parallel (one worker per chunk)
    def extract_notes(doc):
        response = llm.invoke([
            {"role": "system", "content": "Extract ALL details in structured bullet-point notes. Do NOT summarize or drop information."},
            {"role": "user", "content": doc.page_content}
        ])
        return response.content.strip()

    num_chunks = len(chunked_docs)
    partial_notes = [None] * num_chunks

    with ThreadPoolExecutor(max_workers=num_chunks) as executor:
        futures = {executor.submit(extract_notes, doc): i for i, doc in enumerate(chunked_docs)}
        for future in as_completed(futures):
            idx = futures[future]
            partial_notes[idx] = future.result()

    # 3️⃣ Merge notes into one unified summary
    merge_input = "\n\n".join(partial_notes)
    final_response = llm.invoke([
        {"role": "system", "content": summarizer_prompt},
        {"role": "user", "content": merge_input}
    ])
    final_summary = final_response.content.strip()

    # 4️⃣ Save only the unified summary
    with open(SUMMARY_PATH, "w", encoding="utf-8") as f:
        f.write(final_summary)

    print(f"✅ Final unified summary saved to {SUMMARY_PATH}")
    return [Document(page_content=final_summary, metadata={"source": "summaries.txt"})]