import { useParams } from 'react-router-dom';
import BackButton from '../components/ui/BackButton';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList,
} from 'recharts';
import TechBadge from '../components/ui/TechBadge';
import ChurnLiveDemo from '../components/demos/ChurnLiveDemo';
import HeartLiveDemo from '../components/demos/HeartLiveDemo';
import FraudLiveDemo from '../components/demos/FraudLiveDemo';
import HouseLiveDemo from '../components/demos/HouseLiveDemo';
import SalesLiveDemo from '../components/demos/SalesLiveDemo';
import MovieLiveDemo from '../components/demos/MovieLiveDemo';
import SentimentLiveDemo from '../components/demos/SentimentLiveDemo';
import SmartNestLiveDemo from '../components/demos/SmartNestLiveDemo';
import AgenticChatDemo from '../components/demos/AgenticChatDemo';
import AnomalyLiveDemo from '../components/demos/AnomalyLiveDemo';
import ClipSearchDemo from '../components/demos/ClipSearchDemo';
import MiniLlavaDemo from '../components/demos/MiniLlavaDemo';
import DiffusionGanDemo from '../components/demos/DiffusionGanDemo';
import GPT2LoraDemo from '../components/demos/GPT2LoraDemo';
import RAGComparisonDemo from '../components/demos/RAGComparisonDemo';
import FrozenTrainableDiagram from '../components/demos/FrozenTrainableDiagram';
import TrainingCurvesComparison from '../components/demos/TrainingCurvesComparison';
import FinetuneLoraCurves from '../components/demos/FinetuneLoraCurves';
import ScrollReveal from '../components/ui/ScrollReveal';
import { getCaseStudy, categories } from '../data/caseStudies';
import { getTheme, getIcon } from '../lib/projectTheme';

// Each case study that has hasLiveDemo:true also sets demoKey to pick which
// widget renders — add a new entry here whenever a new project ships its
// own live demo component.
const DEMO_COMPONENTS = {
  churn: ChurnLiveDemo,
  heart: HeartLiveDemo,
  fraud: FraudLiveDemo,
  house: HouseLiveDemo,
  sales: SalesLiveDemo,
  movies: MovieLiveDemo,
  sentiment: SentimentLiveDemo,
  smartnest: SmartNestLiveDemo,
  agenticChat: AgenticChatDemo,
  anomaly: AnomalyLiveDemo,
  clipSearch: ClipSearchDemo,
  miniLlava: MiniLlavaDemo,
  diffusionGan: DiffusionGanDemo,
  gpt2Lora: GPT2LoraDemo,
  ragCompare: RAGComparisonDemo,
};

// A tiny handful of case studies need a genuinely custom architecture visual
// instead of the generic linear ArchitectureDiagram below — set
// study.customArchitecture to one of these keys to opt in.
const CUSTOM_ARCHITECTURE_COMPONENTS = {
  frozenTrainable: FrozenTrainableDiagram,
};

// Same opt-in pattern for the charts section — a few projects have a
// comparison that a generic bar chart can't express (e.g. two full training
// curves side by side). Set study.customChart to one of these keys.
const CUSTOM_CHART_COMPONENTS = {
  trainingCurves: TrainingCurvesComparison,
  finetuneLoraCurves: FinetuneLoraCurves,
};

function MetricCard({ label, value }) {
  return (
    <div className="bg-warm-100/90 border border-black/10 rounded-2xl p-5 text-center">
      <div className="text-2xl md:text-3xl font-heading font-bold text-black">{value}</div>
      <div className="text-xs text-zinc-600 mt-1 uppercase tracking-wide">{label}</div>
    </div>
  );
}

