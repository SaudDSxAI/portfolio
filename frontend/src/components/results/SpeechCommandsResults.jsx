import { useState, useRef } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { StatStrip } from './shared';
import { Play, Pause, Check, X } from 'lucide-react';

function AudioRow({ example, theme }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  return (
    <div className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${example.correct ? 'border-black/10 bg-white/50' : 'border-amber-300 bg-amber-50'}`}>
      <button
        onClick={toggle}
        className={`flex items-center justify-center w-9 h-9 rounded-full flex-shrink-0 text-white transition-transform hover:scale-105 ${theme.iconBg}`}
        aria-label="play"
      >
        {playing ? <Pause className="w-4 h-4" strokeWidth={2.5} /> : <Play className="w-4 h-4 ml-0.5" strokeWidth={2.5} />}
      </button>
      <audio
        ref={audioRef}
        src={example.file}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-black">said "{example.trueLabel}"</div>
        <div className="text-[11px] text-zinc-500">
          model heard "{example.predLabel}" &middot; {(example.confidence * 100).toFixed(1)}% confidence
        </div>
      </div>
      {example.correct ? (
        <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" strokeWidth={2.5} />
      ) : (
        <X className="w-5 h-5 text-amber-600 flex-shrink-0" strokeWidth={2.5} />
      )}
    </div>
  );
}

export default function SpeechCommandsResults({ study, theme }) {
  const history = study.trainingHistory;
  const curveData = history
    ? history.epochs.map((e, i) => ({
        epoch: e,
        trainAcc: +(history.train_acc[i] * 100).toFixed(1),
        valAcc: +(history.val_acc[i] * 100).toFixed(1),
      }))
    : [];

  return (
    <div className="space-y-8">
      <StatStrip metrics={study.heroMetrics} />

      <div>
        <h2 className="text-lg font-heading font-bold text-black mb-1">Accuracy by word, on the held-out test set</h2>
        <p className="text-sm text-zinc-600 mb-4">4,874 real test clips the model never trained or validated on. Silence is perfect; "unknown" (the catch-all bucket of other words) is the hardest.</p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={study.perClassAccuracy} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e3d8c6" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#585b3c' }} />
            <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: '#585b3c' }} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              formatter={(v, name, props) => [`${v}% (${props.payload.correct}/${props.payload.total})`, 'Accuracy']}
              contentStyle={{ background: '#fff', border: '1px solid #e3d8c6', borderRadius: 10 }}
            />
            <Bar dataKey="accuracyPct" radius={[4, 4, 0, 0]}>
              {study.perClassAccuracy?.map((d, i) => (
                <Cell key={i} fill={d.label === 'silence' ? theme.chartChosen : theme.chartOther} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {curveData.length > 0 && (
        <div>
          <h2 className="text-lg font-heading font-bold text-black mb-1">Training curve, 10 real epochs</h2>
          <p className="text-sm text-zinc-600 mb-4">Train and validation accuracy stay close together, no runaway overfitting. Best checkpoint (epoch 9, {history.best_val_acc}% val accuracy) is what's evaluated everywhere else on this page.</p>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={curveData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e3d8c6" vertical={false} />
              <XAxis dataKey="epoch" tick={{ fontSize: 11, fill: '#585b3c' }} label={{ value: 'Epoch', position: 'insideBottom', offset: -3, fontSize: 11, fill: '#585b3c' }} />
              <YAxis domain={[70, 100]} tick={{ fontSize: 11, fill: '#585b3c' }} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background: '#fff', border: '1px solid #e3d8c6', borderRadius: 10 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="trainAcc" name="Train accuracy" stroke={theme.chartOther} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="valAcc" name="Val accuracy" stroke={theme.chartChosen} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {study.topConfusions?.length > 0 && (
        <div>
          <h2 className="text-lg font-heading font-bold text-black mb-1">Where it actually gets confused</h2>
          <p className="text-sm text-zinc-600 mb-4">Real mistakes from the test set, not hypothetical ones. Mostly rhyming or acoustically similar words.</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {study.topConfusions.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-sm rounded-lg border border-black/10 bg-white/50 px-3 py-2">
                <span className="text-zinc-700">
                  "<span className="font-semibold text-black">{c.true}</span>" heard as "<span className="font-semibold text-black">{c.pred}</span>"
                </span>
                <span className="text-xs font-semibold text-zinc-500">{c.count}x</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {study.demoExamples?.length > 0 && (
        <div>
          <h2 className="text-lg font-heading font-bold text-black mb-1">Hear it for yourself</h2>
          <p className="text-sm text-zinc-600 mb-4">Real clips from the test set, run through the trained model. Includes one real mistake, not just the wins.</p>
          <div className="grid sm:grid-cols-2 gap-2.5">
            {study.demoExamples.map((ex, i) => (
              <AudioRow key={i} example={ex} theme={theme} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
