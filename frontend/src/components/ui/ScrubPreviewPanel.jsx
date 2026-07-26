import { useEffect, useState } from 'react';

/**
 * The detail panel for the mobile finger-scrub grids (Projects and
 * CategoryPage). Deliberately NOT an overlay anchored to the active tile —
 * an earlier version enlarged the tile itself, which caused two problems:
 * edge-column tiles got clipped by the section's `overflow-hidden` (needed
 * elsewhere for the zero-scroll layout), and the popup sat right under the
 * finger that triggered it, so you couldn't actually read it.
 *
 * Instead this is a fixed-height slot living *above* the grid, always in
 * the same place, always clear of whatever the finger is doing below it.
 * It cross-fades between an idle hint and the active tile's full detail —
 * `lastActive` keeps the previous content mounted through the fade-out so
 * the transition has something to dissolve rather than popping to empty.
 */
export default function ScrubPreviewPanel({ active }) {
  const [lastActive, setLastActive] = useState(null);

  useEffect(() => {
    if (active) setLastActive(active);
  }, [active]);

  const display = active || lastActive;

  return (
    <div className="relative flex-shrink-0 h-20 mb-2 rounded-2xl border border-black/10 bg-warm-100/80 overflow-hidden">
      {/* Idle hint */}
      <div
        className={`absolute inset-0 flex items-center justify-center px-4 transition-opacity duration-200 ${
          active ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <p className="text-[11px] text-zinc-500 font-medium text-center leading-snug">
          Touch and drag across the cards to preview — release to open
        </p>
      </div>

      {/* Active preview */}
      <div
        className={`absolute inset-0 flex items-center gap-3 px-4 transition-opacity duration-200 ${
          active ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {display && (
          <>
            <span
              className={`flex items-center justify-center w-12 h-12 rounded-xl text-white flex-shrink-0 ${display.iconBg}`}
            >
              {display.icon}
            </span>
            <div className="min-w-0 text-left">
              <p className="text-sm font-bold text-black leading-tight truncate">{display.title}</p>
              <p className="text-[11px] text-zinc-600 leading-snug line-clamp-2">{display.description}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
