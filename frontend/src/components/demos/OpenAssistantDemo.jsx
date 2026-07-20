// This project's live demo IS the actual chat widget already running on
// this site — not a separate copy of it. Building a second, parallel demo
// instance would mean two different assistants existing on the same page,
// which is dishonest about what's actually deployed. Instead, this just
// opens the real widget via the same 'openChat' event the Navbar/Hero/
// Contact buttons already use.
const SAMPLE_EXCHANGES = [
  { q: "What's Saud's background?", a: 'Answers directly from the system prompt — no tool call, no project lookup needed.' },
  { q: 'Tell me about the RAG comparison project', a: "Recognizes a specific project is being asked about, calls get_project_details('comparative-rag-techniques'), then answers from the real write-up." },
];

export default function OpenAssistantDemo() {
  const openWidget = () => window.dispatchEvent(new Event('openChat'));

  return (
    <div>
      <p className="text-xs text-zinc-500 mb-4">
        This is the actual assistant running in the corner of this site, not a separate demo copy of it.
      </p>

      <div className="flex flex-col gap-2 mb-5">
        {SAMPLE_EXCHANGES.map((ex) => (
          <div key={ex.q} className="bg-white/70 border border-black/10 rounded-xl p-3">
            <p className="text-xs font-semibold text-black mb-1">"{ex.q}"</p>
            <p className="text-[11px] text-zinc-500 leading-relaxed">{ex.a}</p>
          </div>
        ))}
      </div>

      <button
        onClick={openWidget}
        className="shrink-0 px-5 py-3 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all"
      >
        Open the assistant
      </button>
    </div>
  );
}
