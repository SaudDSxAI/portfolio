export default function Footer() {
  return (
    <footer className="border-t border-black/10 py-8 px-6 bg-warm-50">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-lg font-heading font-bold text-black">
            SA
          </span>
          <span className="text-sm text-zinc-700">
            © {new Date().getFullYear()} Saud Ahmad
          </span>
        </div>

        <div className="flex items-center gap-6">
          <a
            href="https://github.com/SaudDSxAI"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-zinc-600 hover:text-black transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/saud-ahmad1/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-zinc-600 hover:text-black transition-colors"
          >
            LinkedIn
          </a>
          <a
            href="mailto:sauds6446@gmail.com"
            className="text-sm text-zinc-600 hover:text-black transition-colors"
          >
            Email
          </a>
        </div>

        <p className="text-xs text-zinc-600">
          Built with React & FastAPI · Powered by AI
        </p>
      </div>
    </footer>
  );
}
