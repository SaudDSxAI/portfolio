import { Mic, FileAudio, ListTree, BrainCircuit, ScissorsLineDashed, Volume2, ListMusic, Repeat } from 'lucide-react';

// A literal data pipeline, not an abstract "listen/think/speak" summary:
// each box is one real component (named model or API), each arrow is
// labelled with the actual data type crossing it. This is what "how it's
// wired together" means technically for this project.

const PIPELINE = [
  {
    icon: Mic,
    title: 'Microphone',
    detail: 'MediaRecorder API captures the mic as an audio/webm clip while the AnalyserNode watches loudness to detect when you stop talking.',
    out: 'audio clip (webm)',
    tone: 'sky',
  },
  {
    icon: FileAudio,
    title: 'Speech-to-text',
    detail: 'gpt-4o-mini-transcribe converts the clip to text (falls back to whisper-1). A vocabulary hint of project and company names reduces mis-transcription.',
    out: 'transcript (plain text)',
    tone: 'violet',
  },
  {
    icon: ListTree,
    title: 'Prompt assembly',
    detail: 'The transcript is appended to the running conversation history, alongside the system prompt, the project index, and the two available tools.',
    out: 'messages[] array',
    tone: 'violet',
  },
  {
    icon: BrainCircuit,
    title: 'LLM',
    detail: 'gpt-4o-mini, streamed, temperature 0.7. Can call get_project_details(slug) or get_cv() mid-turn before producing its final answer.',
    out: 'reply tokens (streamed)',
    tone: 'amber',
  },
  {
    icon: ScissorsLineDashed,
    title: 'Sentence detection',
    detail: 'A regex watches the incoming token stream for a sentence boundary (with a lookahead so "92.68" or "e.g." are not mistaken for one).',
    out: 'one finished sentence',
    tone: 'amber',
  },
  {
    icon: Volume2,
    title: 'Text-to-speech',
    detail: 'gpt-4o-mini-tts (falls back to tts-1, voice "onyx") synthesizes that sentence alone, before the rest of the reply has finished generating.',
    out: 'audio (mp3, base64 over SSE)',
    tone: 'emerald',
  },
  {
    icon: ListMusic,
    title: 'Playback queue',
    detail: "The browser holds arriving clips in a queue and plays them back to back, so later sentences are synthesized while earlier ones are still playing.",
    out: 'reply heard',
    tone: 'emerald',
  },
];

const TONE = {
  sky: { box: 'border-sky-300 bg-sky-50', icon: 'text-sky-700' },
  violet: { box: 'border-violet-300 bg-violet-50', icon: 'text-violet-700' },
  amber: { box: 'border-amber-300 bg-amber-50', icon: 'text-amber-700' },
  emerald: { box: 'border-emerald-300 bg-emerald-50', icon: 'text-emerald-700' },
};

function Arrow({ label }) {
  return (
    <div className="flex items-center gap-2 pl-6 py-1">
      <div className="w-px h-5 bg-black/20" />
      <span className="text-[10px] font-mono text-zinc-500 bg-black/5 rounded px-1.5 py-0.5">{label}</span>
    </div>
  );
}

// Bar widths are proportional to each other, not to measured milliseconds —
// they show the shape of the overlap. Real per-stage timings are logged
// server-side per turn rather than estimated here.
const SEQUENTIAL = [
  { label: 'STT', tone: 'violet', span: 2 },
  { label: 'LLM (full reply)', tone: 'amber', span: 4 },
  { label: 'TTS (full reply)', tone: 'emerald', span: 4 },
];
const PIPELINED = [
  { label: 'STT', tone: 'violet', span: 2, offset: 0 },
  { label: 'LLM', tone: 'amber', span: 4, offset: 2 },
  { label: '1', tone: 'emerald', span: 1.4, offset: 3.4 },
  { label: '2', tone: 'emerald', span: 1.4, offset: 4.8 },
  { label: '3', tone: 'emerald', span: 1.4, offset: 6.2 },
];
const TOTAL = 10;

function Bar({ label, tone, span, offset = 0 }) {
  return (
    <div
      className={`absolute h-8 rounded-md flex items-center justify-center overflow-hidden ${
        tone === 'violet' ? 'bg-violet-600' : tone === 'amber' ? 'bg-amber-600' : 'bg-emerald-600'
      }`}
      style={{ left: `${(offset / TOTAL) * 100}%`, width: `${(span / TOTAL) * 100}%` }}
      title={label}
    >
      <span className="text-[11px] font-semibold text-white px-1 truncate">{label}</span>
    </div>
  );
}

export default function VoiceAgentFlow() {
  return (
    <div className="bg-white/70 border border-black/10 rounded-2xl p-6 sm:p-8">
      {/* ---- the pipeline ---- */}
      <div className="space-y-0 mb-8">
        {PIPELINE.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={step.title}>
              <div className={`rounded-2xl border-2 ${TONE[step.tone].box} p-4`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon size={16} className={`${TONE[step.tone].icon} shrink-0`} />
                  <p className="font-heading font-bold text-sm text-black">{step.title}</p>
                </div>
                <p className="text-[11.5px] text-zinc-600 leading-relaxed">{step.detail}</p>
              </div>
              {i < PIPELINE.length - 1 && <Arrow label={step.out} />}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-2 mb-8">
        <Repeat size={13} className="text-zinc-400" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          playback queue empties → microphone reopens automatically → back to step 1
        </span>
      </div>

      {/* ---- pipelining vs. sequential ---- */}
      <p className="text-xs font-bold uppercase tracking-wider text-zinc-600 mb-4 text-center">
        Steps 4–6 overlap instead of running in sequence
      </p>

      <div className="space-y-5">
        <div>
          <p className="text-[11px] font-semibold text-zinc-700 mb-1.5">Sequential</p>
          <div className="relative h-8 w-full rounded-md bg-black/5">
            {SEQUENTIAL.reduce((acc, b) => {
              const offset = acc.offset;
              acc.offset += b.span;
              acc.nodes.push(<Bar key={b.label} {...b} offset={offset} />);
              return acc;
            }, { offset: 0, nodes: [] }).nodes}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold text-zinc-700 mb-1.5">
            Pipelined <span className="font-normal text-zinc-500">(what actually runs)</span>
          </p>
          <div className="relative h-8 w-full rounded-md bg-black/5">
            {PIPELINED.map((b) => <Bar key={b.label} {...b} />)}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1.5">
            1, 2, 3 = the reply's sentences, each synthesized as soon as it's written.
          </p>
        </div>
      </div>
    </div>
  );
}
