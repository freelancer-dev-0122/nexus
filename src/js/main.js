/**
 * NEXUS — AUTONOMOUS OPERATIONS COMMAND CENTER
 * Main Entry Point
 */
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initSmoothScroll } from './lib/lenis-scroll.js';
import { initCursor } from './lib/cursor.js';
import { initMagneticButtons } from './lib/magnetic.js';
import { initScrollMarquee } from './lib/marquee.js';
import { initHero } from './sections/hero.js';
import { initLoader } from './sections/loader.js';
import { initPinnedScroll } from './sections/pinned-scroll.js';
import { initPipeline } from './sections/pipeline.js';
import { initControlRoom } from './sections/control-room.js';
import { initCapabilities } from './sections/capabilities.js';
import { initBigMarquee } from './sections/big-marquee.js';
import { initFooter } from './sections/footer.js';
import { initNav } from './lib/nav.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Lenis Smooth Scroll integrated with GSAP ScrollTrigger
  const lenis = initSmoothScroll();
  if (lenis) {
    lenis.stop(); // Lock scroll while loader is active
  }

  // 2. Custom Cursor (instant dot + lagging ring with "VIEW" over interactive targets)
  initCursor();

  // 3. Navigation (Mobile Overlay & Smooth Anchor Scrolling)
  initNav();

  // 4. Magnetic Buttons
  initMagneticButtons();

  // 5. Hero Section (Three.js Lens Scene + Telemetry Digits)
  const { triggerHeroEntrance, heroLensScene } = initHero();

  // 6. Scroll-linked 120px ink marquee strip (DETECT • REASON • ACT • LEARN)
  initScrollMarquee();

  // 7. Pinned Scroll Section: Nominal -> Incident -> Resolved (450vh single timeline scrub)
  initPinnedScroll();

  // 8. The Pipeline: Horizontal Scroll Story on desktop, vertical stack on mobile
  initPipeline();

  // 9. The Control Room: Live Ops Dashboard & ~30vh scrub transition from Pipeline
  initControlRoom({ heroLensScene });

  // 10. Section A: Capabilities
  initCapabilities();

  // 11. Section B: Big Marquee (2 stacked velocity-skewed rows)
  initBigMarquee();

  // 12. Lazy-init Footer when approaching viewport
  const footerSection = document.getElementById('site-footer');
  if (footerSection) {
    const footerObserver = new IntersectionObserver((entries, obs) => {
      if (entries[0].isIntersecting) {
        initFooter();
        obs.disconnect();
      }
    }, { rootMargin: '400px 0px' });
    footerObserver.observe(footerSection);
  } else {
    initFooter();
  }

  // 13. Loader (0% -> 100% then expo.inOut clip-path wipe)
  initLoader(() => {
    if (lenis) {
      lenis.start(); // Unlock smooth scroll when loader has fully exited
    }
    triggerHeroEntrance();
    ScrollTrigger.refresh();
  });

  // Call ScrollTrigger.refresh() after fonts load and Three.js scene mounts
  if (document.fonts) {
    document.fonts.ready.then(() => {
      ScrollTrigger.refresh();
    });
  }

  // Tab visibility change listener
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      ScrollTrigger.refresh();
    }
  });
});


