/**
 * GenerativeArt — deterministic, repo-name-seeded SVG art.
 *
 * Each project gets a unique mark made of:
 * - A custom radial gradient drawn from the olive palette
 * - Three soft floating blobs at seeded positions
 * - A diagonal stripe overlay for depth
 * - The repo's first 1–2 letters as a subtle wordmark
 *
 * Same repo name → same art, every render. No assets, no network.
 */

// Seeded PRNG (Mulberry32) so output is stable per seed
function seedFrom(str) {
 let h = 2166136261;
 for (let i = 0; i < str.length; i++) {
 h ^= str.charCodeAt(i);
 h = Math.imul(h, 16777619);
 }
 return h >>> 0;
}

function mulberry32(a) {
 return function () {
 let t = (a += 0x6d2b79f5);
 t = Math.imul(t ^ (t >>> 15), t | 1);
 t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
 return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
 };
}

// Curated olive palette pairs (matches the site's tailwind primary scale)
const PALETTES = [
 { a: '#c9cba4', b: '#73774e', c: '#eef0d4' },
 { a: '#afb284', b: '#585b3c', c: '#f7f8eb' },
 { a: '#dfe2bb', b: '#8f9466', c: '#eef0d4' },
 { a: '#c9cba4', b: '#41432d', c: '#dfe2bb' },
 { a: '#8f9466', b: '#2c2e20', c: '#c9cba4' },
 { a: '#73774e', b: '#181913', c: '#afb284' },
];

export default function GenerativeArt({
 seed = 'project',
 className = '',
 showWordmark = true,
}) {
 const rand = mulberry32(seedFrom(String(seed)));
 const palette = PALETTES[Math.floor(rand() * PALETTES.length)];
 const gradId = `g-${seedFrom(seed).toString(36)}`;
 const stripeId = `s-${seedFrom(seed).toString(36)}`;

 // Three blobs at seeded positions
 const blobs = Array.from({ length: 3 }, () => ({
 cx: 20 + rand() * 60,
 cy: 20 + rand() * 60,
 r: 22 + rand() * 24,
 fill: rand() > 0.5 ? palette.a : palette.b,
 opacity: 0.55 + rand() * 0.35,
 }));

 // Diagonal angle for the stripe overlay
 const stripeAngle = Math.floor(rand() * 60) - 30;

 // Wordmark = first 1–2 chars of seed, uppercase
 const wordmark = String(seed).replace(/[^a-z0-9]/gi, '').slice(0, 2).toUpperCase() || '·';

 return (
 <svg
 viewBox="0 0 100 100"
 preserveAspectRatio="xMidYMid slice"
 className={`absolute inset-0 w-full h-full ${className}`}
 aria-hidden="true"
 >
 <defs>
 {/* Radial gradient base */}
 <radialGradient id={gradId} cx="30%" cy="30%" r="80%">
 <stop offset="0%" stopColor={palette.c} />
 <stop offset="60%" stopColor={palette.a} />
 <stop offset="100%" stopColor={palette.b} />
 </radialGradient>
 {/* Diagonal stripe pattern */}
 <pattern
 id={stripeId}
 width="14"
 height="14"
 patternUnits="userSpaceOnUse"
 patternTransform={`rotate(${stripeAngle})`}
 >
 <line x1="0" y1="0" x2="0" y2="14" stroke={palette.b} strokeWidth="0.6" opacity="0.18" />
 </pattern>
 </defs>

 {/* Base gradient */}
 <rect width="100" height="100" fill={`url(#${gradId})`} />

 {/* Blurred blobs */}
 <g style={{ filter: 'blur(6px)' }}>
 {blobs.map((b, i) => (
 <circle key={i} cx={b.cx} cy={b.cy} r={b.r} fill={b.fill} opacity={b.opacity} />
 ))}
 </g>

 {/* Diagonal stripes overlay */}
 <rect width="100" height="100" fill={`url(#${stripeId})`} />

 {/* Subtle inner border */}
 <rect
 x="1"
 y="1"
 width="98"
 height="98"
 fill="none"
 stroke="rgba(0,0,0,0.08)"
 strokeWidth="0.5"
 />

 {/* Wordmark — large, very low opacity, looks letterpressed */}
 {showWordmark && (
 <text
 x="50"
 y="62"
 textAnchor="middle"
 fontSize="38"
 fontWeight="900"
 fontFamily="Outfit, sans-serif"
 fill={palette.b}
 opacity="0.22"
 letterSpacing="-2"
 >
 {wordmark}
 </text>
 )}
 </svg>
 );
}
