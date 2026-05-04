import { useRef, useEffect } from 'react';

export default function ParticleField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let mouse = { x: null, y: null };
    let cw = window.innerWidth;
    let ch = window.innerHeight;

    // Neural Network Configuration
    let layerConfig = [4, 6, 8, 10, 8, 6, 3];
    if (window.innerWidth < 768) layerConfig = [3, 4, 5, 4, 3];
    const numLayers = layerConfig.length;
    let neurons = [];
    let connections = [];
    let signals = [];
    let feedTokens = [];
    let outputTokens = [];
    let ripples = [];

    // Per-layer glow: each layer tracks its own brightness independently
    let layerGlow = new Float32Array(numLayers); // 0..1

    // =================== Q&A DATA ===================
    const qaPool = [
      { q: "How does Saud architect autonomous AI agents?", a: "By leveraging LangGraph state machines and rigorous LLM pipelines." },
      { q: "What impact did Saud's AI recruitment engine deliver?", a: "Automated the semantic evaluation of 3,500+ complex CVs." },
      { q: "Which vector infrastructures does Saud specialize in?", a: "Production-grade ChromaDB, FAISS, and advanced semantic RAG systems." },
      { q: "How does Saud optimize real-time LLM performance?", a: "Asynchronous streaming architectures and Server-Sent Events via FastAPI." },
      { q: "What defines Saud's full-stack AI development capability?", a: "Seamlessly bridging dynamic React frontends with robust Python backends." },
      { q: "Where did Saud forge his foundational data science expertise?", a: "Through intensive academic training at GIK Institute of Technology." },
      { q: "What core frameworks power Saud's generative AI solutions?", a: "LlamaIndex, OpenAI, LangChain, and advanced PyTorch primitives." },
      { q: "How many enterprise AI systems has Saud successfully deployed?", a: "Multiple production systems transforming complex business workflows." },
      { q: "How does Saud ensure enterprise-grade AI processing?", a: "Implementing strict data pipelines, anonymization, and async queues." },
      { q: "What makes Saud's AskSaud portfolio assistant unique?", a: "It provides dynamic, intelligent answers using real-time RAG inference." },
      { q: "How does Saud handle sophisticated unstructured data parsing?", a: "Extracting structured schemas using NLP, OCR, and recursive chunking." },
      { q: "What is Saud's engineering philosophy for machine learning?", a: "Massive scalability, fault-tolerance, and exceptional user experiences." }
    ];

    // Q&A State
    let currentQA = null;
    let qaPhase = 'idle';
    let qaTimer = 0;
    let questionText = '';
    let qCharIndex = 0;
    let textOpacity = 1;
    let qaIndex = 0;
    let outputGlow = 0;
    let signalsReachedOutput = 0;
    let inputSignalCount = 0;
    let networkActivity = 0;

    const shuffledQA = [...qaPool].sort(() => Math.random() - 0.5);

    // =================== DEPTH-BASED COLOR (CACHED) ===================
    const _computeLayerRGB = (layerIndex) => {
      const t = numLayers > 1 ? Math.min(1, Math.max(0, layerIndex)) / (numLayers - 1) : 0;
      let r, g, b;
      if (t < 0.5) {
        const s = t / 0.5;
        r = Math.round(82 + s * (180 - 82));
        g = Math.round(82 + s * (154 - 82));
        b = Math.round(91 + s * (34 - 91));
      } else {
        const s = (t - 0.5) / 0.5;
        r = Math.round(180 + s * (245 - 180));
        g = Math.round(154 + s * (245 - 154));
        b = Math.round(34 + s * (245 - 34));
      }
      return { r, g, b };
    };
    // Pre-compute colors for each layer index
    const _layerColorCache = [];
    for (let i = 0; i < numLayers; i++) _layerColorCache[i] = _computeLayerRGB(i);

    const layerColorRGB = (layerIndex) => {
      const idx = Math.round(Math.min(numLayers - 1, Math.max(0, layerIndex)));
      return _layerColorCache[idx];
    };

    const layerColor = (layerIndex, alpha = 1) => {
      const c = layerColorRGB(layerIndex);
      return `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`;
    };

    const resize = () => {
      cw = window.innerWidth;
      ch = window.innerHeight;
      canvas.width = cw;
      canvas.height = ch;
    };

    const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const easeOutQuad = (t) => 1 - (1 - t) * (1 - t);

    // =================== RIPPLE ===================
    const MAX_RIPPLES = 20;
    class Ripple {
      constructor(x, y, layerIndex) {
        this.x = x; this.y = y;
        this.layerIndex = layerIndex;
        this.radius = 0;
        this.maxRadius = 40;
        this.speed = 2;
        this.alive = true;
      }
      update() {
        this.radius += this.speed;
        if (this.radius > this.maxRadius) this.alive = false;
      }
      draw() {
        const p = this.radius / this.maxRadius;
        const alpha = 0.25 * (1 - p) * (1 - p);
        if (alpha < 0.005) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = layerColor(this.layerIndex, alpha);
        ctx.lineWidth = 1.5 * (1 - p);
        ctx.stroke();
      }
    }

    // =================== LAYER AURA (lightweight) ===================
    let isVertical = false;
    const drawLayerAura = () => {
      const ls = isVertical ? ch / (numLayers + 1) : cw / (numLayers + 1);
      for (let l = 0; l < numLayers; l++) {
        const glow = layerGlow[l];
        if (glow < 0.02) continue;
        const coord = ls * (l + 1);
        const col = layerColorRGB(l);
        const alpha = 0.035 * glow;
        ctx.fillStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${alpha})`;
        if (isVertical) {
          ctx.fillRect(0, coord - ls * 0.4, cw, ls * 0.8);
        } else {
          ctx.fillRect(coord - ls * 0.4, 0, ls * 0.8, ch);
        }
      }
    };

    // =================== NEURON ===================
    class Neuron {
      constructor(x, y, layerIndex, neuronIndex) {
        this.x = x; this.y = y;
        this.baseX = x; this.baseY = y;
        this.layerIndex = layerIndex;
        this.neuronIndex = neuronIndex;
        this.isOutput = layerIndex === numLayers - 1;
        this.radius = this.isOutput ? 6.5 : 4;
        this.activation = 0;
        this.charge = 0;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.breathSpeed = this.isOutput ? 0.018 : 0.008 + Math.random() * 0.006;
        this.driftX = 0; this.driftY = 0;
        this.driftSpeedX = (Math.random() - 0.5) * 0.002;
        this.driftSpeedY = (Math.random() - 0.5) * 0.002;
        this.driftRange = 5 + Math.random() * 4;
      }

      activate(strength = 1) {
        this.activation = Math.min(1, this.activation + strength);
        this.charge = Math.min(1, this.charge + strength * 0.7);
        // Boost the layer glow more aggressively so all layers light up visibly
        layerGlow[this.layerIndex] = Math.min(1, layerGlow[this.layerIndex] + strength * 0.5);
      }

      update() {
        this.pulsePhase += this.breathSpeed;
        this.driftX += this.driftSpeedX;
        this.driftY += this.driftSpeedY;
        this.x = this.baseX + Math.sin(this.driftX) * this.driftRange;
        this.y = this.baseY + Math.cos(this.driftY) * this.driftRange;
        this.activation *= 0.91;
        this.charge *= 0.95;
      }

      draw() {
        const pulse = Math.sin(this.pulsePhase);
        const lg = layerGlow[this.layerIndex]; // how bright is this entire layer right now
        const col = layerColorRGB(this.layerIndex);

        // Idle opacity — higher base so middle layers are always somewhat visible
        const idleBase = this.isOutput ? 0.2 + pulse * 0.06 : 0.08 + pulse * 0.02;
        const layerBoost = lg * 0.4;
        const activationBoost = this.activation * 0.55;
        const opacity = Math.min(1, idleBase + layerBoost + activationBoost);

        // Charge glow — simple expanded circle, no gradient
        if (this.charge > 0.06) {
          const glowR = this.radius + 18 * this.charge;
          ctx.beginPath();
          ctx.arc(this.x, this.y, glowR, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${0.12 * this.charge})`;
          ctx.fill();
        }

        // Outer ring
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 1.2, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${opacity * 0.3})`;
        ctx.lineWidth = this.isOutput ? 1.4 : 0.7;
        ctx.stroke();

        // Core fill
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${opacity})`;
        ctx.fill();

        // Hot white center
        const centerAlpha = Math.min(1, 0.2 + this.activation * 0.5 + lg * 0.2) * 0.6;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${centerAlpha})`;
        ctx.fill();

        // Output neuron breathing — simple circle, no gradient
        if (this.isOutput) {
          const breathAlpha = 0.04 + pulse * 0.03 + lg * 0.06;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius + 10, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${breathAlpha})`;
          ctx.fill();
        }

        // Mouse hover charge
        if (mouse.x !== null) {
          const dx = this.x - mouse.x;
          const dy = this.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            this.charge = Math.min(1, this.charge + (1 - dist / 120) * 0.025);
            layerGlow[this.layerIndex] = Math.min(1, layerGlow[this.layerIndex] + (1 - dist / 120) * 0.008);
          }
        }
      }
    }

    // =================== CONNECTION ===================
    class Connection {
      constructor(from, to) {
        this.from = from; this.to = to;
        this.weight = 0.3 + Math.random() * 0.7;
        this.activity = 0;
      }

      update() {
        this.activity *= 0.86;
      }

      draw() {
        const fromLG = layerGlow[this.from.layerIndex];
        const toLG = layerGlow[this.to.layerIndex];
        const avgLayerGlow = (fromLG + toLG) / 2;

        // Hairline at rest, very dim. Brighter when layer glows or when active signal.
        const baseAlpha = 0.012 + this.weight * 0.008;
        const glowAlpha = avgLayerGlow * 0.08;
        const actAlpha = this.activity * 0.4;
        const alpha = Math.min(0.8, baseAlpha + glowAlpha + actAlpha);

        // Mouse proximity
        let mb = 0;
        if (mouse.x !== null) {
          const mx = (this.from.x + this.to.x) / 2;
          const my = (this.from.y + this.to.y) / 2;
          const d = Math.sqrt((mx - mouse.x) ** 2 + (my - mouse.y) ** 2);
          if (d < 120) mb = (1 - d / 120) * 0.04;
        }

        const fromCol = layerColorRGB(this.from.layerIndex);
        const toCol = layerColorRGB(this.to.layerIndex);

        if (this.activity > 0.08) {
          // Active: bright gradient, thickness reflects weight & signal
          const grad = ctx.createLinearGradient(this.from.x, this.from.y, this.to.x, this.to.y);
          grad.addColorStop(0, `rgba(${fromCol.r}, ${fromCol.g}, ${fromCol.b}, ${alpha + mb})`);
          grad.addColorStop(1, `rgba(${toCol.r}, ${toCol.g}, ${toCol.b}, ${alpha + mb})`);
          ctx.beginPath();
          ctx.moveTo(this.from.x, this.from.y);
          ctx.lineTo(this.to.x, this.to.y);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 0.4 + this.weight * 0.6 + this.activity * 2.5;
          ctx.stroke();
        } else {
          // Hairline at rest
          const midCol = {
            r: Math.round((fromCol.r + toCol.r) / 2),
            g: Math.round((fromCol.g + toCol.g) / 2),
            b: Math.round((fromCol.b + toCol.b) / 2)
          };
          ctx.beginPath();
          ctx.moveTo(this.from.x, this.from.y);
          ctx.lineTo(this.to.x, this.to.y);
          ctx.strokeStyle = `rgba(${midCol.r}, ${midCol.g}, ${midCol.b}, ${alpha + mb})`;
          ctx.lineWidth = 0.25 + this.weight * 0.12;
          ctx.stroke();
        }
      }
    }

    // =================== SIGNAL PARTICLE (optimized) ===================
    const MAX_SIGNALS = 35;
    class Signal {
      constructor(connection, inheritedEnergy = 0) {
        this.connection = connection;
        this.progress = 0;
        this.speed = (window.innerWidth < 768) ? 0.06 : 0.07 + Math.random() * 0.03;
        this.alive = true;
        this.energy = 0.3 + inheritedEnergy * 0.5;
        this.radius = 1.5 + this.energy * 2;
        this.trailLength = 4;
        this.trail = [];
      }

      update() {
        this.progress += this.speed;
        const x = this.connection.from.x + (this.connection.to.x - this.connection.from.x) * this.progress;
        const y = this.connection.from.y + (this.connection.to.y - this.connection.from.y) * this.progress;
        this.trail.unshift({ x, y });
        if (this.trail.length > this.trailLength) this.trail.pop();

        this.connection.activity = Math.max(this.connection.activity, 0.5 + this.energy * 0.5);

        if (this.progress >= 1) {
          this.alive = false;
          const target = this.connection.to;
          target.activate(0.7 + this.energy * 0.3);

          // Ripple only on input and output layers (performance)
          const arrivalLayer = target.layerIndex;
          if (arrivalLayer === 0 || arrivalLayer === numLayers - 1) {
            if (ripples.length < MAX_RIPPLES) ripples.push(new Ripple(target.x, target.y, arrivalLayer));
          }

          if (arrivalLayer === numLayers - 1) {
            signalsReachedOutput++;
            outputGlow = Math.min(1, outputGlow + 0.2);
          }

          // Forward — single signal only, cap total
          if (arrivalLayer < numLayers - 1 && signals.length < MAX_SIGNALS) {
            const tl = target.layerIndex;
            const ni = target.neuronIndex;
            const nextConns = connections.filter(c => c.from.layerIndex === tl && c.from.neuronIndex === ni);
            if (nextConns.length > 0) {
              const pick = nextConns[Math.floor(Math.random() * nextConns.length)];
              signals.push(new Signal(pick, this.energy * 0.75));
            }
          }
        }
      }

      draw() {
        if (this.trail.length === 0) return;
        const col = layerColorRGB(this.connection.to.layerIndex);

        // Short fading trail — simple circles, no gradients
        for (let i = 1; i < this.trail.length; i++) {
          const t = this.trail[i];
          const fade = 1 - i / this.trail.length;
          ctx.beginPath();
          ctx.arc(t.x, t.y, this.radius * (1 - i * 0.18), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${fade * 0.3})`;
          ctx.fill();
        }

        // Head — glow ring + white core (no radial gradient)
        const h = this.trail[0];
        ctx.beginPath();
        ctx.arc(h.x, h.y, this.radius + 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${col.r}, ${col.g}, ${col.b}, 0.15)`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(h.x, h.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, 0.9)`;
        ctx.fill();
      }
    }

    // =================== FEED TOKEN ===================
    class FeedToken {
      constructor(text, startX, startY, targetNeuron, delay) {
        this.text = text;
        this.startX = startX; this.startY = startY;
        this.targetNeuron = targetNeuron;
        this.delay = delay;
        this.progress = 0;
        this.speed = 0.06;
        this.alive = true;
        this.arrived = false;
        this.opacity = 1;
        this.timer = 0;
      }

      update() {
        this.timer++;
        if (this.timer < this.delay) return;
        this.progress += this.speed;
        const t = easeInOutCubic(Math.min(1, this.progress));
        this.x = this.startX + (this.targetNeuron.x - this.startX) * t;
        this.y = this.startY + (this.targetNeuron.y - this.startY) * t;

        if (this.progress > 0.7) {
          this.opacity = Math.max(0, 1 - (this.progress - 0.7) / 0.3);
        }

        if (this.progress >= 1 && !this.arrived) {
          this.arrived = true;
          this.targetNeuron.activate(1);
          this.targetNeuron.charge = 1;

          // Fire all outgoing connections from this input neuron for a burst effect
          const outConns = connections.filter(
            c => c.from.layerIndex === 0 && c.from.neuronIndex === this.targetNeuron.neuronIndex
          );
          if (outConns.length > 0) {
            // Primary signal
            const pick = outConns[Math.floor(Math.random() * outConns.length)];
            signals.push(new Signal(pick, 0.6));
            inputSignalCount++;
          }

          // Ripple burst on input
          ripples.push(new Ripple(this.targetNeuron.x, this.targetNeuron.y, 0));
        }

        if (this.progress > 1.1) this.alive = false;
      }

      draw() {
        if (this.timer < this.delay || !this.x) return;
        const scale = this.progress < 0.2 ? easeOutQuad(this.progress / 0.2) : 1;
        const fontSize = Math.round(11 * scale);
        if (fontSize < 3) return;
        ctx.font = `700 ${fontSize}px "Inter", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = `rgba(180, 154, 34, ${this.opacity})`;
        ctx.fillText(this.text, this.x, this.y);
      }
    }

    // =================== OUTPUT TOKEN ===================
    class OutputToken {
      constructor(text, neuron, targetX, targetY, delay) {
        this.text = text;
        this.neuron = neuron;
        this.startX = neuron.x; this.startY = neuron.y;
        this.targetX = targetX; this.targetY = targetY;
        this.delay = delay;
        this.progress = 0;
        this.speed = 0.15;
        this.alive = true;
        this.arrived = false;
        this.opacity = 0;
        this.timer = 0;
        this.finalOpacity = 0;
      }

      update() {
        this.timer++;
        if (this.timer < this.delay) return;
        this.progress += this.speed;
        const t = easeInOutCubic(Math.min(1, this.progress));
        this.x = this.startX + (this.targetX - this.startX) * t;
        this.y = this.startY + (this.targetY - this.startY) * t;
        this.opacity = Math.min(1, this.progress * 2);
        if (this.progress >= 1 && !this.arrived) {
          this.arrived = true;
          this.finalOpacity = 1;
        }
        if (this.arrived) this.opacity = this.finalOpacity;
      }

      draw() {
        if (this.timer < this.delay || !this.x) return;
        ctx.fillStyle = `rgba(180, 154, 34, ${this.opacity})`;
        ctx.fillText(this.text, this.x, this.y);
      }

      fadeOut(rate) {
        this.finalOpacity = Math.max(0, this.finalOpacity - rate);
        this.opacity = this.finalOpacity;
        if (this.finalOpacity <= 0) this.alive = false;
      }
    }

    // =================== FLOATING PARTICLES (Removed for perf) ===================

    // =================== INITIALIZATION ===================
    const initNetwork = () => {
      neurons = []; connections = []; signals = [];
      feedTokens = []; outputTokens = []; ripples = [];
      layerGlow = new Float32Array(numLayers);

      const w = cw, h = ch;
      isVertical = w < 768;
      const layerSpacing = isVertical ? h / (numLayers + 1) : w / (numLayers + 1);

      for (let l = 0; l < numLayers; l++) {
        const count = layerConfig[l];
        const layerCoord = layerSpacing * (l + 1);
        const neuronSpacing = isVertical ? w / (count + 1) : h / (count + 1);
        for (let n = 0; n < count; n++) {
          const crossCoord = neuronSpacing * (n + 1);
          const x = isVertical ? crossCoord : layerCoord;
          const y = isVertical ? layerCoord : crossCoord;
          neurons.push(new Neuron(x, y, l, n));
        }
      }

      for (let l = 0; l < numLayers - 1; l++) {
        const curr = neurons.filter(n => n.layerIndex === l);
        const next = neurons.filter(n => n.layerIndex === l + 1);
        for (const from of curr) {
          for (const to of next) {
            if (Math.random() < 0.25) connections.push(new Connection(from, to));
          }
        }
      }
    };

    // =================== Q&A ENGINE ===================
    const getQTextPosition = () => {
      const ls = isVertical ? ch / (numLayers + 1) : cw / (numLayers + 1);
      return isVertical
        ? { x: cw / 2, y: Math.max(28, ls * 0.35) }
        : { x: Math.max(35, ls - 40), y: ch * 0.13 };
    };

    const getATextPosition = () => {
      const ls = isVertical ? ch / (numLayers + 1) : cw / (numLayers + 1);
      return isVertical
        ? { x: cw / 2, y: Math.min(ch - 160, ls * numLayers + ls * 0.4) }
        : { x: Math.min(cw - 35, ls * numLayers + 40), y: ch * 0.13 };
    };

    const startNextQuestion = () => {
      currentQA = shuffledQA[qaIndex % shuffledQA.length];
      qaIndex++;
      qaPhase = 'typing_q';
      qaTimer = 0;
      questionText = '';
      qCharIndex = 0;
      textOpacity = 1;
      outputGlow = 0;
      signalsReachedOutput = 0;
      inputSignalCount = 0;
      feedTokens = [];
      outputTokens = [];
    };

    const updateQA = () => {
      // Decay all layer glows every frame — slower decay so layers stay lit longer
      for (let i = 0; i < numLayers; i++) {
        layerGlow[i] *= 0.985;
      }

      if (!currentQA) {
        qaTimer++;
        networkActivity = Math.max(0, networkActivity - 0.008);
        if (qaTimer > 30) startNextQuestion();
        return;
      }
      qaTimer++;

      switch (qaPhase) {
        case 'typing_q': {
          networkActivity = Math.min(0.15, networkActivity + 0.003);
          if (qCharIndex < currentQA.q.length) {
            questionText = currentQA.q.slice(0, qCharIndex + 2);
            qCharIndex += 2;
          }
          if (qCharIndex >= currentQA.q.length) {
            qaPhase = 'splitting';
            qaTimer = 0;
          }
          break;
        }

        case 'splitting': {
          networkActivity = Math.min(0.3, networkActivity + 0.008);
          // Wait 90 frames (~1.5s) so users can read the full question
          if (qaTimer > 90) {
            const words = currentQA.q.replace(/\?/g, '').split(' ').filter(w => w.length > 0);
            const inputNeurons = neurons.filter(n => n.layerIndex === 0);
            const qPos = getQTextPosition();

            ctx.font = isVertical ? '600 11px "Inter", sans-serif' : '600 13px "Inter", sans-serif';
            const maxW = isVertical ? cw - 30 : Math.max(140, Math.min(200, qPos.x * 1.5));
            const wordPositions = [];
            let line = '', y = qPos.y;
            let lineWords = [];

            for (const word of words) {
              const test = line + (line ? ' ' : '') + word;
              if (ctx.measureText(test).width > maxW && line) {
                let cumX = qPos.x - ctx.measureText(line).width / 2;
                lineWords.forEach(lw => {
                  const ww = ctx.measureText(lw + ' ').width;
                  wordPositions.push({ x: cumX + ww / 2, y: y + 5 });
                  cumX += ww;
                });
                line = word;
                y += 18;
                lineWords = [word];
              } else {
                line = test;
                lineWords.push(word);
              }
            }
            if (lineWords.length > 0) {
              let cumX = qPos.x - ctx.measureText(line).width / 2;
              lineWords.forEach(lw => {
                const ww = ctx.measureText(lw + ' ').width;
                wordPositions.push({ x: cumX + ww / 2, y: y + 5 });
                cumX += ww;
              });
            }

            for (let i = 0; i < words.length; i++) {
              const neuron = inputNeurons[i % inputNeurons.length];
              const wp = wordPositions[i] || qPos;
              feedTokens.push(new FeedToken(words[i], wp.x, wp.y, neuron, i * 3));
            }

            questionText = '';
            qaPhase = 'feeding_tokens';
            qaTimer = 0;
          }
          break;
        }

        case 'feeding_tokens': {
          networkActivity = Math.min(0.6, networkActivity + 0.012);
          const allArrived = feedTokens.length > 0 && feedTokens.every(t => t.arrived || !t.alive);
          if (allArrived && qaTimer > 10) {
            qaPhase = 'propagating';
            qaTimer = 0;
          }
          break;
        }

        case 'propagating': {
          networkActivity = Math.min(1, networkActivity + 0.015);

          const hasActiveSignals = signals.length > 0;
          const timeout = isVertical ? 250 : 150;

          // Answer immediately when wavefront hits output layer
          if ((signalsReachedOutput > 0 && signalsReachedOutput >= inputSignalCount * 0.3) || qaTimer > timeout || (inputSignalCount > 0 && signalsReachedOutput >= inputSignalCount)) {
            const outputNeurons = neurons.filter(n => n.layerIndex === numLayers - 1);
            outputNeurons.forEach(n => {
              n.activate(1);
              n.charge = 1;
              ripples.push(new Ripple(n.x, n.y, n.layerIndex));
            });
            // Full output layer glow
            layerGlow[numLayers - 1] = 1;
            outputGlow = 1;
            qaPhase = 'assembling_answer';
            qaTimer = 0;
          }
          break;
        }

        case 'assembling_answer': {
          networkActivity = Math.max(0.5, networkActivity - 0.003);
          if (qaTimer === 1) {
            const words = currentQA.a.split(' ').filter(w => w.length > 0);
            const outputNeurons = neurons.filter(n => n.layerIndex === numLayers - 1);
            const aPos = getATextPosition();

            ctx.font = '700 13px "Inter", sans-serif';
            const maxWidth = isVertical ? cw - 40 : Math.max(140, Math.min(200, cw - aPos.x + 60));

            const wordTargets = [];
            let line = '', y = aPos.y;
            let lineWords = [];

            for (const word of words) {
              const test = line + (line ? ' ' : '') + word;
              if (ctx.measureText(test).width > maxWidth && line) {
                let cumX = aPos.x - ctx.measureText(line).width / 2;
                lineWords.forEach(lw => {
                  const ww = ctx.measureText(lw + ' ').width;
                  wordTargets.push({ x: cumX + ww / 2, y: y });
                  cumX += ww;
                });
                line = word;
                y += 20;
                lineWords = [word];
              } else {
                line = test;
                lineWords.push(word);
              }
            }
            if (lineWords.length > 0) {
              let cumX = aPos.x - ctx.measureText(line).width / 2;
              lineWords.forEach(lw => {
                const ww = ctx.measureText(lw + ' ').width;
                wordTargets.push({ x: cumX + ww / 2, y: y });
                cumX += ww;
              });
            }

            for (let i = 0; i < words.length; i++) {
              const neuron = outputNeurons[i % outputNeurons.length];
              const target = wordTargets[i];
              outputTokens.push(new OutputToken(words[i], neuron, target.x, target.y, 0));
            }
          }

          const allTokensArrived = outputTokens.length > 0 && outputTokens.every(t => t.arrived);
          if (allTokensArrived) {
            qaPhase = 'displaying';
            qaTimer = 0;
          }
          if (qaTimer > 150) {
            qaPhase = 'displaying';
            qaTimer = 0;
          }
          break;
        }

        case 'displaying': {
          networkActivity = Math.max(0.2, networkActivity - 0.005);
          if (qaTimer > 120) {
            qaPhase = 'fading';
            qaTimer = 0;
          }
          break;
        }

        case 'fading': {
          textOpacity = Math.max(0, 1 - qaTimer / 25);
          outputGlow = Math.max(0, outputGlow - 0.04);
          networkActivity = Math.max(0, networkActivity - 0.012);

          outputTokens.forEach(t => t.fadeOut(0.05));

          if (qaTimer > 30) {
            qaPhase = 'idle';
            qaTimer = 0;
            currentQA = null;
            questionText = '';
            feedTokens = [];
            outputTokens = [];
          }
          break;
        }

        case 'idle': {
          networkActivity = Math.max(0, networkActivity - 0.008);
          if (qaTimer > 20) startNextQuestion();
          break;
        }
      }
    };

    // =================== DRAW Q&A TEXT ===================
    const drawQAText = () => {
      const qFontSize = isVertical ? 13 : 15;
      const aFontSize = isVertical ? 13 : 15;
      const labelSize = isVertical ? 9 : 10;
      const lineH = isVertical ? 17 : 20;

      if (questionText && (qaPhase === 'typing_q' || qaPhase === 'splitting')) {
        const qPos = getQTextPosition();
        ctx.save();
        ctx.textAlign = 'center';

        ctx.font = `700 ${labelSize}px "Inter", sans-serif`;
        ctx.fillStyle = `rgba(180, 154, 34, ${0.6 * textOpacity})`;
        ctx.fillText('INPUT QUERY', qPos.x, qPos.y - 18);

        ctx.font = `700 ${qFontSize}px "Inter", sans-serif`;
        ctx.fillStyle = `rgba(254, 243, 199, ${textOpacity})`;

        const maxW = isVertical ? cw - 24 : Math.max(140, Math.min(200, qPos.x * 1.5));
        const words = questionText.split(' ');
        let line = '', y = qPos.y;
        for (const word of words) {
          const test = line + (line ? ' ' : '') + word;
          if (ctx.measureText(test).width > maxW && line) {
            ctx.fillText(line, qPos.x, y);
            line = word; y += lineH;
          } else {
            line = test;
          }
        }
        ctx.fillText(line, qPos.x, y);

        if (qaPhase === 'typing_q') {
          ctx.fillStyle = `rgba(180, 154, 34, ${Math.sin(qaTimer * 0.15) > 0 ? 0.8 : 0})`;
          const cw = ctx.measureText(line).width;
          ctx.fillRect(qPos.x + cw / 2 + 3, y - 10, 1.5, 13);
        }
        ctx.restore();
      }

      if (qaPhase === 'assembling_answer' || qaPhase === 'displaying' || qaPhase === 'fading') {
        const aPos = getATextPosition();
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = `700 ${labelSize}px "Inter", sans-serif`;
        ctx.fillStyle = `rgba(180, 154, 34, ${0.6 * textOpacity})`;
        ctx.fillText('OUTPUT', aPos.x, aPos.y - 18);
        ctx.restore();
      }

      if (qaPhase === 'feeding_tokens' || qaPhase === 'propagating') {
        const qPos = getQTextPosition();
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = `700 ${labelSize}px "Inter", sans-serif`;
        ctx.fillStyle = `rgba(180, 154, 34, ${0.5})`;
        ctx.fillText('PROCESSING...', qPos.x, isVertical ? qPos.y + 30 : qPos.y - 18);
        ctx.restore();
      }
    };

    // =================== LAYER LABELS ===================
    const drawLayerLabels = () => {
      if (isVertical) return;

      const ls = cw / (numLayers + 1);
      const labels = ['Input', 'Hidden', 'Hidden', 'Deep', 'Hidden', 'Hidden', 'Output'];

      ctx.font = '10px "Inter", "Helvetica", sans-serif';
      ctx.textAlign = 'center';

      for (let l = 0; l < numLayers; l++) {
        const alpha = 0.04 + layerGlow[l] * 0.3 + networkActivity * 0.04;
        ctx.fillStyle = layerColor(l, Math.min(0.5, alpha));
        ctx.fillText(labels[l] || `L${l}`, ls * (l + 1), ch - 20);
      }
    };

    // =================== OUTPUT GLOW ===================
    const drawOutputGlow = () => {
      if (outputGlow <= 0) return;
      const ls = isVertical ? ch / (numLayers + 1) : cw / (numLayers + 1);
      const ox = isVertical ? cw / 2 : ls * numLayers;
      const oy = isVertical ? ls * numLayers : ch / 2;
      const outCol = layerColorRGB(numLayers - 1);
      const g = ctx.createRadialGradient(ox, oy, 10, ox, oy, 160);
      g.addColorStop(0, `rgba(${outCol.r}, ${outCol.g}, ${outCol.b}, ${0.1 * outputGlow})`);
      g.addColorStop(1, `rgba(${outCol.r}, ${outCol.g}, ${outCol.b}, 0)`);
      ctx.beginPath();
      ctx.arc(ox, oy, 160, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    };

    // =================== ANIMATION LOOP ===================
    let time = 0;
    let isVisible = true;

    const animate = () => {
      if (!isVisible) return;
      if (cw < 768 && time % 2 !== 0) {
          time++;
          animationId = requestAnimationFrame(animate);
          return;
      }
      time++;
      ctx.clearRect(0, 0, cw, ch);

      // Layer auras — background glow per layer
      drawLayerAura();

      connections.forEach(c => { c.update(); c.draw(); });
      drawOutputGlow();
      neurons.forEach(n => { n.update(); n.draw(); });

      // Ripples
      ripples.forEach(r => { r.update(); r.draw(); });
      ripples = ripples.filter(r => r.alive);

      // Signals
      signals.forEach(s => { s.update(); s.draw(); });
      signals = signals.filter(s => s.alive);

      // Feed tokens
      feedTokens.forEach(t => { t.update(); t.draw(); });
      feedTokens = feedTokens.filter(t => t.alive);

      // Output tokens - set font once for all
      if (outputTokens.length > 0) {
        ctx.font = '700 14px "Inter", sans-serif';
        ctx.textAlign = 'center';
        outputTokens.forEach(t => { t.update(); t.draw(); });
        outputTokens = outputTokens.filter(t => t.alive);
      }

      drawLayerLabels();
      updateQA();
      drawQAText();

      animationId = requestAnimationFrame(animate);
    };

    // =================== EVENTS ===================
    const handleMouseMove = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const handleMouseLeave = () => { mouse.x = null; mouse.y = null; };
    const handleClick = (e) => {
      let closest = null, closestDist = Infinity;
      neurons.forEach(n => {
        const d = Math.sqrt((n.x - e.clientX) ** 2 + (n.y - e.clientY) ** 2);
        if (d < closestDist) { closestDist = d; closest = n; }
      });
      if (closest && closestDist < 100) {
        closest.activate(1);
        closest.charge = 1;
        ripples.push(new Ripple(closest.x, closest.y, closest.layerIndex));
        connections.filter(
          c => c.from.layerIndex === closest.layerIndex && c.from.neuronIndex === closest.neuronIndex
        ).forEach(c => signals.push(new Signal(c, 0.7)));
      }
    };
    let lastWidth = window.innerWidth;
    const handleResize = () => {
      const newWidth = window.innerWidth;
      if (Math.abs(newWidth - lastWidth) > 5) {
        lastWidth = newWidth;
        resize(); initNetwork();
        qaPhase = 'idle'; qaTimer = 0; currentQA = null;
        questionText = ''; feedTokens = []; outputTokens = [];
      } else {
        resize();
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('click', handleClick);

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const wasVisible = isVisible;
        isVisible = entry.isIntersecting;
        if (isVisible && !wasVisible) animate();
      });
    }, { threshold: 0.05 });
    observer.observe(canvas);

    resize(); initNetwork(); animate();

    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('click', handleClick);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0" style={{ pointerEvents: 'auto' }} />;
}
