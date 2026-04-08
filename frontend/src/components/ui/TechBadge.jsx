export default function TechBadge({ name }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase bg-primary-500/10 text-primary-400 border border-primary-500/20 rounded-full hover:bg-primary-500/20 hover:border-primary-500/30 transition-all duration-200 cursor-default">
      {name}
    </span>
  );
}
