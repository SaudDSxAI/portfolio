import streamlit as st
from assistant import ResumeAssistant
import streamlit.components.v1 as components

# Streamlit Page Configuration
st.set_page_config(page_title="Saud Ahmad | AI & Robotics", page_icon="", layout="wide")

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
        .highlight-box {
            background: rgba(255, 255, 255, 0.08);
            border-left: 4px solid #c770f0;
            padding: 1rem;
            border-radius: 12px;
            margin-bottom: 1rem;
            box-shadow: 0 3px 8px rgba(199, 112, 240, 0.2);
        }
        .project-box {
            background: rgba(102, 252, 241, 0.08);
            border-left: 4px solid #66fcf1;
            padding: 1rem;
            border-radius: 12px;
            margin-bottom: 1rem;
            box-shadow: 0 3px 8px rgba(102, 252, 241, 0.2);
        }
        .section-title {
            font-size: 24px;
            font-weight: bold;
            color: #66fcf1;
            margin-top: 2rem;
            text-shadow: 1px 1px 3px rgba(102, 252, 241, 0.4);
        }
    </style>
""", unsafe_allow_html=True)

# ------------------ HEADER ------------------ #
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

# ------------------ PROFILE ------------------ #
st.markdown("<div class='section-title'> Profile</div>", unsafe_allow_html=True)
st.markdown("""
<div class='highlight-box'>
A passionate <strong>Robotics Engineer</strong> and <strong>Embedded Systems Developer</strong> with a foundation in <strong>Data Science</strong>.  
I specialize in building intelligent machines that connect software smarts with real-world hardware. From sensor fusion to smart agriculture robots, I thrive at the intersection of code and circuits.  

I’ve led a 40-member robotics team, delivering real-world projects from concept to deployment. Whether it’s autonomous navigation, laser weed removal, or mobile robot control, I bring both vision and execution to the table.

I’m especially excited by <strong>robotic automation, real-time embedded systems, and AI-powered systems for good</strong>.
</div>
""", unsafe_allow_html=True)

# ------------------ PROJECTS ------------------ #
st.markdown("<div class='section-title'>Projects & Experience</div>", unsafe_allow_html=True)

project_data = [
    {
        "title": "AgroBot: Autonomous Weed Removal Robot",
        "details": """
- Solar-powered robot for outdoor field navigation  
- Zig-zag navigation using GPS + IMU fusion  
- YOLOv8-based weed detection on Jetson Orin Nano  
- Laser-based weed removal with gantry + servo motors  
- Arduino Mega for hardware control  
- Final Year Capstone Project  
"""
    },
    {
        "title": "SmartFarmX: IoT-Driven Precision Agriculture",
        "details": """
- ESP32-based unit for environmental monitoring  
- Raspberry Pi robot with robotic arm for soil moisture analysis  
- Blynk dashboard for real-time control and alerts  
- Future plan: camera-based plant disease detection  
"""
    },
    {
        "title": "RoboFusion: Modular Robotics for Freelance Client",
        "details": """
- Custom multifunction robot: obstacle avoid, line follow, RC mode  
- Mobile app integration for remote control  
- Embedded systems design with real-time sensor interfacing  
"""
    },
    {
        "title": "RoboMini: Early-Stage Robotics Projects",
        "details": """
- PID-based line following and obstacle avoidance  
- Manual/RC-mode switching  
- Control tuning, testing, and iterative development  
"""
    }
]

# Create a two-column layout
col1, col2 = st.columns(2)

# Render each project inside an expander
for i, project in enumerate(project_data):
    with (col1 if i % 2 == 0 else col2):
        with st.expander(project["title"]):
            st.markdown(f"""
            <div class='project-box'>
            {project['details']}
            </div>
            """, unsafe_allow_html=True)

# ------------------ EDUCATION ------------------ #
st.markdown("<div class='section-title'> Education</div>", unsafe_allow_html=True)
st.markdown("""
<div class='highlight-box'>
<strong>Bachelor of Science in Data Science</strong><br>
<span style='color:#c3c3f2;'>Ghulam Ishaq Khan Institute of Engineering Sciences and Technology (GIKI)</span><br>
<em>Graduated: 2025</em>  

Specialized in Machine Learning, Computer Vision, Embedded Systems  
Final Year Project: AgroBot – An AI-powered autonomous robot for precision weed removal  
</div>
""", unsafe_allow_html=True)

# ------------------ SKILLS ------------------ #
st.markdown("""
<style>
.section-title {
    text-align: center;
    font-size: 30px;
    font-weight: bold;
    color: #c3c3f2;
    margin-bottom: 2rem;
    text-shadow: 1px 1px 2px #444;
}
.skill-card {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 15px;
    padding: 1rem;
    margin-bottom: 1rem;
    box-shadow: 0 4px 15px rgba(163, 135, 242, 0.2);
    transition: transform 0.2s ease;
}
.skill-card:hover {
    transform: scale(1.02);
    box-shadow: 0 6px 20px rgba(195, 195, 242, 0.4);
}
.skill-title {
    font-size: 18px;
    font-weight: 600;
    color: #ffffff;
    margin-bottom: 0.5rem;
    text-shadow: 1px 1px 2px #000;
}
.skill-list {
    color: #ddddff;
    font-size: 15px;
    line-height: 1.5;
}
</style>

