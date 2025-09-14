import os
import base64
from dotenv import load_dotenv
from github import Github
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from concurrent.futures import ThreadPoolExecutor, as_completed

# ================= CONFIG =================
load_dotenv()
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

if not GITHUB_TOKEN:
    raise ValueError("❌ GITHUB_TOKEN not found in .env file")

OUTPUT_DIR = "mydata"
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "repos_overview.txt")
COMBINED_FILE = os.path.join(OUTPUT_DIR, "combined.txt")

MAX_FILE_SIZE = 500_000
ALLOWED_EXTENSIONS = (
    ".py", ".js", ".ts", ".java", ".cpp", ".c", ".rb", ".go",
    ".php", ".html", ".css", ".md", ".json", ".yaml", ".yml", ".toml"
)

# ================= LOAD CV DOCUMENTS =================
def load_cv_documents(data_folder="mydata"):
    documents = []
    for root, _, files in os.walk(data_folder):
        for file in files:
            file_path = os.path.join(root, file)
            ext = file.lower().split(".")[-1]

            try:
                if ext == "pdf":
                    loader = PyPDFLoader(file_path)
                    docs = loader.load()
                elif ext == "txt":
                    loader = TextLoader(file_path, encoding="utf-8")
                    docs = loader.load()
                else:
                    continue

                # Add file name info to each document
                for d in docs:
                    d.metadata["source"] = file_path
                documents.extend(docs)

            except Exception as e:
                print(f"⚠️ Skipping {file_path}: {e}")
    return documents


# ================= FETCH GITHUB REPO LIST =================
def fetch_repo_list():
    g = Github(GITHUB_TOKEN)
    user = g.get_user()

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    repo_results = [] # ✅ will hold processed repo info

    def process_repo(repo):
        """Fetch metadata + README for a single repo."""
        try:
            repo_info = []
            repo_info.append(f"===== REPO: {repo.name} =====\n")
            repo_info.append(f"Full Name: {repo.full_name}\n")
            repo_info.append(f"URL: {repo.html_url}\n")

            # ✅ Try to fetch README content
            try:
                readme = repo.get_readme()
                readme_content = readme.decoded_content.decode("utf-8")
                repo_info.append("\n--- README ---\n")
                repo_info.append(readme_content)
                repo_info.append("\n--- END README ---\n")
            except Exception:
                repo_info.append("\n(No README found)\n")

            repo_info.append("===== END OF REPO =====\n\n")
            return "".join(repo_info)

        except Exception as e:
            return f"⚠️ Failed to fetch {repo.full_name}: {e}\n"

    # 🔄 Run repos in parallel
    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = [executor.submit(process_repo, repo) for repo in user.get_repos()]
        for future in as_completed(futures):
            repo_results.append(future.result())

    # Write results to repos_overview.txt
    with open(OUTPUT_FILE, "w", encoding="utf-8") as out_file:
        for repo_text in repo_results:
            out_file.write(repo_text)

    return OUTPUT_FILE, repo_results

# ================= SAVE CV + GITHUB TO COMBINED =================
def save_combined(cv_docs, repo_results):
    if os.path.exists(COMBINED_FILE):
        print(f"✅ {COMBINED_FILE} already exists, skipping write.")
        return COMBINED_FILE

    with open(COMBINED_FILE, "w", encoding="utf-8") as out_file:
        out_file.write("===== CV DOCUMENTS =====\n\n")

        if not cv_docs:
            out_file.write("(⚠️ No CV documents found in mydata)\n\n")
        else:
            for doc in cv_docs:
                source = doc.metadata.get("source", "Unknown file")
                content = doc.page_content.strip()
                out_file.write(f"--- FILE: {source} ---\n")
                out_file.write(content + "\n\n")

        out_file.write("\n\n===== GITHUB REPOSITORIES =====\n\n")
        for repo_text in repo_results:
            out_file.write(repo_text)

    print(f"✅ Combined data saved to {COMBINED_FILE}")
    return COMBINED_FILE

# ================= MAIN =================
if __name__ == "__main__":
    print("🔄 Loading CV documents...")
    cv_docs = load_cv_documents()

    print("🔄 Fetching GitHub repositories...")
    repo_file, repo_results = fetch_repo_list()

    print("🔄 Saving combined data (CV + GitHub)...")
    combined = save_combined(cv_docs, repo_results)

    print("✅ All data stored successfully.")
