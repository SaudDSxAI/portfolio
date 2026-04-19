import { useRef, useEffect } from 'react';

export default function EquationEngine() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    let animationId;
    let cw = window.innerWidth;
    let ch = window.innerHeight;
    let dpr = window.devicePixelRatio || 1;

    let mouse = { x: cw / 2, y: ch / 2, active: false };
    let isPaused = document.hidden;
    const handleVisibilityChange = () => { isPaused = document.hidden; };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    let neurons = [];
    let connections = [];
    let arcs = [];
    let ripples = [];
    let time = 0;
    let cycleTimer = 0;

    let R = 0, cx = 0, cy = 0;
    let bgCanvas = null;
    let dotSpacing = 28;

    const symbols = ['σ', '∂', 'α', 'λ', 'θ', '∇'];

    let layerConfig = window.innerWidth < 768 ? [4, 6, 8, 5, 3] : [6, 12, 16, 12, 8];
    const numLayers = layerConfig.length;

    const resize = () => {
      cw = window.innerWidth;
      ch = window.innerHeight;
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
      ctx.scale(dpr, dpr);
      
      cx = cw / 2;
      cy = ch / 2;
      R = Math.min(cw, ch) * 0.38;

      dotSpacing = cw < 768 ? 48 : 28;
      bgCanvas = document.createElement('canvas');
      bgCanvas.width = cw + dotSpacing * 2;
      bgCanvas.height = ch + dotSpacing * 2;
      const bgCtx = bgCanvas.getContext('2d');
      bgCtx.fillStyle = `rgba(74, 144, 217, 0.08)`;
      for (let x = 0; x < bgCanvas.width; x += dotSpacing) {
         for (let y = 0; y < bgCanvas.height; y += dotSpacing) {
             bgCtx.fillRect(x, y, 1, 1);
         }
      }
    };

    const getBezierPoint = (t, sx, sy, cpx, cpy, ex, ey) => {
        return {
            x: (1-t)*(1-t)*sx + 2*(1-t)*t*cpx + t*t*ex,
            y: (1-t)*(1-t)*sy + 2*(1-t)*t*cpy + t*t*ey
        };
    };

    function drawHexagon(x, y, r) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            let a = (Math.PI / 3) * i - Math.PI / 2;
            let px = x + r * Math.cos(a);
            let py = y + r * Math.sin(a);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
    }

    class Neuron {
      constructor(l, i, count) {
        this.layerIndex = l;
        this.neuronIndex = i;
        this.isInput = l === 0;
        this.isOutput = l === numLayers - 1;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.activation = 0;
        this.sym = symbols[Math.floor(Math.random() * symbols.length)];
        this.radius = cw < 768 ? 7 : 10;

        if (this.isInput) {
            this.theta = Math.PI + Math.PI * (i + 1) / (count + 1);
            this.baseX = cx + R * Math.cos(this.theta);
            this.baseY = cy + R * Math.sin(this.theta);
        } else if (this.isOutput) {
            this.theta = 0 + Math.PI * (i + 1) / (count + 1);
            this.baseX = cx + R * Math.cos(this.theta);
            this.baseY = cy + R * Math.sin(this.theta);
        } else {
            const innerR = R * (1 - l / (numLayers - 1)) * 0.85;
            this.theta = (Math.PI * 2 * i) / count + (l % 2 === 0 ? 0 : Math.PI / count);
            this.baseX = cx + innerR * Math.cos(this.theta);
            this.baseY = cy + innerR * Math.sin(this.theta);
        }
      }
      
      activate(strength=1) {
          this.activation = Math.min(1, this.activation + strength);
      }

      update() {
          this.pulsePhase += 0.02;
          this.activation *= 0.93;
      }

      draw(offsetX, offsetY) {
          const x = this.baseX + offsetX;
          const y = this.baseY + offsetY;

          let idleOpacity = 0.15 + Math.sin(this.pulsePhase) * 0.1; 
          let peakOpacity = 0.35;
          let alpha = Math.min(peakOpacity, idleOpacity + this.activation);

          let fillCol = this.activation > 0.5 ? `rgba(160, 196, 232, ${alpha})` : `rgba(13, 31, 60, ${alpha})`;
          let strokeCol = `rgba(26, 74, 122, ${0.4 + this.activation * 0.6})`;

          drawHexagon(x, y, this.radius);
          ctx.fillStyle = fillCol;
          ctx.fill();
          ctx.strokeStyle = strokeCol;
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = `rgba(74, 144, 217, ${0.2 + this.activation * 0.8})`;
          ctx.font = '8px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(this.sym, x, y);
      }
    }

    class Connection {
        constructor(from, to) {
            this.from = from;
            this.to = to;
            this.weight = Math.random();
            this.activity = 0;
            
            const midX = (this.from.baseX + this.to.baseX) / 2;
            const midY = (this.from.baseY + this.to.baseY) / 2;
            
            const strength = 0.3 + Math.random() * 0.3; 
            this.cpx = midX + (cx - midX) * strength;
            this.cpy = midY + (cy - midY) * strength;
        }
    }

    class AttentionArc {
        constructor(conn, isDaydream=false) {
            this.conn = conn;
            this.progress = 0;
            this.alive = true;
            this.isDaydream = isDaydream;
            this.speed = 0.015 + Math.random() * 0.01;
            this.lifeAfter = 1.0; 
        }

        update() {
            if (this.progress < 1) {
                this.progress += this.speed;
                this.conn.activity = Math.max(this.conn.activity, 1.0);
                if (this.progress >= 1) {
                    if (!this.isDaydream) {
                        this.conn.to.activate(1);
                        if (this.conn.to.isOutput) {
                            ripples.push(new Ripple(this.conn.to.baseX, this.conn.to.baseY));
                        } else {
                            spawnArcs(this.conn.to);
                        }
                    }
                }
            } else {
                this.lifeAfter -= 0.02;
                if (this.lifeAfter <= 0) this.alive = false;
            }
        }

        draw(offsetX, offsetY) {
            const sx = this.conn.from.baseX + offsetX;
            const sy = this.conn.from.baseY + offsetY;
            const ex = this.conn.to.baseX + offsetX;
            const ey = this.conn.to.baseY + offsetY;
            const cpx = this.conn.cpx + offsetX;
            const cpy = this.conn.cpy + offsetY;

            const alpha = this.progress < 1 ? 0.35 : 0.35 * this.lifeAfter;
            
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.quadraticCurveTo(cpx, cpy, ex, ey);
            
            const grad = ctx.createLinearGradient(sx, sy, ex, ey);
            if (this.isDaydream) {
                grad.addColorStop(0, `rgba(26, 58, 110, ${alpha * 0.2})`);
                grad.addColorStop(1, `rgba(26, 58, 110, ${alpha * 0.2})`);
            } else {
                grad.addColorStop(0, `rgba(79, 195, 247, ${alpha})`); 
                grad.addColorStop(1, `rgba(160, 196, 232, ${alpha})`);
            }
            
            ctx.strokeStyle = grad;
            ctx.lineWidth = 1 + this.conn.weight * 1.5;
            ctx.stroke();

            if (this.progress < 1) {
                const pt = getBezierPoint(this.progress, sx, sy, cpx, cpy, ex, ey);
                ctx.fillStyle = `rgba(255, 255, 255, 0.4)`;
                ctx.beginPath(); ctx.arc(pt.x, pt.y, 2, 0, Math.PI*2); ctx.fill();
            }
        }
    }

    class Ripple {
      constructor(x, y) {
        this.baseX = x; this.baseY = y;
        this.radius = 0;
        this.maxRadius = 35;
        this.speed = 1.5;
        this.alive = true;
      }
      update() {
        this.radius += this.speed;
        if (this.radius > this.maxRadius) this.alive = false;
      }
      draw(ox, oy) {
        const p = this.radius / this.maxRadius;
        const alpha = 0.35 * (1 - p);
        if (alpha < 0.005) return;
        ctx.beginPath();
        ctx.arc(this.baseX + ox, this.baseY + oy, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(160, 196, 232, ${alpha})`;
        ctx.lineWidth = 1 * (1 - p);
        ctx.stroke();
      }
    }

    const spawnArcs = (neuron) => {
        const outConns = connections.filter(c => c.from === neuron);
        if (outConns.length > 0 && arcs.length < 30) {
            const pick = outConns[Math.floor(Math.random() * outConns.length)];
            arcs.push(new AttentionArc(pick));
        }
    };

    const initNetwork = () => {
      neurons = [];
      connections = [];
      arcs = [];
      ripples = [];

      for (let l = 0; l < numLayers; l++) {
        const count = layerConfig[l];
        for (let n = 0; n < count; n++) {
          neurons.push(new Neuron(l, n, count));
        }
      }

      for (let l = 0; l < numLayers - 1; l++) {
        const curr = neurons.filter(n => n.layerIndex === l);
        const next = neurons.filter(n => n.layerIndex === l + 1);
        for (const from of curr) {
          for (const to of next) {
            if (Math.random() < 0.35) {
                connections.push(new Connection(from, to));
            }
          }
        }
      }
    };

    const runDaydream = () => {
        if (arcs.length < 5 && Math.random() < 0.02 && cycleTimer < 400) {
            const pick = connections[Math.floor(Math.random() * connections.length)];
            arcs.push(new AttentionArc(pick, true));
        }
    };

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      if (isPaused) return;

      if (cw < 768 && time % 2 !== 0) { time++; return; }
      time++;
      cycleTimer++;
      
      ctx.clearRect(0, 0, cw, ch);

      let mx = 0, my = 0;
      if (mouse.active) {
          mx = (mouse.x - cw/2) * -0.05;
          my = (mouse.y - ch/2) * -0.05;
      }

      // --- LAYER 1: Latent Dot Grid ---
      const l1x = mx * 0.2;
      const l1y = my * 0.2;
      if (bgCanvas) {
          const shiftX = ((l1x - time * 0.1) % dotSpacing + dotSpacing) % dotSpacing;
          ctx.drawImage(bgCanvas, shiftX - dotSpacing, l1y - dotSpacing);
          ctx.drawImage(bgCanvas, shiftX, l1y - dotSpacing);
      }

      // --- LAYER 2: Circle Web ---
      const l2x = mx * 0.5;
      const l2y = my * 0.5;
      
      ctx.beginPath();
      ctx.arc(cx + l2x, cy + l2y, R, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(26, 110, 181, ${0.2 + Math.sin(time*0.02)*0.1})`;
      ctx.setLineDash([2, 8]);
      ctx.lineDashOffset = -time * 0.2;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);

      connections.forEach(c => {
          ctx.beginPath();
          ctx.moveTo(c.from.baseX + l2x, c.from.baseY + l2y);
          ctx.quadraticCurveTo(c.cpx + l2x, c.cpy + l2y, c.to.baseX + l2x, c.to.baseY + l2y);
          ctx.strokeStyle = `rgba(26, 58, 110, 0.08)`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
      });

      arcs.forEach(a => { a.update(); a.draw(l2x, l2y); });
      arcs = arcs.filter(a => a.alive);

      ripples.forEach(r => { r.update(); r.draw(l2x, l2y); });
      ripples = ripples.filter(r => r.alive);

      neurons.forEach(n => { n.update(); n.draw(l2x, l2y); });

      // --- LAYER 3: Core ---
      const l3x = mx * 0.8;
      const l3y = my * 0.8;

      const coreR = cw < 768 ? 15 : 22;
      const coreRot = time * 0.005;
      let coreScale = 1.0;
      if (cycleTimer > 600 && cycleTimer < 800) {
          coreScale = 1.0 + Math.sin((cycleTimer - 600) * 0.05) * 0.15;
      }
      const coreX = cx + l3x;
      const coreY = cy + l3y;
      
      for (let i = 4; i > 0; i--) {
          drawOctagon(coreX, coreY, (coreR * coreScale) + (i * 4), coreRot);
          ctx.fillStyle = `rgba(26, 26, 78, ${0.1 / i})`;
          ctx.fill();
      }
      
      drawOctagon(coreX, coreY, coreR * coreScale, coreRot);
      ctx.fillStyle = (cycleTimer > 600 && cycleTimer < 800) ? `rgba(192, 216, 240, 0.35)` : `rgba(26, 26, 78, 0.4)`;
      ctx.fill();
      ctx.strokeStyle = `rgba(160, 196, 232, 0.6)`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Silent Inference Cycle Loop
      if (cycleTimer > 900) cycleTimer = 0; // 15 seconds mostly idle
      if (cycleTimer === 600) { // Initiate inference
          const inputs = neurons.filter(n => n.isInput);
          inputs.forEach((input, i) => {
              setTimeout(() => {
                  input.activate(1);
                  ripples.push(new Ripple(input.baseX, input.baseY));
                  spawnArcs(input);
              }, i * 200);
          });
      }

      runDaydream();
    };

    function drawOctagon(x, y, r, rot) {
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            let a = Math.PI / 4 * i + rot;
            let px = x + r * Math.cos(a);
            let py = y + r * Math.sin(a);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
    }

    const handleMouseMove = (e) => { 
        mouse.x = e.clientX; 
        mouse.y = e.clientY; 
        mouse.active = true; 
    };
    const handleMouseLeave = () => { mouse.active = false; };
    let lastWidth = window.innerWidth;
    const handleResize = () => {
      const newWidth = window.innerWidth;
      if (Math.abs(newWidth - lastWidth) > 5) {
        lastWidth = newWidth;
        resize(); initNetwork();
      } else resize();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    resize(); initNetwork(); animate();

    return () => {
      cancelAnimationFrame(animationId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />;
}