<div class='section-title'>Skills</div>
""", unsafe_allow_html=True)

col1, col2 = st.columns(2)

with col1:
    st.markdown("""
    <div class='skill-card'>
        <div class='skill-title'>Programming Languages</div>
        <div class='skill-list'>C, C++ – Embedded/robotics<br>Python – AI, scripting, ROS2</div>
    </div>
    
    <div class='skill-card'>
        <div class='skill-title'>Embedded Systems</div>
        <div class='skill-list'>STM32 Nucleo<br>ESP32<br>Arduino Mega/Uno</div>
    </div>

    <div class='skill-card'>
        <div class='skill-title'>Microprocessors</div>
        <div class='skill-list'>Jetson Orin Nano / Nano<br>Raspberry Pi 3/5</div>
    </div>

    <div class='skill-card'>
        <div class='skill-title'>Robotics & AI</div>
        <div class='skill-list'>ROS2 – Sensor Fusion, Navigation<br>PID Control<br>YOLOv8 – Object Detection</div>
    </div>
    """, unsafe_allow_html=True)

with col2:
    st.markdown("""
    <div class='skill-card'>
        <div class='skill-title'>Sensors & Hardware</div>
        <div class='skill-list'>GPS NEO-8M<br>IMU<br>Encoders<br>Stepper & Servo Motors</div>
    </div>

    <div class='skill-card'>
        <div class='skill-title'>Data & Visualization</div>
        <div class='skill-list'>pandas, NumPy<br>Power BI, Tableau<br>Matplotlib, Seaborn</div>
    </div>

    <div class='skill-card'>
        <div class='skill-title'>Soft Skills</div>
        <div class='skill-list'>Team Leadership<br>Technical Mentoring<br>Problem Solving<br>Communication<br>Initiative & Ownership<br>Adaptability<br>Ethical Judgment</div>
    </div>
    """, unsafe_allow_html=True)

# ------------------ FOOTER ------------------ #
st.markdown("---")
st.markdown("<div style='text-align: center; color: #888;'>Built with using <strong>Streamlit</strong></div>", unsafe_allow_html=True)

# ------------------ CHATBOT ------------------ #
# Ensure state
if "assistant" not in st.session_state:
    st.session_state.assistant = ResumeAssistant()

if "chat_history" not in st.session_state:
    st.session_state.chat_history = []

# CSS + HTML for floating chat
chat_css = """
<style>
.chat-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #66fcf1;
  color: black;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  font-size: 28px;
  text-align: center;
  line-height: 60px;
  cursor: pointer;
  box-shadow: 0px 4px 10px rgba(0,0,0,0.3);
  z-index: 9999;
}
.chat-popup {
  display: none;
  position: fixed;
  bottom: 90px;
  right: 20px;
  width: 350px;
  max-height: 500px;
  border-radius: 15px;
  background: #1e1e2f;
  box-shadow: 0px 8px 20px rgba(0,0,0,0.4);
  z-index: 10000;
  overflow: hidden;
  flex-direction: column;
}
.chat-header {
  background: #66fcf1;
  color: black;
  padding: 10px;
  font-weight: bold;
  text-align: center;
}
.chat-body {
  padding: 10px;
  height: 350px;
  overflow-y: auto;
  color: white;
  font-size: 14px;
}
.chat-input {
  display: flex;
  border-top: 1px solid #444;
}
.chat-input input {
  flex: 1;
  padding: 10px;
  border: none;
  outline: none;
  font-size: 14px;
}
.chat-input button {
  background: #66fcf1;
  border: none;
  padding: 10px;
  cursor: pointer;
}
</style>
"""

chat_html = """
<div class="chat-button" onclick="toggleChat()">💬</div>

<div class="chat-popup" id="chatPopup" style="display:none;flex-direction:column;">
  <div class="chat-header">Chat with Saud</div>
  <div class="chat-body" id="chatBody"></div>
  <div class="chat-input">
    <input id="chatInput" type="text" placeholder="Type a message..." 
           onkeydown="if(event.key==='Enter'){sendMessage()}">
    <button onclick="sendMessage()">➤</button>
  </div>
</div>

<script>
function toggleChat() {
  var popup = document.getElementById("chatPopup");
  popup.style.display = (popup.style.display === "flex") ? "none" : "flex";
}

function sendMessage() {
  var input = document.getElementById("chatInput");
  var text = input.value.trim();
  if (text !== "") {
    var chatBody = document.getElementById("chatBody");
    chatBody.innerHTML += "<p><b>You:</b> " + text + "</p>";
    input.value = "";
    window.parent.postMessage({type: "streamlit_chat", text: text}, "*");
  }
}
</script>
"""

components.html(chat_css + chat_html, height=600)

# Hidden Streamlit input to receive JS messages
message = st.experimental_get_query_params().get("chat_msg", [""])[0]

if message:
    response = st.session_state.assistant.ask(message)
    st.session_state.chat_history.append({"user": message, "bot": response})

# Render past conversation into the chat body
chat_history_html = ""
for msg in st.session_state.chat_history:
    chat_history_html += f"<p><b>You:</b> {msg['user']}</p>"
    chat_history_html += f"<p><b>Saud:</b> {msg['bot']}</p>"

# Inject updated chat into frontend
components.html(
    f"<script>document.getElementById('chatBody').innerHTML = `{chat_history_html}`;</script>",
    height=0,
)