import { MosaicConfusion } from './shared';

export default function AnomalyResults({ study, theme }) {
  const fm = study.finalMetrics || {};

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-heading font-bold text-black mb-1">Catching intrusions it was never shown</h2>
        <p className="text-sm text-zinc-600 mb-4">
          No attack ever entered training. Only normal traffic. Anything that reconstructs badly gets flagged.
          {fm.precision != null && fm.f1 != null && (
            <> When it flags something, it's right {(fm.precision * 100).toFixed(1)}% of the time (F1 {fm.f1.toFixed(3)}).</>
          )}
        </p>
        {study.confusionMatrix && (
          <MosaicConfusion cm={study.confusionMatrix} labels={study.confusionMatrixLabels} theme={theme} />
        )}
      </div>
    </div>
  );
}
