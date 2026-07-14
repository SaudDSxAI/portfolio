import { useEffect, useRef, useState } from 'react';

// SmartNest doesn't have a public server to hit (it's a home Arduino on a
// private WiFi network), so unlike the other live demos this isn't fetching
// real data — it's a client-side simulation of the same dashboard, running
// the exact same auto-mode logic the real Arduino firmware runs. Clearly
// labeled as simulated rather than pretending to be a live connection.

const DEVICES = [
  { id: 0, name: 'B1', sub: 'Smoke' },
  { id: 1, name: 'B2', sub: 'Humidity' },
  { id: 2, name: 'B3', sub: 'Temp' },
  { id: 3, name: 'B4', sub: 'Light' },
  { id: 4, name: 'Fan', sub: 'Manual only' },
];

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

// Small random walk so values drift like real sensor noise instead of
// jumping around or sitting perfectly flat.
function drift(value, delta, lo, hi) {
  return clamp(value + (Math.random() - 0.5) * delta, lo, hi);
}

export default function SmartNestLiveDemo() {
  const [temp, setTemp] = useState(27);
  const [hum, setHum] = useState(55);
  const [lux, setLux] = useState(420);
  const [smoke, setSmoke] = useState(80);
  const [relays, setRelays] = useState([false, false, false, false, false]);
  const [autoMode, setAutoMode] = useState(true);
  const [thresholds, setThresholds] = useState({ lux: 500, temp: 30, smoke: 512, hum: 80 });
  const pendingRef = useRef(new Set());

  // Simulated sensor drift, same 2s cadence the real dashboard polls at.
  useEffect(() => {
    const interval = setInterval(() => {
      setTemp((t) => drift(t, 1.2, 18, 42));
      setHum((h) => drift(h, 2.5, 25, 95));
      setLux((l) => drift(l, 60, 0, 1000));
      setSmoke((s) => drift(s, 15, 0, 1023));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Same auto-mode rule set as the Arduino firmware: fan (index 4) is
  // deliberately excluded from auto mode, manual only.
  useEffect(() => {
    if (!autoMode) return;
    setRelays((prev) => {
      const next = [...prev];
      if (!pendingRef.current.has(0)) next[0] = smoke > thresholds.smoke;
      if (!pendingRef.current.has(1)) next[1] = hum > thresholds.hum;
      if (!pendingRef.current.has(2)) next[2] = temp > thresholds.temp;
      if (!pendingRef.current.has(3)) next[3] = lux < thresholds.lux;
      return next;
    });
  }, [autoMode, smoke, hum, temp, lux, thresholds]);

  const toggleRelay = (id) => {
    if (id !== 4 && autoMode) return; // locked while auto mode owns it
    setRelays((prev) => {
      const next = [...prev];
      next[id] = !next[id];
      return next;
    });
  };

  const luxPct = (lux / 1000) * 100;
  const smokePct = (smoke / 1023) * 100;
  const smokeAlert = smokePct >= 13;

  return (
    <div>
      <p className="text-xs text-zinc-500 mb-4">
        SmartNest runs on a home WiFi network, so this can't connect to the real device — this is a
        client-side simulation running the exact same auto-mode rules as the actual Arduino firmware, with
        sensor values drifting on their own. Toggle Auto off to control devices manually.
      </p>

      <div className="rounded-2xl overflow-hidden border border-black/10 shadow-lg" style={{ background: '#0b0e14' }}>
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            <span className="text-white font-heading font-bold text-sm">SmartNest</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 text-[10px] font-semibold uppercase tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              Simulated
            </span>
            <label className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-semibold uppercase tracking-wide text-zinc-300 cursor-pointer">
              Auto
              <input
                type="checkbox"
                checked={autoMode}
                onChange={(e) => setAutoMode(e.target.checked)}
                className="accent-sky-500"
              />
            </label>
          </div>
        </div>

        {smokeAlert && (
          <div className="mx-5 mt-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs">
            Smoke level elevated — check environment
          </div>
        )}

        {/* Sensors */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-5">
          {[
            { label: 'Temp', value: temp.toFixed(1), unit: '°C', pct: (temp / 50) * 100, color: '#f87171' },
            { label: 'Humidity', value: hum.toFixed(1), unit: '%', pct: hum, color: '#38bdf8' },
            { label: 'Light', value: luxPct.toFixed(0), unit: '%', pct: luxPct, color: '#facc15' },
            { label: 'Smoke', value: smokePct.toFixed(0), unit: '%', pct: smokePct, color: '#a78bfa' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-white/5 border border-white/10 p-3" style={{ borderLeft: `3px solid ${s.color}` }}>
              <div className="text-[10px] uppercase tracking-wide text-zinc-400 mb-1">{s.label}</div>
              <div className="text-white font-heading font-bold text-lg mb-2">
                {s.value}<span className="text-xs text-zinc-500 ml-0.5">{s.unit}</span>
              </div>
              <div className="h-1 rounded-full bg-white/10">
                <div className="h-full rounded-full transition-all" style={{ width: `${clamp(s.pct, 0, 100)}%`, background: s.color }} />
              </div>
            </div>
          ))}
        </div>

        {/* Devices */}
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3 px-5 pb-5">
          {DEVICES.map((d) => {
            const on = relays[d.id];
            const locked = d.id !== 4 && autoMode;
            return (
              <button
                key={d.id}
                onClick={() => toggleRelay(d.id)}
                disabled={locked}
                className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all ${
                  on ? 'bg-sky-500/15 border-sky-500/40' : 'bg-white/5 border-white/10'
                } ${locked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-white/25'}`}
              >
                <span className={`text-xs font-semibold ${on ? 'text-sky-300' : 'text-zinc-300'}`}>{d.name}</span>
                <span className="text-[10px] text-zinc-500">{d.sub}</span>
                <span className={`mt-1 w-8 h-4 rounded-full relative transition-colors ${on ? 'bg-sky-500' : 'bg-white/15'}`}>
                  <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
                </span>
              </button>
            );
          })}
        </div>

        {/* Thresholds */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-5 pb-5">
          {[
            { key: 'lux', label: 'Light', unit: '%', min: 0, max: 100 },
            { key: 'temp', label: 'Temp', unit: '°C', min: 20, max: 50 },
            { key: 'smoke', label: 'Smoke', unit: '%', min: 0, max: 100 },
            { key: 'hum', label: 'Humidity', unit: '%', min: 0, max: 100 },
          ].map((t) => {
            const displayVal = t.key === 'lux' || t.key === 'smoke'
              ? Math.round((thresholds[t.key] / (t.key === 'lux' ? 1000 : 1023)) * 100)
              : thresholds[t.key];
            return (
              <div key={t.key} className="rounded-xl bg-white/5 border border-white/10 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-wide text-zinc-400">{t.label}</span>
                  <span className="text-xs font-semibold text-sky-300">{displayVal}{t.unit}</span>
                </div>
                <input
                  type="range"
                  min={t.min}
                  max={t.max}
                  value={displayVal}
                  onChange={(e) => {
                    const raw = Number(e.target.value);
                    const converted = t.key === 'lux' ? (raw / 100) * 1000 : t.key === 'smoke' ? (raw / 100) * 1023 : raw;
                    setThresholds((prev) => ({ ...prev, [t.key]: converted }));
                  }}
                  className="w-full accent-sky-500"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
