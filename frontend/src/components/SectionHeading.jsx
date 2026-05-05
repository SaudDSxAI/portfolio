import ScrollReveal from './ui/ScrollReveal';

export default function SectionHeading({ title, subtitle, eyebrow, align = 'center' }) {
 const isCenter = align === 'center';
 return (
 <ScrollReveal>
 <div className={`mb-16 ${isCenter ? 'text-center' : ''}`}>
 {eyebrow && (
 <p
 className={`text-[11px] font-semibold uppercase tracking-[0.25em] text-primary-700 mb-3 ${
 isCenter ? '' : ''
 }`}
 >
 {eyebrow}
 </p>
 )}
 <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-black mb-4 tracking-tight leading-[1.05]">
 {title}
 </h2>
 {subtitle && (
 <p className="text-lg text-zinc-600 max-w-2xl mx-auto leading-relaxed">
 {subtitle}
 </p>
 )}
 <div
 className={`mt-6 h-[3px] w-24 rounded-full bg-gradient-to-r from-primary-300 via-primary-500 to-primary-700 ${
 isCenter ? 'mx-auto' : ''
 }`}
 />
 </div>
 </ScrollReveal>
 );
}
