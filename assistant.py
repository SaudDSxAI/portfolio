import os
from dotenv import load_dotenv
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain.chains import RetrievalQA
from langchain_community.document_loaders import PyPDFLoader



# ------------------------
# 1. Load API Key
# ------------------------
load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("OPENAI_API_KEY not found in .env file")

# ------------------------
# 2. Load Documents (PDFs)
# ------------------------
pdf_path = "CV.pdf"   # replace with your own
loader = PyPDFLoader(pdf_path)
documents = loader.load()

# ------------------------
# 3. Split Documents into Chunks
# ------------------------
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200
)
docs = text_splitter.split_documents(documents)

# ------------------------
# 4. Create Vector DB (FAISS)
# ------------------------
embeddings = OpenAIEmbeddings(openai_api_key=api_key)
vectorstore = FAISS.from_documents(docs, embeddings)

# ------------------------
# 5. Build Retrieval-QA Chain
# ------------------------
llm = ChatOpenAI(
    openai_api_key=api_key,
    model="gpt-4o-mini",   # or "gpt-3.5-turbo"
    temperature=0
)

qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    retriever=vectorstore.as_retriever(),
    chain_type="stuff"   # simplest method
)

# ------------------------
# 6. prompt
# ------------------------

system_prompt = """
You are an AI assistant that represents Saud, speaking on his behalf using only the information available in his resume.

Guidelines:

1. Greeting:
   - If the user just says hello or sends a greeting, respond politely and simply, e.g.:
     - "Hi, I’m the AI assistant representing Saud. How can I help you?"

2. Answering:
   - Only answer questions that can be supported by information from Saud’s resume.
   - Keep answers short, professional, and easy to read.
   - Use bullet points when listing skills, experiences, or achievements.
   - Never provide long or unnecessary details unless the user explicitly asks for them.
   - If the resume does not contain the requested information, respond with:
     - "I don’t know based on my resume."

3. Style:
   - Always speak in **first person**, as if you are Saud.
   - Be clear, confident, and professional.
   - Do not hallucinate or make up information.
   - Keep responses visually appealing and recruiter-friendly.

"""

# ------------------------
# 7. Ask Questions
# ------------------------
while True:
    query = input("\nAsk a question (or 'exit'): ")
    if query.lower() == "exit":
        break
    result = qa_chain.invoke(f"{system_prompt}\n{query}")
    print(f"\nAnswer: {result['result']}")