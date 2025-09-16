import os
import faiss
import numpy as np
from pathlib import Path
from dotenv import load_dotenv

from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_text_splitters import RecursiveCharacterTextSplitter


# ---------------------------
# 0. Load environment variables
# ---------------------------
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("❌ OPENAI_API_KEY not found in .env")
print("✅ OpenAI API key loaded.")


# ---------------------------
# 1. Load your GitHub data
# ---------------------------
data_path   = Path("mydata/combined.txt")
index_file  = Path("mydata/faiss.index")
chunks_file = Path("mydata/chunks.npy")

with open(data_path, "r", encoding="utf-8") as f:
    raw_text = f.read()

print(f"✅ Loaded {len(raw_text.splitlines())} lines from {data_path}")


# ---------------------------
# 2. Chunk the text
# ---------------------------
splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50
)
chunks = splitter.split_text(raw_text)
print(f"✅ Created {len(chunks)} chunks")


# ---------------------------
# 3. Embeddings + FAISS (load or build)
# ---------------------------
embeddings_model = OpenAIEmbeddings(model="text-embedding-3-small")

if index_file.exists() and chunks_file.exists():
    print("📂 Loading existing FAISS index...")
    index = faiss.read_index(str(index_file))
    chunks = np.load(chunks_file, allow_pickle=True).tolist()
else:
    print("⚙️ Building FAISS index using OpenAI embeddings...")
    vectors = embeddings_model.embed_documents(chunks)
    vectors = np.array(vectors, dtype="float32")

    index = faiss.IndexFlatL2(vectors.shape[1])
    index.add(vectors)

    # Save index + chunks
    faiss.write_index(index, str(index_file))
    np.save(chunks_file, np.array(chunks, dtype=object))

    print("💾 Saved FAISS index + chunks to disk.")

print("✅ FAISS index ready.")


# ---------------------------
# 4. Retrieval helper
# ---------------------------
def retrieve_chunks(query, k=3):
    q_emb = embeddings_model.embed_query(query)
    D, I = index.search(np.array([q_emb], dtype="float32"), k)
    return [chunks[i] for i in I[0]]


# ---------------------------
# 5. Initialize Chat LLM
# ---------------------------
llm = ChatOpenAI(model="gpt-4o-mini")  # uses key from .env


# ---------------------------
# 6. RAG answering function
# ---------------------------
def answer_query(query):
    context = retrieve_chunks(query)
    context_str = "\n\n".join(context)

    prompt = f"""
    You are an intelligent assistant trained on GitHub project data.

    Use the context below to answer the question as helpfully as possible.
    If the context is only partially relevant, try to infer a good answer 
    by combining the context with your general knowledge.
    If the context is totally unrelated, politely say you don’t have enough info.

    Context:
    {context_str}

    Question: {query}
    """

    response = llm.invoke(prompt)
    return response.content


# ---------------------------
# 7. Run an interactive loop
# ---------------------------
if __name__ == "__main__":
    print("\n🚀 RAG system ready! Ask questions about your GitHub data.")
    print("Type 'exit' to quit.\n")

    while True:
        q = input("Query: ")
        if q.lower() in ["exit", "quit"]:
            break
        answer = answer_query(q)
        print("\nAnswer:", answer, "\n")
