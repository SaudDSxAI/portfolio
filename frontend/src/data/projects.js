// Hand-picked projects — maintained manually, no auto-sync.
// Paste new project info to Claude to have it structured into an entry here.
// Shape:
// {
//   id, title, description, impact, tech: [...], category,
//   github: '', live: '', featured: bool,
// }

export const projects = [];

export const categories = ['All', 'Production AI', 'LLM/RAG', 'ML/Deep Learning'];

export const skills = [
  {
    category: 'Full-Stack SaaS Development',
    icon: '',
    items: ['React & Next.js', 'FastAPI & Python Backends', 'Multi-tenant System Architecture', 'AI SaaS: Recruitment Platform (Nebula)', 'AI SaaS: HSE Performance Tracker', 'REST APIs & Real-time Analytics'],
  },
  {
    category: 'Agentic Systems & RAG',
    icon: '',
    items: ['LangChain & LangGraph', 'CrewAI', 'Semantic Kernel', 'LlamaIndex', 'Vector DBs (Chroma/FAISS)', 'Hybrid Retrieval', 'Multi-Agent Orchestration'],
  },
  {
    category: 'Generative AI & LLMs',
    icon: '',
    items: ['GPT Architectures', 'LLaMA & Mistral', 'Anthropic Claude', 'Hugging Face', 'Prompt Engineering', 'Multimodal Generation', 'Ollama', 'Fine-Tuning'],
  },
  {
    category: 'Machine & Deep Learning',
    icon: '',
    items: ['PyTorch & TensorFlow', 'scikit-learn', 'Transformers (BERT)', 'CNNs & RNNs', 'NLP & Text Classification', 'Computer Vision', 'Feature Engineering'],
  },
  {
    category: 'Data Engineering & Analytics',
    icon: '',
    items: ['Data Pipelines (ETL)', 'Apache Spark / Airflow', 'Pandas & NumPy', 'SQL, BigQuery & Snowflake', 'Exploratory Data Analysis', 'Power BI / Tableau', 'Statistical Modeling'],
  },
  {
    category: 'MLOps & Model Deployment',
    icon: '',
    items: ['Parameter-Efficient Tuning (LoRA/PEFT)', 'Quantization (QLoRA)', 'MLflow & W&B Tracking', 'Python (AI/ML Core)', 'Docker & Kubernetes', 'Automated CI/CD'],
  },
];

export const stats = [
  { label: 'GitHub Repositories', value: '38', icon: '' },
  { label: 'Projects Built', value: '15+', icon: '' },
  { label: 'Technologies', value: '30+', icon: '' },
  { label: 'Production Systems', value: '4+', icon: '' },
];
