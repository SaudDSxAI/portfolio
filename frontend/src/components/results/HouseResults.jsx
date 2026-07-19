import { RadialCompare, SignedBarList } from './shared';

export default function HouseResults({ study, theme }) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-heading font-bold text-black mb-1">How much each model explains</h2>
        <p className="text-sm text-zinc-600 mb-4">R²: the share of price variation each model accounts for. Lasso was chosen despite XGBoost's small numeric edge, since a paired test found no significant difference.</p>
        <RadialCompare data={study.modelComparison} metricKey="r2" metricLabel="R²" theme={theme} />
      </div>

      {study.featureImportance && (
        <div>
          <h2 className="text-lg font-heading font-bold text-black mb-1">Top price drivers</h2>
          <p className="text-sm text-zinc-600 mb-4">The features that move predicted price the most.</p>
          <SignedBarList data={study.featureImportance} theme={theme} />
        </div>
      )}
    </div>
  );
}
