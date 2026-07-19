import { FunnelBars, RankLeaderboard } from './shared';

export default function FraudResults({ study, theme }) {
  const cm = study.confusionMatrix;
  const total = cm.tn + cm.fp + cm.fn + cm.tp;
  const flagged = cm.fp + cm.tp;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-heading font-bold text-black mb-1">From every transaction to the fraud actually caught</h2>
        <p className="text-sm text-zinc-600 mb-4">On the held-out test set, most transactions are legitimate, so this narrows fast.</p>
        <FunnelBars
          theme={theme}
          steps={[
            { label: 'Test transactions', value: total },
            { label: 'Flagged as fraud', value: flagged },
            { label: 'Real fraud, correctly caught', value: cm.tp },
          ]}
        />
      </div>

      <div>
        <h2 className="text-lg font-heading font-bold text-black mb-1">Imbalance-handling techniques compared</h2>
        <p className="text-sm text-zinc-600 mb-4">Ranked by PR-AUC, the honest metric here, since ROC-AUC stays high even with many false alarms.</p>
        <RankLeaderboard data={study.modelComparison} metricKey="prAuc" metricLabel="PR-AUC" theme={theme} />
      </div>
    </div>
  );
}
