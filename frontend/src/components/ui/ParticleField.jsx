import { useRef, useEffect } from 'react';

export default function ParticleField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let mouse = { x: null, y: null };

    // Neural Network Configuration
    const layerConfig = [4, 6, 8, 10, 8, 6, 3];
    let neurons = [];
    let connections = [];
    let signals = [];
    let floatingParticles = [];
    let feedTokens = [];    // words flying into input neurons
    let outputTokens = [];  // words emerging from output neurons

    // =================== Q&A DATA ===================
    const qaPool = [
      { q: "Who is Saud Ahmad?", a: "AI Engineer & Data Scientist" },
      { q: "What does Saud specialize in?", a: "LLMs, RAG & Agentic AI" },
      { q: "What tech stack does he use?", a: "Python, FastAPI, React" },
      { q: "How many CVs has he processed?", a: "3,500+ CVs for UAE firm" },
      { q: "What is AskSaud?", a: "AI Portfolio Assistant" },
      { q: "Where does Saud study?", a: "Data Science @ GIK Institute" },
      { q: "What databases does he use?", a: "ChromaDB, FAISS, Pinecone" },
      { q: "What frameworks does he use?", a: "LangGraph, LlamaIndex, PyTorch" },
      { q: "What has Saud deployed?", a: "4+ Production AI Systems" },
      { q: "How many projects built?", a: "15+ Projects and counting" },
      { q: "Favorite ML tools?", a: "Hugging Face, scikit-learn" },
      { q: "Does he do full-stack?", a: "React + FastAPI + Docker" },
    ];

    // Q&A State
    let currentQA = null;
    let qaPhase = 'idle';
    let qaTimer = 0;
    let questionText = '';
    let answerText = '';
    let qCharIndex = 0;
    let textOpacity = 1;
    let qaIndex = 0;
    let outputGlow = 0;
    let signalsReachedOutput = 0;
    let inputSignalCount = 0; // exact number of signals fired from input
    let answerTokensReady = false;
    let answerAssembled = '';
    let answerTokenIndex = 0;

    const shuffledQA = [...qaPool].sort(() => Math.random() - 0.5);

    // =================== ENERGY COLOR ===================
    const energyColor = (energy, alpha = 1) => {
      const e = Math.min(1, Math.max(0, energy));
      let r, g, b;
      if (e < 0.3) {
        const t = e / 0.3;
        r = Math.round(59 + t * (0 - 59));
        g = Math.round(130 + t * (210 - 130));
        b = Math.round(246 + t * (255 - 246));
      } else if (e < 0.6) {
        const t = (e - 0.3) / 0.3;
        r = Math.round(0 + t * 220);
        g = Math.round(210 + t * (255 - 210));
        b = Math.round(255);
      } else {
        const t = (e - 0.6) / 0.4;
        r = Math.round(220 + t * (255 - 220));
        g = Math.round(255 - t * (255 - 200));
        b = Math.round(255 - t * (255 - 60));
      }
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    // Helper: easing
    const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const easeOutQuad = (t) => 1 - (1 - t) * (1 - t);

    // =================== NEURON ===================
    class Neuron {
      constructor(x, y, layerIndex, neuronIndex) {
        this.x = x; this.y = y;
        this.baseX = x; this.baseY = y;
        this.layerIndex = layerIndex;
        this.neuronIndex = neuronIndex;
        this.radius = 3.5;
        this.baseOpacity = 0.2;
        this.opacity = this.baseOpacity;
        this.activation = 0;
        this.energy = 0;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.breathSpeed = 0.012 + Math.random() * 0.008;
        this.driftX = 0; this.driftY = 0;
        this.driftSpeedX = (Math.random() - 0.5) * 0.004;
        this.driftSpeedY = (Math.random() - 0.5) * 0.004;
        this.driftRange = 6 + Math.random() * 5;
      }

      activate(strength = 1) {
        this.activation = Math.min(1, this.activation + strength);
        this.energy = Math.min(1, this.energy + strength * 0.8);
      }

      update() {
        this.pulsePhase += this.breathSpeed;
        const breathe = Math.sin(this.pulsePhase) * 0.06;
        this.driftX += this.driftSpeedX;
        this.driftY += this.driftSpeedY;
        this.x = this.baseX + Math.sin(this.driftX) * this.driftRange;
        this.y = this.baseY + Math.cos(this.driftY) * this.driftRange;
        this.activation *= 0.94;
        this.energy *= 0.97;
        this.opacity = this.baseOpacity + breathe + this.activation * 0.6;

        if (mouse.x !== null) {
          const dx = this.x - mouse.x;
          const dy = this.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            this.opacity += (1 - dist / 150) * 0.25;
            this.energy = Math.min(1, this.energy + (1 - dist / 150) * 0.015);
          }
        }
      }

      draw() {
        const e = this.energy;
        if (this.activation > 0.05) {
          const gr = this.radius + 18 * this.activation;
          const gradient = ctx.createRadialGradient(this.x, this.y, this.radius, this.x, this.y, gr);
          gradient.addColorStop(0, energyColor(e, 0.4 * this.activation));
          gradient.addColorStop(1, energyColor(e, 0));
          ctx.beginPath(); ctx.arc(this.x, this.y, gr, 0, Math.PI * 2); ctx.fillStyle = gradient; ctx.fill();
        }
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius + 1.5, 0, Math.PI * 2);
        ctx.strokeStyle = energyColor(e * 0.7, this.opacity * 0.3);
        ctx.lineWidth = 0.8; ctx.stroke();
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = energyColor(e, this.opacity); ctx.fill();
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = energyColor(Math.min(1, e + 0.3), this.opacity * 0.9); ctx.fill();
      }
    }

    // =================== CONNECTION ===================
    class Connection {
      constructor(from, to) {
        this.from = from; this.to = to;
        this.weight = 0.3 + Math.random() * 0.7;
        this.baseOpacity = 0.025 + this.weight * 0.025;
        this.activity = 0; this.energy = 0;
      }
      update() { this.activity *= 0.92; this.energy *= 0.95; }
      draw() {
        const opacity = this.baseOpacity + this.activity * 0.18;
        let mb = 0;
        if (mouse.x !== null) {
          const mx = (this.from.x + this.to.x) / 2, my = (this.from.y + this.to.y) / 2;
          const d = Math.sqrt((mx - mouse.x) ** 2 + (my - mouse.y) ** 2);
          if (d < 150) mb = (1 - d / 150) * 0.06;
        }
        ctx.beginPath(); ctx.moveTo(this.from.x, this.from.y); ctx.lineTo(this.to.x, this.to.y);
        ctx.strokeStyle = energyColor(this.energy, opacity + mb);
        ctx.lineWidth = 0.4 + this.weight * 0.3 + this.activity * 2; ctx.stroke();
      }
    }

    // =================== SIGNAL ===================
    class Signal {
      constructor(connection, inheritedEnergy = 0) {
        this.connection = connection;
        this.progress = 0;
        this.speed = 0.015 + Math.random() * 0.018;
        this.alive = true;
        this.radius = 2.2 + Math.random() * 1.3;
        this.trailLength = 7;
        this.trail = [];
        this.energy = 0.15 + inheritedEnergy * 0.5;
        this.maxEnergy = 0.3 + Math.random() * 0.7;
      }

      update() {
        this.progress += this.speed;
        this.energy = Math.min(this.maxEnergy, this.energy + this.speed * 0.35);
        const x = this.connection.from.x + (this.connection.to.x - this.connection.from.x) * this.progress;
        const y = this.connection.from.y + (this.connection.to.y - this.connection.from.y) * this.progress;
        this.trail.unshift({ x, y, energy: this.energy });
        if (this.trail.length > this.trailLength) this.trail.pop();
        this.connection.activity = Math.max(this.connection.activity, 0.5);
        this.connection.energy = Math.max(this.connection.energy, this.energy);

        if (this.progress >= 1) {
          this.alive = false;
          this.connection.to.activate(0.6 + this.energy * 0.3);

          // Track output arrivals
          if (this.connection.to.layerIndex === layerConfig.length - 1) {
            signalsReachedOutput++;
            outputGlow = Math.min(1, outputGlow + 0.15);
          }

          // Always forward exactly 1 signal to the next layer (pure input-driven flow)
          if (this.connection.to.layerIndex < layerConfig.length - 1) {
            const tl = this.connection.to.layerIndex;
            const ni = this.connection.to.neuronIndex;
            const nextConns = connections.filter((c) => c.from.layerIndex === tl && c.from.neuronIndex === ni);
            if (nextConns.length > 0) {
              const pick = nextConns[Math.floor(Math.random() * nextConns.length)];
              signals.push(new Signal(pick, this.energy));
            }
          }
        }
      }

      draw() {
        for (let i = 0; i < this.trail.length; i++) {
          const t = this.trail[i];
          const fade = 1 - i / this.trail.length;
          ctx.beginPath(); ctx.arc(t.x, t.y, this.radius * (1 - i / this.trail.length * 0.5), 0, Math.PI * 2);
          ctx.fillStyle = energyColor(t.energy || this.energy, fade * 0.55); ctx.fill();
        }
        if (this.trail.length > 0) {
          const h = this.trail[0];
          const gs = this.radius * (4 + this.energy * 3);
          const g = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, gs);
          g.addColorStop(0, energyColor(this.energy, 0.5));
          g.addColorStop(0.5, energyColor(this.energy * 0.7, 0.15));
          g.addColorStop(1, energyColor(this.energy, 0));
          ctx.beginPath(); ctx.arc(h.x, h.y, gs, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
          ctx.beginPath(); ctx.arc(h.x, h.y, this.radius, 0, Math.PI * 2);
          ctx.fillStyle = energyColor(Math.min(1, this.energy + 0.3), 1); ctx.fill();
        }
      }
    }

    // =================== FEED TOKEN (word → input neuron) ===================
    class FeedToken {
      constructor(text, startX, startY, targetNeuron, delay) {
        this.text = text;
        this.startX = startX; this.startY = startY;
        this.targetNeuron = targetNeuron;
        this.delay = delay;
        this.progress = 0;
        this.speed = 0.018;
        this.alive = true;
        this.arrived = false;
        this.opacity = 1;
        this.timer = 0;
      }

      update() {
        this.timer++;
        if (this.timer < this.delay) return; // wait for stagger

        this.progress += this.speed;
        const t = easeInOutCubic(Math.min(1, this.progress));
        this.x = this.startX + (this.targetNeuron.x - this.startX) * t;
        this.y = this.startY + (this.targetNeuron.y - this.startY) * t;

        // Shrink opacity & scale as it approaches the neuron
        if (this.progress > 0.7) {
          this.opacity = Math.max(0, 1 - (this.progress - 0.7) / 0.3);
        }

        if (this.progress >= 1 && !this.arrived) {
          this.arrived = true;
          // Activate the input neuron
          this.targetNeuron.activate(1);
          this.targetNeuron.energy = 0.8;

          // Fire exactly 1 signal from this input neuron
          const outConns = connections.filter(
            (c) => c.from.layerIndex === 0 && c.from.neuronIndex === this.targetNeuron.neuronIndex
          );
          if (outConns.length > 0) {
            const pick = outConns[Math.floor(Math.random() * outConns.length)];
            signals.push(new Signal(pick, 0.3));
            inputSignalCount++;
          }
        }

        if (this.progress > 1.1) this.alive = false;
      }

      draw() {
        if (this.timer < this.delay || !this.x) return;
        const scale = this.progress < 0.2 ? easeOutQuad(this.progress / 0.2) : 1;
        const fontSize = Math.round(11 * scale);
        if (fontSize < 3) return;

        ctx.save();
        ctx.font = `600 ${fontSize}px "Inter", sans-serif`;
        ctx.textAlign = 'center';

        // Glow
        ctx.shadowColor = 'rgba(59, 130, 246, 0.7)';
        ctx.shadowBlur = 8 * this.opacity;
        ctx.fillStyle = `rgba(191, 219, 254, ${this.opacity * 0.95})`;
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
      }
    }

    // =================== OUTPUT TOKEN (output neuron → answer text) ===================
    class OutputToken {
      constructor(text, neuron, targetX, targetY, delay) {
        this.text = text;
        this.neuron = neuron;
        this.startX = neuron.x; this.startY = neuron.y;
        this.targetX = targetX; this.targetY = targetY;
        this.delay = delay;
        this.progress = 0;
        this.speed = 0.016;
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

        // Fade in as it moves
        this.opacity = Math.min(1, this.progress * 2);

        if (this.progress >= 1 && !this.arrived) {
          this.arrived = true;
          this.finalOpacity = 1;
        }

        if (this.arrived) {
          this.opacity = this.finalOpacity;
        }
      }

      draw() {
        if (this.timer < this.delay || !this.x) return;

        ctx.save();
        ctx.font = '700 13px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(34, 211, 238, 0.6)';
        ctx.shadowBlur = 10 * this.opacity;
        ctx.fillStyle = `rgba(207, 250, 254, ${this.opacity * 0.95})`;
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
      }

      // Fade out method
      fadeOut(rate) {
        this.finalOpacity = Math.max(0, this.finalOpacity - rate);
        this.opacity = this.finalOpacity;
        if (this.finalOpacity <= 0) this.alive = false;
      }
    }

    // =================== FLOATING PARTICLES ===================
    class FloatingParticle {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.25;
        this.vy = (Math.random() - 0.5) * 0.25;
        this.radius = Math.random() * 1.2 + 0.3;
        this.opacity = Math.random() * 0.08 + 0.02;
        this.pulseSpeed = Math.random() * 0.02 + 0.005;
        this.phase = Math.random() * Math.PI * 2;
      }
      update() {
        this.x += this.vx; this.y += this.vy;
        this.phase += this.pulseSpeed;
        if (this.x < -20) this.x = canvas.width + 20;
        if (this.x > canvas.width + 20) this.x = -20;
        if (this.y < -20) this.y = canvas.height + 20;
        if (this.y > canvas.height + 20) this.y = -20;
      }
      draw() {
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(59, 130, 246, ${this.opacity + Math.sin(this.phase) * 0.02})`;
        ctx.fill();
      }
    }

    // =================== INITIALIZATION ===================
    let isVertical = false;

    const initNetwork = () => {
      neurons = []; connections = []; signals = [];
      floatingParticles = []; feedTokens = []; outputTokens = [];

      const w = canvas.width, h = canvas.height;
      isVertical = w < 768; // switch to vertical on mobile
      const numLayers = layerConfig.length;
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
        const curr = neurons.filter((n) => n.layerIndex === l);
        const next = neurons.filter((n) => n.layerIndex === l + 1);
        for (const from of curr) {
          for (const to of next) {
            if (Math.random() < 0.55) connections.push(new Connection(from, to));
          }
        }
      }

      const pc = Math.min(35, Math.floor((w * h) / 35000));
      for (let i = 0; i < pc; i++) floatingParticles.push(new FloatingParticle());
    };

    // =================== Q&A ENGINE ===================
    const getQTextPosition = () => {
      const numLayers = layerConfig.length;
      const ls = isVertical ? canvas.height / (numLayers + 1) : canvas.width / (numLayers + 1);
      return isVertical
        ? { x: canvas.width / 2, y: Math.max(35, ls - 45) }
        : { x: Math.max(35, ls - 40), y: canvas.height * 0.13 };
    };

    const getATextPosition = () => {
      const numLayers = layerConfig.length;
      const ls = isVertical ? canvas.height / (numLayers + 1) : canvas.width / (numLayers + 1);
      return isVertical
        ? { x: canvas.width / 2, y: Math.min(canvas.height - 35, ls * numLayers + 45) }
        : { x: Math.min(canvas.width - 35, ls * numLayers + 40), y: canvas.height * 0.13 };
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
      answerTokensReady = false;
      answerAssembled = '';
      answerTokenIndex = 0;
      feedTokens = [];
      outputTokens = [];
    };

    const updateQA = () => {
      if (!currentQA) {
        qaTimer++;
        if (qaTimer > 80) startNextQuestion();
        return;
      }

      qaTimer++;

      switch (qaPhase) {
        case 'typing_q': {
          // Type out the question
          if (qaTimer % 2 === 0 && qCharIndex < currentQA.q.length) {
            questionText = currentQA.q.slice(0, qCharIndex + 1);
            qCharIndex++;
          }
          if (qCharIndex >= currentQA.q.length) {
            qaPhase = 'splitting';
            qaTimer = 0;
          }
          break;
        }

        case 'splitting': {
          // Brief pause, then split into tokens and create FeedTokens
          if (qaTimer > 30) {
            const words = currentQA.q.replace(/\?/g, '').split(' ').filter(w => w.length > 0);
            const inputNeurons = neurons.filter((n) => n.layerIndex === 0);
            const qPos = getQTextPosition();

            // Calculate word positions mimicking the text wrap
            ctx.font = '600 13px "Inter", sans-serif';
            const maxW = isVertical ? canvas.width - 40 : Math.max(140, Math.min(200, qPos.x * 1.5));
            const wordPositions = [];
            let line = '', y = qPos.y;
            let lineWords = [];

            for (const word of words) {
              const test = line + (line ? ' ' : '') + word;
              if (ctx.measureText(test).width > maxW && line) {
                // process previous line
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

            // Assign each word to an input neuron (round-robin)
            for (let i = 0; i < words.length; i++) {
              const neuron = inputNeurons[i % inputNeurons.length];
              const wp = wordPositions[i] || qPos;
              feedTokens.push(new FeedToken(words[i], wp.x, wp.y, neuron, i * 18));
            }

            questionText = ''; // Clear static text, words are now animated
            qaPhase = 'feeding_tokens';
            qaTimer = 0;
          }
          break;
        }

        case 'feeding_tokens': {
          // Wait for all feed tokens to arrive — no extra signals, purely input-driven
          const allArrived = feedTokens.length > 0 && feedTokens.every((t) => t.arrived || !t.alive);
          if (allArrived && qaTimer > 20) {
            qaPhase = 'propagating';
            qaTimer = 0;
          }
          break;
        }

        case 'propagating': {
          // No random mid-layer firing — only input-originated signals propagate

          // Wait until ALL input signals have reached the output layer
          const hasActiveSignals = signals.length > 0;
          const allReached = inputSignalCount > 0 && signalsReachedOutput >= inputSignalCount;

          if ((allReached && !hasActiveSignals) || qaTimer > 180) {
            // All input signals arrived at output → ready
            const outputNeurons = neurons.filter((n) => n.layerIndex === layerConfig.length - 1);
            outputNeurons.forEach((n) => { n.activate(1); n.energy = 1; });
            outputGlow = 1;
            qaPhase = 'assembling_answer';
            qaTimer = 0;
          }
          break;
        }

        case 'assembling_answer': {
          // Split answer into words and have them emerge from output neurons
          if (qaTimer === 1) {
            const words = currentQA.a.split(' ').filter(w => w.length > 0);
            const outputNeurons = neurons.filter((n) => n.layerIndex === layerConfig.length - 1);
            const aPos = getATextPosition();

            // Calculate target positions mimicking proper center-aligned word wrap
            ctx.font = '700 13px "Inter", sans-serif';
            const maxWidth = isVertical ? canvas.width - 40 : Math.max(140, Math.min(200, canvas.width - aPos.x + 60));

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
                y += 20; // Move down naturally
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
              outputTokens.push(new OutputToken(words[i], neuron, target.x, target.y, i * 15));
            }
          }

          // Check if all output tokens arrived
          const allTokensArrived = outputTokens.length > 0 && outputTokens.every((t) => t.arrived);
          if (allTokensArrived) {
            qaPhase = 'displaying';
            qaTimer = 0;
          }
          // Safety timeout
          if (qaTimer > 200) {
            qaPhase = 'displaying';
            qaTimer = 0;
          }
          break;
        }

        case 'displaying': {
          // Show full answer for a moment
          if (qaTimer > 150) {
            qaPhase = 'fading';
            qaTimer = 0;
          }
          break;
        }

        case 'fading': {
          textOpacity = Math.max(0, 1 - qaTimer / 45);
          outputGlow = Math.max(0, outputGlow - 0.025);

          // Fade output tokens
          outputTokens.forEach((t) => t.fadeOut(0.025));

          if (qaTimer > 55) {
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
          if (qaTimer > 50) startNextQuestion();
          break;
        }
      }
    };

    // =================== DRAW STATIC Q&A TEXT ===================
    const drawQAText = () => {
      // Question text (only during typing_q and splitting)
      if (questionText && (qaPhase === 'typing_q' || qaPhase === 'splitting')) {
        const qPos = getQTextPosition();
        ctx.save();
        ctx.textAlign = 'center';

        // Label
        ctx.font = '600 9px "Inter", sans-serif';
        ctx.fillStyle = `rgba(96, 165, 250, ${0.45 * textOpacity})`;
        ctx.fillText('INPUT QUERY', qPos.x, qPos.y - 22);

        // Question
        ctx.font = '600 13px "Inter", sans-serif';
        ctx.shadowColor = 'rgba(59, 130, 246, 0.5)';
        ctx.shadowBlur = 10;
        ctx.fillStyle = `rgba(219, 234, 254, ${0.9 * textOpacity})`;

        // Word wrap with mobile minimum width
        const maxW = isVertical ? canvas.width - 40 : Math.max(140, Math.min(200, qPos.x * 1.5));
        const words = questionText.split(' ');
        let line = '', y = qPos.y;
        for (const word of words) {
          const test = line + (line ? ' ' : '') + word;
          if (ctx.measureText(test).width > maxW && line) {
            ctx.fillText(line, qPos.x, y);
            line = word; y += 18;
          } else {
            line = test;
          }
        }
        ctx.fillText(line, qPos.x, y);

        // Cursor blink
        if (qaPhase === 'typing_q') {
          ctx.fillStyle = `rgba(96, 165, 250, ${Math.sin(qaTimer * 0.15) > 0 ? 0.8 : 0})`;
          const cw = ctx.measureText(line).width;
          ctx.fillRect(qPos.x + cw / 2 + 3, y - 11, 1.5, 14);
        }
        ctx.restore();
      }

      // Answer label (during assembling/displaying)
      if (qaPhase === 'assembling_answer' || qaPhase === 'displaying' || qaPhase === 'fading') {
        const aPos = getATextPosition();
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = '600 9px "Inter", sans-serif';
        ctx.fillStyle = `rgba(34, 211, 238, ${0.45 * textOpacity})`;
        ctx.fillText('OUTPUT', aPos.x, aPos.y - 22);
        ctx.restore();
      }

      // Input label during feeding
      if (qaPhase === 'feeding_tokens' || qaPhase === 'propagating') {
        const qPos = getQTextPosition();
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = '600 9px "Inter", sans-serif';
        ctx.fillStyle = `rgba(96, 165, 250, ${0.35})`;
        ctx.fillText('PROCESSING...', qPos.x, isVertical ? qPos.y + 40 : qPos.y - 22);
        ctx.restore();
      }
    };

    // =================== LAYER LABELS ===================
    const drawLayerLabels = () => {
      if (isVertical) return; // Hide layer labels on mobile to save space

      const numLayers = layerConfig.length;
      const ls = canvas.width / (numLayers + 1);
      const labels = ['Input', 'Hidden', 'Hidden', 'Deep', 'Hidden', 'Hidden', 'Output'];

      ctx.font = '10px "Inter", "Helvetica", sans-serif';
      ctx.textAlign = 'center';

      for (let l = 0; l < numLayers; l++) {
        let alpha = 0.08;
        if (qaPhase === 'feeding_tokens' && l === 0) alpha = 0.3;
        if (qaPhase === 'propagating' && l > 0 && l < numLayers - 1) alpha = 0.18;
        if ((qaPhase === 'assembling_answer' || qaPhase === 'displaying') && l === numLayers - 1) alpha = 0.35;
        ctx.fillStyle = `rgba(59, 130, 246, ${alpha})`;
        ctx.fillText(labels[l] || `L${l}`, ls * (l + 1), canvas.height - 20);
      }
    };

    // =================== OUTPUT GLOW ===================
    const drawOutputGlow = () => {
      if (outputGlow <= 0) return;
      const numLayers = layerConfig.length;
      const ls = isVertical ? canvas.height / (numLayers + 1) : canvas.width / (numLayers + 1);
      const ox = isVertical ? canvas.width / 2 : ls * numLayers;
      const oy = isVertical ? ls * numLayers : canvas.height / 2;
      const g = ctx.createRadialGradient(ox, oy, 10, ox, oy, 130);
      g.addColorStop(0, `rgba(34, 211, 238, ${0.07 * outputGlow})`);
      g.addColorStop(1, 'rgba(34, 211, 238, 0)');
      ctx.beginPath(); ctx.arc(ox, oy, 130, 0, Math.PI * 2);
      ctx.fillStyle = g; ctx.fill();
    };

    // =================== ANIMATION LOOP ===================
    let time = 0;
    let isVisible = true;

    const animate = () => {
      if (!isVisible) return;
      time++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      floatingParticles.forEach((p) => { p.update(); p.draw(); });
      connections.forEach((c) => { c.update(); c.draw(); });
      drawOutputGlow();
      neurons.forEach((n) => { n.update(); n.draw(); });

      // Signals
      signals.forEach((s) => { s.update(); s.draw(); });
      signals = signals.filter((s) => s.alive);

      // Feed tokens (words flying to input neurons)
      feedTokens.forEach((t) => { t.update(); t.draw(); });
      feedTokens = feedTokens.filter((t) => t.alive);

      // Output tokens (words emerging from output neurons)
      outputTokens.forEach((t) => { t.update(); t.draw(); });
      outputTokens = outputTokens.filter((t) => t.alive);

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
      neurons.forEach((n) => {
        const d = Math.sqrt((n.x - e.clientX) ** 2 + (n.y - e.clientY) ** 2);
        if (d < closestDist) { closestDist = d; closest = n; }
      });
      if (closest && closestDist < 100) {
        closest.activate(1); closest.energy = 0.9;
        connections.filter(
          (c) => c.from.layerIndex === closest.layerIndex && c.from.neuronIndex === closest.neuronIndex
        ).forEach((c) => signals.push(new Signal(c, 0.7)));
      }
    };
    const handleResize = () => {
      resize(); initNetwork();
      qaPhase = 'idle'; qaTimer = 0; currentQA = null;
      questionText = ''; feedTokens = []; outputTokens = [];
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('click', handleClick);

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const wasVisible = isVisible;
        isVisible = entry.isIntersecting;
        if (isVisible && !wasVisible) {
          animate();
        }
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
