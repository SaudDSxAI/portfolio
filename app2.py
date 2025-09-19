import streamlit as st
import json
from load_embed import run_pipeline

# Initialize assistant once
if "qa_chain" not in st.session_state:
    st.session_state["qa_chain"] = run_pipeline(init_only=True)  # only build pipeline, no CLI loop
    st.session_state["messages"] = []

qa_chain = st.session_state["qa_chain"]

st.set_page_config(page_title="Saud's Assistant", page_icon="🤖", layout="wide")

st.title("Hello! I'm Saud's AI Assistant 🤖")
st.markdown("Ask me anything about Saud's resume and projects!")

# Sidebar controls
st.sidebar.title("⚙️ Controls")
if st.sidebar.button("🗑️ Clear Chat"):
    st.session_state["messages"] = []
if st.sidebar.button("💾 Export Chat"):
    if st.session_state["messages"]:
        with open("chat_history.json", "w", encoding="utf-8") as f:
            json.dump(st.session_state["messages"], f, indent=2, ensure_ascii=False)
        st.sidebar.success("Exported → chat_history.json")
    else:
        st.sidebar.warning("No history!")

# Render chat history
for role, content in st.session_state["messages"]:
    if role == "user":
        st.markdown(f"** You:** {content}")
    else:
        st.markdown(f"** Assistant:** {content}")

# Input box
if prompt := st.chat_input("Type your question..."):
    st.session_state["messages"].append(("user", prompt))
    with st.spinner(" Thinking..."):
        try:
            result = qa_chain.invoke({"query": prompt})
            response = result["result"] if isinstance(result, dict) else result
        except Exception as e:
            response = f"⚠️ Error: {e}"
    st.markdown(f"** Assistant:** {response}")
    st.session_state["messages"].append(("assistant", response))
