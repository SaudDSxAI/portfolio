import { RankLeaderboard, MosaicConfusion, TornadoChart } from './shared';

export default function ChurnResults({ study, theme }) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-heading font-bold text-black mb-1">Model leaderboard</h2>
        <p className="text-sm text-zinc-600 mb-4">Benchmarked under identical conditions, ranked by ROC-AUC.</p>
        <RankLeaderboard data={study.modelComparison} metricKey="rocAuc" metricLabel="ROC-AUC" theme={theme} />
      </div>

      {study.confusionMatrix && (
        <div>
          <h2 className="text-lg font-heading font-bold text-black mb-3">Where it gets it right and wrong</h2>
          <MosaicConfusion cm={study.confusionMatrix} labels={study.confusionMatrixLabels} theme={theme} />
        </div>
      )}

      {study.featureImportance && (
        <div>
          <h2 className="text-lg font-heading font-bold text-black mb-1">What drives the prediction</h2>
          <p className="text-sm text-zinc-600 mb-4">Each bar shows a feature pulling the prediction toward "stays" or "churns."</p>
          <TornadoChart data={study.featureImportance} theme={theme} />
        </div>
      )}
    </div>
  );
}
