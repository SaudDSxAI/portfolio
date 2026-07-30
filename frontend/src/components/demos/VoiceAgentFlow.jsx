import { Mic, Ear, Brain, AudioLines, Hand } from 'lucide-react';

// Custom-built for the voice agent. The generic 3-box architecture layout
// can't show the two things that actually make this project interesting:
//   1. the turn is a *loop*, not a pipeline with an end, and
//   2. the speed win comes from overlapping stages, which is a timing
//      property — you have to draw it against a time axis to see it.
// Hence the timeline comparison in the middle, which is the real point.

const STAGES = [
  { icon: Ear, label: 'Listen', detail: 'Mic level watched every frame. Silence for 700ms ends your turn.', tone: 'sky' },
  { icon: Mic, label: 'Transcribe', detail: 'Speech to text, primed with a list of names it would otherwise mishear.', tone: 'violet' },
  { icon: Brain, label: 'Think', detail: 'Same agent as the text chat. Can pull the CV or a project write-up first.', tone: 'amber' },
  { icon: AudioLines, label: 'Speak', detail: 'Each sentence is voiced the moment it exists, not after the full reply.', tone: 'emerald' },
];

const TONE = {
  sky: { box: 'border-sky-300 bg-sky-50', icon: 'text-sky-700', chip: 'bg-sky-600' },
  violet: { box: 'border-violet-300 bg-violet-50', icon: 'text-violet-700', chip: 'bg-violet-600' },
  amber: { box: 'border-amber-300 bg-amber-50', icon: 'text-amber-700', chip: 'bg-amber-600' },
  emerald: { box: 'border-emerald-300 bg-emerald-50', icon: 'text-emerald-700', chip: 'bg-emerald-600' },
};

// Widths are proportional to each other, not to measured milliseconds —
// this shows the *shape* of the overlap, which is the design decision.
// Real per-stage timings are logged per turn rather than guessed at here.
const SEQUENTIAL = [
  { label: 'Transcribe', tone: 'violet', span: 2 },
  { label: 'Think (whole reply)', tone: 'amber', span: 4 },
  { label: 'Voice (whole reply)', tone: 'emerald', span: 4 },
];

// The short emerald blocks are labelled 1/2/3 rather than "Voice sentence 1",
// because at this width any longer label just truncates into an ellipsis.
// The legend under the track carries the meaning instead.
const PIPELINED = [
  { label: 'Transcribe', tone: 'violet', span: 2, offset: 0 },
  { label: 'Think', tone: 'amber', span: 4, offset: 2 },
  { label: '1', tone: 'emerald', span: 1.4, offset: 3.4 },
  { label: '2', tone: 'emerald', span: 1.4, offset: 4.8 },
  { label: '3', tone: 'emerald', span: 1.4, offset: 6.2 },
];

const TOTAL = 10;

function Bar({ label, tone, span, offset = 0 }) {
  return (
    <div
      className={`absolute h-8 rounded-md ${TONE[tone].chip} flex items-center justify-center overflow-hidden`}
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
      <p className="text-xs text-zinc-500 mb-7 text-center">
        A conversation loop, not a request and response. Nothing here has a send button.
      </p>

      {/* ---- the loop ---- */}
      <div className="grid sm:grid-cols-4 gap-3 mb-4">
        {STAGES.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`rounded-2xl border-2 ${TONE[s.tone].box} p-4 relative`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} className={`${TONE[s.tone].icon} shrink-0`} />
                <p className="font-heading font-bold text-sm text-black">{s.label}</p>
              </div>
              <p className="text-[11.5px] text-zinc-600 leading-relaxed">{s.detail}</p>
              <span className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center">
                {i + 1}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-2 mb-8">
        <div className="h-px flex-1 bg-black/10" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          then straight back to step 1, automatically
        </span>
        <div className="h-px flex-1 bg-black/10" />
      </div>

      {/* ---- the timing win ---- */}
      <p className="text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1 text-center">
        Why it replies sooner
      </p>
      <p className="text-[11px] text-zinc-500 mb-5 text-center max-w-lg mx-auto">
        Same total work either way. The difference is when you start hearing it.
      </p>

      <div className="space-y-5 mb-2">
        <div>
          <p className="text-[11px] font-semibold text-zinc-700 mb-1.5">
            One block at a time — you wait for the whole reply
          </p>
          <div className="relative h-8 w-full rounded-md bg-black/5">
            {SEQUENTIAL.reduce((acc, b) => {
              const offset = acc.offset;
              acc.offset += b.span;
              acc.nodes.push(<Bar key={b.label} {...b} offset={offset} />);
              return acc;
            }, { offset: 0, nodes: [] }).nodes}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1.5">
            First sound only after every stage has finished.
          </p>
        </div>

        <div>
          <p className="text-[11px] font-semibold text-zinc-700 mb-1.5">
            Sentence by sentence — voicing starts while it's still writing
          </p>
          <div className="relative h-8 w-full rounded-md bg-black/5">
            {PIPELINED.map((b) => <Bar key={b.label} {...b} />)}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-3 h-3 rounded-sm bg-emerald-600 shrink-0" />
            <p className="text-[11px] text-zinc-600">
              <span className="font-semibold text-emerald-700">1, 2, 3</span> are the reply's
              sentences, each voiced the moment it's written.
            </p>
          </div>
          <p className="text-[11px] text-emerald-700 font-semibold mt-1.5">
            Sound starts as soon as sentence one exists. The rest are voiced while you're already
            listening to the earlier ones, so their cost is hidden.
          </p>
        </div>
      </div>

      {/* ---- barge-in ---- */}
      <div className="mt-8 rounded-2xl border-2 border-rose-300 bg-rose-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Hand size={16} className="text-rose-700 shrink-0" />
          <p className="font-heading font-bold text-sm text-black">Cutting in</p>
        </div>
        <p className="text-[11.5px] text-zinc-700 leading-relaxed">
          The mic keeps being watched <em>while it's talking</em>, so you can interrupt it the way
          you'd interrupt a person. Doing that has to kill three things at once: the clip playing,
          every clip queued behind it, and the server still generating more. Miss any one and it
          keeps talking after you've cut in.
        </p>
      </div>

      <p className="text-[11px] text-zinc-400 mt-6 text-center">
        Voice and typing share one session, so you can start a question out loud and finish it
        by typing without losing the thread.
      </p>
    </div>
  );
}
