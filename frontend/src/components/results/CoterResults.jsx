import { MessageCircle, Mail, Facebook, Linkedin, Instagram } from 'lucide-react';

const CHANNEL_ICONS = {
  messageCircle: MessageCircle,
  mail: Mail,
  facebook: Facebook,
  linkedin: Linkedin,
  instagram: Instagram,
};

export default function CoterResults({ study, theme }) {
  const channels = study.channels || [];

  return (
    <div>
      <h2 className="text-lg font-heading font-bold text-black mb-1">Five channels, one platform</h2>
      <p className="text-sm text-zinc-600 mb-5">
        Real activity pulled from the live deployment, not a feature list.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {channels.map((c) => {
          const Icon = CHANNEL_ICONS[c.icon];
          return (
            <div key={c.name} className="rounded-xl border border-black/10 bg-white/70 p-4 text-center">
              <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-2 ${theme.iconBg} text-white shadow-sm ${theme.iconShadow}`}>
                {Icon && <Icon className="w-5 h-5" strokeWidth={2} />}
              </span>
              <div className="text-sm font-heading font-bold text-black">{c.name}</div>
              <div className="text-[11px] text-zinc-600 mt-1 leading-snug">{c.stat}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
