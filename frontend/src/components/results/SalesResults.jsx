import { SeasonalBars, DotPlot } from './shared';

export default function SalesResults({ study, theme }) {
  return (
    <div className="space-y-8">
      {study.featureImportance && (
        <div>
          <h2 className="text-lg font-heading font-bold text-black mb-1">Which months push sales up or down</h2>
          <p className="text-sm text-zinc-600 mb-4">Holiday months pull sales well above trend; February is reliably the weakest month.</p>
          <SeasonalBars data={study.featureImportance} theme={theme} />
        </div>
      )}

      <div>
        <h2 className="text-lg font-heading font-bold text-black mb-1">Three approaches, nearly tied</h2>
        <p className="text-sm text-zinc-600 mb-4">Prophet and SARIMA landed within $100 of each other; the deployed model matches both at a fraction of the dependency weight.</p>
        <DotPlot data={study.modelComparison} metricKey="accuracy" metricLabel="Forecast accuracy" theme={theme} />
      </div>
    </div>
  );
}
