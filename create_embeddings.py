import os
from dotenv import load_dotenv
from github import Github
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
import chromadb
from chromadb.config import Settings
from openai import OpenAI
from langchain.text_splitter import RecursiveCharacterTextSplitter
import pdfplumber
from docx import Document

# ================= CONFIG =================
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_USERNAME = os.getenv("GITHUB_USERNAME")  # Your GitHub username

DATA_DIR = Path("data")
CHROMA_DIR = Path("chroma_db")
TEMP_DIR = Path("temp_github")

if not OPENAI_API_KEY or not GITHUB_TOKEN:
    raise ValueError("❌ Missing OPENAI_API_KEY or GITHUB_TOKEN in .env")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(CHROMA_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)

# Initialize OpenAI client directly
openai_client = OpenAI(api_key=OPENAI_API_KEY)

def get_embeddings(texts):
    """Get embeddings using OpenAI directly"""
    response = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=texts
    )
    return [item.embedding for item in response.data]

# Initialize ChromaDB client
chroma_client = chromadb.PersistentClient(path=str(CHROMA_DIR))

# Text splitter for chunking
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    length_function=len,
)


# ================= STEP 1: Load CV and Data Files =================
def extract_text_from_pdf(file_path):
    """Extract text from PDF using pdfplumber"""
    text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        print(f"  ⚠️ Error extracting PDF {file_path}: {e}")
    return text


def extract_text_from_docx(file_path):
    """Extract text from DOCX using python-docx"""
    text = ""
    try:
        doc = Document(file_path)
        for para in doc.paragraphs:
            text += para.text + "\n"
        # Also extract text from tables
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    text += cell.text + " "
                text += "\n"
    except Exception as e:
        print(f"  ⚠️ Error extracting DOCX {file_path}: {e}")
    return text


def extract_text_from_doc(file_path):
    """Extract text from DOC using textract or antiword fallback"""
    text = ""
    try:
        # Try using textract
        import textract
        text = textract.process(file_path).decode('utf-8')
    except ImportError:
        print(f"  ⚠️ textract not installed. Install with: pip install textract")
        print(f"  ⚠️ Skipping .doc file: {file_path}")
    except Exception as e:
        print(f"  ⚠️ Error extracting DOC {file_path}: {e}")
    return text


def load_cv_files():
    """Load all files from data folder (supports PDF, DOCX, DOC, TXT, MD)"""
    print("\n📂 Loading files from data folder...")
    files_data = []
    
    if not DATA_DIR.exists():
        print("⚠️ Data folder not found!")
        return files_data
    
    # Supported extensions
    supported_extensions = [".txt", ".md", ".pdf", ".docx", ".doc"]
    
    for file_path in DATA_DIR.glob("*"):
        if file_path.is_file() and file_path.suffix.lower() in supported_extensions:
            print(f"  📄 Found: {file_path.name}")
            try:
                content = ""
                suffix = file_path.suffix.lower()
                
                if suffix in [".txt", ".md"]:
                    with open(file_path, "r", encoding="utf-8") as f:
                        content = f.read()
                
                elif suffix == ".pdf":
                    content = extract_text_from_pdf(file_path)
                
                elif suffix == ".docx":
                    content = extract_text_from_docx(file_path)
                
                elif suffix == ".doc":
                    content = extract_text_from_doc(file_path)
                
                # Only add if we got content
                if content.strip():
                    files_data.append({
                        "filename": file_path.name,
                        "content": content,
                        "path": str(file_path)
                    })
                    print(f"    ✅ Extracted {len(content)} characters")
                else:
                    print(f"    ⚠️ No content extracted from {file_path.name}")
                    
            except Exception as e:
                print(f"  ⚠️ Error reading {file_path.name}: {e}")
    
    print(f"✅ Loaded {len(files_data)} files from data folder")
    return files_data


