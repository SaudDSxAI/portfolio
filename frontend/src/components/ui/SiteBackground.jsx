/**
 * SiteBackground — fixed, full-viewport, GPU-cheap.
 *
 * Layers (bottom → top):
 *   1. Cream base
 *   2. Four slow drifting olive aurora blobs (uses existing `blob` keyframe)
 *   3. Faint dot-grid texture for depth
 *   4. Soft radial vignette so corners gently fade
 *
 * Renders behind everything else (z-index -10), is decorative only
 * (aria-hidden), and never intercepts pointer events.
 */
export default function SiteBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden"
    >
      {/* 1. Cream base */}
      <div className="absolute inset-0 bg-warm-50" />

      {/* 2. Aurora blobs (olive family — primary-200/300/400) */}
      <div className="absolute -top-32 -left-32 w-[40rem] h-[40rem] rounded-full bg-primary-300/40 blur-[120px] animate-blob" />
      <div className="absolute top-[18%] -right-40 w-[44rem] h-[44rem] rounded-full bg-primary-400/25 blur-[120px] animate-blob animation-delay-2000" />
      <div className="absolute top-[55%] left-[8%] w-[38rem] h-[38rem] rounded-full bg-primary-200/45 blur-[120px] animate-blob animation-delay-4000" />
      <div className="absolute -bottom-32 right-[12%] w-[36rem] h-[36rem] rounded-full bg-primary-300/30 blur-[120px] animate-blob" />

      {/* 3. Dot-grid texture */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.6) 1px, transparent 0)',
          backgroundSize: '26px 26px',
        }}
      />

      {/* 4. Radial vignette — pulls focus toward the center */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 35%, rgba(239,231,216,0.55) 100%)',
        }}
      />
    </div>
  );
}
