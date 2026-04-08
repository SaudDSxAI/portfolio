export default function Footer() {
  return (
    <footer className="border-t border-white/5 py-8 px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-lg font-heading font-bold bg-gradient-to-r from-primary-400 to-cyan-400 bg-clip-text text-transparent">
            SA
          </span>
          <span className="text-sm text-slate-500">
            © {new Date().getFullYear()} Saud Ahmad
          </span>
        </div>

        <div className="flex items-center gap-6">
          <a
            href="https://github.com/SaudDSxAI"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/saud-ahmad1/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            LinkedIn
          </a>
          <a
            href="mailto:sauds6446@gmail.com"
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            Email
          </a>
        </div>

        <p className="text-xs text-slate-600">
          Built with React & FastAPI · Powered by AI
        </p>
      </div>
    </footer>
  );
}
