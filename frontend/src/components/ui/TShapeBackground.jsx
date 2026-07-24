/**
 * TShapeBackground — a large, soft "T" rendered purely as background glow,
 * reinforcing the T-shaped-skills concept (broad bar of complementary
 * knowledge, deep stem of core specialization) without ever looking like a
 * chart, diagram, or literal letterform. Two blurred, low-opacity bars
 * (one horizontal, one vertical) are all it is — no outline, no stroke,
 * no labels baked into the shape itself.
 *
 * Desktop/tablet only: a literal T doesn't survive a narrow phone width,
 * so this unmounts entirely below md and the page just falls back to a
 * plain, clean background there.
 */
export default function TShapeBackground() {
  return (
    <div
      aria-hidden="true"
      className="hidden md:block absolute inset-0 -z-10 pointer-events-none overflow-hidden"
    >
      {/* Horizontal bar of the T — deliberately the fainter of the two, so
          the eye settles on the stem below as the "hot" part of the page. */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-[13%] w-[78%] max-w-4xl h-40 lg:h-48 rounded-full blur-[90px]"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(143,148,102,0.09) 0%, rgba(175,178,132,0.06) 45%, transparent 75%)',
        }}
      />

      {/* Vertical stem of the T — the AI-engineering specialization column.
          Stronger, warmer, and taller than the bar's glow on purpose: this
          is the part of the T meant to draw the eye. */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-[10%] w-48 lg:w-64 h-[85%] rounded-full blur-[100px]"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(143,148,102,0.30) 0%, rgba(175,178,132,0.18) 40%, rgba(201,203,164,0.08) 65%, transparent 80%)',
        }}
      />
      <div
        className="absolute left-1/2 -translate-x-1/2 top-[16%] w-28 lg:w-36 h-[55%] rounded-full blur-[70px]"
        style={{ background: 'rgba(143,148,102,0.16)' }}
      />

      {/* Center seam where bar and stem meet, so it reads as one continuous
          form rather than two separate blobs. */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-[13%] w-60 h-28 rounded-full blur-[70px]"
        style={{ background: 'rgba(143,148,102,0.14)' }}
      />
    </div>
  );
}
