import TransitionLink from './ui/TransitionLink';

// Icons per category key — add one here when a new category is introduced.
// Falls back to a generic folder icon for anything not listed.
function CategoryIcon({ categoryKey }) {
  const common = 'w-6 h-6';
  switch (categoryKey) {
    case 'ml':
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25l3-3 3 3-3 3-3-3z" />
        </svg>
      );
    case 'dl':
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25z" />
        </svg>
      );
    default:
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
        </svg>
      );
  }
}

export default function CategoryBrowserCard({ categoryKey, meta, studies }) {
  const count = studies.length;
  const isEmpty = count === 0;

  return (
    <TransitionLink
      to={`/${categoryKey}`}
      className="group relative rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-2 block h-full"
    >
      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-primary-400/0 via-primary-500/0 to-primary-700/0 group-hover:from-primary-400/40 group-hover:via-primary-500/30 group-hover:to-primary-700/40 transition-all duration-500 blur-md opacity-60" />

      <div className="relative bg-warm-100/90 border border-black/10 rounded-2xl overflow-hidden h-full flex flex-col p-6 hover:border-primary-600/40 hover:shadow-2xl hover:shadow-primary-500/20 transition-all duration-500">
        <div className="flex items-start justify-between mb-5">
          <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-md shadow-primary-700/25">
            <CategoryIcon categoryKey={categoryKey} />
          </span>
        </div>

        <h3 className="font-heading font-bold text-black text-xl mb-1 group-hover:text-primary-800 transition-colors duration-300">
          {meta.label}
        </h3>
        <p className="text-sm text-zinc-600 leading-relaxed mb-5 flex-1">{meta.subtitle}</p>

        <div className="flex items-center justify-between pt-4 border-t border-black/10">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            isEmpty ? 'bg-zinc-200/70 text-zinc-500' : 'bg-primary-200/60 text-primary-800'
          }`}>
            {isEmpty ? 'Coming soon' : `${count} case ${count === 1 ? 'study' : 'studies'}`}
          </span>
          <span className="flex items-center gap-1 text-sm font-semibold text-primary-700 group-hover:text-primary-900">
            Browse
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
            </svg>
          </span>
        </div>
      </div>
    </TransitionLink>
  );
}
