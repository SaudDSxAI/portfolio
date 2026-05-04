import { useRef, useEffect } from 'react';

// Ultra-lightweight circular attention background
// Strict 30fps, pauses when hidden/obscured, zero heavy math in loop
export default function EquationEngine() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });

    let animId;
    let cw = 0, ch = 0;
    let cx = 0, cy = 0, R = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const isMobile = () => cw < 768;

    // Pausing flags
    let paused = document.hidden;
    let obscured = false;

    // Pre-cached geometry
    let nodes = [];       // { x, y, phase, sym, active, decay }
    let ghostArcs = [];   // { ax, ay, bx, by, cpx, cpy, life, maxLife }
    let rimAngle = 0;

    const SYMBOLS = ['σ', '∂', 'α', 'λ', 'θ', '∇'];
    const NODE_R = 7;

    // FPS throttle — target 30fps
    let lastT = 0;
    const FRAME_MS = 1000 / 30;

    // Offscreen dot grid
    let dotImg = null;
    let dotSpacing = 36;

    const buildDotGrid = () => {
      dotSpacing = isMobile() ? 52 : 36;
      const oc = document.createElement('canvas');
      // One tile that repeats
      oc.width = dotSpacing;
      oc.height = dotSpacing;
      const oc2 = oc.getContext('2d');
      oc2.fillStyle = 'rgba(0,0,0,0.08)';
      oc2.fillRect(0, 0, 1, 1);
      dotImg = oc;
    };

    const buildGeometry = () => {
      cw = window.innerWidth;
      ch = window.innerHeight;
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
      ctx.scale(dpr, dpr);
      cx = cw / 2;
      cy = ch / 2;
      R = Math.min(cw, ch) * 0.36;

      buildDotGrid();

      // Node counts scale with screen
      const rim = isMobile() ? 10 : 18;   // nodes on outer rim
      const inner = isMobile() ? 5 : 10;  // inner ring nodes

      nodes = [];

      // Outer rim
      for (let i = 0; i < rim; i++) {
        const theta = (Math.PI * 2 * i) / rim;
        nodes.push({
          x: cx + R * Math.cos(theta),
          y: cy + R * Math.sin(theta),
          phase: Math.random() * Math.PI * 2,
          sym: SYMBOLS[i % SYMBOLS.length],
          active: 0,
          isOuter: true,
        });
      }

      // Inner ring (60% of R)
      const innerR = R * 0.55;
      for (let i = 0; i < inner; i++) {
        const theta = (Math.PI * 2 * i) / inner + Math.PI / inner;
        nodes.push({
          x: cx + innerR * Math.cos(theta),
          y: cy + innerR * Math.sin(theta),
          phase: Math.random() * Math.PI * 2,
          sym: SYMBOLS[(i + 3) % SYMBOLS.length],
          active: 0,
          isOuter: false,
        });
      }

      ghostArcs = [];
    };

    // Draw a hexagon path (pre-computed 6 points, no sin/cos in loop)
    const HEX_ANGLES = Array.from({ length: 6 }, (_, i) => ({
      cos: Math.cos((Math.PI / 3) * i - Math.PI / 6),
      sin: Math.sin((Math.PI / 3) * i - Math.PI / 6),
    }));
    const hexPath = (x, y, r) => {
      ctx.beginPath();
      ctx.moveTo(x + r * HEX_ANGLES[0].cos, y + r * HEX_ANGLES[0].sin);
      for (let i = 1; i < 6; i++) {
        ctx.lineTo(x + r * HEX_ANGLES[i].cos, y + r * HEX_ANGLES[i].sin);
      }
      ctx.closePath();
    };

    // Draw octagon for core
    const OCT_ANGLES = Array.from({ length: 8 }, (_, i) => ({
      cos: Math.cos((Math.PI / 4) * i),
      sin: Math.sin((Math.PI / 4) * i),
    }));
    const octPath = (x, y, r, rot) => {
      ctx.beginPath();
      const c0 = Math.cos(rot), s0 = Math.sin(rot);
      for (let i = 0; i < 8; i++) {
        const px = x + r * (OCT_ANGLES[i].cos * c0 - OCT_ANGLES[i].sin * s0);
        const py = y + r * (OCT_ANGLES[i].cos * s0 + OCT_ANGLES[i].sin * c0);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
    };

    let coreRot = 0;
    let cycleT = 0;
    const CYCLE = 540; // frames (18s at 30fps)

    const spawnGhostArc = () => {
      if (ghostArcs.length >= 8 || nodes.length < 2) return;
      const a = nodes[Math.floor(Math.random() * nodes.length)];
      const b = nodes[Math.floor(Math.random() * nodes.length)];
      if (a === b) return;
      const maxLife = 40 + Math.random() * 30;
      ghostArcs.push({
        ax: a.x, ay: a.y, bx: b.x, by: b.y,
        cpx: cx + (Math.random() - 0.5) * R * 0.3,
        cpy: cy + (Math.random() - 0.5) * R * 0.3,
        life: maxLife, maxLife,
      });
    };

    const triggerInferenceCycle = () => {
      // Activate a few outer nodes sequentially
      const outerNodes = nodes.filter(n => n.isOuter);
      const count = Math.min(4, outerNodes.length);
      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          if (outerNodes[i]) outerNodes[i].active = 1;
          // Link to a random inner node
          const inner = nodes.filter(n => !n.isOuter);
          if (inner.length > 0) {
            const target = inner[Math.floor(Math.random() * inner.length)];
            const src = outerNodes[i];
            const maxLife = 35;
            ghostArcs.push({
              ax: src.x, ay: src.y, bx: target.x, by: target.y,
              cpx: cx, cpy: cy,
              life: maxLife, maxLife, isSig: true,
            });
          }
        }, i * 120);
      }
    };

    const render = (ts) => {
      animId = requestAnimationFrame(render);
      if (paused || obscured) return;

      // Throttle to 30fps
      if (ts - lastT < FRAME_MS) return;
      lastT = ts;

      ctx.clearRect(0, 0, cw, ch);

      // === LAYER 1: dot grid (2 drawImage calls total) ===
      if (dotImg) {
        const pat = ctx.createPattern(dotImg, 'repeat');
        if (pat) {
          ctx.fillStyle = pat;
          ctx.fillRect(0, 0, cw, ch);
        }
      }

      // === LAYER 2: orbital rim ===
      rimAngle += 0.003;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(163,163,163,0.25)`;
      ctx.setLineDash([3, 10]);
      ctx.lineDashOffset = -(rimAngle * 200);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);

      // === LAYER 2: ghost arcs ===
      for (let i = ghostArcs.length - 1; i >= 0; i--) {
        const a = ghostArcs[i];
        a.life--;
        const t = a.life / a.maxLife;
        const alpha = a.isSig
          ? t * 0.4
          : Math.sin(t * Math.PI) * 0.12;
        ctx.beginPath();
        ctx.moveTo(a.ax, a.ay);
        ctx.quadraticCurveTo(a.cpx, a.cpy, a.bx, a.by);
        ctx.strokeStyle = a.isSig
          ? `rgba(0,0,0,${alpha})`
          : `rgba(82,82,91,${alpha})`;
        ctx.lineWidth = a.isSig ? 1.2 : 0.8;
        ctx.stroke();
        if (a.life <= 0) ghostArcs.splice(i, 1);
      }

      // === LAYER 2: nodes ===
      ctx.font = '7px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      nodes.forEach(n => {
        n.phase += 0.018;
        n.active = Math.max(0, n.active - 0.025);
        const breath = 0.12 + Math.sin(n.phase) * 0.08;
        const alpha = Math.min(0.35, breath + n.active * 0.25);

        hexPath(n.x, n.y, NODE_R);
        ctx.fillStyle = n.active > 0.4
          ? `rgba(0,0,0,${alpha})`
          : `rgba(39,39,42,${alpha + 0.05})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(113,113,122,${0.35 + n.active * 0.5})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();

        ctx.fillStyle = `rgba(0,0,0,${0.15 + n.active * 0.6})`;
        ctx.fillText(n.sym, n.x, n.y);
      });

      // === LAYER 3: center core ===
      coreRot += 0.004;
      cycleT++;

      const coreR = isMobile() ? 13 : 19;
      const breathing = 1 + Math.sin(cycleT * 0.06) * 0.06;
      const coreActive = cycleT > CYCLE * 0.6 && cycleT < CYCLE * 0.85;

      // soft glow rings
      for (let i = 3; i > 0; i--) {
        octPath(cx, cy, coreR * breathing + i * 5, coreRot);
        ctx.fillStyle = `rgba(24,24,27,${0.04 / i})`;
        ctx.fill();
      }
      octPath(cx, cy, coreR * breathing, coreRot);
      ctx.fillStyle = coreActive
        ? `rgba(0,0,0,0.3)`
        : `rgba(39,39,42,0.38)`;
      ctx.fill();
      ctx.strokeStyle = `rgba(0,0,0,0.55)`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // === Cycle management ===
      if (cycleT === Math.floor(CYCLE * 0.6)) triggerInferenceCycle();
      if (cycleT >= CYCLE) cycleT = 0;

      // Daydream arcs
      if (Math.random() < 0.008) spawnGhostArc();
    };

    // Event handlers
    const onVisChange = () => { paused = document.hidden; };
    const onScroll = () => { obscured = false; };
    const onMouseMove = (e) => { /* future parallax hook */ };

    let resizeTimer;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(buildGeometry, 150);
    };

    document.addEventListener('visibilitychange', onVisChange);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('mousemove', onMouseMove);

    buildGeometry();
    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(resizeTimer);
      document.removeEventListener('visibilitychange', onVisChange);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
    />
  );
}
