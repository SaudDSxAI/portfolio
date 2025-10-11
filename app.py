import streamlit as st
from pathlib import Path
import base64
from load_embed import run_pipeline

# --- Page setup ---
st.set_page_config(page_title="Saud’s Assistant", layout="wide")

# --- Custom CSS (Elegant Slate Theme) ---
st.markdown("""
    <style>
        /* Global Aesthetic */
        .stApp {
            background: linear-gradient(160deg, #e6ebf0 0%, #f5f7fa 100%);
            font-family: 'Inter', sans-serif;
            color: #222;
        }

        .block-container {
            padding-top: 2.5rem;
            padding-bottom: 3rem;
        }

        /* Profile Section */
        .profile-container {
            display: flex;
            justify-content: center;
            margin: 25px 0 10px 0;
        }

        .profile-pic {
            width: 160px;
            height: 160px;
            border-radius: 50%;
            border: 1px solid #d4d7dd;
            box-shadow: 0 8px 18px rgba(0, 0, 0, 0.08);
            object-fit: cover;
            object-position: center 15%;
        }

        /* Title Section */
        .main-title {
            text-align: center;
            font-size: 1.65em;
            font-weight: 600;
            color: #1a1a1a;
            margin-top: 10px;
            letter-spacing: -0.3px;
        }
        .sub-title {
            text-align: center;
            font-size: 0.98em;
            color: #4b5563;
            margin-bottom: 35px;
            font-weight: 400;
        }

        /* Chat Section */
        div[data-testid="stChatMessage"] {
            background-color: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 16px 20px;
            margin-bottom: 14px;
            box-shadow: 0 6px 12px rgba(0,0,0,0.04);
            color: #1e1e1e !important;
        }

        /* Assistant Message */
        div[data-testid="stChatMessage"][data-testid="assistant"] {
            background-color: #f9fafc;
            border-left: 4px solid #2563EB;
        }

        /* User Message */
        div[data-testid="stChatMessage"][data-testid="user"] {
            background-color: #fefefe;
            border-left: 4px solid #D97706;
        }

        /* Text inside chat messages */
        div[data-testid="stChatMessage"] p,
        div[data-testid="stChatMessage"] span,
        div[data-testid="stChatMessage"] div {
            color: #1e293b !important;   /* deep gray-blue for smooth readability */
            font-size: 1.02em;
            line-height: 1.6;
        }

        /* Chat Input */
        .stChatInput textarea {
            background-color: #ffffff !important;
            color: #1f2937 !important;
            border-radius: 10px !important;
            border: 1px solid #d1d5db !important;
            box-shadow: 0 3px 6px rgba(0,0,0,0.05);
            font-family: 'Inter', sans-serif !important;
            font-size: 1.05em !important;
        }

        /* Scrollbar */
        ::-webkit-scrollbar {
            width: 8px;
        }
        ::-webkit-scrollbar-thumb {
            background: #b0b8c1;
            border-radius: 10px;
        }

        /* Hover & Fade */
        div[data-testid="stChatMessage"]:hover {
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
            transform: translateY(-1px);
            transition: 0.2s ease-in-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(4px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .assistant-response {
            animation: fadeIn 0.6s ease-out;
        }

        /* Hide default emojis */
        [data-testid="stChatMessageAvatar"] {
            display: none !important;
        }
    </style>
""", unsafe_allow_html=True)


# --- Initialize assistant ---
if "qa_chain" not in st.session_state:
    st.session_state["qa_chain"] = run_pipeline(init_only=True)
    st.session_state["messages"] = []

qa_chain = st.session_state["qa_chain"]

# --- Display Profile Image ---
def image_to_base64(image_path):
    with open(image_path, "rb") as img:
        return base64.b64encode(img.read()).decode()

image_path = Path(__file__).parent / "saud.jpeg"
if image_path.exists():
    img_base64 = image_to_base64(image_path)
    st.markdown(f"""
        <div class="profile-container">
            <img src="data:image/jpeg;base64,{img_base64}" class="profile-pic">
        </div>
    """, unsafe_allow_html=True)

# --- Titles ---
st.markdown("<div class='main-title'>Saud’s AI Assistant</div>", unsafe_allow_html=True)
st.markdown("<div class='sub-title'>Ask about Saud’s background, skills, and portfolio projects.</div>", unsafe_allow_html=True)

# --- Chat Container ---
chat_container = st.container()

# --- Render Messages ---
with chat_container:
    for message in st.session_state["messages"]:
        with st.chat_message(message["role"]):
            if message["role"] == "assistant":
                st.markdown(f"<div class='assistant-response'>{message['content']}</div>", unsafe_allow_html=True)
            else:
                st.markdown(message["content"])

# --- Chat input ---
if prompt := st.chat_input("Type your question..."):
    st.session_state["messages"].append({"role": "user", "content": prompt})
    
    with st.chat_message("user"):
        st.markdown(prompt)

    with st.chat_message("assistant"):
        message_placeholder = st.empty()
        message_placeholder.markdown("💭 *Thinking...*")

        try:
            result = qa_chain.invoke({"query": prompt})
            response = result["result"] if isinstance(result, dict) else result
        except Exception as e:
            response = f"⚠️ Error: {e}"

        message_placeholder.markdown(response)

    st.session_state["messages"].append({"role": "assistant", "content": response})
