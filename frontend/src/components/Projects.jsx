import SectionHeading from './SectionHeading';
import CategoryBrowserCard from './CategoryBrowserCard';
import ScrollReveal from './ui/ScrollReveal';
import { categories, caseStudies } from '../data/caseStudies';

// Projects are organized into classes (ML, DL, and more as they're added —
// just add a new key to `categories` + `caseStudies` in
// src/data/caseStudies.js and it shows up here automatically). Each class
// has its own page with real project cards, which each open a full
// case-study page with real charts and numbers.
export default function Projects() {
  const categoryKeys = Object.keys(categories);

  return (
    <section id="projects" className="relative py-24 px-6">
      <div className="relative max-w-6xl mx-auto">
        <SectionHeading
          eyebrow="Selected Work"
          title="Projects"
          subtitle="Organized by discipline — pick a class to see the real benchmarks and case studies behind it."
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoryKeys.map((key, i) => (
            <ScrollReveal key={key} delay={i * 80}>
              <CategoryBrowserCard
                categoryKey={key}
                meta={categories[key]}
                studies={caseStudies[key] || []}
              />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
