import { RadialCompare } from './shared';

export default function HseResults({ study, theme }) {
  const categories = study.complianceFields || [];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-heading font-bold text-black mb-1">A live score, rolled up from real daily logs</h2>
        <p className="text-sm text-zinc-600 mb-4">
          One example project from the live deployment, currently rated "Excellent."
        </p>
        <RadialCompare
          data={[{ name: 'Example project score', score: 90, chosen: true }]}
          metricKey="score"
          metricLabel="Performance score"
          theme={theme}
        />
      </div>

      {categories.length > 0 && (
        <div>
          <h2 className="text-lg font-heading font-bold text-black mb-1">What the 30 daily fields actually cover</h2>
          <p className="text-sm text-zinc-600 mb-4">Real construction-site HSE practices, not a generic checklist.</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <span key={c} className={`text-xs font-medium px-3 py-1.5 rounded-full ${theme.badge}`}>
                {c}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
