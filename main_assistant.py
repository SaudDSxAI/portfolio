import os
import warnings
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain.memory import ConversationBufferMemory
from langchain.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from langchain_community.document_loaders import TextLoader
from load_embed import load_cv_documents   # reuse CV loader from first script

# ================= CONFIG =================
load_dotenv()

GITHUB_TOKEN   = os.getenv("GITHUB_TOKEN")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not GITHUB_TOKEN:
    raise ValueError("❌ GITHUB_TOKEN not found in .env file")
if not OPENAI_API_KEY:
    raise ValueError("❌ OPENAI_API_KEY not found in .env file")

warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=DeprecationWarning)

REPO_TXT_PATH = "mydata/repos_overview.txt"

# ================= LOAD CONTEXT =================
def load_context():
    """Load CV + repo overview into a single text string for context injection."""
    cv_docs = load_cv_documents()

    repo_text = ""
    if os.path.exists(REPO_TXT_PATH):
        repo_loader = TextLoader(REPO_TXT_PATH, encoding="utf-8")
        repo_docs = repo_loader.load()
        repo_text = "\n\n".join([d.page_content for d in repo_docs])
    else:
        repo_text = "(No repository overview file found.)"

    cv_text = "\n\n".join([d.page_content for d in cv_docs]) if cv_docs else "(No CV documents found.)"

    return f"### CV Data:\n{cv_text}\n\n### Repository Data:\n{repo_text}"

# ================= CHATBOT BUILD =================
_chatbot = None
_context_data = None


def build_chatbot():
    global _context_data
    _context_data = load_context()

    llm = ChatOpenAI(
        openai_api_key=OPENAI_API_KEY,
        temperature=0.3,
        model="gpt-4o-mini"
    )

    memory = ConversationBufferMemory(
        memory_key="chat_history",
        return_messages=True,
        output_key="answer"
    )

    system_prompt = SystemMessagePromptTemplate.from_template(
        """
You are an AI assistant representing Saud. Your role is to communicate professionally, politely, and persuasively on Saud's behalf. 
You have access to context about Saud’s skills, projects, experiences, achievements, and related information.

Guidelines for Responses:

1. **General Conversation:**
   - Respond politely and naturally to greetings or casual messages.
   - Keep the tone humble, professional, and approachable.
   - Do not mention Saud’s skills or achievements unless asked.

2. **Recruiter or Job-Focused Queries:**
   - If the user is a recruiter or asks about Saud’s abilities in a specific field, role, or technology, respond in a **persuasive and professional manner**.
   - Highlight **relevant skills, projects, achievements, and experiences** directly related to the user’s query.
   - Explain why Saud is capable of performing the role or task.
   - Include links to projects, repositories, portfolios, or publications whenever available.

3. **Field- or Topic-Specific Queries:**
   - Analyze the question to detect the relevant domain (e.g., AI, web development, etc.).
   - Present **only the relevant experiences, skills, and projects** related to that field.
   - Structure responses clearly using bullets, tables, or sections similar to a professional CV or resume.
   - Provide context on achievements or outcomes to make the information convincing.

4. **Profile-Specific Queries:**
   - If the user asks general questions like "tell me about yourself" or "what can you do," summarize Saud’s background, skills, and experience concisely and professionally.
   - Highlight **key strengths, projects, and unique accomplishments**.

5. **Tone and Style:**
   - Always professional, confident, yet approachable.
   - Be persuasive without exaggerating; remain truthful to the context.
   - Use Markdown for headings, bullets, or tables when appropriate.
   - Avoid dumping all information at once; provide what is relevant to the query.

6. **Context Usage:**
   - Only provide information that exists in the context.
   - If something is not present in the context, politely indicate that it is unavailable.

Context:
{context}
"""
    )

    human_prompt = HumanMessagePromptTemplate.from_template("{question}")
    chat_prompt = ChatPromptTemplate.from_messages([system_prompt, human_prompt])

    def chatbot(question: str) -> str:
        try:
            messages = chat_prompt.format_messages(context=_context_data, question=question)
            response = llm.invoke(messages)
            return response.content
        except Exception as e:
            return f"⚠️ Error: {e}"

    return chatbot


def get_chatbot():
    global _chatbot
    if _chatbot is None:
        _chatbot = build_chatbot()
    return _chatbot


def answer(question: str) -> str:
    chatbot = get_chatbot()
    return chatbot(question)

