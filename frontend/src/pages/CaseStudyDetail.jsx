import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList,
} from 'recharts';
import TechBadge from '../components/ui/TechBadge';
import ChurnLiveDemo from '../components/demos/ChurnLiveDemo';
import HeartLiveDemo from '../components/demos/HeartLiveDemo';
import FraudLiveDemo from '../components/demos/FraudLiveDemo';
import ScrollReveal from '../components/ui/ScrollReveal';
import { getCaseStudy, categories } from '../data/caseStudies';

// Each case study that has hasLiveDemo:true also sets demoKey to pick which
// widget renders — add a new entry here whenever a new project ships its
// own live demo component.
const DEMO_COMPONENTS = {
  churn: ChurnLiveDemo,
  heart: HeartLiveDemo,
  fraud: FraudLiveDemo,
};

function MetricCard({ label, value }) {
  return (
    <div className="bg-warm-100/90 border border-black/10 rounded-2xl p-5 text-center">
      <div className="text-2xl md:text-3xl font-heading font-bold text-black">{value}</div>
      <div className="text-xs text-zinc-600 mt-1 uppercase tracking-wide">{label}</div>
    </div>
  );
}

function ModelComparisonChart({ data, metricKey = 'rocAuc', metricLabel = 'ROC-AUC' }) {
  // Zoom the axis into the range that actually contains the data instead of
  // forcing 0–100 — these models sit within a few points of each other,
  // which is real, meaningful separation (it's the whole evidence for the
  // model choice), but a 0–100 axis flattens it into invisibility. Padding
  // of ~4 points on each side keeps bars readable without exaggerating it.
  const values = data.map((d) => d[metricKey]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const domain = [Math.max(0, Math.floor(min - 4)), Math.ceil(max + 4)];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 24, right: 20, left: 0, bottom: 30 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e3d8c6" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#585b3c' }} angle={-15} textAnchor="end" height={50} />
        <YAxis tick={{ fontSize: 11, fill: '#585b3c' }} unit="%" domain={domain} />
        <Tooltip
          formatter={(v) => `${v}%`}
          contentStyle={{ background: '#fff', border: '1px solid #e3d8c6', borderRadius: 10 }}
        />
        <Bar dataKey={metricKey} name={metricLabel} radius={[6, 6, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.chosen ? '#41432d' : '#dfe2bb'} />
          ))}
          <LabelList
            dataKey={metricKey}
            position="top"
            formatter={(v) => `${v}%`}
            style={{ fontSize: 12, fontWeight: 700, fill: '#2c2e20' }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function FeatureImportanceChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e3d8c6" />
        <XAxis type="number" tick={{ fontSize: 11, fill: '#585b3c' }} />
        <YAxis dataKey="feature" type="category" width={170} tick={{ fontSize: 11, fill: '#41432d' }} />
        <Tooltip formatter={(v) => v.toFixed(3)} contentStyle={{ background: '#fff', border: '1px solid #e3d8c6', borderRadius: 10 }} />
        <Bar dataKey="coefficient" radius={[0, 6, 6, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.coefficient >= 0 ? '#b45309' : '#585b3c'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function ConfusionMatrix({ cm }) {
  const total = cm.tn + cm.fp + cm.fn + cm.tp;
  const cells = [
    { value: cm.tn, label: 'Correctly predicted stay', tone: 'good' },
    { value: cm.fp, label: 'False alarms', tone: 'bad' },
    { value: cm.fn, label: 'Missed churners', tone: 'bad' },
    { value: cm.tp, label: 'Correctly caught churners', tone: 'good' },
  ];
  return (
    <div>
      <p className="text-sm text-zinc-600 mb-4">On {total} held-out test customers.</p>
      <div className="grid grid-cols-2 gap-3">
        {cells.map((c, i) => (
          <div
            key={i}
            className={`rounded-xl p-4 text-center border ${
              c.tone === 'good'
                ? 'bg-primary-100/60 border-primary-400/40'
                : 'bg-amber-100/60 border-amber-400/40'
            }`}
          >
            <div className="text-xl font-heading font-bold text-black">{c.value}</div>
            <div className="text-[11px] text-zinc-600 mt-1">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CaseStudyDetail() {
  const { category, slug } = useParams();
  const navigate = useNavigate();
  const study = getCaseStudy(category, slug);
  const meta = categories[category];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!study) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <p className="text-zinc-600 mb-4">Case study not found.</p>
        <Link to={`/${category}`} className="text-primary-700 font-semibold hover:text-primary-900">
          ← Back to {meta?.label || 'projects'}
        </Link>
      </div>
    );
  }

  return (
    <article className="relative py-28 px-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(`/${category}`)}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-600 hover:text-primary-800 transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to {meta?.label}
        </button>

        {/* Hero */}
        <ScrollReveal>
          <div className="text-[11px] font-semibold text-primary-700 uppercase tracking-[0.25em] mb-3">
            {meta?.label} Case Study
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-black mb-4 tracking-tight leading-[1.05]">
            {study.title}
          </h1>
          <p className="text-lg text-zinc-700 leading-relaxed mb-6 max-w-3xl">{study.tagline}</p>

          <div className="flex items-center gap-4 mb-10">
            {study.github && (
              <a
                href={study.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white text-sm font-semibold hover:bg-zinc-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                Code
              </a>
            )}
            {study.live && (
              <a
                href={study.live}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white text-sm font-semibold shadow-md shadow-primary-500/25 hover:shadow-lg transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                Live demo
              </a>
            )}
          </div>
        </ScrollReveal>

        {/* Hero metrics */}
        <ScrollReveal delay={100}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-14">
            {study.heroMetrics.map((m) => (
              <MetricCard key={m.label} {...m} />
            ))}
          </div>
        </ScrollReveal>

        {/* Live demo */}
        {study.hasLiveDemo && DEMO_COMPONENTS[study.demoKey] && (
          <ScrollReveal delay={150}>
            <div className="mb-14">
              <h2 className="text-lg font-heading font-bold text-black mb-1">Try it live</h2>
              <p className="text-sm text-zinc-600 mb-4">
                Build a profile, pick a model, and see the real prediction — not a mockup.
              </p>
              {(() => {
                const DemoComponent = DEMO_COMPONENTS[study.demoKey];
                return <DemoComponent />;
              })()}
            </div>
          </ScrollReveal>
        )}

        {/* Narrative */}
        <div className="space-y-10 mb-14">
          {study.narrative.map((section, i) => (
            <ScrollReveal key={section.heading} delay={i * 60}>
              <div>
                <h2 className="text-xl font-heading font-bold text-black mb-3">{section.heading}</h2>
                <p className="text-zinc-700 leading-relaxed">{section.body}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Charts */}
        {study.modelComparison && (
          <ScrollReveal>
            <div className="bg-warm-100/60 border border-black/10 rounded-2xl p-6 mb-8">
              <h2 className="text-lg font-heading font-bold text-black mb-1">Model comparison</h2>
              <p className="text-sm text-zinc-600 mb-4">
                Benchmarked under identical conditions — the highlighted bar is the model that was chosen, on evidence.
              </p>
              <ModelComparisonChart
                data={study.modelComparison}
                metricKey={study.comparisonMetricKey || 'rocAuc'}
                metricLabel={study.comparisonMetricLabel || 'ROC-AUC'}
              />
            </div>
          </ScrollReveal>
        )}

        {study.confusionMatrix && (
          <ScrollReveal>
            <div className="bg-warm-100/60 border border-black/10 rounded-2xl p-6 mb-8">
              <h2 className="text-lg font-heading font-bold text-black mb-4">Confusion matrix</h2>
              <ConfusionMatrix cm={study.confusionMatrix} />
            </div>
          </ScrollReveal>
        )}

        {study.featureImportance && (
          <ScrollReveal>
            <div className="bg-warm-100/60 border border-black/10 rounded-2xl p-6 mb-8">
              <h2 className="text-lg font-heading font-bold text-black mb-1">What drives the outcome</h2>
              <p className="text-sm text-zinc-600 mb-4">Model coefficients — positive pushes toward the predicted outcome, negative pushes away.</p>
              <FeatureImportanceChart data={study.featureImportance} />
            </div>
          </ScrollReveal>
        )}

        {/* Tech stack */}
        {study.tech?.length > 0 && (
          <ScrollReveal>
            <div className="mb-10">
              <h2 className="text-lg font-heading font-bold text-black mb-3">Tech stack</h2>
              <div className="flex flex-wrap gap-2">
                {study.tech.map((t) => (
                  <TechBadge key={t} name={t} />
                ))}
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Skills demonstrated */}
        {study.skillsDemonstrated?.length > 0 && (
          <ScrollReveal>
            <div className="bg-black text-white rounded-2xl p-6 md:p-8">
              <h2 className="text-lg font-heading font-bold mb-4">Skills demonstrated</h2>
              <ul className="space-y-3">
                {study.skillsDemonstrated.map((skill, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-zinc-200 leading-relaxed">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>
        )}
      </div>
    </article>
  );
}
