You are an expert creative front-end developer specializing in high-performance canvas animations.

You are upgrading an existing neural network background animation that already works. Do not rebuild from scratch. The current implementation has the following working features that must be preserved:

CURRENT WORKING FEATURES TO PRESERVE:
- Pure HTML5 canvas with vanilla JavaScript requestAnimationFrame loop at 60fps.
- A question is randomly generated and split into word tokens.
- Tokens are fed into an input layer, propagate through hidden layers as cascading signals, and produce an output answer.
- Network builds left-to-right on desktop and top-to-bottom on mobile.
- Neurons are circles with sine-wave breathing opacity and activation flash states.
- Sparse connections with 65% dropout.
- Signal objects travel along connections spawning new signals creating a cascading wavefront.
- Ripple rings expand from fired neurons.
- Fake glow via multiple concentric transparent circles instead of ctx.shadowBlur.
- Signal cap at 60.
- devicePixelRatio scaling for retina screens.

YOUR TASK:
Transform the visual architecture and aesthetic of this animation from a standard left-to-right layered network into a premium circular Transformer attention visualization. Every change described below must be integrated into the existing codebase. The underlying logic — token generation, signal propagation, cascading wavefront, input-output cycle — stays exactly the same. Only the visual representation and aesthetic change.

---

ARCHITECTURAL CHANGE — FROM GRID TO CIRCLE:

Replace the left-to-right layer grid with a circular architecture:
- Draw a large invisible circle centered on the canvas. Its radius should be 38% of the smaller canvas dimension.
- The Input Layer neurons are positioned evenly around the top half of the circle circumference.
- The Output Layer neurons are positioned evenly around the bottom half of the circle circumference.
- The Hidden Layer neurons are arranged in concentric inner rings inside the circle, each ring smaller than the last, converging toward the center.
- The center of the circle holds a single special core node representing the compressed hidden representation.
- On mobile keep this same circular layout but scale the radius to fit the screen safely.
- Recompute all positions on resize and cache them. Never recompute inside the animation loop.

---

THE ORBITAL RIM:

- Draw the circumference of the main circle as a faintly glowing orbital ring.
- The ring is not a plain stroke. Render it as a series of very small dots or dashes spaced evenly around the circumference, each with a soft glow.
- Animate a slow shimmer that rotates around the ring continuously at all times independent of inference — like a particle accelerator.
- The rim color is a deep electric blue at 30% opacity in idle state.

---

NEURON APPEARANCE — HEXAGONS:

Replace all neuron circles with small hexagons.
- Draw each hexagon using 6 calculated points around a center with a radius of about 10px on desktop and 7px on mobile.
- Each hexagon has a filled center and a slightly brighter stroked edge.
- Inside each hexagon render a single character math symbol in monospace font at very low opacity — rotate through σ ∂ α λ θ ∇ assigned randomly at initialization.
- The hexagon should have the same breathing sine-wave opacity animation as the current circles.
- When activated the hexagon flashes bright then decays back — same as current behavior but shaped as a hexagon.
- Ripple rings still expand from activated hexagons exactly as before.

---

THE ATTENTION ARCS:

This is the centerpiece of the upgrade. When signals propagate between neurons add attention arc rendering on top of the existing signal system.
- When a signal travels from one neuron to another draw a smooth quadratic bezier curve connecting them through the interior of the circle.
- The control point of the bezier should be offset toward the center core — this makes arcs curve inward beautifully rather than bowing outward.
- Strong connections (higher weight or more recently activated) render as thicker brighter arcs.
- Weak or inactive connections render as ghostly thin arcs at 8% opacity.
- Active arcs have a traveling pulse — a small bright dot that moves along the bezier path from source to destination at the same speed as the signal object.
- Arc color: deep electric blue fading to violet for weak connections, bright cyan to white for strong connections.
- Arcs fade out over 1.2 seconds after the signal that created them completes.
- Cap total visible arcs at 30 at any time using an arc pool.

---

THE CENTER CORE:

