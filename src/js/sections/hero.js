/**
 * HERO SECTION CONTROLLER
 * - Initializes Three.js Hero Lens Scene
 * - Telemetry digit rolling counters (OPS / SEC toggle)
 * - Hero entrance choreography upon loader wipe
 */
import gsap from 'gsap';
import { HeroLensScene } from '../lib/hero-lens.js';
import { DigitRoller } from '../lib/digit-roll.js';

export function initHero() {
  // 1. Initialize Three.js Hero Scene (CanvasTexture title + Refractive Glass Lens)
  let heroLensScene = null;
  const canvasEl = document.getElementById('three-hero-canvas');
  if (canvasEl) {
    heroLensScene = new HeroLensScene('three-hero-canvas');
  }

  // 2. Setup Telemetry Digit Rollers for Stats
  const statRoll1 = document.getElementById('stat-roll-1');
  const statRoll2 = document.getElementById('stat-roll-2');
  const statRoll3 = document.getElementById('stat-roll-3');

  const roller1 = statRoll1 ? new DigitRoller(statRoll1) : null;
  const roller2 = statRoll2 ? new DigitRoller(statRoll2) : null;
  const roller3 = statRoll3 ? new DigitRoller(statRoll3) : null;

  const telemetryData = {
    OPS: {
      labels: ['Uptime', 'Incidents resolved', 'Mean time to resolve'],
      values: ['99.99%', '12,480', '41s']
    },
    SEC: {
      labels: ['Zero-day containment', 'Threats neutralized', 'Isolation response'],
      values: ['99.999%', '84,192', '12ms']
    }
  };

  const label1 = document.getElementById('stat-label-1');
  const label2 = document.getElementById('stat-label-2');
  const label3 = document.getElementById('stat-label-3');

  function renderStats(mode = 'OPS', duration = 1.3) {
    const data = telemetryData[mode];
    if (!data) return;

    if (label1) label1.textContent = data.labels[0];
    if (label2) label2.textContent = data.labels[1];
    if (label3) label3.textContent = data.labels[2];

    if (roller1) roller1.setValue(data.values[0], duration);
    if (roller2) roller2.setValue(data.values[1], duration);
    if (roller3) roller3.setValue(data.values[2], duration);
  }

  // Initial stats
  renderStats('OPS', 1.0);

  // 3. OPS / SEC Pill Toggles
  const btnOps = document.getElementById('btn-mode-ops');
  const btnSec = document.getElementById('btn-mode-sec');

  if (btnOps && btnSec) {
    btnOps.addEventListener('click', () => {
      if (btnOps.classList.contains('active')) return;
      btnOps.classList.add('active');
      btnSec.classList.remove('active');
      btnOps.setAttribute('aria-selected', 'true');
      btnSec.setAttribute('aria-selected', 'false');
      renderStats('OPS', 1.2);
    });

    btnSec.addEventListener('click', () => {
      if (btnSec.classList.contains('active')) return;
      btnSec.classList.add('active');
      btnOps.classList.remove('active');
      btnSec.setAttribute('aria-selected', 'true');
      btnOps.setAttribute('aria-selected', 'false');
      renderStats('SEC', 1.2);
    });
  }

  // 4. Start blueprint and telemetry bar at autoAlpha 0, y: 24 (hidden until loader exits)
  gsap.set(['.panel-blueprint', '.panel-telemetry'], { autoAlpha: 0, y: 24 });

  // 5. Hero Entrance Choreography (invoked by loader onComplete)
  function triggerHeroEntrance() {
    // Animate Three.js letters rising in with stagger + lens scale
    if (heroLensScene) {
      heroLensScene.animateEntrance();
    }

    // Fade and slide in labels, pill nav, and bottom bar panels
    const tl = gsap.timeline();

    tl.fromTo('.site-header',
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 1.0, ease: 'power3.out', delay: 0.1 }
    );

    tl.fromTo('.labels-row-top, .labels-row-bottom',
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 1.1, stagger: 0.15, ease: 'power3.out' },
      '-=0.7'
    );

    // Staggered reveal of blueprint panel and telemetry stats bar from autoAlpha 0, y: 24
    tl.to(['.panel-blueprint', '.panel-telemetry'],
      {
        autoAlpha: 1,
        y: 0,
        duration: 1.1,
        stagger: 0.18,
        ease: 'power3.out'
      },
      '-=0.6'
    );

    // Re-roll stats with high energy on entrance
    setTimeout(() => {
      renderStats('OPS', 1.4);
    }, 400);
  }

  return {
    heroLensScene,
    triggerHeroEntrance
  };
}
