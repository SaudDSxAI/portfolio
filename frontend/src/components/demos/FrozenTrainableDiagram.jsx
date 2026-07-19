import { Snowflake, PencilRuler, Grid3x3, ArrowRight } from 'lucide-react';

// Custom-built specifically for Mini-LLaVA — no other project on this site
// has a "some pieces are frozen, one piece is trained" architecture, so the
// generic ArchitectureDiagram (which just shows a linear flow) doesn't
// communicate the thing that actually matters here: only ~1.2M of the
// pipeline's ~275M total parameters ever change during training.
export default function FrozenTrainableDiagram() {
  return (
    <div className="bg-white/70 border border-black/10 rounded-2xl p-6 sm:p-8">
      <p className="text-xs text-zinc-500 mb-6 text-center">
        Two frozen models, one small trained bridge between them — roughly 1.2M trainable parameters out of ~275M total.
      </p>

      <div className="flex flex-col sm:flex-row items-stretch gap-3 sm:gap-2">
        {/* CLIP vision tower — frozen */}
        <div className="flex-1 rounded-2xl border-2 border-sky-300 bg-sky-50 p-4 relative">
          <div className="flex items-center gap-1.5 text-sky-700 text-[10px] font-bold uppercase tracking-wide mb-2">
            <Snowflake size={12} /> Frozen
          </div>
          <p className="font-heading font-bold text-sm text-black mb-1">CLIP Vision Tower</p>
          <p className="text-[11px] text-zinc-600 mb-3">ViT-B/32, unchanged, exactly as OpenAI released it</p>
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 bg-white/70 rounded-lg px-2 py-1.5 border border-black/5">
            <Grid3x3 size={13} className="text-sky-600 shrink-0" />
            Image → 49 patch vectors (768 numbers each)
          </div>
        </div>

        <div className="flex sm:flex-col items-center justify-center text-zinc-300 shrink-0">
          <ArrowRight size={20} className="sm:-rotate-0 rotate-90" />
        </div>

        {/* Projector — trainable */}
        <div className="flex-1 rounded-2xl border-2 border-stone-500 bg-stone-50 p-4 relative shadow-md shadow-stone-500/10">
          <div className="flex items-center gap-1.5 text-stone-700 text-[10px] font-bold uppercase tracking-wide mb-2">
            <PencilRuler size={12} /> Trainable — the only part that learns
          </div>
          <p className="font-heading font-bold text-sm text-black mb-1">Projector (MLP)</p>
          <p className="text-[11px] text-zinc-600 mb-3">Linear → GELU → Linear, ~1.2M parameters, built from scratch</p>
          <div className="text-[11px] text-zinc-500 bg-white/70 rounded-lg px-2 py-1.5 border border-black/5">
            Translates CLIP's vectors into GPT-2's input format
          </div>
        </div>

        <div className="flex sm:flex-col items-center justify-center text-zinc-300 shrink-0">
          <ArrowRight size={20} className="sm:-rotate-0 rotate-90" />
        </div>

        {/* GPT-2 — frozen */}
        <div className="flex-1 rounded-2xl border-2 border-sky-300 bg-sky-50 p-4 relative">
          <div className="flex items-center gap-1.5 text-sky-700 text-[10px] font-bold uppercase tracking-wide mb-2">
            <Snowflake size={12} /> Frozen
          </div>
          <p className="font-heading font-bold text-sm text-black mb-1">GPT-2</p>
          <p className="text-[11px] text-zinc-600 mb-3">Unchanged, exactly as OpenAI released it</p>
          <div className="text-[11px] text-zinc-500 bg-white/70 rounded-lg px-2 py-1.5 border border-black/5">
            Reads translated vectors as if they were words, writes the caption
          </div>
        </div>
      </div>

      <p className="text-[11px] text-zinc-400 mt-5 text-center">
        Training only ever adjusts the middle box. CLIP never learns anything about captions; GPT-2 never learns anything about images.
      </p>
    </div>
  );
}
