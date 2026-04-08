import ScrollReveal from './ui/ScrollReveal';

export default function SectionHeading({ title, subtitle, align = 'center' }) {
  return (
    <ScrollReveal>
      <div className={`mb-16 ${align === 'center' ? 'text-center' : ''}`}>
        <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4 tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        )}
        <div
          className={`mt-6 h-1 w-20 bg-gradient-to-r from-primary-400 to-cyan-400 rounded-full ${
            align === 'center' ? 'mx-auto' : ''
          }`}
        />
      </div>
    </ScrollReveal>
  );
}
