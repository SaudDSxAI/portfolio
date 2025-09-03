import streamlit as st
import time
import re
import json
from assistant import answer  # import the new answer() function

# --- Page Setup ---
st.set_page_config(page_title="Saud's Assistant", page_icon="🤖", layout="wide")

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
            background: linear-gradient(135deg, #E5E7EB, #F3F4F6); /* light gray gradient */
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
            background: linear-gradient(135deg, #F5E6D3, #EED6B7); /* light brown gradient */
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
        .chat-avatar {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: inline-block;
            text-align: center;
            line-height: 28px;
            font-size: 14px;
            margin-right: 6px;
        }
        .user-avatar { background: #A0522D; color: white; }
        .bot-avatar { background: #8B5C2A; color: white; }
    </style>
    """,
    unsafe_allow_html=True,
)

# --- Title ---
st.title("Hello! I'm Saud's AI Assistant ")
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
        # Always render as plain Markdown, no color, no design
        st.markdown(content, unsafe_allow_html=False)

# --- Chat History ---
for role, content in st.session_state["messages"]:
    if role == "user":
        st.markdown(
            f"<div class='user-msg'><span class='chat-avatar user-avatar'></span>{content}</div>",
            unsafe_allow_html=True,
        )
    elif role == "assistant":
        render_assistant(content)
    else:
        st.markdown(f"<div class='system-msg'>{content}</div>", unsafe_allow_html=True)

# --- Input Box ---
if prompt := st.chat_input("Type your question here..."):
    st.session_state["messages"].append(("user", prompt))
    st.markdown(
        f"<div class='user-msg'><span class='chat-avatar user-avatar'></span>{prompt}</div>",
        unsafe_allow_html=True,
    )

    with st.spinner("🤖 Thinking..."):
        final_response = answer(prompt)  # use assistant.py function

        # Show the full Markdown reply at once, no typing effect, no color/design
        st.markdown(final_response, unsafe_allow_html=False)

    st.session_state["messages"].append(("assistant", final_response))
