import { SparsityGrid, DotPlot } from './shared';

export default function MovieResults({ study, theme }) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-heading font-bold text-black mb-1">A matrix that's almost entirely empty</h2>
        <p className="text-sm text-zinc-600 mb-4">Each user has rated under 2% of all movies. The model has to fill in the rest.</p>
        <SparsityGrid filledPct={1.7} theme={theme} />
      </div>

      <div>
        <h2 className="text-lg font-heading font-bold text-black mb-1">A win that barely counts as one</h2>
        <p className="text-sm text-zinc-600 mb-4">SVD beat a plain averages-only baseline by a razor-thin margin, and clearly beat a similar-users approach.</p>
        <DotPlot data={study.modelComparison} metricKey="accuracy" metricLabel="Rating accuracy" theme={theme} />
      </div>
    </div>
  );
}
