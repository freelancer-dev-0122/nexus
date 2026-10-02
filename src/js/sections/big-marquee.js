/**
 * SECTION B: BIG MARQUEE CONTROLLER
 * - 2 Stacked rows: Row 1 scrolls left (filled paper), Row 2 scrolls right (1px outlined)
 * - Words: AUTOMATE • DETECT • RESOLVE • LEARN •
 * - Speed follows scroll velocity, rows skew up to 6deg when scrolling fast
 * - Pause on hover
 * - Pause offscreen via IntersectionObserver
 * - prefers-reduced-motion respects: no skew, steady slow speed
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initBigMarquee() {
  const section = document.getElementById('big-marquee-section');
  if (!section) return;

  const track1 = section.querySelector('.big-marquee-track-1');
  const track2 = section.querySelector('.big-marquee-track-2');
  const items = section.querySelectorAll('.big-marquee-item');
  if (!track1 || !track2) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let pos1 = 0;
  let pos2 = 0;
  let velocityFactor = 1.0;
  let targetSkew = 0;
  let isHovered = false;
  let isSectionVisible = true;

  const setSkew = prefersReduced ? null : gsap.quickTo(items, 'skewX', { duration: 0.28, ease: 'power2.out' });

  // Update speed & skew based on scroll velocity
  ScrollTrigger.create({
    trigger: document.body,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      if (prefersReduced) return;
      const velocity = self.getVelocity ? self.getVelocity() : 0;
      if (Math.abs(velocity) > 25) {
        velocityFactor = 1.0 + Math.min(3.5, Math.abs(velocity) / 280);
        targetSkew = Math.max(-6, Math.min(6, (velocity / 260)));
      } else {
        velocityFactor = 1.0;
        targetSkew = 0;
      }
      if (setSkew) setSkew(targetSkew);
    }
  });

  // Pause on hover
  section.addEventListener('mouseenter', () => {
    isHovered = true;
  });
  section.addEventListener('mouseleave', () => {
    isHovered = false;
  });

  // Animation Loop
  let animId = null;
  function updateMarquee() {
    if (!isHovered && isSectionVisible) {
      const speed = 1.4 * velocityFactor;

      // Track 1 moves LEFT
      pos1 -= speed;
      const halfWidth1 = track1.scrollWidth / 2;
      if (Math.abs(pos1) >= halfWidth1) {
        pos1 = 0;
      }
      track1.style.transform = `translate3d(${pos1.toFixed(2)}px, 0, 0)`;

      // Track 2 moves RIGHT
      pos2 += speed;
      const halfWidth2 = track2.scrollWidth / 2;
      if (pos2 >= 0) {
        pos2 = -halfWidth2;
      }
      track2.style.transform = `translate3d(${pos2.toFixed(2)}px, 0, 0)`;
    }

    animId = requestAnimationFrame(updateMarquee);
  }

  // Set initial position for track2 so it scrolls seamlessly right
  requestAnimationFrame(() => {
    const halfWidth2 = track2.scrollWidth / 2;
    pos2 = -halfWidth2;
    animId = requestAnimationFrame(updateMarquee);
  });

  // Pause offscreen
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      isSectionVisible = entry.isIntersecting;
    });
  }, { threshold: 0.05 });

  observer.observe(section);

  // Stop when tab is hidden, restart when restored
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (animId) { cancelAnimationFrame(animId); animId = null; }
    } else if (isSectionVisible && !animId) {
      animId = requestAnimationFrame(updateMarquee);
    }
  });

  return () => {
    if (animId) cancelAnimationFrame(animId);
  };
}
