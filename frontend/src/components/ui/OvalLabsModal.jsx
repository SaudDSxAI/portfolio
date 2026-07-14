import { useEffect, useState } from 'react';

const OVAL_LABS_URL = 'https://ovallabs.org';

/**
 * "What is Oval Labs?" popup — embeds ovallabs.org inside the portfolio via
 * iframe instead of sending the visitor away to a new tab. Some sites block
 * being framed (X-Frame-Options / CSP frame-ancestors); there's no reliable
 * cross-origin way to detect that from JS, so a "having trouble?" fallback
 * link is always shown as a safety net rather than trying to guess.
 */
export default function OvalLabsModal({ open, onClose }) {
  const [loaded, setLoaded] = useState(false);
  const [slow, setSlow] = useState(false);

  // Reset load state each time the modal reopens, and let Escape close it.
  useEffect(() => {
    if (!open) return;
    setLoaded(false);
    setSlow(false);
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';

    // ovallabs.org is a heavy marketing page (fonts, animations, embeds) —
    // if it hasn't finished loading after a few seconds, stop making the
    // visitor stare at a spinner and offer the direct link instead. The
    // iframe keeps trying in the background either way.
    const slowTimer = window.setTimeout(() => setSlow(true), 5000);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      window.clearTimeout(slowTimer);
    };
    // Intentionally NOT depending on `onClose` — Hero re-renders constantly
    // (the typewriter role text updates every ~50ms), which would create a
    // new onClose reference on every render. If that were a dependency here,
    // this effect would re-run on every single Hero re-render, wiping
    // `loaded`/`slow` back to their initial state each time — which is
    // exactly why the modal looked like it "loaded for a second then went
    // back to loading forever." Keying this only on `open` means it runs
    // once when the modal opens and leaves the load state alone after that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="About Oval Labs"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-4xl h-[85vh] bg-warm-50 rounded-2xl border border-black/10 shadow-2xl overflow-hidden flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-black/10 bg-warm-100/80">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0" />
            <span className="text-sm font-semibold text-black truncate">Oval Labs</span>
            <span className="text-xs text-zinc-500 hidden sm:inline truncate">ovallabs.org</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <a
              href={OVAL_LABS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-zinc-600 hover:text-primary-800 underline underline-offset-2"
            >
              Trouble viewing? Open directly ↗
            </a>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-600 hover:text-black hover:bg-black/5 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="relative flex-1 bg-white">
          {!loaded && !slow && (
            <div className="absolute inset-0 flex items-center justify-center text-zinc-500 text-sm gap-2 bg-white">
              <span className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              Loading Oval Labs...
            </div>
          )}
          {!loaded && slow && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-6 bg-white">
              <span className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-zinc-600 max-w-xs">
                Oval Labs is taking a while to load in here. You can keep
                waiting, or jump straight there instead.
              </p>
              <a
                href={OVAL_LABS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 rounded-xl transition-all duration-300"
              >
                Open ovallabs.org ↗
              </a>
            </div>
          )}
          <iframe
            src={OVAL_LABS_URL}
            title="Oval Labs"
            className="w-full h-full border-0"
            onLoad={() => setLoaded(true)}
          />
        </div>
      </div>
    </div>
  );
}
