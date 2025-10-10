import streamlit as st
import json
from load_embed import run_pipeline
from pathlib import Path
import base64

# --- Page setup ---
st.set_page_config(page_title="Saud's Assistant", page_icon="🤖", layout="wide")

# --- Initialize assistant once ---
if "qa_chain" not in st.session_state:
    st.session_state["qa_chain"] = run_pipeline(init_only=True)
    st.session_state["messages"] = []

qa_chain = st.session_state["qa_chain"]

# --- Convert old message format (tuple → dict) if needed ---
for i, msg in enumerate(st.session_state.get("messages", [])):
    if isinstance(msg, tuple):
        role, content = msg
        st.session_state["messages"][i] = {"role": role, "content": content}

# --- Display image ---
def image_to_base64(image_path):
    with open(image_path, "rb") as img:
        return base64.b64encode(img.read()).decode()

image_path = Path(__file__).parent / "saud.jpeg"
if image_path.exists():
    img_base64 = image_to_base64(image_path)
    st.markdown(
        f"""
        <div style="display: flex; justify-content: center; margin: 10px 0;">
            <img src="data:image/jpeg;base64,{img_base64}" 
                 style="width: 160px; height: 200px; border-radius: 50%; object-fit: cover; object-position: center 15%;">
        </div>
        """,
        unsafe_allow_html=True,
    )

# --- Titles ---
st.markdown(
    "<h3 style='text-align: center;'>Hello! I'm Saud's AI Assistant </h3>",
    unsafe_allow_html=True
)
st.markdown(
    "<h6 style='text-align: center;'>Ask me anything about Saud's resume and projects!</h6>",
    unsafe_allow_html=True
)

# --- Render previous chat messages ---
for message in st.session_state["messages"]:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# --- Chat input box ---
if prompt := st.chat_input("Type your question..."):
    # Show user message instantly
    st.session_state["messages"].append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    # Generate assistant response
    with st.chat_message("assistant"):
        with st.spinner("Thinking..."):
            try:
                result = qa_chain.invoke({"query": prompt})
                response = result["result"] if isinstance(result, dict) else result
            except Exception as e:
                response = f"⚠️ Error: {e}"
            st.markdown(response)

    # Store assistant reply
    st.session_state["messages"].append({"role": "assistant", "content": response})
