/**
 * PINNED SCROLL CONTROLLER
 * - 450vh scroll distance, ScrollTrigger scrub: 1, driven by ONE GSAP timeline
 * - Two stacked layers: NOMINAL (bone/ink) and INCIDENT (ink/paper)
 * - clip-path: circle() expands from Three.js glass lens center
 * - Timeline:
 *   0–15% NOMINAL, 15–40% circle expands to ANOMALY, 40–65% ISOLATING,
 *   65–85% circle shrinks back to RESOLVED, 85–100% hold
 * - Pause waveforms when offscreen
 * - Reduced motion support
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { IncidentLensScene } from '../lib/incident-lens.js';

gsap.registerPlugin(ScrollTrigger);

export function initPinnedScroll() {
  const section = document.getElementById('incident-section');
  const incidentLayer = document.getElementById('layer-incident');
  if (!section || !incidentLayer) return;

  // 1. Initialize Incident Three.js Lens Scene
  const canvasEl = document.getElementById('incident-three-canvas');
  const lensScene = canvasEl ? new IncidentLensScene('incident-three-canvas') : null;

  // 2. Prefers Reduced Motion Check
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    if (lensScene) lensScene.setStage('NOMINAL');
    return;
  }

  // 3. Stage Configurations
  const STAGES = {
    NOMINAL: {
      key: 'NOMINAL',
      heading: 'NOMINAL',
      label: 'PHASE 02 // STRESS INJECTION',
      desc: 'Consensus verified across all 12 distributed regions.\nZero invariant drift detected. Latency baseline: 0.38ms.',
      probe: 'eBPF_KERNEL_RING_04',
      latency: '0.38ms',
      action: 'CONTINUOUS_MONITORING',
      waveType: 'calm',
      chipIndex: 0
    },
    ANOMALY: {
      key: 'ANOMALY',
      heading: 'ANOMALY',
      label: 'PHASE 02 // STRESS INJECTION',
      desc: 'Entropy surge detected on ingress pipeline node 03.\nMemory leak cascading into worker thread pool. SLA breached.',
      probe: 'INGRESS_ROUTER_NODE_03',
      latency: '48.20ms (SPIKE)',
      action: 'TRIPPING_CIRCUIT_BREAKER',
      waveType: 'violent',
      chipIndex: 1
    },
    ISOLATING: {
      key: 'ISOLATING',
      heading: 'ISOLATING',
      label: 'PHASE 02 // STRESS INJECTION',
      desc: 'Autonomous circuit-breaker tripped. Shard quarantined.\nSynthesizing causal blast-radius graph and backup routing.',
      probe: 'QUARANTINE_MESH_ENCLAVE',
      latency: '8.40ms (ISOLATING)',
      action: 'SYNTHESIZING_CAUSAL_GRAPH',
      waveType: 'flattening',
      chipIndex: 2
    },
    RESOLVED: {
      key: 'RESOLVED',
      heading: 'RESOLVED',
      label: 'PHASE 02 // STRESS INJECTION',
      desc: 'Faulty replica terminated and self-healed in 41ms.\nZero dropped packets. Global mesh restored to nominal.',
      probe: 'SELF_HEALED_SHARD_REPLICA',
      latency: '0.41ms (STABLE)',
      action: 'VERIFYING_INVARIANTS',
      waveType: 'steady',
      chipIndex: 3
    }
  };

  let activeStageKey = 'NOMINAL';

  // Elements across both layers
  const stageLabels = document.querySelectorAll('.mono-stage-label');
  const stageWordChips = document.querySelectorAll('.stage-word-chip');
  const incidentDescs = document.querySelectorAll('.incident-desc');
  const cardProbes = document.querySelectorAll('.card-probe-val');
  const cardLatencies = document.querySelectorAll('.card-latency-val');
  const cardActions = document.querySelectorAll('.card-action-val');
  const progressFills = document.querySelectorAll('.incident-progress-line-fill');
  const stepChips = document.querySelectorAll('.step-chip');

  // Single bottom-right percent counter and discrete stage labels
  const percentEl = document.getElementById('incident-percent-val');
  const stageLabelEls = document.querySelectorAll('.hud-stage-label');
  const readoutEl = document.getElementById('incident-hud-readout');

  function updateStageUI(stageKey) {
    if (activeStageKey === stageKey) return;
    activeStageKey = stageKey;
    const stage = STAGES[stageKey];
    if (!stage) return;

    // Character reveal for stage label
    stageLabels.forEach(el => {
      el.textContent = stage.label;
      gsap.fromTo(el, { opacity: 0.2, y: -4 }, { opacity: 0.7, y: 0, duration: 0.35, ease: 'power3.out' });
    });

    // Heading word
    stageWordChips.forEach(el => {
      el.textContent = stage.heading;
      gsap.fromTo(el, { scale: 0.92 }, { scale: 1, duration: 0.4, ease: 'back.out(2)' });
    });

    // Description text
    incidentDescs.forEach(el => {
      el.textContent = stage.desc;
      gsap.fromTo(el, { opacity: 0 }, { opacity: 0.75, duration: 0.4, ease: 'power2.out' });
    });

    // Card details
    cardProbes.forEach(el => el.textContent = stage.probe);
    cardLatencies.forEach(el => {
      el.textContent = stage.latency;
      if (stageKey === 'ANOMALY') el.classList.add('card-val-alert');
      else el.classList.remove('card-val-alert');
    });
    cardActions.forEach(el => el.textContent = stage.action);

    // Step Chips (0-3)
    stepChips.forEach(chip => {
      const idx = parseInt(chip.getAttribute('data-step-index'), 10);
      if (idx === stage.chipIndex) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });

    // Huge background word (strictly below text and cards, 6% opacity)
    const bgWords = document.querySelectorAll('.incident-bg-word');
    bgWords.forEach(el => {
      el.textContent = stage.heading;
    });

    // Update 3D Lens Scene
    if (lensScene) {
      lensScene.setStage(stageKey);
    }
  }

  // 4. Waveform Canvas Setup
  const nomWaveCanvas = document.getElementById('nominal-waveform-canvas');
  const incWaveCanvas = document.getElementById('incident-waveform-canvas');
  const nomWaveCtx = nomWaveCanvas ? nomWaveCanvas.getContext('2d') : null;
  const incWaveCtx = incWaveCanvas ? incWaveCanvas.getContext('2d') : null;

  let waveAnimationId = null;
  let isWaveformRunning = true;
  let waveTime = 0;

  function renderWaveforms() {
    if (!isWaveformRunning) return;
    waveTime += 0.05;

    const currentStage = STAGES[activeStageKey];
    const waveType = currentStage ? currentStage.waveType : 'calm';

    [
      { ctx: nomWaveCtx, canvas: nomWaveCanvas, isIncident: false },
      { ctx: incWaveCtx, canvas: incWaveCanvas, isIncident: true }
    ].forEach(({ ctx, canvas, isIncident }) => {
      if (!ctx || !canvas) return;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      ctx.beginPath();
      ctx.lineWidth = 1.6;

      if (isIncident) {
        ctx.strokeStyle = (waveType === 'violent' || waveType === 'flattening') ? '#FF4A12' : '#F7F5F0';
      } else {
        ctx.strokeStyle = '#0B0F14';
      }

      const mid = h / 2;

      for (let x = 0; x <= w; x += 3) {
        let y = mid;

        if (waveType === 'calm') {
          // Calm sine in NOMINAL
          y += Math.sin(x * 0.05 + waveTime * 1.8) * 8;
        } else if (waveType === 'violent') {
          // Violent spike in ANOMALY
          const spikeCenter = w * 0.55;
          const dist = Math.abs(x - spikeCenter);
          const envelope = Math.max(0, 1 - dist / (w * 0.35));
          const noise = (Math.random() - 0.5) * 14 * envelope;
          const spike = Math.sin(x * 0.15 + waveTime * 6) * 22 * envelope;
          y += spike + noise + Math.sin(x * 0.04 + waveTime * 2) * 5;
        } else if (waveType === 'flattening') {
          // Flattening line in ISOLATING
          const damp = Math.exp(-x / (w * 0.6));
          y += Math.sin(x * 0.08 + waveTime * 2.5) * 12 * damp;
        } else if (waveType === 'steady') {
          // Clean steady line at RESOLVED
          y += Math.sin(x * 0.02 + waveTime * 1.2) * 3;
        }

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.stroke();
    });

    waveAnimationId = requestAnimationFrame(renderWaveforms);
  }

  // Waveform canvas resize listener
  function resizeWaveforms() {
    [nomWaveCanvas, incWaveCanvas].forEach(c => {
      if (!c) return;
      c.width = c.clientWidth * (window.devicePixelRatio || 1);
      c.height = c.clientHeight * (window.devicePixelRatio || 1);
    });
  }

  resizeWaveforms();
  window.addEventListener('resize', resizeWaveforms);

  // Start Waveforms
  renderWaveforms();

  // Pause waveform canvas when offscreen via IntersectionObserver
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (!isWaveformRunning) {
          isWaveformRunning = true;
          renderWaveforms();
        }
      } else {
        isWaveformRunning = false;
        if (waveAnimationId) cancelAnimationFrame(waveAnimationId);
      }
    });
  }, { threshold: 0.05 });

  observer.observe(section);

  // Also pause waveforms when the tab is hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      isWaveformRunning = false;
      if (waveAnimationId) {
        cancelAnimationFrame(waveAnimationId);
        waveAnimationId = null;
      }
    } else {
      // Only resume if section is visible
      const rect = section.getBoundingClientRect();
      const inView = rect.bottom > 0 && rect.top < window.innerHeight;
      if (inView && !isWaveformRunning) {
        isWaveformRunning = true;
        renderWaveforms();
      }
    }
  });

  // 5. Build ONE GSAP Timeline driven by ScrollTrigger scrub: 1
  const circleState = { progress: 0 }; // 0 = 0px radius, 1 = full viewport radius

  function applyCircleClip(progressNormalized) {
    const isMobile = window.innerWidth <= 768;
    const coords = lensScene ? lensScene.getLensScreenPosition() : {
      x: window.innerWidth * (isMobile ? 0.5 : 0.72),
      y: window.innerHeight * (isMobile ? 0.35 : 0.70)
    };

    const maxR = Math.hypot(window.innerWidth, window.innerHeight) * 1.15;
    const currentR = progressNormalized * maxR;

    incidentLayer.style.clipPath = `circle(${currentR.toFixed(1)}px at ${coords.x.toFixed(1)}px ${coords.y.toFixed(1)}px)`;
  }

  // Create single timeline
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: window.innerWidth <= 768 ? '+=300%' : '+=450%',
      pin: true,
      pinSpacing: true,
      scrub: 1,
      anticipatePin: 1,
      onUpdate: (self) => {
        const p = self.progress;

        // Apply circle clip-path
        applyCircleClip(circleState.progress);

        // Single source of truth: self.progress mapped linearly to 0–100
        const pct = Math.min(100, Math.max(0, Math.round(p * 100)));

        // 1. Percentage counter (strictly monotonic, no jumps, one single element)
        if (percentEl) {
          percentEl.textContent = `${pct}%`;
          percentEl.setAttribute('aria-label', `${pct}%`);
        }

        // 2. Progress line fill
        progressFills.forEach(fill => {
          fill.style.width = `${pct}%`;
        });

        // 3. Stage thresholds:
        // 0–15 NOMINAL, 15–40 ANOMALY, 40–65 ISOLATING, 65–100 RESOLVED
        let currentStage = 'NOMINAL';
        let chipIdx = 0;
        if (pct < 15) {
          currentStage = 'NOMINAL';
          chipIdx = 0;
        } else if (pct < 40) {
          currentStage = 'ANOMALY';
          chipIdx = 1;
        } else if (pct < 65) {
          currentStage = 'ISOLATING';
          chipIdx = 2;
        } else {
          currentStage = 'RESOLVED';
          chipIdx = 3;
        }

        // 4. Render stage labels: discrete autoAlpha 0 or 1 (no cross-overlap)
        stageLabelEls.forEach(el => {
          const isTarget = el.getAttribute('data-stage') === currentStage;
          gsap.set(el, { autoAlpha: isTarget ? 1 : 0 });
        });

        // 5. Update step chips (0-3) across both layers
        stepChips.forEach(chip => {
          const idx = parseInt(chip.getAttribute('data-step-index'), 10);
          if (idx === chipIdx) {
            chip.classList.add('active');
          } else {
            chip.classList.remove('active');
          }
        });

        // 6. Theme inversion for bottom-right readout
        if (readoutEl) {
          if (circleState.progress > 0.15) {
            readoutEl.classList.add('is-incident-theme');
          } else {
            readoutEl.classList.remove('is-incident-theme');
          }
        }

        // 7. Update UI copy & 3D lens scene
        updateStageUI(currentStage);
      }
    }
  });

  // Timeline Segments:
  // 0.00 -> 0.15: NOMINAL (circle stays at 0)
  tl.to(circleState, {
    progress: 0,
    duration: 0.15,
    ease: 'none'
  }, 0);

  // 0.15 -> 0.40: Circle expands to 100% with expo.inOut (ANOMALY)
  tl.to(circleState, {
    progress: 1,
    duration: 0.25,
    ease: 'expo.inOut'
  }, 0.15);

  // 0.40 -> 0.65: Full circle hold (ISOLATING)
  tl.to(circleState, {
    progress: 1,
    duration: 0.25,
    ease: 'none'
  }, 0.40);

  // 0.65 -> 0.85: Circle shrinks back to 0 with expo.inOut (RESOLVED)
  tl.to(circleState, {
    progress: 0,
    duration: 0.20,
    ease: 'expo.inOut'
  }, 0.65);

  // 0.85 -> 1.00: Hold at 0 (RESOLVED)
  tl.to(circleState, {
    progress: 0,
    duration: 0.15,
    ease: 'none'
  }, 0.85);

  // Initialize UI with NOMINAL
  updateStageUI('NOMINAL');
  applyCircleClip(0);

  return {
    lensScene,
    tl
  };
}
