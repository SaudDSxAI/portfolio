import os
import asyncio
from dotenv import load_dotenv
from github import Github
from concurrent.futures import ThreadPoolExecutor, as_completed
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_openai import ChatOpenAI
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.schema import Document

# ================= CONFIG =================
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

OUTPUT_DIR = "mydata"
COMBINED_FILE = os.path.join(OUTPUT_DIR, "combined.txt")
SUMMARY_FILE = os.path.join(OUTPUT_DIR, "summary.txt")

if not OPENAI_API_KEY or not GITHUB_TOKEN:
    raise ValueError("❌ Missing OPENAI_API_KEY or GITHUB_TOKEN in .env")

os.makedirs(OUTPUT_DIR, exist_ok=True)


# ================= LOAD CV DOCUMENTS =================
def load_cv_documents(data_folder="mydata"):
    documents = []
    for root, _, files in os.walk(data_folder):
        for file in files:
            path = os.path.join(root, file)
            try:
                if file.endswith(".pdf"):
                    docs = PyPDFLoader(path).load()
                elif file.endswith(".txt"):
                    docs = TextLoader(path, encoding="utf-8").load()
                else:
                    continue
                for d in docs:
                    d.metadata["source"] = path
                documents.extend(docs)
            except Exception as e:
                print(f"⚠️ Skipping {path}: {e}")
    return documents


# ================= FETCH GITHUB REPOS =================
def fetch_repos():
    g = Github(GITHUB_TOKEN)
    user = g.get_user()
    repo_results = []

    def process_repo(repo):
        try:
            info = [f"===== REPO: {repo.name} =====\n", f"URL: {repo.html_url}\n"]
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


# ================= SUMMARIZER =================
async def summarize(texts):
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0, api_key=OPENAI_API_KEY)
    splitter = RecursiveCharacterTextSplitter(chunk_size=1200, chunk_overlap=50)
    docs = splitter.split_documents([Document(page_content="\n".join(texts))])

    async def extract(doc):
        resp = await llm.ainvoke([
            {"role": "system", "content": "Extract structured notes. Keep all details."},
            {"role": "user", "content": doc.page_content}
        ])
        return resp.content

    partials = await asyncio.gather(*(extract(d) for d in docs))

    final = await llm.ainvoke([
        {"role": "system", "content": "Merge into one structured summary with sections: Profile, Skills, Projects, Repositories, Education, Soft Skills."},
        {"role": "user", "content": "\n\n".join(partials)}
    ])
    return final.content


# ================= PIPELINE =================
def run_pipeline():
    print("🔄 Loading CV...")
    cv_docs = load_cv_documents()
    print("🔄 Fetching GitHub repos...")
    repos = fetch_repos()

    # Save raw combined
    with open(COMBINED_FILE, "w", encoding="utf-8") as f:
        for d in cv_docs:
            f.write(d.page_content + "\n\n")
        for r in repos:
            f.write(r)
    print(f"✅ Combined saved → {COMBINED_FILE}")

    # Summarize
    print("🔄 Summarizing...")
    summary = asyncio.run(summarize([d.page_content for d in cv_docs] + repos))

    with open(SUMMARY_FILE, "w", encoding="utf-8") as f:
        f.write(summary)
    print(f"✅ Summary saved → {SUMMARY_FILE}")


if __name__ == "__main__":
    run_pipeline()
