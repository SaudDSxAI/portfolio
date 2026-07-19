import { HeadToHead, MosaicConfusion } from './shared';

export default function SentimentResults({ study, theme }) {
  const [baseline, lstm] = study.modelComparison;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-heading font-bold text-black mb-1">The simple baseline actually won</h2>
        <p className="text-sm text-zinc-600 mb-4">
          A classical TF-IDF + Logistic Regression model beat the deep learning model on accuracy. The LSTM is
          still what's deployed below, since the point was proving out transfer learning with pretrained
          embeddings, not chasing the top score.
        </p>
        <HeadToHead
          theme={theme}
          ribbon="Baseline wins on accuracy, deployed anyway to demonstrate the technique"
          left={{
            name: baseline.name,
            chosen: false,
            stats: [{ label: 'Accuracy', value: `${baseline.accuracy}%` }],
          }}
          right={{
            name: lstm.name,
            chosen: true,
            stats: [{ label: 'Accuracy', value: `${lstm.accuracy}%` }],
          }}
        />
      </div>

      {study.confusionMatrix && (
        <div>
          <h2 className="text-lg font-heading font-bold text-black mb-3">Where the LSTM gets it right and wrong</h2>
          <MosaicConfusion cm={study.confusionMatrix} labels={study.confusionMatrixLabels} theme={theme} />
        </div>
      )}
    </div>
  );
}
