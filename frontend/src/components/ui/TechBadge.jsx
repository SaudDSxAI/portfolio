export default function TechBadge({ name }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase bg-black/10 text-zinc-800 border border-black/25 rounded-full hover:bg-black/20 hover:border-black/40 transition-all duration-200 cursor-default">
      {name}
    </span>
  );
}
