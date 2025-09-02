import streamlit as st
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain.chains import RetrievalQA
from langchain_community.document_loaders import PyPDFLoader


# ------------------ CHATBOT CLASS ------------------ #
class ResumeAssistant:
    def __init__(self, pdf_path="CV.pdf"):
        api_key = st.secrets["OPENAI_API_KEY"]

        if not api_key:
            raise ValueError("OPENAI_API_KEY not found in Streamlit secrets")

        # Load Resume
        loader = PyPDFLoader(pdf_path)
        documents = loader.load()

        # Split Docs
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )
        docs = text_splitter.split_documents(documents)

        # Create Vector DB
        embeddings = OpenAIEmbeddings(openai_api_key=api_key)
        vectorstore = FAISS.from_documents(docs, embeddings)

        # LLM
        llm = ChatOpenAI(
            openai_api_key=api_key,
            model="gpt-4o-mini",
            temperature=0
        )

        self.qa_chain = RetrievalQA.from_chain_type(
            llm=llm,
            retriever=vectorstore.as_retriever(),
            chain_type="stuff"
        )

        # System Prompt
        self.system_prompt = """
        You are an AI assistant that represents Saud, speaking on his behalf using only the information available in his resume.

        Guidelines:
        - Always greet politely if user just says hello.
        - Only answer questions that are in the resume.
        - Use bullet points for lists (skills, experiences, projects).
        - Always speak in first person as Saud.
        - Keep answers short, professional, and recruiter-friendly.
        - If unsure, say: "I don’t know based on my resume."
        """

    def ask(self, query: str) -> str:
        result = self.qa_chain.invoke(f"{self.system_prompt}\n{query}")
        return result["result"]


# ------------------ PAGE CONFIG ------------------ #
st.set_page_config(page_title="Saud Ahmad | AI & Robotics", page_icon="🤖", layout="wide")

# ------------------ CUSTOM STYLES ------------------ #
st.markdown("""
    <style>
        .stApp {
            background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
            color: #ffffff;
            font-family: 'Segoe UI', sans-serif;
        }
        h1, h2, h3, h4 {
            color: #66fcf1;
            text-shadow: 1px 1px 3px rgba(102, 252, 241, 0.4);
        }
        a {
            color: #c770f0;
            text-shadow: 1px 1px 2px rgba(199, 112, 240, 0.4);
        }
        /* Chatbot Button */
        #chatbot-button {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background-color: #66fcf1;
            color: black;
            border: none;
            border-radius: 50%;
            width: 60px;
            height: 60px;
            font-size: 28px;
            cursor: pointer;
            box-shadow: 0px 4px 8px rgba(0,0,0,0.3);
            z-index: 9999;
        }
        #chat-container {
            display: none;
            position: fixed;
            bottom: 90px;
            right: 20px;
            width: 350px;
            height: 450px;
            background: white;
            border-radius: 12px;
            box-shadow: 0px 4px 12px rgba(0,0,0,0.3);
            z-index: 9999;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        #chat-header {
            background: #203a43;
            color: white;
            padding: 10px;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        #close-btn {
            cursor: pointer;
        }
        #chat-body {
            flex: 1;
            padding: 10px;
            overflow-y: auto;
            background: #f9f9f9;
            color: black;
        }
        #chat-input {
            padding: 10px;
            border-top: 1px solid #ddd;
            background: white;
        }
    </style>
    <script>
        function toggleChat() {
            var chat = document.getElementById("chat-container");
            if (chat.style.display === "none" || chat.style.display === "") {
                chat.style.display = "flex";
            } else {
                chat.style.display = "none";
            }
        }
        function closeChat() {
            document.getElementById("chat-container").style.display = "none";
        }
    </script>
""", unsafe_allow_html=True)


# ------------------ PORTFOLIO HEADER ------------------ #
st.markdown("<h1 style='text-align: center;'> Saud Ahmad</h1>", unsafe_allow_html=True)
st.markdown("<h5 style='text-align: center; color: #c3c3f2;'>Robotics Engineer | Embedded Systems Developer</h3>", unsafe_allow_html=True)
st.markdown("""
<p style='text-align: center;'>
<a href='mailto:sauds6446@gmail.com'>sauds6446@gmail.com</a> &nbsp;|&nbsp; 
0346-2936273 &nbsp;|&nbsp; 
Kabal, Swat, Pakistan
</p>
<p style='text-align: center;'>
<a href='https://github.com/Saud0346'>GitHub</a> | 
<a href='https://linkedin.com/in/saud-ahmad1'>LinkedIn</a>
</p>
""", unsafe_allow_html=True)


# ------------------ CHATBOT UI ------------------ #
# Floating button
st.markdown('<button id="chatbot-button" onclick="toggleChat()">💬</button>', unsafe_allow_html=True)

# Chat container
st.markdown("""
<div id="chat-container">
  <div id="chat-header">
    Saud's Assistant 🤖
    <span id="close-btn" onclick="closeChat()">❌</span>
  </div>
  <div id="chat-body">
""", unsafe_allow_html=True)

# Session state for conversation
if "messages" not in st.session_state:
    st.session_state.messages = []
    st.session_state.assistant = ResumeAssistant()
    st.session_state.messages.append({"role": "assistant", "content": "Hi 👋 I’m Saud’s assistant. Ask me anything about my projects, skills, or experience."})

# Display chat messages
for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

# Chat input
if prompt := st.chat_input("Ask me anything..."):
    # User message
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    # Assistant response
    response = st.session_state.assistant.ask(prompt)
    st.session_state.messages.append({"role": "assistant", "content": response})
    with st.chat_message("assistant"):
        st.markdown(response)

st.markdown("</div></div>", unsafe_allow_html=True)
