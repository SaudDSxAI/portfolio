import { useParams, Link } from 'react-router-dom';
import { useEffect } from 'react';
import SectionHeading from '../components/SectionHeading';
import CaseStudyCard from '../components/CaseStudyCard';
import ScrollReveal from '../components/ui/ScrollReveal';
import { caseStudies, categories } from '../data/caseStudies';

export default function CategoryPage() {
  const { category } = useParams();
  const meta = categories[category];
  const studies = caseStudies[category] || [];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [category]);

  if (!meta) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <p className="text-zinc-600 mb-4">Category not found.</p>
        <Link to="/" className="text-primary-700 font-semibold hover:text-primary-900">
          ← Back home
        </Link>
      </div>
    );
  }

  return (
    <section className="relative py-32 px-6 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-600 hover:text-primary-800 transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back home
        </Link>

        <SectionHeading eyebrow={meta.eyebrow} title={meta.label} subtitle={meta.subtitle} align="left" />

        {studies.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {studies.map((study, i) => (
              <ScrollReveal key={study.slug} delay={i * 80}>
                <CaseStudyCard study={study} categoryKey={category} index={i} />
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-24 text-center">
            <svg className="w-12 h-12 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
            </svg>
            <p className="text-zinc-600 mb-1">Case studies for {meta.label} are in progress.</p>
            <p className="text-sm text-zinc-500">Check back soon, or ask the AI assistant what's coming next.</p>
          </div>
        )}
      </div>
    </section>
  );
}
