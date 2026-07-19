import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Real numbers from both training runs, same 4 epochs, same data split
// (same random seed), so this is a genuinely fair side-by-side.
const fullFinetuneData = [
  { epoch: 1, train: 3.7338, val: 3.4979 },
  { epoch: 2, train: 3.4266, val: 3.4401 },
  { epoch: 3, train: 3.2771, val: 3.4154 },
  { epoch: 4, train: 3.1513, val: 3.4087 },
];

const loraData = [
  { epoch: 1, train: 3.9865, val: 3.7223 },
  { epoch: 2, train: 3.8003, val: 3.6468 },
  { epoch: 3, train: 3.7280, val: 3.6108 },
  { epoch: 4, train: 3.6833, val: 3.5872 },
];

export default function FinetuneLoraCurves() {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-white/70 border border-black/10 rounded-2xl p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-amber-700 mb-1">Full fine-tune (124M trainable)</p>
        <p className="text-[11px] text-zinc-500 mb-4">Train loss falls much faster than val loss, the overfitting gap that showed up as a real repetition bug at epoch 4.</p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={fullFinetuneData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis dataKey="epoch" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} domain={[3.0, 4.0]} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="train" stroke="#b45309" strokeWidth={2} dot={{ r: 3 }} name="train loss" />
            <Line type="monotone" dataKey="val" stroke="#fde68a" strokeWidth={2} dot={{ r: 3 }} name="val loss" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white/70 border border-black/10 rounded-2xl p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-amber-700 mb-1">LoRA (442K trainable, 0.354%)</p>
        <p className="text-[11px] text-zinc-500 mb-4">Train and val loss stay much closer together, still improving at epoch 4, no plateau, no overfitting gap.</p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={loraData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis dataKey="epoch" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} domain={[3.0, 4.0]} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="train" stroke="#b45309" strokeWidth={2} dot={{ r: 3 }} name="train loss" />
            <Line type="monotone" dataKey="val" stroke="#fde68a" strokeWidth={2} dot={{ r: 3 }} name="val loss" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
