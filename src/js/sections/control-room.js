/**
 * THE CONTROL ROOM — SIMULATED LIVE OPS DASHBOARD
 * Single state object: stage ('nominal' | 'detect' | 'spread' | 'reason' | 'act' | 'resolved')
 * All widgets synchronized: Service Map, Latency Chart, Log Feed, AI Terminal, KPI Strip.
 * 12-second scripted incident timeline with 1-click trigger.
 * Pause intervals and canvas when offscreen via IntersectionObserver.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { splitText } from '../lib/text-splitter.js';
import { DigitRoller } from '../lib/digit-roll.js';

gsap.registerPlugin(ScrollTrigger);

export function initControlRoom(options = {}) {
  const section = document.getElementById('control-room-section');
  if (!section) return;

  const heroLensScene = options.heroLensScene || window.__heroLensScene || null;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Background transition from bone pipeline to ink Control Room
  // Interpolates background color (#E9E6DF to #0B0F14) over a ~30vh scrub range,
  // switching text colors at the 0.5 midpoint (no gray flash, no abrupt edge)
  section.classList.add('theme-bone');
  gsap.fromTo(section,
    { backgroundColor: '#E9E6DF' },
    {
      backgroundColor: '#0B0F14',
      ease: 'power2.inOut',
      scrollTrigger: {
        trigger: section,
        start: 'top 95%',
        end: 'top 65%', // ~30vh scrub range
        scrub: 0.5,
        onUpdate: (self) => {
          if (self.progress >= 0.5) {
            section.classList.remove('theme-bone');
            section.classList.add('theme-ink');
          } else {
            section.classList.remove('theme-ink');
            section.classList.add('theme-bone');
          }
        }
      }
    }
  );

  // Single State Object
  const opsState = {
    stage: 'nominal',
    isIncidentRunning: false,
    p99Latency: 0.42,
    errorRate: 0.00,
    requestsPerSec: 48290,
    activeNodes: 1024,
    mttr: '41ms'
  };

  // 1. Live Clock with Odometer Digits
  const clockEl = document.getElementById('cr-clock');
  const clockRoller = clockEl ? new DigitRoller(clockEl) : null;
  function updateClock() {
    if (!clockEl) return;
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    const timeStr = `${h}:${m}:${s}`;
    if (clockRoller) {
      clockRoller.setValue(timeStr, 0.35, 0.02);
    } else {
      clockEl.textContent = timeStr;
    }
  }
  updateClock();
  let clockInterval = setInterval(updateClock, 1000);

  // 2. Headline Character Reveal on scroll enter
  const headlineEl = document.querySelector('.cr-headline');
  if (headlineEl) {
    const chars = splitText(headlineEl, { type: 'chars' });
    gsap.fromTo(chars,
      { y: 80, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.85,
        stagger: 0.02,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: headlineEl,
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      }
    );
  }

  // 3. Bento Card Stagger Entrance
  const cards = document.querySelectorAll('.bento-card');
  gsap.fromTo(cards,
    { y: 40, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: 0.9,
      stagger: 0.08,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.control-room-bento',
        start: 'top 82%',
        toggleActions: 'play none none none'
      }
    }
  );

  // 4. Cursor Spotlight on Cards
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });

  // 5. Service Health Map
  const healthGrid = document.getElementById('health-grid');
  const tooltip = document.getElementById('health-tooltip');
  let nodes = [];
  let epicenterIndex = 28; // Center node that fails first

  function buildHealthGrid() {
    if (!healthGrid) return;
    healthGrid.innerHTML = '';
    nodes = [];

    const isMobile = window.innerWidth <= 900;
    const cols = isMobile ? 8 : 12;
    const rows = 6;
    const totalCount = cols * rows;
    epicenterIndex = isMobile ? 20 : 28;

    for (let i = 0; i < totalCount; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const node = document.createElement('div');
      node.className = 'service-node';
      node.dataset.index = i;
      node.dataset.row = row;
      node.dataset.col = col;

      // Calculate Euclidean distance to epicenter
      const epiRow = Math.floor(epicenterIndex / cols);
      const epiCol = epicenterIndex % cols;
      node.dataset.dist = Math.hypot(row - epiRow, col - epiCol).toFixed(2);

      // Hover tooltip
      node.addEventListener('mouseenter', () => {
        const fakeLatency = opsState.stage === 'spread' || opsState.stage === 'detect'
          ? (node.classList.contains('is-anomaly') ? '42.8ms' : '1.1ms')
          : '0.38ms';
        tooltip.innerHTML = `<strong>svc-shard-${String(i).padStart(2, '0')}</strong><br/>LATENCY: ${fakeLatency}<br/>REGION: eu-west-3`;
        tooltip.classList.add('is-visible');

        const rect = node.getBoundingClientRect();
        const gridRect = healthGrid.getBoundingClientRect();
        tooltip.style.left = `${rect.left - gridRect.left + rect.width / 2}px`;
        tooltip.style.top = `${rect.top - gridRect.top}px`;
      });

      node.addEventListener('mouseleave', () => {
        tooltip.classList.remove('is-visible');
      });

      healthGrid.appendChild(node);
      nodes.push(node);
    }
  }

  buildHealthGrid();

  let prevWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    if ((prevWidth > 900 && window.innerWidth <= 900) || (prevWidth <= 900 && window.innerWidth > 900)) {
      prevWidth = window.innerWidth;
      buildHealthGrid();
    }
  });

  // Random shimmer on healthy nodes
  let shimmerInterval = setInterval(() => {
    if (opsState.isIncidentRunning) return;
    const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
    if (randomNode && !randomNode.classList.contains('is-anomaly')) {
      randomNode.style.backgroundColor = 'rgba(247, 245, 240, 0.45)';
      setTimeout(() => {
        if (!randomNode.classList.contains('is-anomaly')) {
          randomNode.style.backgroundColor = 'rgba(247, 245, 240, 0.25)';
        }
      }, 600);
    }
  }, 400);

  // 6. Latency Chart (Canvas Line Streaming every 120ms)
  const chartCanvas = document.getElementById('latency-chart-canvas');
  const p99El = document.getElementById('p99-readout');
  const p99Roller = p99El ? new DigitRoller(p99El) : null;
  let chartCtx = chartCanvas ? chartCanvas.getContext('2d') : null;
  const chartData = Array(36).fill(25); // baseline pixels
  let chartInterval = null;

  function resizeChartCanvas() {
    if (!chartCanvas) return;
    chartCanvas.width = chartCanvas.clientWidth * (window.devicePixelRatio || 1);
    chartCanvas.height = chartCanvas.clientHeight * (window.devicePixelRatio || 1);
  }
  resizeChartCanvas();
  window.addEventListener('resize', resizeChartCanvas);

  function drawLatencyChart() {
    if (!chartCtx || !chartCanvas) return;
    const w = chartCanvas.width;
    const h = chartCanvas.height;
    chartCtx.clearRect(0, 0, w, h);

    // Draw baseline grid line
    chartCtx.strokeStyle = 'rgba(247, 245, 240, 0.08)';
    chartCtx.lineWidth = 1;
    chartCtx.beginPath();
    chartCtx.moveTo(0, h * 0.7);
    chartCtx.lineTo(w, h * 0.7);
    chartCtx.stroke();

    // Line Path
    chartCtx.beginPath();
    const step = w / (chartData.length - 1);

    chartData.forEach((val, i) => {
      const x = i * step;
      const y = h - (val * (h / 120));
      if (i === 0) chartCtx.moveTo(x, y);
      else chartCtx.lineTo(x, y);
    });

    const isSpike = opsState.stage === 'detect' || opsState.stage === 'spread';
    chartCtx.strokeStyle = isSpike ? '#FF4A12' : '#F7F5F0';
    chartCtx.lineWidth = isSpike ? 2.5 : 1.8;
    chartCtx.stroke();

    // Glowing dot at current lead
    const lastX = w;
    const lastY = h - (chartData[chartData.length - 1] * (h / 120));
    chartCtx.beginPath();
    chartCtx.arc(lastX, lastY, isSpike ? 5 : 3.5, 0, Math.PI * 2);
    chartCtx.fillStyle = isSpike ? '#FF4A12' : '#F7F5F0';
    chartCtx.fill();
  }

  function updateLatencyStream() {
    let nextVal = 25;
    if (opsState.stage === 'detect') {
      nextVal = 55 + Math.random() * 20;
    } else if (opsState.stage === 'spread') {
      nextVal = 85 + Math.random() * 25;
    } else if (opsState.stage === 'reason') {
      nextVal = 60 + Math.random() * 15;
    } else if (opsState.stage === 'act') {
      nextVal = 35 + Math.random() * 8;
    } else {
      nextVal = 24 + Math.random() * 6;
    }

    chartData.shift();
    chartData.push(nextVal);
    drawLatencyChart();
  }

  chartInterval = setInterval(updateLatencyStream, 120);

  // 7. Live Log Feed
  const logsContainer = document.getElementById('logs-container');
  let logInterval = null;

  const sampleLogs = [
    { type: 'INFO', msg: 'ingress-gateway-01 sync verified // drift 0.001ms' },
    { type: 'INFO', msg: 'consensus-ring-alpha healthy // 12/12 peers' },
    { type: 'INFO', msg: 'ebpf-probe-42 telemetry packet dispatched' },
    { type: 'WARN', msg: 'thread-pool worker backlog reaching 82% threshold' },
    { type: 'ERROR', msg: 'circuit-breaker tripped on worker-shard-42' },
    { type: 'WARN', msg: 'entropy drift detected on ingress router node 03' },
    { type: 'INFO', msg: 'causal graph generated // blast radius 42 nodes' },
    { type: 'INFO', msg: 'autonomous rollback container spawned in 41ms' },
    { type: 'INFO', msg: 'ledger commit verified // state restored to nominal' }
  ];

  function addLogLine(type, msg) {
    if (!logsContainer) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.${String(Math.floor(now.getMilliseconds() / 10)).padStart(2, '0')}`;

    const line = document.createElement('div');
    line.className = 'log-entry font-mono';

    const chipClass = type === 'ERROR' ? 'chip-error' : (type === 'WARN' ? 'chip-warn' : 'chip-info');

    line.innerHTML = `
      <span class="log-time">${timeStr}</span>
      <span class="log-chip ${chipClass}">${type}</span>
      <span class="log-msg">${msg}</span>
    `;

    logsContainer.appendChild(line);

    // Keep max 14 lines in DOM
    while (logsContainer.children.length > 14) {
      logsContainer.removeChild(logsContainer.firstChild);
    }

    logsContainer.scrollTop = logsContainer.scrollHeight;
  }

  logInterval = setInterval(() => {
    if (opsState.stage === 'nominal') {
      const item = sampleLogs[Math.floor(Math.random() * 3)];
      addLogLine(item.type, item.msg);
    }
  }, 2200);

  // 8. AI Reasoning Terminal
  const termBody = document.getElementById('terminal-body');
  const confidenceFill = document.getElementById('confidence-fill');

  function typeTerminalLine(text, onComplete) {
    if (!termBody) return;
    const lineEl = document.createElement('div');
    lineEl.className = 'terminal-line';
    lineEl.innerHTML = `<span class="terminal-prompt">&gt;</span> <span class="term-text"></span><span class="terminal-cursor"></span>`;
    termBody.appendChild(lineEl);

    // Keep max 7 lines in terminal
    while (termBody.children.length > 7) {
      termBody.removeChild(termBody.firstChild);
    }

    const textSpan = lineEl.querySelector('.term-text');
    const cursor = lineEl.querySelector('.terminal-cursor');

    if (prefersReduced) {
      textSpan.textContent = text;
      cursor.remove();
      if (onComplete) onComplete();
      return;
    }

    let charIdx = 0;
    const typeTimer = setInterval(() => {
      if (charIdx < text.length) {
        textSpan.textContent += text[charIdx];
        charIdx++;
      } else {
        clearInterval(typeTimer);
        cursor.remove();
        if (onComplete) onComplete();
      }
    }, 28);
  }

  // Idle terminal loop
  typeTerminalLine('kernel eBPF mesh monitoring nominal baseline...');
  const idleLogs = [
    'verifying consensus ring integrity... 0 anomalies',
    'eBPF telemetry mesh active // latency variance 0.02ms',
    'zero invariant drift detected across 72 microservices',
    'autonomous guardrails engaged // standing by'
  ];
  let idleLogIdx = 0;
  let idleTermInterval = setInterval(() => {
    if (opsState.stage === 'nominal' && isSectionVisible) {
      typeTerminalLine(idleLogs[idleLogIdx % idleLogs.length]);
      idleLogIdx++;
    }
  }, 4500);

  // 9. KPI Strip
  const kpiErrorEl = document.getElementById('kpi-error-val');
  const kpiReqEl = document.getElementById('kpi-req-val');
  const kpiNodesEl = document.getElementById('kpi-nodes-val');
  const kpiMttrEl = document.getElementById('kpi-mttr-val');

  const kpiErrorRoller = kpiErrorEl ? new DigitRoller(kpiErrorEl) : null;
  const kpiReqRoller = kpiReqEl ? new DigitRoller(kpiReqEl) : null;
  const kpiNodesRoller = kpiNodesEl ? new DigitRoller(kpiNodesEl) : null;
  const kpiMttrRoller = kpiMttrEl ? new DigitRoller(kpiMttrEl) : null;

  if (kpiErrorRoller) kpiErrorRoller.setValue('0.00%', 0.5);
  if (kpiReqRoller) kpiReqRoller.setValue('48,290', 0.5);
  if (kpiNodesRoller) kpiNodesRoller.setValue('1,024', 0.5);
  if (kpiMttrRoller) kpiMttrRoller.setValue('41ms', 0.5);

  const kpiErrorChip = document.querySelector('.kpi-cell:nth-child(1) .kpi-delta-chip');
  const kpiErrorSpark = document.querySelector('.kpi-cell:nth-child(1) .sparkline-path');

  // 10. SCRIPTED 12-SECOND INCIDENT TIMELINE
  const triggerBtn = document.getElementById('cr-trigger-btn');
  const btnFill = document.getElementById('cr-btn-fill');
  const statusChip = document.getElementById('cr-status-chip');
  const statusChipText = document.getElementById('cr-chip-text');
  const scanline = document.getElementById('cr-scanline');

  function setStage(stageName) {
    opsState.stage = stageName;

    // Update Status Chip
    if (statusChip && statusChipText) {
      if (stageName === 'nominal') {
        statusChip.classList.remove('is-active-incident');
        statusChipText.textContent = 'ALL SYSTEMS NOMINAL';
      } else {
        statusChip.classList.add('is-active-incident');
        statusChipText.textContent = `INCIDENT // ${stageName.toUpperCase()}`;
      }
    }

    // Update P99 Readout
    if (p99El && p99Roller) {
      if (stageName === 'detect') {
        p99El.classList.add('is-spike');
        p99Roller.setValue('48.2ms', 0.4);
      } else if (stageName === 'spread') {
        p99El.classList.add('is-spike');
        p99Roller.setValue('88.4ms', 0.4);
      } else if (stageName === 'reason') {
        p99El.classList.add('is-spike');
        p99Roller.setValue('42.1ms', 0.4);
      } else if (stageName === 'act') {
        p99El.classList.remove('is-spike');
        p99Roller.setValue('1.2ms', 0.4);
      } else {
        p99El.classList.remove('is-spike');
        p99Roller.setValue('0.42ms', 0.4);
      }
    }
  }

  function triggerIncidentSequence() {
    if (opsState.isIncidentRunning) return;
    opsState.isIncidentRunning = true;
    if (triggerBtn) triggerBtn.disabled = true;

    const incidentTl = gsap.timeline({
      onComplete: () => {
        opsState.isIncidentRunning = false;
        if (triggerBtn) triggerBtn.disabled = false;
        if (btnFill) btnFill.style.width = '0%';
        setStage('nominal');
        addLogLine('INFO', 'incident sequence complete // systems nominal');
      }
    });

    // Button progress bar 0 -> 100% over 12s
    if (btnFill) {
      incidentTl.fromTo(btnFill, { width: '0%' }, { width: '100%', duration: 12, ease: 'none' }, 0);
    }

    // --- 0–2s: DETECT ---
    incidentTl.add(() => {
      setStage('detect');
      addLogLine('WARN', 'anomaly detected on node eu-west-3 // latency spike');
      addLogLine('WARN', 'entropy threshold breached: +38.4ms variance');
      typeTerminalLine('detecting anomaly on node eu-west-3. Initiating probe...');

      // Three.js camera shake on lens if still mounted
      if (heroLensScene && heroLensScene.camera && !prefersReduced) {
        const origX = heroLensScene.camera.position.x;
        const origY = heroLensScene.camera.position.y;
        gsap.fromTo(heroLensScene.camera.position,
          { x: origX - 0.08, y: origY + 0.08 },
          {
            x: origX + 0.08,
            y: origY - 0.08,
            duration: 0.05,
            repeat: 5,
            yoyo: true,
            ease: 'none',
            onComplete: () => {
              heroLensScene.camera.position.x = origX;
              heroLensScene.camera.position.y = origY;
            }
          }
        );
      }

      // Epicenter node fails
      const epiNode = nodes[epicenterIndex];
      if (epiNode) epiNode.classList.add('is-anomaly');
    }, 0);

    // --- 2–5s: SPREAD ---
    incidentTl.add(() => {
      setStage('spread');
      addLogLine('ERROR', 'circuit breaker tripped: worker-shard-42');
      addLogLine('ERROR', 'cascade breach on 14 replica pods');
      typeTerminalLine('tracing causal chain across 14 replica shards...');

      // KPI climbing
      if (kpiErrorRoller) kpiErrorRoller.setValue('4.82%', 0.6);
      if (kpiReqRoller) kpiReqRoller.setValue('31,400', 0.6);
      if (kpiNodesRoller) kpiNodesRoller.setValue('1,018', 0.6);
      if (kpiMttrRoller) kpiMttrRoller.setValue('240ms', 0.6);

      if (kpiErrorChip) {
        kpiErrorChip.textContent = '+4.82% SPIKE';
        kpiErrorChip.classList.add('is-alert');
      }
      if (kpiErrorSpark) kpiErrorSpark.classList.add('is-alert');

      // Map wave spreading outward by distance
      nodes.forEach(node => {
        const dist = parseFloat(node.dataset.dist);
        if (dist <= 4.2) {
          gsap.delayedCall(dist * 0.28, () => {
            node.classList.add('is-anomaly');
          });
        }
      });

      // Subtle screen shake (2px, 300ms)
      if (!prefersReduced) {
        gsap.fromTo(section,
          { x: -2, y: 1 },
          { x: 2, y: -1, duration: 0.05, repeat: 5, yoyo: true, ease: 'none', onComplete: () => {
            gsap.set(section, { x: 0, y: 0 });
          }}
        );
      }

      // Card borders pulsing orange
      cards.forEach(c => c.classList.add('pulsing-border'));
    }, 2);

    // --- 5–8s: REASON ---
    incidentTl.add(() => {
      setStage('reason');
      cards.forEach(c => c.classList.remove('pulsing-border'));
      addLogLine('INFO', 'causal graph synthesized in 3.8ms');
      typeTerminalLine('isolating shard 42 // root cause: memory leak in deploy 8f3c');
      if (confidenceFill) confidenceFill.style.width = '99%';

      // Scanline sweep across the section
      if (scanline && !prefersReduced) {
        gsap.fromTo(scanline,
          { top: '0%', opacity: 1 },
          { top: '100%', opacity: 0, duration: 1.6, ease: 'power2.inOut' }
        );
      }
    }, 5);

    // --- 8–11s: ACT ---
    incidentTl.add(() => {
      setStage('act');
      addLogLine('INFO', 'executing autonomous rollback to invariant 8f3b');
      typeTerminalLine('rolling back deploy 8f3c to invariant 8f3b...');

      // Reverse wave healing the map
      nodes.forEach(node => {
        const dist = parseFloat(node.dataset.dist);
        gsap.delayedCall((5 - Math.min(5, dist)) * 0.25, () => {
          node.classList.remove('is-anomaly');
        });
      });

      // KPIs returning to normal
      if (kpiErrorRoller) kpiErrorRoller.setValue('0.00%', 0.6);
      if (kpiReqRoller) kpiReqRoller.setValue('48,290', 0.6);
      if (kpiNodesRoller) kpiNodesRoller.setValue('1,024', 0.6);
      if (kpiMttrRoller) kpiMttrRoller.setValue('41ms', 0.6);

      if (kpiErrorChip) {
        kpiErrorChip.textContent = '0.00%';
        kpiErrorChip.classList.remove('is-alert');
      }
      if (kpiErrorSpark) kpiErrorSpark.classList.remove('is-alert');
    }, 8);

    // --- 11–12s: RESOLVED ---
    incidentTl.add(() => {
      setStage('resolved');
      addLogLine('INFO', 'VERIFIED: zero invariant errors // fleet restored');
      typeTerminalLine('verified. 0 errors detected. Cluster restored to NOMINAL.');
    }, 11);
  }

  if (triggerBtn) {
    triggerBtn.addEventListener('click', triggerIncidentSequence);
  }

  // 11. Performance: Pause intervals and canvas when section is offscreen
  let isSectionVisible = true;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (!isSectionVisible) {
          isSectionVisible = true;
          if (!chartInterval) chartInterval = setInterval(updateLatencyStream, 120);
          if (!clockInterval) clockInterval = setInterval(updateClock, 1000);
        }
      } else {
        isSectionVisible = false;
        if (chartInterval) {
          clearInterval(chartInterval);
          chartInterval = null;
        }
        if (clockInterval) {
          clearInterval(clockInterval);
          clockInterval = null;
        }
      }
    });
  }, { threshold: 0.05 });

  observer.observe(section);

  // Also pause shimmer, log, and terminal idle intervals when offscreen
  // (these are declared at function scope so the observer closure can access them)
  // They are already declared above; the observer below augments the existing one.
  const extObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) {
        if (shimmerInterval) { clearInterval(shimmerInterval); shimmerInterval = null; }
        if (logInterval) { clearInterval(logInterval); logInterval = null; }
        if (idleTermInterval) { clearInterval(idleTermInterval); idleTermInterval = null; }
      } else {
        if (!shimmerInterval) {
          shimmerInterval = setInterval(() => {
            if (opsState.isIncidentRunning) return;
            const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
            if (randomNode && !randomNode.classList.contains('is-anomaly')) {
              randomNode.style.backgroundColor = 'rgba(247, 245, 240, 0.45)';
              setTimeout(() => {
                if (!randomNode.classList.contains('is-anomaly')) {
                  randomNode.style.backgroundColor = '';
                }
              }, 400);
            }
          }, 600);
        }
        if (!logInterval) {
          logInterval = setInterval(() => {
            if (opsState.stage === 'nominal') {
              const item = sampleLogs[Math.floor(Math.random() * 3)];
              addLogLine(item.type, item.msg);
            }
          }, 2200);
        }
        if (!idleTermInterval) {
          idleTermInterval = setInterval(() => {
            if (opsState.stage === 'nominal' && isSectionVisible) {
              typeTerminalLine(idleLogs[idleLogIdx % idleLogs.length]);
              idleLogIdx++;
            }
          }, 4500);
        }
      }
    });
  }, { threshold: 0.05 });

  extObserver.observe(section);


  // Call ScrollTrigger.refresh() after mounting to ensure layout accuracy
  ScrollTrigger.refresh();
}
