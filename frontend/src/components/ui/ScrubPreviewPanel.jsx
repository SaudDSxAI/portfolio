import { useEffect, useState } from 'react';

/**
 * The detail panel for the mobile finger-scrub grids (Projects, CategoryPage,
 * Skills). Deliberately NOT an overlay anchored to the active tile — an
 * earlier version enlarged the tile itself, which caused two problems:
 * edge-column tiles got clipped by the section's `overflow-hidden` (needed
 * elsewhere for the zero-scroll layout), and the popup sat right under the
 * finger that triggered it, so you couldn't actually read it.
 *
 * Instead this is a fixed-height slot living *above* the grid, always in
 * the same place, always clear of whatever the finger is doing below it.
 * It cross-fades between an idle hint and the active tile's full detail —
 * `lastActive` keeps the previous content mounted through the fade-out so
 * the transition has something to dissolve rather than popping to empty.
 *
 * `size="lg"` is a taller, roomier variant (bigger icon, bigger title, more
 * lines of description) for pages like Skills where the detail text itself
 * — a full list of items, not a one-line tagline — needs real space to be
 * readable rather than a cramped one-liner.
 */
export default function ScrubPreviewPanel({
  active,
  size = 'sm',
  hint = 'Touch and drag across the cards to preview — release to open',
}) {
  const [lastActive, setLastActive] = useState(null);

  useEffect(() => {
    if (active) setLastActive(active);
  }, [active]);

  const display = active || lastActive;
  const isLg = size === 'lg';

  return (
    <div
      className={`relative flex-shrink-0 mb-2 rounded-2xl border-2 border-primary-600/40 bg-warm-100/90 shadow-sm overflow-hidden ${
        isLg ? 'min-h-[7.5rem] px-5 py-4' : 'h-20 px-4'
      }`}
    >
      {/* Idle hint */}
      <div
        className={`absolute inset-0 flex items-center justify-center px-4 transition-opacity duration-200 ${
          active ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <p className={`text-zinc-500 font-medium text-center leading-snug ${isLg ? 'text-xs' : 'text-[11px]'}`}>
          {hint}
        </p>
      </div>

      {/* Active preview */}
      <div
        className={`absolute inset-0 flex items-center transition-opacity duration-200 ${
          isLg ? 'gap-4 px-5' : 'gap-3 px-4'
        } ${active ? 'opacity-100' : 'opacity-0'}`}
      >
        {display && (
          <>
            <span
              className={`flex items-center justify-center rounded-xl text-white flex-shrink-0 ${display.iconBg} ${
                isLg ? 'w-14 h-14' : 'w-12 h-12'
              }`}
            >
              {display.icon}
            </span>
            <div className="min-w-0 text-left">
              <p
                className={`font-bold text-black leading-tight ${
                  isLg ? 'text-base mb-1.5' : 'text-sm truncate'
                }`}
              >
                {display.title}
              </p>
              <p
                className={`text-zinc-600 leading-snug ${
                  isLg ? 'text-[13px] line-clamp-4' : 'text-[11px] line-clamp-2'
                }`}
              >
                {display.description}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
