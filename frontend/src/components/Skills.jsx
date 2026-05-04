import SectionHeading from './SectionHeading';
import ScrollReveal from './ui/ScrollReveal';
import { skills } from '../data/projects';

export default function Skills() {
  return (
    <section id="skills" className="relative py-24 px-6 overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-warm-100/70 to-transparent pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        <SectionHeading
          title="Skills & Expertise"
          subtitle="Technologies and frameworks I use to build production AI systems"
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {skills.map((group, groupIndex) => (
            <ScrollReveal key={group.category} delay={groupIndex * 100}>
              <div className="group relative bg-warm-100/85 backdrop-blur-xl border border-black/10 rounded-2xl p-6 hover:border-black/20 hover:shadow-xl hover:shadow-black/10 transition-all duration-500 h-full">
                {/* Removed hover glow */}

                <div className="relative">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 bg-black border border-black rounded-xl flex items-center justify-center text-xl text-black group-hover:scale-110 transition-all duration-300 drop-shadow-md">
                      {group.icon ? group.icon : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <h3 className="text-lg font-heading font-bold text-black">
                      {group.category}
                    </h3>
                  </div>

                  {/* Skills List */}
                  <div className="flex flex-wrap gap-2">
                    {group.items.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1.5 text-xs font-medium bg-warm-50 text-zinc-700 border border-black/10 rounded-lg hover:bg-black/10 hover:text-black hover:border-black/30 transition-all duration-200 cursor-default"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
