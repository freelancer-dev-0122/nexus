/**
 * THE PIPELINE — PINNED HORIZONTAL SCROLL STORY
 * - ScrollTrigger pin with anticipatePin and correct pinSpacing
 * - 3 full-viewport panels: 01 DETECT, 02 REASON, 03 ACT
 * - Simple per-character translateY reveal with overflow-hidden wrappers (no skew, pure ink)
 * - Inactive panels set to opacity 0 and visibility hidden (shared ease: power3.inOut)
 * - 3 Card animations:
 *   1. DETECT: Canvas streaming dots with orange anomaly targets and scaling rings
 *   2. REASON: SVG decision tree branching with orange path highlight & mono node tags
 *   3. ACT: 5 action rows ticking off with drawing orange checkmarks + 100% progress fill
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initPipeline() {
  const section = document.getElementById('pipeline-section');
  const track = document.getElementById('pipeline-track');
  if (!section || !track) return;

  const isMobile = window.innerWidth <= 900;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Prepare headlines with clean overflow-hidden character wrappers (no skew, no opacity fade)
  const headlines = document.querySelectorAll('.pipeline-headline');
  const headlineCharsPerPanel = [];

  headlines.forEach(headline => {
    const rawText = headline.textContent.trim();
    headline.innerHTML = '';
    const chars = [];
    const words = rawText.split(' ');

    words.forEach((word, wIdx) => {
      const wordSpan = document.createElement('span');
      wordSpan.style.display = 'inline-block';
      wordSpan.style.whiteSpace = 'nowrap';

      for (const char of word) {
        const mask = document.createElement('span');
        mask.className = 'char-mask';

        const inner = document.createElement('span');
        inner.className = 'char-inner';
        inner.textContent = char;
        // Pure ink solid color
        inner.style.color = '#0B0F14';

        mask.appendChild(inner);
        wordSpan.appendChild(mask);
        chars.push(inner);
      }

      headline.appendChild(wordSpan);

      if (wIdx < words.length - 1) {
        const space = document.createElement('span');
        space.className = 'char-space';
        space.innerHTML = '&nbsp;';
        space.style.display = 'inline-block';
        space.style.whiteSpace = 'pre';
        headline.appendChild(space);
      }
    });

    headlineCharsPerPanel.push(chars);
  });

  // 1. Setup Card Animations
  // --- Animation 1: DETECT Streaming Dots Canvas ---
  const detectCanvas = document.getElementById('detect-stream-canvas');
  let detectAnimId = null;
  let isDetectRunning = false;
  let detectDots = [];

  function initDetectCanvas() {
    if (!detectCanvas) return;
    const ctx = detectCanvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      detectCanvas.width = detectCanvas.clientWidth * dpr;
      detectCanvas.height = detectCanvas.clientHeight * dpr;
      createDots();
    }

    function createDots() {
      detectDots = [];
      const count = 48;
      const w = detectCanvas.width;
      const h = detectCanvas.height;

      for (let i = 0; i < count; i++) {
        detectDots.push({
          x: Math.random() * w,
          y: Math.random() * h,
          speed: 1.2 + Math.random() * 2.2,
          radius: 2.2 + Math.random() * 2,
          isAnomaly: i % 11 === 0,
          ringScale: 0,
          ringOpacity: 0
        });
      }
    }

    resize();
    window.addEventListener('resize', resize);

    function draw() {
      if (!isDetectRunning) return;
      const w = detectCanvas.width;
      const h = detectCanvas.height;

      ctx.clearRect(0, 0, w, h);

      detectDots.forEach(dot => {
        dot.x += dot.speed;
        if (dot.x > w + 20) {
          dot.x = -20;
          dot.y = Math.random() * h;
          dot.ringScale = 0;
          dot.ringOpacity = 0;
        }

        if (dot.isAnomaly) {
          // Anomalous dot: Orange #FF4A12
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, dot.radius * 1.3, 0, Math.PI * 2);
          ctx.fillStyle = '#FF4A12';
          ctx.fill();

          // Scaling indicator ring
          if (dot.x > w * 0.25 && dot.x < w * 0.85) {
            dot.ringScale = Math.min(1, dot.ringScale + 0.04);
            dot.ringOpacity = Math.min(0.85, dot.ringOpacity + 0.05);

            ctx.beginPath();
            ctx.arc(dot.x, dot.y, (dot.radius + 12) * dot.ringScale, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 74, 18, ${dot.ringOpacity})`;
            ctx.lineWidth = 1.4;
            ctx.stroke();

            // Coordinate pulse tag
            ctx.font = '9px monospace';
            ctx.fillStyle = `rgba(255, 74, 18, ${dot.ringOpacity})`;
            ctx.fillText('ANOMALY // 0x4F', dot.x + 18, dot.y - 8);
          }
        } else {
          // Normal telemetry dot
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(11, 15, 20, 0.45)';
          ctx.fill();
        }
      });

      detectAnimId = requestAnimationFrame(draw);
    }

    return {
      start: () => {
        if (!isDetectRunning) {
          isDetectRunning = true;
          draw();
        }
      },
      stop: () => {
        isDetectRunning = false;
        if (detectAnimId) cancelAnimationFrame(detectAnimId);
      }
    };
  }

  const detectController = initDetectCanvas();

  // --- Animation 2: REASON Decision Tree SVG ---
  function playReasonTree() {
    const branches = document.querySelectorAll('.tree-branch-line');
    const highlightedPath = document.querySelectorAll('.tree-branch-highlight');
    const nodeLabels = document.querySelectorAll('.tree-node-text');

    gsap.fromTo(branches,
      { strokeDashoffset: 200 },
      { strokeDashoffset: 0, duration: 1.1, stagger: 0.12, ease: 'power2.out' }
    );

    gsap.fromTo(highlightedPath,
      { strokeDashoffset: 200 },
      { strokeDashoffset: 0, duration: 1.3, delay: 0.5, ease: 'power3.out' }
    );

    gsap.fromTo(nodeLabels,
      { opacity: 0, y: 6 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.18, delay: 0.7, ease: 'power2.out' }
    );
  }

  // --- Animation 3: ACT Checklist & Progress ---
  let actTimeline = null;

  function playActChecklist() {
    const rows = document.querySelectorAll('.act-row');
    const fill = document.getElementById('act-progress-fill');
    const percentLabel = document.getElementById('act-percent-label');

    if (actTimeline) actTimeline.kill();

    rows.forEach(r => r.classList.remove('is-active', 'is-completed'));
    if (fill) fill.style.width = '0%';
    if (percentLabel) percentLabel.textContent = '0%';

    actTimeline = gsap.timeline();

    rows.forEach((row, i) => {
      actTimeline.add(() => {
        row.classList.add('is-active', 'is-completed');
        const pct = Math.round(((i + 1) / rows.length) * 100);
        if (fill) fill.style.width = `${pct}%`;
        if (percentLabel) percentLabel.textContent = `${pct}%`;
      }, `+=${i === 0 ? 0.2 : 0.4}`);
    });
  }

  // If reduced motion, set final states immediately
  if (prefersReduced) {
    if (detectController) detectController.start();
    document.querySelectorAll('.tree-branch-line, .tree-branch-highlight').forEach(el => {
      el.style.strokeDashoffset = '0';
    });
    document.querySelectorAll('.act-row').forEach(el => {
      el.classList.add('is-completed');
    });
    const fill = document.getElementById('act-progress-fill');
    if (fill) fill.style.width = '100%';
    return;
  }

  // Mobile layout: Stacked vertical reveal on scroll (no horizontal pin)
  if (isMobile) {
    const panels = document.querySelectorAll('.pipeline-panel');
    panels.forEach((p, idx) => {
      p.style.opacity = '1';
      p.style.visibility = 'visible';

      ScrollTrigger.create({
        trigger: p,
        start: 'top 75%',
        once: true,
        onEnter: () => {
          if (headlineCharsPerPanel[idx] && headlineCharsPerPanel[idx].length > 0) {
            gsap.fromTo(headlineCharsPerPanel[idx],
              { y: '105%' },
              { y: '0%', duration: 0.65, stagger: 0.02, ease: 'power3.out' }
            );
          }
          if (idx === 0 && detectController) detectController.start();
          if (idx === 1) playReasonTree();
          if (idx === 2) playActChecklist();
        }
      });
    });
    return;
  }

  // 2. Desktop Horizontal Scroll Implementation
  const panels = document.querySelectorAll('.pipeline-panel');
  const numbers = document.querySelectorAll('.panel-number-outline');
  const counterDigit = document.getElementById('pipeline-counter-digit');
  const progressFill = document.getElementById('pipeline-progress-fill');
  const ticks = document.querySelectorAll('.pipeline-tick');

  // Track width = 300vw, viewport width = innerWidth, distance to travel = 200vw
  const totalTrackDistance = (panels.length - 1) * window.innerWidth;

  // Initial panel states
  gsap.set(panels[0], { opacity: 1, visibility: 'visible' });
  gsap.set(panels[1], { opacity: 0, visibility: 'hidden' });
  gsap.set(panels[2], { opacity: 0, visibility: 'hidden' });

  let activeIndex = -1;

  function updateHUD(index) {
    if (activeIndex === index) return;
    activeIndex = index;

    if (counterDigit) {
      counterDigit.textContent = `0${index + 1}`;
    }

    ticks.forEach((tick, i) => {
      if (i === index) tick.classList.add('active');
      else tick.classList.remove('active');
    });

    // Character stagger reveal on the newly active panel headline
    if (headlineCharsPerPanel[index] && headlineCharsPerPanel[index].length > 0) {
      gsap.fromTo(headlineCharsPerPanel[index],
        { y: '105%' },
        { y: '0%', duration: 0.65, stagger: 0.02, ease: 'power3.out', overwrite: 'auto' }
      );
    }

    // Card animations
    if (index === 0) {
      if (detectController) detectController.start();
    } else {
      if (detectController) detectController.stop();
    }

    if (index === 1) playReasonTree();
    if (index === 2) playActChecklist();
  }

  // Single GSAP timeline scrubbing the track and crossfading panels
  const pipelineTl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: `+=${totalTrackDistance}`,
      pin: true,
      pinSpacing: true,
      anticipatePin: 1,
      scrub: 1,
      onUpdate: (self) => {
        const p = self.progress;

        // Progress line across bottom
        if (progressFill) {
          progressFill.style.width = `${p * 100}%`;
        }

        // Active panel index
        let currentIdx = 0;
        if (p >= 0.65) {
          currentIdx = 2;
        } else if (p >= 0.35) {
          currentIdx = 1;
        } else {
          currentIdx = 0;
        }

        updateHUD(currentIdx);
      }
    }
  });

  // Track moves horizontally from 0 to -totalTrackDistance
  pipelineTl.to(track, {
    x: -totalTrackDistance,
    ease: 'none',
    duration: 1
  }, 0);

  // Parallax on numbers
  numbers.forEach((num) => {
    pipelineTl.to(num, {
      x: -80,
      ease: 'none',
      duration: 1
    }, 0);
  });

  // Smooth crossfades with power2.inOut and visibility hidden outside active range:
  // Slide 01 fades out as Slide 02 arrives
  pipelineTl.to(panels[0], {
    opacity: 0,
    ease: 'power2.inOut',
    duration: 0.22,
    onComplete: () => { panels[0].style.visibility = 'hidden'; },
    onReverseComplete: () => { panels[0].style.visibility = 'visible'; }
  }, 0.18);

  // Slide 02 fades in cleanly
  pipelineTl.fromTo(panels[1],
    { opacity: 0, visibility: 'hidden' },
    {
      opacity: 1,
      ease: 'power2.inOut',
      duration: 0.22,
      onStart: () => { panels[1].style.visibility = 'visible'; },
      onReverseComplete: () => { panels[1].style.visibility = 'hidden'; }
    },
    0.22
  );

  // Slide 02 fades out as Slide 03 arrives
  pipelineTl.to(panels[1], {
    opacity: 0,
    ease: 'power2.inOut',
    duration: 0.22,
    onComplete: () => { panels[1].style.visibility = 'hidden'; },
    onReverseComplete: () => { panels[1].style.visibility = 'visible'; }
  }, 0.65);

  // Slide 03 fades in cleanly
  pipelineTl.fromTo(panels[2],
    { opacity: 0, visibility: 'hidden' },
    {
      opacity: 1,
      ease: 'power2.inOut',
      duration: 0.22,
      onStart: () => { panels[2].style.visibility = 'visible'; },
      onReverseComplete: () => { panels[2].style.visibility = 'hidden'; }
    },
    0.68
  );

  // Pause card animations when offscreen
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (activeIndex === 0 && detectController) detectController.start();
      } else {
        if (detectController) detectController.stop();
        if (actTimeline) actTimeline.pause();
      }
    });
  }, { threshold: 0.05 });

  observer.observe(section);

  // Initialize first panel
  updateHUD(0);
}
