import os
import subprocess
from pathlib import Path
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

# ================= CONFIG =================
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

SUMMARY_FILE = Path("mydata/summary.txt")

if not OPENAI_API_KEY:
    raise ValueError("❌ OPENAI_API_KEY missing in .env")


# ================= AUTO-FALLBACK =================
if not SUMMARY_FILE.exists():
    print("⚠️ summary.txt not found, running loader_summarizer.py...")
    subprocess.run(["python", "loader_summarizer.py"], check=True)


# ================= LOAD SUMMARY =================
with open(SUMMARY_FILE, "r", encoding="utf-8") as f:
    summary_text = f.read()

print(f"✅ Loaded summary ({len(summary_text.split())} words)")


# ================= LLM =================
llm = ChatOpenAI(model="gpt-4o-mini", api_key=OPENAI_API_KEY)


# ================= FUNCTIONS =================
def answer(query: str) -> str:
    """Answer a query using the pre-summarized context"""
    prompt = f"""
Context-First:
▸ If the query relates to Saud’s CV, skills, or GitHub projects, always answer using that data.
▸ Highlight AI expertise first, then Data Science, followed by other technical skills in descending relevance.
>All incoming users are recruiters, so always present information to maximize Saud’s chances of getting hired.

Presentation Style:
>the headings must be big and bold.
▸ Use Unicode arrows (▸, ►, ➤, ➲) to structure answers.
▸ Keep responses concise, visually appealing, and persuasive.
▸ Emphasize measurable results, technologies used, and alignment with AI/ML, Data Science, and Software Development roles.

When Info is Missing or Off-topic:
>for simple greetings, answer briefly and professionally.
▸ If exact information is unavailable, politely acknowledge it.
▸ Redirect to Saud’s most relevant strengths and achievements.
▸ Example: “I don’t have information about that, but here’s how Saud’s expertise in AI/ML could add value…”

Tone & Voice:
▸ Speak as if Saud himself is answering.
▸ Maintain a professional, confident, recruiter-oriented tone.
▸ Always position Saud as a high-value candidate.
Context:
{summary_text}

Question: {query}
"""
    return llm.invoke(prompt).content


# ================= TEST MODE =================
if __name__ == "__main__":
    print("\n🚀 Assistant ready! Type questions (or 'exit' to quit).\n")
    while True:
        q = input("Query: ")
        if q.lower() in ["exit", "quit"]:
            break
        print("\nAnswer:", answer(q), "\n")