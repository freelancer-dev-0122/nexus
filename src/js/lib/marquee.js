/**
 * Scroll-Linked Marquee Controller
 * Direction and speed follow scroll velocity, skews slightly while moving fast.
 * Pauses when offscreen via IntersectionObserver to avoid wasting rAF budget.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initScrollMarquee() {
  const marqueeEl = document.querySelector('.marquee-wrapper') || document.querySelector('.marquee-strip');
  const marqueeTrack = document.querySelector('.marquee-inner-track');
  const marqueeItems = document.querySelectorAll('.marquee-item');
  if (!marqueeTrack || marqueeItems.length === 0) return;

  let basePos = 0;
  let scrollSpeed = 1.0;
  let targetSkew = 0;
  let animId = null;
  let isVisible = true;

  const setSkew = gsap.quickTo(marqueeItems, 'skewX', { duration: 0.25, ease: 'power2.out' });

  // Update speed, direction, and skew based on scroll velocity
  ScrollTrigger.create({
    trigger: document.body,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      const velocity = self.getVelocity ? self.getVelocity() : 0;
      if (Math.abs(velocity) > 20) {
        scrollSpeed = 1.0 + (velocity / 250);
        targetSkew = Math.max(-4, Math.min(4, (velocity / 300)));
      } else {
        scrollSpeed = 1.0;
        targetSkew = 0;
      }
      setSkew(targetSkew);
    }
  });

  // RAF loop for smooth continuous marquee
  function updateMarquee() {
    if (!isVisible) {
      animId = null;
      return;
    }
    basePos -= 1.2 * scrollSpeed;
    const trackWidth = marqueeTrack.scrollWidth / 2;
    if (Math.abs(basePos) >= trackWidth) {
      basePos = 0;
    }
    marqueeTrack.style.transform = `translate3d(${basePos.toFixed(2)}px, 0, 0)`;
    animId = requestAnimationFrame(updateMarquee);
  }

  // Pause offscreen
  const target = marqueeEl || marqueeTrack;
  const observer = new IntersectionObserver(([entry]) => {
    isVisible = entry.isIntersecting;
    if (isVisible && !animId) {
      updateMarquee();
    }
  }, { threshold: 0.01 });
  observer.observe(target);

  // Start immediately (will auto-pause when scrolled offscreen)
  updateMarquee();

  return () => {
    if (animId) cancelAnimationFrame(animId);
  };
}
