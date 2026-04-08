import { useState } from 'react';
import SectionHeading from './SectionHeading';
import ProjectCard from './ProjectCard';
import ScrollReveal from './ui/ScrollReveal';
import { projects, categories } from '../data/projects';

export default function Projects() {
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered =
    activeCategory === 'All'
      ? projects
      : projects.filter((p) => p.category === activeCategory);

  return (
    <section id="projects" className="relative py-24 px-6">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-dark-800/30 to-transparent pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        <SectionHeading
          title="Projects"
          subtitle="Production-deployed AI systems, LLM applications, and machine learning solutions"
        />

        {/* Filter Tabs */}
        <ScrollReveal>
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2 text-sm font-medium rounded-xl border transition-all duration-300 ${
                  activeCategory === cat
                    ? 'bg-primary-600 border-primary-500 text-white shadow-lg shadow-primary-900/30'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </ScrollReveal>

        {/* Project Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((project, index) => (
            <ScrollReveal key={project.id} delay={index * 80}>
              <ProjectCard project={project} index={index} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
