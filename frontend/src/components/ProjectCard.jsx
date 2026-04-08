import TechBadge from './ui/TechBadge';

export default function ProjectCard({ project, index }) {
  return (
    <div
      className="group relative rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-2"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Animated gradient border */}
      <div className="absolute -inset-[1px] bg-gradient-to-r opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-500 blur-[1px]"
        style={{
          backgroundImage: `linear-gradient(to right, var(--tw-gradient-from), var(--tw-gradient-to))`,
        }}
      />
      <div className={`absolute -inset-[1px] bg-gradient-to-r ${project.borderGradient} opacity-0 group-hover:opacity-60 rounded-2xl transition-opacity duration-500`} />

      {/* Card Content */}
      <div className="relative bg-dark-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden h-full flex flex-col hover:border-white/20 hover:shadow-2xl hover:shadow-primary-900/20 transition-all duration-500">
        {/* Header gradient area */}
        <div className={`relative h-36 bg-gradient-to-br ${project.gradient} flex items-center justify-center overflow-hidden`}>
          {/* Animated mesh pattern */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 1px, transparent 1px),
                                radial-gradient(circle at 75% 75%, rgba(255,255,255,0.05) 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
            }} />
          </div>
          {/* Icon */}
          <span className="text-5xl relative z-10 group-hover:scale-110 group-hover:text-white transition-all duration-500 text-white/70 drop-shadow-lg">
            {project.icon ? project.icon : (
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
              </svg>
            )}
          </span>
          {/* Featured badge */}
          {project.featured && (
            <div className="absolute top-3 right-3 px-2.5 py-1 bg-primary-500/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
              Featured
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-5 flex-1 flex flex-col">
          {/* Category */}
          <div className="text-[11px] font-semibold text-primary-400 uppercase tracking-wider mb-2">
            {project.category}
          </div>

          {/* Title */}
          <h3 className="text-lg font-heading font-bold text-white mb-2 group-hover:text-primary-300 transition-colors duration-300">
            {project.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-slate-400 leading-relaxed mb-3 flex-1">
            {project.description}
          </p>

          {/* Impact */}
          {project.impact && (
            <p className="text-xs text-primary-400/80 font-medium mb-4 flex items-start gap-1.5">
              <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
              {project.impact}
            </p>
          )}

          {/* Tech Stack */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {project.tech.map((t) => (
              <TechBadge key={t} name={t} />
            ))}
          </div>

          {/* Links */}
          <div className="flex items-center gap-3 pt-3 border-t border-white/5">
            {project.github && (
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                Code
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
