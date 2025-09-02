import streamlit as st
import streamlit.components.v1 as components

# ------------------ PAGE CONFIG ------------------ #
st.set_page_config(page_title="Saud Ahmad | AI & Robotics", page_icon="", layout="wide")

# ------------------ CHAT MODE HANDLER ------------------ #
# st.query_params returns dict of lists, use safe access
chat_only = st.query_params.get("chat", ["0"])[0] == "1"

def _init_assistant():
    # import inside the function so the portfolio view doesn't import unless chat-only
    if "assistant" not in st.session_state:
        from assistant import ResumeAssistant
        st.session_state.assistant = ResumeAssistant()
    if "chat_history" not in st.session_state:
        st.session_state.chat_history = []

def render_chat_only():
    """
    This renders a minimal ChatGPT-like chat page.
    It's used inside the iframe when the launcher requests ?chat=1.
    """
    # Minimal clean styling for chat-only iframe
    st.markdown("""
        <style>
            /* Make the chat iframe look clean like ChatGPT */
            .stApp { background: #ffffff !important; color: #111 !important; }
            .block-container { padding-top: 0.6rem; padding-bottom: 0.6rem; max-width: 720px; }
            .chat-header { padding: 8px 12px; border-bottom: 1px solid #eee; font-weight: 600; font-size: 16px; }
        </style>
    """, unsafe_allow_html=True)

    st.markdown("<div class='chat-header'>Chat with Saud</div>", unsafe_allow_html=True)

    _init_assistant()

    # Render stored history (if any)
    for m in st.session_state.chat_history:
        # user message
        with st.chat_message("user"):
            st.markdown(m["user"])
        # assistant message
        with st.chat_message("assistant"):
            st.markdown(m["bot"])

    # chat_input: Enter sends, Shift+Enter newline, clears after send (Streamlit behavior)
    if prompt := st.chat_input("Message Saud..."):
        # show user's message immediately
        with st.chat_message("user"):
            st.markdown(prompt)
        # call your assistant (blocking)
        reply = st.session_state.assistant.ask(prompt)
        # show assistant reply
        with st.chat_message("assistant"):
            st.markdown(reply)
        # persist to history
        st.session_state.chat_history.append({"user": prompt, "bot": reply})

# If we're in chat-only mode, render chat and stop the rest (so iframe is pure chat)
if chat_only:
    render_chat_only()
    st.stop()


# ------------------ PORTFOLIO MAIN STYLES (only when not chat-only) ------------------ #
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


# ------------------ FLOATING CHAT LAUNCHER (bottom-right) ------------------ #
# This injects a fixed-position launcher + iframe. The iframe src is set to the app URL + ?chat=1
launcher_html = r"""
<style>
  #saud-chat-launcher, #saud-chat-frame {
    position: fixed; z-index: 999999; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  }
  #saud-chat-launcher {
    bottom: 20px; right: 20px;
  }
  #saud-chat-btn {
    width: 56px; height: 56px; border-radius: 50%;
    border: none; cursor: pointer; font-size: 22px;
    background: #10a37f; color: #fff;
    box-shadow: 0 6px 18px rgba(0,0,0,0.25);
  }
  #saud-chat-frame {
    bottom: 92px; right: 20px;
    width: 380px; height: 640px;
    border: 1px solid #ddd; border-radius: 12px; overflow: hidden;
    display: none; background: #fff;
    box-shadow: 0 12px 28px rgba(0,0,0,0.28);
  }
  #saud-chat-close {
    position: absolute; top: 8px; right: 10px; z-index: 2;
    background: transparent; border: none; font-size: 20px; cursor: pointer;
  }
  /* Responsive */
  @media (max-width: 480px) {
    #saud-chat-frame { width: 95vw; height: 70vh; right: 2.5vw; bottom: 80px; }
    #saud-chat-launcher { bottom: 12px; right: 12px; }
  }
</style>

<div id="saud-chat-launcher" aria-hidden="false">
  <button id="saud-chat-btn" title="Chat">💬</button>
</div>

<div id="saud-chat-frame" role="dialog" aria-label="Chat window">
  <button id="saud-chat-close" aria-label="Close">✕</button>
  <iframe id="saud-chat-iframe" src="" style="width:100%;height:100%;border:0;border-radius:12px;"></iframe>
</div>

<script>
(function() {
  const btn = document.getElementById('saud-chat-btn');
  const frameWrap = document.getElementById('saud-chat-frame');
  const closeBtn = document.getElementById('saud-chat-close');
  const iframe = document.getElementById('saud-chat-iframe');

  // compute parent app URL (remove existing query string)
  let parentHref = null;
  try {
    // try to get parent location (should be same origin)
    parentHref = window.parent.location.href;
  } catch (e) {
    // fallback to current location
    parentHref = window.location.href;
  }
  const base = parentHref.split('?')[0];
  iframe.src = base + '?chat=1';

  btn.addEventListener('click', () => {
    frameWrap.style.display = (frameWrap.style.display === 'none' || frameWrap.style.display === '') ? 'block' : 'none';
    // focus into iframe when opened (best-effort)
    if (frameWrap.style.display === 'block') {
      setTimeout(()=> { iframe.contentWindow.focus(); }, 300);
    }
  });
  closeBtn.addEventListener('click', () => { frameWrap.style.display = 'none'; });
  // ESC to close
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') frameWrap.style.display = 'none'; });
})();
</script>
"""

# Use components.html to inject the launcher; a tiny height keeps the layout compact.
components.html(launcher_html, height=1)