# ================= STEP 2: Fetch GitHub Repositories =================
def fetch_github_repos():
    """Fetch all repositories from GitHub"""
    print("\n🔍 Fetching GitHub repositories...")
    g = Github(GITHUB_TOKEN)
    
    try:
        if GITHUB_USERNAME:
            user = g.get_user(GITHUB_USERNAME)
        else:
            user = g.get_user()
        
        repos_data = []
        
        def process_repo(repo):
            try:
                print(f"  📦 Processing: {repo.name}")
                repo_info = {
                    "name": repo.name,
                    "url": repo.html_url,
                    "description": repo.description or "No description",
                    "language": repo.language or "Not specified",
                    "stars": repo.stargazers_count,
                    "content": []
                }
                
                # Get README
                try:
                    readme = repo.get_readme()
                    readme_content = readme.decoded_content.decode("utf-8")
                    repo_info["content"].append(f"README:\n{readme_content}")
                except Exception:
                    repo_info["content"].append("README: Not available")
                
                # Combine all info
                full_content = f"""
Repository: {repo_info['name']}
URL: {repo_info['url']}
Description: {repo_info['description']}
Language: {repo_info['language']}
Stars: {repo_info['stars']}

{chr(10).join(repo_info['content'])}
"""
                
                # Save to temp file (for large data)
                temp_file = TEMP_DIR / f"{repo.name}.txt"
                with open(temp_file, "w", encoding="utf-8") as f:
                    f.write(full_content)
                
                return {
                    "name": repo_info['name'],
                    "content": full_content,
                    "temp_file": str(temp_file)
                }
                
            except Exception as e:
                print(f"  ⚠️ Error processing {repo.name}: {e}")
                return None
        
        # Fetch repos in parallel
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(process_repo, repo) for repo in user.get_repos()]
            for future in as_completed(futures):
                result = future.result()
                if result:
                    repos_data.append(result)
        
        print(f"✅ Fetched {len(repos_data)} repositories")
        return repos_data
        
    except Exception as e:
        print(f"❌ Error fetching GitHub repos: {e}")
        return []


# ================= STEP 3: Create CV Embeddings =================
def create_cv_embeddings(files_data):
    """Create or update CV collection in ChromaDB"""
    print("\n🔨 Creating CV embeddings...")
    
    # Get or create collection
    try:
        cv_collection = chroma_client.get_collection("cv_collection")
        print("  📦 Found existing cv_collection")
    except:
        cv_collection = chroma_client.create_collection(
            name="cv_collection",
            metadata={"description": "CV and personal data"}
        )
        print("  🆕 Created new cv_collection")
    
    # Get existing files in collection
    existing_metadata = cv_collection.get()
    existing_files = set()
    if existing_metadata and existing_metadata['metadatas']:
        existing_files = {meta['filename'] for meta in existing_metadata['metadatas']}
    
    print(f"  📋 Existing files in collection: {len(existing_files)}")
    
    # Filter new files
    new_files = [f for f in files_data if f['filename'] not in existing_files]
    
    if not new_files:
        print("  ⏭️  No new files to embed")
        return
    
    print(f"  🆕 Found {len(new_files)} new files to embed")
    
    def process_file(file_data):
        filename = file_data['filename']
        print(f"  ✨ Embedding {filename}...")
        
        # Split content into chunks
        chunks = text_splitter.split_text(file_data['content'])
        
        # Create embeddings using OpenAI directly
        embeddings = get_embeddings(chunks)
        
        # Prepare data
        ids = [f"{filename}_{i}" for i in range(len(chunks))]
        metadatas = [{"filename": filename, "chunk_index": i} for i in range(len(chunks))]
        
        return {
            'embeddings': embeddings,
            'documents': chunks,
            'metadatas': metadatas,
            'ids': ids,
            'filename': filename,
            'chunk_count': len(chunks)
        }
    
    # Process files in parallel
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = [executor.submit(process_file, file_data) for file_data in new_files]
        
        for future in as_completed(futures):
            result = future.result()
            
            # Add to collection
            cv_collection.add(
                embeddings=result['embeddings'],
                documents=result['documents'],
                metadatas=result['metadatas'],
                ids=result['ids']
            )
            
            print(f"    ✅ Added {result['chunk_count']} chunks from {result['filename']}")
    
    print(f"✅ CV embeddings complete! Added {len(new_files)} new files")


