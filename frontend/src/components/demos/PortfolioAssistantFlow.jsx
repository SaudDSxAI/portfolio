import { MessageCircleQuestion, GitFork, Zap, FileSearch2, Waves } from 'lucide-react';

// Custom-built for the Portfolio Assistant — the generic 3-box "title +
// bullet list" architecture layout used elsewhere on this site doesn't
// show the one thing that actually matters here: this is a single fork,
// not a pipeline. A question comes in, the model makes exactly one
// decision, and both branches converge into the same streamed answer.
export default function PortfolioAssistantFlow() {
  return (
    <div className="bg-white/70 border border-black/10 rounded-2xl p-6 sm:p-8">
      <p className="text-xs text-zinc-500 mb-6 text-center">
        One decision, not a pipeline: does the model already know this, or does it need one project's real detail first?
      </p>

      {/* Question in */}
      <div className="flex justify-center mb-3">
        <div className="flex items-center gap-2 rounded-full border border-black/10 bg-warm-100/80 px-4 py-2">
          <MessageCircleQuestion size={16} className="text-indigo-600 shrink-0" />
          <span className="text-xs font-semibold text-black">A question arrives</span>
        </div>
      </div>

      <div className="flex justify-center mb-3">
        <div className="w-px h-6 bg-black/15" />
      </div>

      {/* The fork */}
      <div className="flex justify-center mb-3">
        <div className="flex items-center gap-2 rounded-xl border border-indigo-300 bg-indigo-50 px-4 py-2">
          <GitFork size={16} className="text-indigo-700 shrink-0" />
          <span className="text-xs font-semibold text-indigo-800">Does it already know the answer?</span>
        </div>
      </div>

      {/* Two branches */}
      <div className="grid sm:grid-cols-2 gap-4 mb-3">
        <div className="flex flex-col items-center">
          <div className="w-px h-5 bg-black/15" />
          <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-600 mb-2">Yes</span>
          <div className="w-full rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-4 text-center">
            <Zap size={16} className="text-emerald-700 mx-auto mb-1.5" />
            <p className="font-heading font-bold text-sm text-black mb-1">Answers directly</p>
            <p className="text-[11px] text-zinc-600">From the project index and its own knowledge — no tool call at all</p>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="w-px h-5 bg-black/15" />
          <span className="text-[10px] font-bold uppercase tracking-wide text-amber-600 mb-2">No</span>
          <div className="w-full rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-center">
            <FileSearch2 size={16} className="text-amber-700 mx-auto mb-1.5" />
            <p className="font-heading font-bold text-sm text-black mb-1">Calls get_project_details(slug)</p>
            <p className="text-[11px] text-zinc-600">Fetches that one project's exact stored write-up, then answers from it</p>
          </div>
        </div>
      </div>

      {/* Converge */}
      <div className="flex justify-center mb-3">
        <div className="w-px h-6 bg-black/15" />
      </div>
      <div className="flex justify-center">
        <div className="flex items-center gap-2 rounded-full border border-black/10 bg-warm-100/80 px-4 py-2">
          <Waves size={16} className="text-indigo-600 shrink-0" />
          <span className="text-xs font-semibold text-black">Either way: streamed back token by token over SSE</span>
        </div>
      </div>

      <p className="text-[11px] text-zinc-400 mt-5 text-center">
        No reformulation, no second search, no judge call — one fork, one decision, per question.
      </p>
    </div>
  );
}
