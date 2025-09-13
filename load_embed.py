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

OUTPUT_FILE = "mydata/repos_overview.txt"
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
                elif ext == "txt":
                    loader = TextLoader(file_path, encoding="utf-8")
                else:
                    continue
                documents.extend(loader.load())
            except Exception as e:
                print(f"⚠️ Skipping {file_path}: {e}")
    return documents

# ================= FETCH GITHUB REPO LIST =================
def fetch_repo_list():
    g = Github(GITHUB_TOKEN)
    user = g.get_user()

    os.makedirs("mydata", exist_ok=True)
    repo_names = []   # ✅ list to store repo full names
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
            return repo.full_name, "".join(repo_info)

        except Exception as e:
            return repo.full_name, f"⚠️ Failed to fetch {repo.full_name}: {e}\n"

    # 🔄 Run repos in parallel
    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = [executor.submit(process_repo, repo) for repo in user.get_repos()]
        for future in as_completed(futures):
            repo_full_name, repo_text = future.result()
            repo_names.append(repo_full_name)
            repo_results.append(repo_text)

    # Write results to file (sequentially after all futures complete)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as out_file:
        for repo_text in repo_results:
            out_file.write(repo_text)

    return OUTPUT_FILE, repo_names

# ================= FETCH DETAILED REPO INFO =================
def fetch_repo_details(repo_full_name):
    g = Github(GITHUB_TOKEN)
    repo = g.get_repo(repo_full_name)
    output_file = f"mydata/repo_details/{repo.name}.txt"

    os.makedirs("mydata/repo_details", exist_ok=True)

    with open(output_file, "w", encoding="utf-8") as out_file:
        # Basic Info
        out_file.write(f"===== REPO: {repo.name} =====\n")
        out_file.write(f"Description: {repo.description}\n")
        out_file.write(f"Language: {repo.language}\n")
        out_file.write(f"Stars: {repo.stargazers_count}\n")
        out_file.write(f"Forks: {repo.forks_count}\n")
        out_file.write(f"URL: {repo.html_url}\n\n")

        # README
        try:
            readme = repo.get_readme()
            readme_content = base64.b64decode(readme.content).decode("utf-8", errors="ignore")
            out_file.write("===== README =====\n" + readme_content + "\n\n")
        except Exception:
            out_file.write("No README found\n\n")

        # Files
        out_file.write("===== CODE FILES =====\n")
        contents = repo.get_contents("")
        while contents:
            file_content = contents.pop(0)
            if file_content.type == "dir":
                contents.extend(repo.get_contents(file_content.path))
            else:
                if file_content.size > MAX_FILE_SIZE:
                    continue
                if not file_content.path.endswith(ALLOWED_EXTENSIONS):
                    continue
                try:
                    decoded = base64.b64decode(file_content.content).decode("utf-8", errors="ignore")
                    out_file.write(f"\n--- FILE: {file_content.path} ---\n{decoded}\n")
                except Exception:
                    out_file.write(f"{file_content.path} → could not decode\n")

        out_file.write("\n===== END OF REPO =====\n")

    return output_file

# ================= MAIN =================
if __name__ == "__main__":
    print("🔄 Loading CV documents...")
    cv_docs = load_cv_documents()

    print("🔄 Fetching GitHub repositories...")
    repo_file, repo_names = fetch_repo_list()

    print("✅ Setup complete. Repo information saved.")
    print(repo_names)