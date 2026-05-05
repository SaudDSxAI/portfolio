/**
 * SiteBackground — fixed, full-viewport, GPU-cheap.
 *
 * Layers (bottom → top):
 * 1. Cream base
 * 2. Four slow drifting olive aurora blobs (uses existing `blob` keyframe)
 * 3. Faint dot-grid texture for depth
 * 4. Soft radial vignette so corners gently fade
 *
 * Renders behind everything else (z-index -10), is decorative only
 * (aria-hidden), and never intercepts pointer events.
 */
export default function SiteBackground() {
 return (
 <div
 aria-hidden="true"
 className="fixed inset-0 -z-10 pointer-events-none overflow-hidden"
 >
 {/* 1. Cream base */}
 <div className="absolute inset-0 bg-warm-50" />

 {/* 2. Aurora blobs (optimized with radial gradients instead of heavy CSS blur) */}
 <div 
 className="absolute -top-32 -left-32 w-[50rem] h-[50rem] animate-blob" 
 style={{ background: 'radial-gradient(circle at center, rgba(201, 203, 164, 0.35) 0%, transparent 60%)', willChange: 'transform' }} 
 />
 <div 
 className="absolute top-[18%] -right-40 w-[55rem] h-[55rem] animate-blob animation-delay-2000" 
 style={{ background: 'radial-gradient(circle at center, rgba(175, 178, 132, 0.25) 0%, transparent 60%)', willChange: 'transform' }} 
 />
 <div 
 className="absolute top-[55%] left-[8%] w-[45rem] h-[45rem] animate-blob animation-delay-4000" 
 style={{ background: 'radial-gradient(circle at center, rgba(223, 226, 187, 0.45) 0%, transparent 60%)', willChange: 'transform' }} 
 />
 <div 
 className="absolute -bottom-32 right-[12%] w-[45rem] h-[45rem] animate-blob" 
 style={{ background: 'radial-gradient(circle at center, rgba(201, 203, 164, 0.25) 0%, transparent 60%)', willChange: 'transform' }} 
 />

 {/* 3. Dot-grid texture */}
 <div
 className="absolute inset-0 opacity-[0.06]"
 style={{
 backgroundImage:
 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.6) 1px, transparent 0)',
 backgroundSize: '26px 26px',
 }}
 />

 {/* 4. Radial vignette — pulls focus toward the center */}
 <div
 className="absolute inset-0"
 style={{
 background:
 'radial-gradient(ellipse at center, transparent 35%, rgba(239,231,216,0.55) 100%)',
 }}
 />
 </div>
 );
}
