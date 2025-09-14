import os
import asyncio
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.schema import Document

# ================= CONFIG =================
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
COMBINED_FILE = "mydata/combined.txt"

if not OPENAI_API_KEY:
    raise ValueError("❌ OPENAI_API_KEY not found. Please add it to your .env file or environment.")


# ================= SUMMARIZATION FUNCTION =================
async def summarize_documents(
    docs,
    model="gpt-4o-mini",
    temperature=0.0,
    chunk_size=800,   # ✅ increased chunk size
    chunk_overlap=0,
    max_concurrency=8  # ✅ cap parallelism
):
    """
    Two-pass summarization:
    1. Extract structured notes from each chunk (async, parallel).
    2. Merge all notes into one unified summary.
    """

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

    llm = ChatOpenAI(api_key=OPENAI_API_KEY, temperature=temperature, model=model)

    # 1️⃣ Split into chunks (fewer, bigger chunks)
    splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    chunked_docs = splitter.split_documents(docs)

    # 2️⃣ Extract structured notes asynchronously
    semaphore = asyncio.Semaphore(max_concurrency)

    async def extract_notes(doc):
        async with semaphore:  # ✅ cap concurrent requests
            response = await llm.ainvoke([
                {"role": "system", "content": "Extract ALL details in structured bullet-point notes. Do NOT summarize or drop information."},
                {"role": "user", "content": doc.page_content}
            ])
            return response.content.strip()

    # Run all note extractions in parallel
    partial_notes = await asyncio.gather(*(extract_notes(doc) for doc in chunked_docs))

    # 3️⃣ Merge notes into one unified summary
    merge_input = "\n\n".join(partial_notes)
    final_response = await llm.ainvoke([
        {"role": "system", "content": summarizer_prompt},
        {"role": "user", "content": merge_input}
    ])
    final_summary = final_response.content.strip()

    print("✅ Final unified summary created (not saved to file).")
    return final_summary, [Document(page_content=final_summary, metadata={"source": "in-memory"})]


# ================= LOAD DATA & RUN =================
def load_combined_file():
    if not os.path.exists(COMBINED_FILE):
        raise FileNotFoundError(f"❌ {COMBINED_FILE} not found. Run the data extraction script first.")
    
    with open(COMBINED_FILE, "r", encoding="utf-8") as f:
        text = f.read().strip()
    
    return [Document(page_content=text, metadata={"source": COMBINED_FILE})]


if __name__ == "__main__":
    print("🔄 Loading combined data...")
    docs = load_combined_file()

    print("🔄 Summarizing...")
    summary, summary_docs = asyncio.run(summarize_documents(docs))

    print("\n===== FINAL SUMMARY =====\n")
    print(summary)
