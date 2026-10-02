/**
 * PHASE 4 — LIVE INCIDENT COMMAND DASHBOARD (Simulated Bento-Grid)
 * Live streaming logs, real-time latency bezier chart, 64-node cluster heatmap,
 * AI reasoning typewriter, and scripted 10-second interactive incident choreography.
 */

export function initDashboard(threeCore) {
  // Tracked intervals — cleared when section leaves viewport
  const activeIntervals = [];
  function addInterval(fn, ms) {
    const id = setInterval(fn, ms);
    activeIntervals.push(id);
    return id;
  }

  // 1. Live UTC Clock
  const clockEl = document.getElementById('dash-live-clock');
  function updateClock() {
    if (clockEl) {
      const now = new Date();
      clockEl.textContent = `UTC ${now.toTimeString().split(' ')[0]}`;
    }
  }
  updateClock(); // Initial call

  // 2. Real-time Latency Chart (Canvas)
  const chartCanvas = document.getElementById('dashboard-chart-canvas');
  const liveValEl = document.getElementById('telemetry-live-val');
  const chartStatusEl = document.getElementById('chart-status-label');
  let chartCtx = chartCanvas ? chartCanvas.getContext('2d') : null;

  const dataPoints = Array.from({ length: 40 }, () => 1.2 + Math.random() * 0.3);
  let isSpikeActive = false;

  function drawChart() {
    if (!chartCtx || !chartCanvas) return;
    const w = chartCanvas.width;
    const h = chartCanvas.height;

    chartCtx.clearRect(0, 0, w, h);

    // Grid lines
    chartCtx.strokeStyle = 'rgba(237, 234, 228, 0.06)';
    chartCtx.lineWidth = 1;
    for (let y = 30; y < h; y += 40) {
      chartCtx.beginPath();
      chartCtx.moveTo(0, y);
      chartCtx.lineTo(w, y);
      chartCtx.stroke();
    }

    // Determine current value
    const latestVal = dataPoints[dataPoints.length - 1];
    if (liveValEl) {
      liveValEl.textContent = `${latestVal.toFixed(2)} ms`;
      liveValEl.style.color = isSpikeActive ? '#FF5A1F' : '#EDEAE4';
    }

    // Bezier curve
    chartCtx.beginPath();
    chartCtx.lineWidth = 2;
    chartCtx.strokeStyle = isSpikeActive ? '#FF5A1F' : '#C8FF3D';

    const step = w / (dataPoints.length - 1);
    const maxVal = isSpikeActive ? 160 : 3.5;

    dataPoints.forEach((val, i) => {
      const x = i * step;
      const normalized = Math.min(1, val / maxVal);
      const y = h - 20 - normalized * (h - 40);

      if (i === 0) {
        chartCtx.moveTo(x, y);
      } else {
        const prevX = (i - 1) * step;
        const prevNorm = Math.min(1, dataPoints[i - 1] / maxVal);
        const prevY = h - 20 - prevNorm * (h - 40);
        const cx = (prevX + x) / 2;
        chartCtx.bezierCurveTo(cx, prevY, cx, y, x, y);
      }
    });

    chartCtx.stroke();

    // Fill under curve
    chartCtx.lineTo(w, h);
    chartCtx.lineTo(0, h);
    chartCtx.closePath();
    const grad = chartCtx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, isSpikeActive ? 'rgba(255, 90, 31, 0.25)' : 'rgba(200, 255, 61, 0.2)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    chartCtx.fillStyle = grad;
    chartCtx.fill();
  }

  // Update chart data periodically (tracked)
  addInterval(() => {
    let nextVal = 1.2 + Math.random() * 0.25;
    if (isSpikeActive) {
      nextVal = 120 + Math.random() * 45;
    }
    dataPoints.shift();
    dataPoints.push(nextVal);
    drawChart();
  }, 120);

  // 3. 64-Node Heatmap Grid
  const heatmapEl = document.getElementById('heatmap-grid');
  const heatmapInfo = document.getElementById('heatmap-selected-info');
  const clusterBadge = document.getElementById('cluster-status-badge');
  const cells = [];

  if (heatmapEl) {
    for (let i = 0; i < 64; i++) {
      const cell = document.createElement('div');
      cell.className = 'heatmap-cell status-ok';
      cell.setAttribute('title', `Node ${i + 1}`);

      cell.addEventListener('mouseenter', () => {
        const region = i % 2 === 0 ? 'US-EAST-1' : 'EU-CENTRAL-1';
        if (heatmapInfo) heatmapInfo.textContent = `INSPECTED: NODE_${i + 1 < 10 ? '0' + (i + 1) : i + 1} (${region}) // LOAD: ${(35 + (i * 7) % 55)}%`;
      });

      heatmapEl.appendChild(cell);
      cells.push(cell);
    }
  }

  // Subtle random healthy node blinks (tracked)
  addInterval(() => {
    if (!isSpikeActive && cells.length > 0) {
      const randomIdx = Math.floor(Math.random() * cells.length);
      cells[randomIdx].style.opacity = '0.4';
      setTimeout(() => {
        cells[randomIdx].style.opacity = '1';
      }, 300);
    }
  }, 600);

  // 4. Live Streaming Kernel Logs
  const terminalEl = document.getElementById('logs-terminal');
  const sampleLogs = [
    { type: 'info', msg: 'consensus/raft: heartbeat quorum acknowledged across 7 regions' },
    { type: 'info', msg: 'ebpf/filter: 0 dropped packets on interface eno1 [4.21M/s]' },
    { type: 'info', msg: 'telemetry/ring: memory footprint stabilized at 14.2MB' },
    { type: 'warn', msg: 'loadbalancer: slight variance in shard #14 ingress (+1.8ms)' },
    { type: 'info', msg: 'causal/graph: invariants refreshed with 0 regression delta' }
  ];

  function addLog(type, message) {
    if (!terminalEl) return;
    const entry = document.createElement('div');
    entry.className = 'log-entry';

    const time = new Date().toTimeString().split(' ')[0] + '.' + Math.floor(Math.random() * 900 + 100);
    entry.innerHTML = `
      <span class="log-time">[${time}]</span>
      <span class="log-badge ${type}">${type.toUpperCase()}</span>
      <span class="log-msg">${message}</span>
    `;

    terminalEl.appendChild(entry);
    terminalEl.scrollTop = terminalEl.scrollHeight;

    // Limit log entries to keep DOM lean
    if (terminalEl.children.length > 35) {
      terminalEl.removeChild(terminalEl.children[0]);
    }
  }

  // Initial logs
  sampleLogs.forEach(l => addLog(l.type, l.msg));

  // Stream logs every 2.5s (tracked)
  addInterval(() => {
    if (!isSpikeActive) {
      const item = sampleLogs[Math.floor(Math.random() * sampleLogs.length)];
      addLog(item.type, item.msg);
    }
  }, 2200);

  // 5. AI Reasoning Typewriter
  const aiThoughtEl = document.getElementById('ai-thought-stream');
  const aiStatusPill = document.getElementById('ai-status-pill');
  const aiActionEl = document.getElementById('ai-proposed-action');

  const baselineThoughts = [
    'All distributed invariants satisfied. Causal graph predicts 0.002% anomaly probability over next 15 minutes.',
    'Cluster entropy within 1-sigma bounds. eBPF trace filters continuously compiling.',
    'Zero human interventions recorded over past 4,820 cycles. Auto-rollback standby armed.'
  ];

  let thoughtIdx = 0;
  addInterval(() => {
    if (!isSpikeActive && aiThoughtEl) {
      thoughtIdx = (thoughtIdx + 1) % baselineThoughts.length;
      typewriterText(aiThoughtEl, baselineThoughts[thoughtIdx]);
    }
  }, 7000);

  function typewriterText(el, text, speed = 18) {
    el.textContent = '';
    let i = 0;
    const timer = setInterval(() => {
      el.textContent += text.charAt(i);
      i++;
      if (i >= text.length) clearInterval(timer);
    }, speed);
  }

  // 6. Interactive "TRIGGER SIMULATED INCIDENT" Button (Scripted 10-Second Choreography)
  const triggerBtn = document.getElementById('btn-trigger-incident');
  let incidentInProgress = false;

  if (triggerBtn) {
    triggerBtn.addEventListener('click', () => {
      if (incidentInProgress) return;
      incidentInProgress = true;
      isSpikeActive = true;

      // Trigger 3D Core pulse
      if (threeCore) threeCore.triggerIncidentSpike();

      triggerBtn.classList.add('is-active-incident');
      triggerBtn.innerHTML = `<span>⚠</span> <span>SIMULATING: CASCADE FAILURE</span>`;

      if (clusterBadge) {
        clusterBadge.textContent = '6/64 FAILING';
        clusterBadge.style.background = '#FF5A1F';
      }

      if (chartStatusEl) {
        chartStatusEl.textContent = 'CRITICAL: LATENCY DEGRADATION';
        chartStatusEl.style.color = '#FF5A1F';
      }

      // Step 1: Immediate logs
      addLog('crit', 'KERNEL PANIC: Heap overflow detected in microservice worker-shard-42');
      addLog('crit', 'INGRESS SPIKE: P99 latency breached SLA threshold (>140ms)');

      // Highlight 6 heatmap cells
      const failingIndices = [18, 19, 26, 27, 34, 42];
      failingIndices.forEach(idx => {
        if (cells[idx]) {
          cells[idx].className = 'heatmap-cell status-crit';
        }
      });

      // AI updates
      if (aiStatusPill) {
        aiStatusPill.textContent = 'TRIAGING INCIDENT';
        aiStatusPill.style.background = 'rgba(255, 90, 31, 0.2)';
        aiStatusPill.style.color = '#FF5A1F';
      }
      if (aiActionEl) aiActionEl.textContent = 'ISOLATING SHARD_42 & TRIPPING CIRCUIT';
      if (aiThoughtEl) {
        typewriterText(aiThoughtEl, 'ANOMALY DETECTED: Root cause identified as recursive memory leak in worker-shard-42. Initiating cryptographic partition.');
      }

      // Step 2: Remediation execution at 4s
      setTimeout(() => {
        addLog('warn', 'CIRCUIT TRIPPED: Traffic shed successfully rerouted to US-EAST-1 replica');
        addLog('info', 'AUTONOMOUS RUNBOOK: Initiating atomic container rollback to SHA: 0x9b3f');

        if (aiStatusPill) aiStatusPill.textContent = 'EXECUTING RUNBOOK';
        if (aiActionEl) aiActionEl.textContent = 'DEPLOYING IMMUTABLE REPLICA';
        if (aiThoughtEl) {
          typewriterText(aiThoughtEl, 'Executing surgical mitigation: Worker terminated. Golden image deployment verified in 820ms.');
        }

        failingIndices.forEach(idx => {
          if (cells[idx]) cells[idx].className = 'heatmap-cell status-warn';
        });
      }, 4000);

      // Step 3: Stabilization at 7.5s
      setTimeout(() => {
        isSpikeActive = false;
        addLog('info', 'HEALTH RESTORED: All 64 microservices reporting green heartbeat');
        addLog('info', 'INVARIANT SYNTHESIZED: Post-mortem generated and committed');

        failingIndices.forEach(idx => {
          if (cells[idx]) cells[idx].className = 'heatmap-cell status-ok';
        });

        if (clusterBadge) {
          clusterBadge.textContent = '64/64 GREEN';
          clusterBadge.style.background = 'rgba(200, 255, 61, 0.15)';
        }

        if (chartStatusEl) {
          chartStatusEl.textContent = 'HEALTHY: 0 JITTER';
          chartStatusEl.style.color = '';
        }
      }, 7500);

      // Step 4: Full reset at 10s
      setTimeout(() => {
        incidentInProgress = false;
        triggerBtn.classList.remove('is-active-incident');
        triggerBtn.innerHTML = `<span>⚠</span> <span>TRIGGER SIMULATED INCIDENT</span>`;

        if (aiStatusPill) {
          aiStatusPill.textContent = 'MONITORING';
          aiStatusPill.style.background = 'rgba(200, 255, 61, 0.15)';
          aiStatusPill.style.color = '#C8FF3D';
        }
        if (aiActionEl) aiActionEl.textContent = 'NONE REQUIRED';
        if (aiThoughtEl) {
          typewriterText(aiThoughtEl, 'Incident resolved in 3.42s with zero packet loss. Systems fully nominal.');
        }
      }, 10000);
    });
  }

  // Pause all intervals when dashboard scrolls offscreen
  const dashboardSection = document.getElementById('control-room') || document.querySelector('.control-room-section');
  if (dashboardSection) {
    const visObserver = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) {
        // Clear all tracked intervals when offscreen
        activeIntervals.forEach(id => clearInterval(id));
        activeIntervals.length = 0;
      } else if (activeIntervals.length === 0) {
        // Restart intervals when back in view (only if not in incident)
        addInterval(updateClock, 1000);
        addInterval(() => {
          let nextVal = 1.2 + Math.random() * 0.25;
          if (isSpikeActive) nextVal = 120 + Math.random() * 45;
          dataPoints.shift();
          dataPoints.push(nextVal);
          drawChart();
        }, 120);
        addInterval(() => {
          if (!isSpikeActive && cells.length > 0) {
            const randomIdx = Math.floor(Math.random() * cells.length);
            cells[randomIdx].style.opacity = '0.4';
            setTimeout(() => { cells[randomIdx].style.opacity = '1'; }, 300);
          }
        }, 600);
        addInterval(() => {
          if (!isSpikeActive) {
            const item = sampleLogs[Math.floor(Math.random() * sampleLogs.length)];
            addLog(item.type, item.msg);
          }
        }, 2200);
        addInterval(() => {
          if (!isSpikeActive && aiThoughtEl) {
            thoughtIdx = (thoughtIdx + 1) % baselineThoughts.length;
            typewriterText(aiThoughtEl, baselineThoughts[thoughtIdx]);
          }
        }, 7000);
      }
    }, { threshold: 0.01 });
    visObserver.observe(dashboardSection);
  }
}
