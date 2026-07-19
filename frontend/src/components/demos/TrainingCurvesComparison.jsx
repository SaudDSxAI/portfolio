import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Real numbers from both training runs — shown side by side specifically so
// the contrast is visible at a glance: one clean, steadily-improving curve
// vs. two competing curves that don't move together in any simple way.
const ddpmData = [
  { epoch: 1, train: 0.0506, val: 0.0331 },
  { epoch: 2, train: 0.0330, val: 0.0321 },
  { epoch: 3, train: 0.0310, val: 0.0310 },
  { epoch: 4, train: 0.0301, val: 0.0296 },
  { epoch: 5, train: 0.0294, val: 0.0284 },
  { epoch: 6, train: 0.0286, val: 0.0271 },
  { epoch: 7, train: 0.0285, val: 0.0277 },
  { epoch: 8, train: 0.0281, val: 0.0302 },
  { epoch: 9, train: 0.0280, val: 0.0271 },
  { epoch: 10, train: 0.0275, val: 0.0274 },
];

const ganData = [
  { epoch: 1, generator: 2.786, discriminator: 0.310 },
  { epoch: 2, generator: 3.071, discriminator: 0.211 },
  { epoch: 3, generator: 2.888, discriminator: 0.294 },
  { epoch: 4, generator: 2.844, discriminator: 0.299 },
  { epoch: 5, generator: 2.766, discriminator: 0.339 },
  { epoch: 6, generator: 2.911, discriminator: 0.312 },
  { epoch: 7, generator: 2.903, discriminator: 0.311 },
  { epoch: 8, generator: 2.966, discriminator: 0.311 },
  { epoch: 9, generator: 3.037, discriminator: 0.310 },
  { epoch: 10, generator: 3.178, discriminator: 0.272 },
];

export default function TrainingCurvesComparison() {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-white/70 border border-black/10 rounded-2xl p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-violet-700 mb-1">Diffusion (DDPM)</p>
        <p className="text-[11px] text-zinc-500 mb-4">One simple loss, tracks quality reliably — best epoch (6) is visibly the low point.</p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={ddpmData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis dataKey="epoch" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="train" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} name="train loss" />
            <Line type="monotone" dataKey="val" stroke="#c4b5fd" strokeWidth={2} dot={{ r: 3 }} name="val loss" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white/70 border border-black/10 rounded-2xl p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-violet-700 mb-1">GAN</p>
        <p className="text-[11px] text-zinc-500 mb-4">Two competing losses — generator loss trends up even as real image quality improved.</p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={ganData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis dataKey="epoch" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="generator" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} name="generator loss" />
            <Line type="monotone" dataKey="discriminator" stroke="#c4b5fd" strokeWidth={2} dot={{ r: 3 }} name="discriminator loss" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