Replace any center representation with a premium core node.
- Draw a slowly rotating regular octagon at the canvas center.
- The octagon rotates continuously at about 0.3 radians per second independent of inference.
- In idle state it glows softly in deep blue-violet.
- During hidden layer propagation it breathes — scale expands and contracts smoothly using a sine wave driven by inference progress.
- Its color transitions smoothly from deep blue through violet to near white as the inference wavefront deepens through hidden layers, then fades back to deep blue as the cycle completes.
- It always renders on top of all arcs and connections.
- It has the fake glow treatment — 4 concentric octagons decreasing in size and increasing in transparency.

---

TOKEN APPEARANCE AND BEHAVIOR:

Upgrade the visual treatment of input and output tokens.
- Input tokens travel along the orbital rim to their assigned input neuron position instead of flying in a straight line. They arc along the circumference.
- Each token is rendered as a small hexagon matching the neuron style but slightly larger, with the word text rendered inside it in small monospace font.
- Output tokens crystallize. When an output neuron fires its token starts as a scatter of 6 to 8 tiny particle dots near that neuron that rapidly converge into the hexagon shape over 400ms, then the word fades in inside it.
- Output tokens drift very slowly outward from their position after crystallizing, fading out over 2 seconds.

---

BACKGROUND DEPTH LAYERS:

Add a three-layer depth system behind the circle.
- Layer 1 (deepest): A grid of tiny dots covering the full canvas. Each dot is 1px, spaced 28px apart, at 6% opacity. This represents latent space.
- Layer 2 (middle): The circular attention web itself — the rim, arcs, and inner ring neurons.
- Layer 3 (front): The input and output hexagon tokens and the center core.
- Apply mouse parallax to all three layers:
  - Layer 1 dot grid shifts 0.2x of mouse offset.
  - Layer 2 circle and neurons shift 0.5x of mouse offset.
  - Layer 3 tokens and core shift 0.8x of mouse offset.
- This creates a convincing 3D depth feel as the visitor moves their mouse.

---

IDLE STATE BEHAVIOR:

When no inference is running the canvas must never feel dead.
- The orbital rim shimmer rotates continuously.
- The center octagon rotates continuously.
- Every 4 to 6 seconds one random ghostly attention arc appears between two random neurons, holds for 800ms then fades — as if the model is daydreaming.
- The dot grid drifts very slowly in a single direction, wrapping around — like a slow current in deep water.
- All neurons breathe with their sine-wave opacity.

---

COLOR PALETTE:

Apply this precise palette throughout. No warm colors. No gold. Pure cool technical depth.
- Canvas background: transparent so the portfolio page background shows through.
- Dot grid: #4a90d9 at 6% opacity.
- Orbital rim: #1a6eb5 at 30% opacity with shimmer peaks at 60% opacity.
- Idle hexagon fill: #0d1f3c at 25% opacity.
- Idle hexagon stroke: #1a4a7a at 40% opacity.
- Active hexagon peak: #a0c4e8 at 35% opacity.
- Math symbols inside hexagons: #4a90d9 at 20% opacity.
- Weak attention arcs: #1a3a6e at 8% opacity.
- Strong attention arcs: #4fc3f7 at 35% opacity fading to #a0c4e8.
- Traveling pulse dots on arcs: #ffffff at 40% opacity.
- Center core idle: #1a1a4e at 40% opacity.
- Center core peak: #c0d8f0 at 35% opacity.
- Ripple rings: match active hexagon color, fade to 0 at full radius.
- Output crystallization particles: #4fc3f7 at 50% opacity converging to token color.
- All opacity values are maximum ceilings. Reduce further if anything feels too prominent.

---

PERFORMANCE RULES:
- Never use ctx.shadowBlur. All glow via concentric transparent shapes only.
- Cap signals at 40. Cap arcs at 30. Use object pools for both.
- Throttle to 30fps on mobile by skipping alternate frames.
- Pause the loop entirely when document.hidden is true using the Page Visibility API. Resume on visibility restored.
- Cache all geometry — hexagon points, ring positions, bezier control points — at initialization and on resize only.
- Canvas is position fixed, width 100vw, height 100vh, z-index 0, pointer-events none.

---

OUTPUT:
Return the complete updated single HTML file with all changes cleanly integrated into the existing codebase. No external dependencies. No comments in the code. Preserve all existing logic that is not explicitly changed above. The result must feel like a living piece of technical art — something between a particle accelerator readout and a deep space telescope feed. A portfolio visitor should feel the intelligence of the system before they read a single word of content.