function ModelComparisonChart({ data, metricKey = 'rocAuc', metricLabel = 'ROC-AUC', theme }) {
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
            <Cell key={i} fill={d.chosen ? theme.chartChosen : theme.chartOther} />
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

function FeatureImportanceChart({ data, theme }) {
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
            <Cell key={i} fill={d.coefficient >= 0 ? theme.chartChosen : '#585b3c'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function ConfusionMatrix({ cm, labels }) {
  const total = cm.tn + cm.fp + cm.fn + cm.tp;
  const defaultLabels = {
    tn: 'Correctly predicted negative',
    fp: 'False positives',
    fn: 'False negatives',
    tp: 'Correctly predicted positive',
  };
  const l = { ...defaultLabels, ...labels };
  const cells = [
    { value: cm.tn, label: l.tn, tone: 'good' },
    { value: cm.fp, label: l.fp, tone: 'bad' },
    { value: cm.fn, label: l.fn, tone: 'bad' },
    { value: cm.tp, label: l.tp, tone: 'good' },
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

function ScreenshotGallery({ items, theme }) {
  return (
    <div className="space-y-10">
      {items.map((item, i) => (
        <div key={i}>
          <h3 className="text-base font-heading font-bold text-black mb-1">{item.heading}</h3>
          {item.caption && <p className="text-sm text-zinc-600 mb-3 leading-relaxed">{item.caption}</p>}
          <a
            href={item.image}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-center bg-black/5 rounded-2xl overflow-hidden border border-black/10 ${theme.hoverBorder} hover:shadow-xl ${theme.hoverShadow} transition-all duration-300`}
          >
            {/* Capped height so tall portrait photos (phone shots) don't turn the
                page into an endless scroll of mostly-empty pavement/sky — click
                through to see the full-resolution original. */}
            <img
              src={item.image}
              alt={item.heading}
              className="max-h-[560px] w-auto max-w-full object-contain block"
              loading="lazy"
            />
          </a>
        </div>
      ))}
    </div>
  );
}

// A vertical build-journey timeline — for the rare project (hardware builds,
// mainly) that actually has a chronological "before it existed → it exists →
// it was shown to people" story worth telling as a timeline, instead of a
// flat grid of same-sized photo cards like every other project uses.
function BuildTimeline({ stages, theme }) {
  return (
    <div className="relative">
      <div className="absolute left-[19px] top-2 bottom-2 w-px bg-black/10" aria-hidden />
      <div className="space-y-14">
        {stages.map((s, i) => {
          const imgs = s.images || (s.image ? [s.image] : []);
          return (
            <div key={i} className="relative pl-14">
              <div className={`absolute left-0 top-0 flex items-center justify-center w-10 h-10 rounded-full ${theme.iconBg} text-white text-xs font-heading font-bold shadow-md ${theme.iconShadow} z-10`}>
                {s.stage}
              </div>
              <div className={`text-[11px] font-semibold ${theme.text} uppercase tracking-[0.2em] mb-1`}>
                {s.label}
              </div>
              <h3 className="text-lg font-heading font-bold text-black mb-2">{s.heading}</h3>
              <p className="text-sm text-zinc-700 leading-relaxed mb-4 max-w-2xl">{s.body}</p>
              <div className={`grid gap-3 ${imgs.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} max-w-xl`}>
                {imgs.map((src, j) => (
                  <a
                    key={j}
                    href={src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-center bg-black/5 rounded-xl overflow-hidden border border-black/10 ${theme.hoverBorder} hover:shadow-lg ${theme.hoverShadow} transition-all duration-300`}
                  >
                    <img src={src} alt={s.heading} className="max-h-[420px] w-auto max-w-full object-contain block" loading="lazy" />
                  </a>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Three connected boxes instead of narrative prose — for projects whose
// architecture is genuinely simple enough that a diagram says it faster
// and more accurately than paragraphs would.
function ArchitectureDiagram({ nodes, theme }) {
  return (
    <div className="flex flex-col md:flex-row items-stretch gap-3">
      {nodes.map((node, i) => (
        <div key={i} className="flex items-center flex-1">
          <div className={`flex-1 rounded-2xl border border-black/10 bg-warm-100/60 p-5`}>
            <div className={`text-[11px] font-semibold ${theme.text} uppercase tracking-[0.2em] mb-2`}>
              {node.title}
            </div>
            <ul className="space-y-1.5">
              {node.items.map((item, j) => (
                <li key={j} className="text-sm text-zinc-700 leading-snug">{item}</li>
              ))}
            </ul>
          </div>
          {i < nodes.length - 1 && (
            <div className="hidden md:flex flex-col items-center justify-center px-2 flex-shrink-0 w-24">
              <svg className={`w-8 h-8 ${theme.text}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
              {node.arrowLabel && (
                <span className="text-[10px] text-zinc-500 text-center leading-tight mt-1">{node.arrowLabel}</span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// A visual rules table — for genuinely tabular data (condition -> action
// mappings, or command references) that reads faster as a table than as a
// bulleted list. `columns` lets different projects reuse this for different
// tabular data (device rules, command protocols, etc.) without hardcoding
// one project's column names into the component.
const DEFAULT_RULE_COLUMNS = [
  { key: 'device', label: 'Device', emphasis: true },
  { key: 'sensor', label: 'Sensor' },
  { key: 'condition', label: 'Condition' },
  { key: 'threshold', label: 'Default threshold', accent: true },
];

function RulesTable({ rows, theme, columns = DEFAULT_RULE_COLUMNS }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-black/10">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-warm-100/80 border-b border-black/10">
            {columns.map((c) => (
              <th key={c.key} className="text-left px-4 py-3 font-heading font-bold text-black text-xs uppercase tracking-wide">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white/40' : 'bg-transparent'}>
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={`px-4 py-3 ${c.emphasis ? 'font-semibold text-black' : c.accent ? `font-medium ${theme.text}` : 'text-zinc-700'}`}
                >
                  {r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CaseStudyDetail() {
  const { category, slug } = useParams();
  const study = getCaseStudy(category, slug);
  const meta = categories[category];

  if (!study) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <p className="text-zinc-600 mb-4">Case study not found.</p>
        <BackButton to={`/${category}`} label={`Back to ${meta?.label || 'projects'}`} />
      </div>
    );
  }

  const theme = getTheme(study.accentColor);
  const Icon = getIcon(study.icon);

  return (
    <article className="relative py-28 px-6">
      <BackButton to={`/${category}`} label={`Back to ${meta?.label || 'projects'}`} />
      <div className="max-w-4xl mx-auto">

        {/* Hero */}
        <ScrollReveal>
          <div className="flex items-center gap-4 mb-5">
            <span className={`flex items-center justify-center w-14 h-14 rounded-2xl ${theme.iconBg} text-white shadow-lg ${theme.iconShadow} flex-shrink-0`}>
              <Icon className="w-7 h-7" strokeWidth={2} />
            </span>
            <div className={`text-[11px] font-semibold ${theme.text} uppercase tracking-[0.25em]`}>
              {meta?.label} Case Study
            </div>
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
                className={`flex items-center gap-2 px-4 py-2 rounded-xl ${theme.button} text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                Live demo
              </a>
            )}
            {study.notebookUrl && (
              <a
                href={study.notebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-black/15 text-black text-sm font-semibold hover:border-black/30 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
                View full notebook
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

        {/* Build timeline — hardware projects with a real chronological build
            story get this instead of a flat photo gallery. */}
        {study.buildTimeline?.length > 0 && (
          <ScrollReveal delay={120}>
            <div className="mb-16">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-5 h-5 ${theme.text}`} strokeWidth={2} />
                <h2 className="text-lg font-heading font-bold text-black">Workbench to field</h2>
              </div>
              <p className="text-sm text-zinc-600 mb-8">
                From bare welded metal to a robot presented in front of a judging panel.
              </p>
              <BuildTimeline stages={study.buildTimeline} theme={theme} />
            </div>
          </ScrollReveal>
        )}

        {/* Live demo */}
        {study.hasLiveDemo && DEMO_COMPONENTS[study.demoKey] && (
          <ScrollReveal delay={150}>
            <div className="mb-14">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-5 h-5 ${theme.text}`} strokeWidth={2} />
                <h2 className="text-lg font-heading font-bold text-black">{study.liveDemoHeading || 'Try it live'}</h2>
              </div>
              <p className="text-sm text-zinc-600 mb-4">
                {study.liveDemoBlurb || 'Build a profile, pick a model, and see the real prediction — not a mockup.'}
              </p>
              {(() => {
                const DemoComponent = DEMO_COMPONENTS[study.demoKey];
                return <DemoComponent />;
              })()}
            </div>
          </ScrollReveal>
        )}

        {/* Architecture diagram — replaces prose for projects simple enough
            that three connected boxes say it faster than paragraphs. A
            handful of projects opt into a fully custom visual instead, via
            study.customArchitecture, when the generic linear-flow diagram
            can't communicate what's actually distinctive (e.g. which parts
            are frozen vs. trained). */}
        {study.architecture?.length > 0 && (
          <ScrollReveal delay={170}>
            <div className="mb-14">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-5 h-5 ${theme.text}`} strokeWidth={2} />
                <h2 className="text-lg font-heading font-bold text-black">How it's wired together</h2>
              </div>
              <p className="text-sm text-zinc-600 mb-6">{study.architectureBlurb}</p>
              {study.customArchitecture && CUSTOM_ARCHITECTURE_COMPONENTS[study.customArchitecture] ? (
                (() => {
                  const CustomArch = CUSTOM_ARCHITECTURE_COMPONENTS[study.customArchitecture];
                  return <CustomArch />;
                })()
              ) : (
                <ArchitectureDiagram nodes={study.architecture} theme={theme} />
              )}
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

        {/* Automation rules table — genuinely tabular condition->action data
            shown as a table instead of a bulleted list. */}
        {study.rules?.length > 0 && (
          <ScrollReveal>
            <div className="mb-14">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-5 h-5 ${theme.text}`} strokeWidth={2} />
                <h2 className="text-lg font-heading font-bold text-black">{study.rulesHeading || 'Auto mode, exactly as coded'}</h2>
              </div>
              <p className="text-sm text-zinc-600 mb-6">
                {study.rulesBlurb || 'What each device does when Auto is on — the fan is deliberately excluded, manual only.'}
              </p>
              <RulesTable rows={study.rules} theme={theme} columns={study.rulesColumns} />
            </div>
          </ScrollReveal>
        )}

        {/* Screenshot gallery — for deployed products without a live demo */}
        {study.screenshots?.length > 0 && (
          <ScrollReveal>
            <div className="mb-14">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-5 h-5 ${theme.text}`} strokeWidth={2} />
                <h2 className="text-lg font-heading font-bold text-black">Inside the app</h2>
              </div>
              <p className="text-sm text-zinc-600 mb-6">
                Real screenshots from the deployed product, not mockups.
              </p>
              <ScreenshotGallery items={study.screenshots} theme={theme} />
            </div>
          </ScrollReveal>
        )}

        {/* Custom chart — for comparisons a generic bar chart can't express,
            like two full training curves shown side by side. */}
        {study.customChart && CUSTOM_CHART_COMPONENTS[study.customChart] && (
          <ScrollReveal>
            <div className="mb-14">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-5 h-5 ${theme.text}`} strokeWidth={2} />
                <h2 className="text-lg font-heading font-bold text-black">{study.customChartHeading || 'Training curves'}</h2>
              </div>
              <p className="text-sm text-zinc-600 mb-6">{study.customChartBlurb}</p>
              {(() => {
                const CustomChart = CUSTOM_CHART_COMPONENTS[study.customChart];
                return <CustomChart />;
              })()}
            </div>
          </ScrollReveal>
        )}

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
                theme={theme}
              />
            </div>
          </ScrollReveal>
        )}

        {study.confusionMatrix && (
          <ScrollReveal>
            <div className="bg-warm-100/60 border border-black/10 rounded-2xl p-6 mb-8">
              <h2 className="text-lg font-heading font-bold text-black mb-4">Confusion matrix</h2>
              <ConfusionMatrix cm={study.confusionMatrix} labels={study.confusionMatrixLabels} />
            </div>
          </ScrollReveal>
        )}

        {study.featureImportance && (
          <ScrollReveal>
            <div className="bg-warm-100/60 border border-black/10 rounded-2xl p-6 mb-8">
              <h2 className="text-lg font-heading font-bold text-black mb-1">What drives the outcome</h2>
              <p className="text-sm text-zinc-600 mb-4">Model coefficients — positive pushes toward the predicted outcome, negative pushes away.</p>
              <FeatureImportanceChart data={study.featureImportance} theme={theme} />
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
              <div className="flex items-center gap-2 mb-4">
                <Icon className={`w-5 h-5 ${theme.onDark}`} strokeWidth={2} />
                <h2 className="text-lg font-heading font-bold">Skills demonstrated</h2>
              </div>
              <ul className="space-y-3">
                {study.skillsDemonstrated.map((skill, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-zinc-200 leading-relaxed">
                    <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${theme.onDark}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
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
