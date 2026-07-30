// This project's live demo IS the actual chat widget already running on
// this site — not a separate copy of it. Building a second, parallel demo
// instance would mean two different assistants existing on the same page,
// which is dishonest about what's actually deployed. Instead, this just
// opens the real widget via the same 'openChat' event the Navbar/Hero/
// Contact buttons already use.
//
// The voice-agent project passes openVoice, which dispatches 'openVoiceChat'
// instead — that event skips the typed panel entirely and drops straight
// into the voice overlay, since a demo button on the *voice* project page
// opening a text box first would be a bait and switch.
const TEXT_EXCHANGES = [
  { q: "What's Saud's background?", a: 'Answers directly from the system prompt — no tool call, no project lookup needed.' },
  { q: 'Tell me about the RAG comparison project', a: "Recognizes a specific project is being asked about, calls get_project_details('comparative-rag-techniques'), then answers from the real write-up." },
];

const VOICE_EXCHANGES = [
  { q: '(spoken) "Hey, tell me about your background"', a: 'Same agent as the typed chat, reached by voice — listens, transcribes, answers, and speaks the reply back.' },
  { q: '(spoken, cutting in mid-reply) "Wait, what about your projects?"', a: 'Interruptible mid-sentence — talking over it stops the current reply and starts listening to the new question.' },
];

export default function OpenAssistantDemo({ openVoice = false } = {}) {
  const openWidget = () => window.dispatchEvent(new Event(openVoice ? 'openVoiceChat' : 'openChat'));
  const exchanges = openVoice ? VOICE_EXCHANGES : TEXT_EXCHANGES;

  return (
    <div>
      <p className="text-xs text-zinc-500 mb-4">
        {openVoice
          ? 'This opens the real assistant on this site directly into voice mode — no typed panel first.'
          : 'This is the actual assistant running in the corner of this site, not a separate demo copy of it.'}
      </p>

      <div className="flex flex-col gap-2 mb-5">
        {exchanges.map((ex) => (
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
        {openVoice ? 'Open the voice assistant' : 'Open the assistant'}
      </button>
    </div>
  );
}
