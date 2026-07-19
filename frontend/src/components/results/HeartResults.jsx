import { HeadToHead, MosaicConfusion, SignedBarList } from './shared';

export default function HeartResults({ study, theme }) {
  const [lr, rf] = study.modelComparison;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-heading font-bold text-black mb-1">A statistical tie, not a clean win</h2>
        <p className="text-sm text-zinc-600 mb-4">A paired t-test across cross-validation folds found no significant difference between the two.</p>
        <HeadToHead
          theme={theme}
          ribbon="p = 0.419, not statistically significant"
          left={{
            name: lr.name,
            chosen: lr.chosen,
            stats: [
              { label: 'ROC-AUC', value: `${lr.rocAuc}%` },
              { label: 'F1 score', value: `${lr.f1}%` },
            ],
          }}
          right={{
            name: rf.name,
            chosen: rf.chosen,
            stats: [
              { label: 'ROC-AUC', value: `${rf.rocAuc}%` },
              { label: 'F1 score', value: `${rf.f1}%` },
            ],
          }}
        />
      </div>

      {study.confusionMatrix && (
        <div>
          <h2 className="text-lg font-heading font-bold text-black mb-3">Where it gets it right and wrong</h2>
          <MosaicConfusion cm={study.confusionMatrix} labels={study.confusionMatrixLabels} theme={theme} />
        </div>
      )}

      {study.featureImportance && (
        <div>
          <h2 className="text-lg font-heading font-bold text-black mb-1">Top clinical risk factors</h2>
          <p className="text-sm text-zinc-600 mb-4">Ranked by how strongly each one moves the prediction.</p>
          <SignedBarList data={study.featureImportance} theme={theme} />
        </div>
      )}
    </div>
  );
}