# ================= STEP 4: Create GitHub Embeddings =================
def create_github_embeddings(repos_data):
    """Create or update GitHub collection in ChromaDB"""
    print("\n🔨 Creating GitHub embeddings...")
    
    # Get or create collection
    try:
        github_collection = chroma_client.get_collection("github_collection")
        print("  📦 Found existing github_collection")
    except:
        github_collection = chroma_client.create_collection(
            name="github_collection",
            metadata={"description": "GitHub repositories data"}
        )
        print("  🆕 Created new github_collection")
    
    # Get existing repos in collection
    existing_metadata = github_collection.get()
    existing_repos = set()
    if existing_metadata and existing_metadata['metadatas']:
        existing_repos = {meta['repo_name'] for meta in existing_metadata['metadatas']}
    
    print(f"  📋 Existing repos in collection: {len(existing_repos)}")
    
    # Filter new repos
    new_repos = [r for r in repos_data if r['name'] not in existing_repos]
    
    if not new_repos:
        print("  ⏭️  No new repos to embed")
        return
    
    print(f"  🆕 Found {len(new_repos)} new repos to embed")
    
    def process_repo(repo_data):
        repo_name = repo_data['name']
        print(f"  ✨ Embedding {repo_name}...")
        
        # Split content into chunks
        chunks = text_splitter.split_text(repo_data['content'])
        
        # Create embeddings using OpenAI directly
        embeddings = get_embeddings(chunks)
        
        # Prepare data
        ids = [f"{repo_name}_{i}" for i in range(len(chunks))]
        metadatas = [{"repo_name": repo_name, "chunk_index": i} for i in range(len(chunks))]
        
        return {
            'embeddings': embeddings,
            'documents': chunks,
            'metadatas': metadatas,
            'ids': ids,
            'repo_name': repo_name,
            'chunk_count': len(chunks)
        }
    
    # Process repos in parallel
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = [executor.submit(process_repo, repo_data) for repo_data in new_repos]
        
        for future in as_completed(futures):
            result = future.result()
            
            # Add to collection
            github_collection.add(
                embeddings=result['embeddings'],
                documents=result['documents'],
                metadatas=result['metadatas'],
                ids=result['ids']
            )
            
            print(f"    ✅ Added {result['chunk_count']} chunks from {result['repo_name']}")
    
    print(f"✅ GitHub embeddings complete! Added {len(new_repos)} new repos")


# ================= MAIN PIPELINE =================
def main():
    print("=" * 60)
    print("🚀 EMBEDDINGS GENERATION PIPELINE (PARALLEL MODE)")
    print("=" * 60)
    
    # Step 1 & 2: Load CV files and GitHub repos IN PARALLEL
    print("\n⚡ Loading CV files and GitHub repos in parallel...")
    
    cv_files = []
    github_repos = []
    
    with ThreadPoolExecutor(max_workers=2) as executor:
        cv_future = executor.submit(load_cv_files)
        github_future = executor.submit(fetch_github_repos)
        
        cv_files = cv_future.result()
        github_repos = github_future.result()
    
    # Step 3 & 4: Create embeddings IN PARALLEL
    print("\n⚡ Creating CV and GitHub embeddings in parallel...")
    
    with ThreadPoolExecutor(max_workers=2) as executor:
        cv_embedding_future = None
        github_embedding_future = None
        
        if cv_files:
            cv_embedding_future = executor.submit(create_cv_embeddings, cv_files)
        else:
            print("\n⚠️ No CV files found to embed")
        
        if github_repos:
            github_embedding_future = executor.submit(create_github_embeddings, github_repos)
        else:
            print("\n⚠️ No GitHub repos found to embed")
        
        # Wait for both to complete
        if cv_embedding_future:
            cv_embedding_future.result()
        if github_embedding_future:
            github_embedding_future.result()
    
    # Cleanup temp files
    print("\n🧹 Cleaning up temp files...")
    for temp_file in TEMP_DIR.glob("*.txt"):
        temp_file.unlink()
    
    print("\n" + "=" * 60)
    print("✅ EMBEDDINGS PIPELINE COMPLETE!")
    print("=" * 60)
    print(f"📊 Collections saved in: {CHROMA_DIR}")
    print("  - cv_collection")
    print("  - github_collection")


if __name__ == "__main__":
    main()