import { memo } from 'react';
import TechBadge from './ui/TechBadge';
import GenerativeArt from './ui/GenerativeArt';

// Pretty-format a relative date
function timeAgo(isoString) {
 if (!isoString) return null;
 const diff = Math.floor((Date.now() - new Date(isoString)) / 1000);
 if (diff < 60) return 'just now';
 if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
 if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
 if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
 if (diff < 31536000) return `${Math.floor(diff / 2592000)}mo ago`;
 return `${Math.floor(diff / 31536000)}y ago`;
}

function ProjectCard({ project, index, wide = false }) {
 const updated = timeAgo(project.updatedAt);

 // Cover surface — generative art seeded from repoName (no emojis).
 const cover = (
 <div
 className={`relative ${
 wide ? 'lg:w-2/5 lg:h-auto h-48' : 'h-44'
 } overflow-hidden border-b lg:border-b-0 ${
 wide ? 'lg:border-r' : ''
 } border-black/10`}
 >
 {/* Deterministic generative art */}
 <GenerativeArt seed={project.repoName || project.title || 'project'} />

 {/* Subtle dark gradient at the bottom for badge legibility */}
 <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/15 to-transparent" />

 {/* Featured ribbon */}
 {project.featured && (
 <div className="absolute top-3 right-3 px-2.5 py-1 bg-gradient-to-r from-primary-600 to-primary-800 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-md shadow-primary-700/30 z-10">
 Featured
 </div>
 )}

 {/* Stars */}
 {project.stars > 0 && (
 <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/85 text-primary-300 text-[10px] font-semibold z-10">
 ★ <span className="text-white">{project.stars}</span>
 </div>
 )}
 </div>
 );

 return (
 <div
 className="group relative rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-2 h-full"
 style={{ animationDelay: `${index * 100}ms` }}
 >
 {/* Mustard glow on hover */}
 <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-primary-400/0 via-primary-500/0 to-primary-700/0 group-hover:from-primary-400/40 group-hover:via-primary-500/30 group-hover:to-primary-700/40 transition-all duration-500 blur-md opacity-60" />

 {/* Card */}
 <div
 className={`relative bg-warm-100/90 border border-black/10 rounded-2xl overflow-hidden h-full flex ${
 wide ? 'flex-col lg:flex-row' : 'flex-col'
 } hover:border-primary-600/40 hover:shadow-2xl hover:shadow-primary-500/20 transition-all duration-500`}
 >
 {cover}

 {/* Body */}
 <div className="p-5 flex-1 flex flex-col">
 {/* Category */}
 <div className="text-[11px] font-semibold text-primary-700 uppercase tracking-[0.2em] mb-2">
 {project.category}
 </div>

 {/* Title */}
 <h3
 className={`font-heading font-bold text-black mb-2 group-hover:text-primary-800 transition-colors duration-300 ${
 wide ? 'text-2xl lg:text-3xl leading-tight' : 'text-lg'
 }`}
 >
 {project.title}
 </h3>

 {/* Description */}
 <p
 className={`text-zinc-700 leading-relaxed mb-3 flex-1 ${
 wide ? 'text-base' : 'text-sm'
 }`}
 >
 {project.description}
 </p>

 {/* Impact */}
 {project.impact && (
 <p className="text-xs text-primary-700 font-medium mb-4 flex items-start gap-1.5">
 <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
 </svg>
 {project.impact}
 </p>
 )}

 {/* Tech Stack */}
 {project.tech?.length > 0 && (
 <div className="flex flex-wrap gap-1.5 mb-4">
 {project.tech.map((t) => (
 <TechBadge key={t} name={t} />
 ))}
 </div>
 )}

 {/* Footer: GitHub link + Live (if any) + last updated */}
 <div className="flex items-center justify-between gap-3 pt-3 border-t border-black/10">
 <div className="flex items-center gap-3">
 {project.live && (
 <a
 href={project.live}
 target="_blank"
 rel="noopener noreferrer"
 className="flex items-center gap-1.5 text-sm text-primary-700 hover:text-primary-900 font-medium transition-colors duration-200"
 >
 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
 </svg>
 Live
 </a>
 )}
 </div>

 {updated && (
 <span className="text-[11px] text-zinc-500 ml-auto">
 {updated}
 </span>
 )}
 </div>
 </div>
 </div>
 </div>
 );
}

// Memoized export — re-renders only when the project payload, index, or
// wide flag actually change. Big win for the grid (each card has an SVG).
export default memo(ProjectCard);
