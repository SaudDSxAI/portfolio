import os
from dotenv import load_dotenv
from github import Github
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

# LangChain imports
from langchain_community.document_loaders import TextLoader
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import FAISS
from langchain.chains import RetrievalQA
from langchain.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate

# ================= CONFIG =================
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

OUTPUT_DIR = Path("data")
CV_FILE = OUTPUT_DIR / "cv.txt"
COMBINED_FILE = OUTPUT_DIR / "combined.txt"
FAISS_PATH = OUTPUT_DIR / "faiss_index"
PROMPT_FILE = OUTPUT_DIR / "prompt.txt"

if not OPENAI_API_KEY or not GITHUB_TOKEN:
    raise ValueError("❌ Missing OPENAI_API_KEY or GITHUB_TOKEN in .env")

os.makedirs(OUTPUT_DIR, exist_ok=True)


# ================= STEP 0: Load Prompt =================
def load_prompt(prompt_file=PROMPT_FILE):
    if not prompt_file.exists():
        raise FileNotFoundError(f"❌ Prompt file not found: {prompt_file}")
    with open(prompt_file, "r", encoding="utf-8") as f:
        prompt_text = f.read()
    system_message = SystemMessagePromptTemplate.from_template(
        f"You are Saud's AI Career Assistant.\nAlways follow these recruiter-oriented instructions:\n\n{prompt_text}"
    )
    return system_message


# ================= STEP 1: Load Single CV File =================
def load_cv_file(cv_file=CV_FILE):
    if not cv_file.exists():
        raise FileNotFoundError(f"❌ CV file not found: {cv_file}")
    print(f"📄 Loading CV from {cv_file}")
    with open(cv_file, "r", encoding="utf-8") as f:
        return [f.read()]


# ================= STEP 2: Fetch GitHub Repositories =================
def fetch_repos():
    g = Github(GITHUB_TOKEN)
    user = g.get_user()
    repo_results = []

    def process_repo(repo):
        try:
            info = [
                f"===== REPO: {repo.name} =====\n",
                f"URL: {repo.html_url}\n"
            ]
            try:
                readme = repo.get_readme()
                info.append("\n--- README ---\n")
                info.append(readme.decoded_content.decode("utf-8"))
                info.append("\n--- END README ---\n")
            except Exception:
                info.append("(No README)\n")
            info.append("===== END REPO =====\n\n")
            return "".join(info)
        except Exception as e:
            return f"⚠️ Failed repo {repo.name}: {e}\n"

    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = [executor.submit(process_repo, repo) for repo in user.get_repos()]
        for f in as_completed(futures):
            repo_results.append(f.result())

    return repo_results


# ================= STEP 3: Combine and Save =================
def combine_and_save(cv_texts, repo_texts, output_file=COMBINED_FILE):
    with open(output_file, "w", encoding="utf-8") as f:
        for cv in cv_texts:
            f.write(cv + "\n\n")
        for repo in repo_texts:
            f.write(repo)
    print(f"✅ Combined data saved → {output_file}")


# ================= STEP 4: Build or Load FAISS =================
def get_vectorstore(combined_file=COMBINED_FILE, faiss_path=FAISS_PATH):
    embeddings = OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY, model="text-embedding-3-large")

    if faiss_path.exists():
        try:
            print("📦 Found existing FAISS index. Loading...")
            vectorstore = FAISS.load_local(str(faiss_path), embeddings, allow_dangerous_deserialization=True)
            return vectorstore
        except Exception as e:
            print(f"⚠️ Failed to load FAISS index: {e}")
            print("🔄 Rebuilding embeddings...")

    print("🆕 Creating FAISS index from combined data...")
    with open(combined_file, "r", encoding="utf-8") as f:
        text = f.read()
    vectorstore = FAISS.from_texts([text], embeddings)
    vectorstore.save_local(str(faiss_path))
    print(f"✅ FAISS index created and saved → {faiss_path}")
    return vectorstore


# ================= STEP 5: Build QA Chain =================
def build_qa_chain(vectorstore, system_prompt):
    retriever = vectorstore.as_retriever(search_kwargs={"k": 33})
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

    human_message = HumanMessagePromptTemplate.from_template(
        "Here is the context:\n{context}\n\nNow answer the question:\n{question}"
    )
    prompt = ChatPromptTemplate.from_messages([system_prompt, human_message])

    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        retriever=retriever,
        chain_type="stuff",
        chain_type_kwargs={"prompt": prompt},
        return_source_documents=True
    )
    return qa_chain


# ================= MAIN PIPELINE =================
def run_pipeline(init_only: bool = False):
    print("🔄 Loading recruiter prompt...")
    system_prompt = load_prompt()

    print("🔄 Loading CV file...")
    cv_texts = load_cv_file()

    print("🔄 Fetching GitHub repositories...")
    repos = fetch_repos()

    print("🔄 Combining and saving data...")
    combine_and_save(cv_texts, repos)

    print("🔄 Loading or building vectorstore...")
    vectorstore = get_vectorstore()

    print("🔄 Building QA chain...")
    qa_chain = build_qa_chain(vectorstore, system_prompt)

    if init_only:
        return qa_chain

    print("\n🚀 CV Assistant Ready! Ask me questions (type 'exit' to quit)\n")
    while True:
        query = input("Query: ")
        if query.lower() in ["exit", "quit"]:
            print("👋 Exiting assistant. Goodbye!")
            break
        print("💭 Thinking...")
        try:
            result = qa_chain.invoke({"query": query})
            print("\nAnswer:", result["result"])
            print("\nSources:")
            for doc in result["source_documents"]:
                print(" -", doc.metadata.get("source", "unknown"))
        except Exception as e:
            print(f"⚠️ Error: {e}")


if __name__ == "__main__":
    run_pipeline()
