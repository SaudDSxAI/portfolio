// Hand-picked projects — maintained manually, no auto-sync.
// Paste new project info to Claude to have it structured into an entry here.
// Shape:
// {
//   id, title, description, impact, tech: [...], category,
//   github: '', live: '', featured: bool,
// }

export const projects = [];

export const categories = ['All', 'Production AI', 'LLM/RAG', 'ML/Deep Learning'];

// Every category below is grounded in what's actually built and shown in the
// case studies (see caseStudies.js) — not an aspirational tech-stack list.
// When a new case study ships with a genuinely new technology, add it here.
export const skills = [
  {
    category: 'Full-Stack Production Systems',
    icon: '',
    items: [
      'Next.js & React',
      'FastAPI & Python Backends',
      'PostgreSQL, SQLAlchemy & SQLite',
      'Docker & Railway Deployment',
      'Deployed: COTER Global Recruitment Agent',
      'Deployed: ZYP Assembly QC System',
      'Deployed: Oval Labs Outreach Automation',
      'Deployed: HSE Performance Tracker',
    ],
  },
  {
    category: 'Agentic AI & LLM Orchestration',
    icon: '',
    items: [
      'LangChain & LangGraph',
      'OpenAI GPT-4o-mini / API',
      'Multi-Channel Agents (WhatsApp, Gmail, LinkedIn, Meta)',
      'Tool-Use & Autonomous Web Research Agents',
      'Server-Sent Events Streaming',
      "This Site's Own AI Assistant",
    ],
  },
  {
    category: 'RAG & Retrieval Engineering',
    icon: '',
    items: [
      'Hybrid Search (BM25 + Embeddings)',
      'Cross-Encoder Re-ranking',
      'HyDE & Agentic Retrieval',
      'FAISS Vector Search',
      'sentence-transformers',
      '5 Retrieval Techniques Benchmarked From Scratch',
    ],
  },
  {
    category: 'Machine Learning & Forecasting',
    icon: '',
    items: [
      'scikit-learn & XGBoost',
      'Imbalanced Data (SMOTE, Class Weighting)',
      'Time-Series Forecasting (Prophet, SARIMA)',
      'Model Interpretability (SHAP)',
      'Collaborative Filtering',
      'Cross-Validation & Statistical Significance Testing',
    ],
  },
  {
    category: 'Deep Learning & Generative Models',
    icon: '',
    items: [
      'PyTorch',
      'LSTMs & Sequence Modeling',
      'Autoencoders for Anomaly Detection',
      'Diffusion Models (DDPM) & GANs',
      'LoRA / PEFT Fine-Tuning, Built From Scratch',
      'Transfer Learning',
    ],
  },
  {
    category: 'Computer Vision & Multimodal AI',
    icon: '',
    items: [
      'CLIP (Vision-Language Embeddings)',
      'YOLOv8 Object & Face Detection',
      'DeepFace / ArcFace Recognition',
      'OpenCV & face_recognition',
      'Hugging Face Transformers',
      'Vision-Language Pipelines (Mini-LLaVA)',
    ],
  },
  {
    category: 'Robotics, IoT & Embedded Systems',
    icon: '',
    items: [
      'Arduino (Mega, WiFiS3) & ESP32',
      'Raspberry Pi & NVIDIA Jetson Orin Nano',
      'C++ for Embedded Control',
      'Sensor Fusion (Ultrasonic, IR, IMU, Gas, Soil Moisture)',
      'MQTT & Blynk IoT',
      'Solar-Powered Autonomous Systems',
    ],
  },
  {
    category: 'Data Engineering & Visualization',
    icon: '',
    items: [
      'pandas, NumPy & SciPy',
      'Recharts & matplotlib',
      'Real-Time Data (WebSocket)',
      'REST API Design',
      'Third-Party Integrations (Google Sheets, Gmail/IMAP, LinkedIn, Meta)',
    ],
  },
];

