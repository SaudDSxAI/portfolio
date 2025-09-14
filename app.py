import streamlit as st
import re
import json
from main_assistant import answer, preload 

# --- Page Setup ---
st.set_page_config(page_title="Saud's Assistant", page_icon="🤖", layout="wide")

# --- Preload summary on app startup ---
if "preloaded" not in st.session_state:
    with st.spinner("🔄 Loading Saud's data... Please wait."):
        preload()  # warm up summary cache
    st.session_state["preloaded"] = True

# --- Sidebar Controls ---
st.sidebar.title("⚙️ Controls")

if st.sidebar.button("🗑️ Clear Chat"):
    st.session_state["messages"] = []

if st.sidebar.button("💾 Export Chat"):
    if "messages" in st.session_state and st.session_state["messages"]:
        export_name = "chat_history.json"
        with open(export_name, "w", encoding="utf-8") as f:
            json.dump(st.session_state["messages"], f, indent=2, ensure_ascii=False)
        st.sidebar.success(f"Exported → {export_name}")
    else:
        st.sidebar.warning("No chat history to export!")

# --- Custom CSS ---
st.markdown(
    """
    <style>
        .user-msg {
            background: linear-gradient(135deg, #E5E7EB, #F3F4F6);
            color: #2D2D2D;
            padding: 12px 16px;
            border-radius: 16px;
            margin: 8px 0;
            text-align: right;
            box-shadow: 0 2px 6px rgba(0,0,0,0.08);
            font-size: 1rem;
            line-height: 1.4;
        }
        .bot-msg {
            background: linear-gradient(135deg, #F5E6D3, #EED6B7);
            color: #2D2D2D;
            padding: 12px 16px;
            border-radius: 16px;
            margin: 8px 0;
            text-align: left;
            box-shadow: 0 2px 6px rgba(0,0,0,0.06);
            font-size: 1rem;
            line-height: 1.4;
        }
        .system-msg {
            color: #888;
            font-size: 0.85rem;
            margin: 6px 0;
            text-align: center;
            font-style: italic;
        }
    </style>
    """,
    unsafe_allow_html=True,
)

# --- Title ---
st.title("Hello! I'm Saud's AI Assistant 🤖")
st.markdown("Ask me anything about Saud's resume!")

# --- Session State ---
if "messages" not in st.session_state:
    st.session_state["messages"] = []

# --- Helper: render assistant safely ---
def render_assistant(content: str):
    code_block = re.search(r"```(\w+)?\n([\s\S]+?)```", content)
    if code_block:
        lang = code_block.group(1) or "text"
        code_text = code_block.group(2)
        st.code(code_text, language=lang)
    elif content.strip().startswith("#include") or "int main" in content:
        st.code(content, language="cpp")
    else:
        st.markdown(content, unsafe_allow_html=False)

# --- Chat History ---
for role, content in st.session_state["messages"]:
    if role == "user":
        st.markdown(f"<div class='user-msg'>{content}</div>", unsafe_allow_html=True)
    elif role == "assistant":
        render_assistant(content)
    else:
        st.markdown(f"<div class='system-msg'>{content}</div>", unsafe_allow_html=True)

# --- Input Box ---
if prompt := st.chat_input("Type your question here..."):
    st.session_state["messages"].append(("user", prompt))
    st.markdown(f"<div class='user-msg'>{prompt}</div>", unsafe_allow_html=True)

    with st.spinner("🤖 Thinking..."):
        final_response = answer(prompt)

    render_assistant(final_response)
    st.session_state["messages"].append(("assistant", final_response))
