/**
 * Custom Cursor: Theme-inverted Dot + Lagging Ring + Label Pill
 * - pointer-events: none on every cursor element
 * - mix-blend-mode: difference with white elements
 * - Physics: ring duration 0.18 ease power3.out, dot duration 0.06 ease power3
 * - Scales ring down to 0.5 over buttons and links
 * - Shows label pill ("VIEW", "RUN", "DRAG", "SCROLL") only over elements with data-cursor
 * - Hides (scale 0, opacity 0) when mouse leaves window
 * - Disabled completely on touch devices
 */
import gsap from 'gsap';

export function initCursor() {
  const cursorEl = document.getElementById('custom-cursor');
  if (!cursorEl) return;

  // Disable completely on touch devices
  if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
    cursorEl.style.display = 'none';
    return;
  }

  const dot = cursorEl.querySelector('.cursor-dot');
  const ring = cursorEl.querySelector('.cursor-ring');
  const label = cursorEl.querySelector('.cursor-label');

  // Physics: gsap.quickTo with requested durations (ring 0.18, dot 0.06)
  const setDotX = gsap.quickTo(dot, 'x', { duration: 0.06, ease: 'power3' });
  const setDotY = gsap.quickTo(dot, 'y', { duration: 0.06, ease: 'power3' });
  const setRingX = gsap.quickTo(ring, 'x', { duration: 0.18, ease: 'power3.out' });
  const setRingY = gsap.quickTo(ring, 'y', { duration: 0.18, ease: 'power3.out' });

  // No layout reads in mousemove handler
  window.addEventListener('mousemove', (e) => {
    setDotX(e.clientX);
    setDotY(e.clientY);
    setRingX(e.clientX);
    setRingY(e.clientY);

    if (cursorEl.classList.contains('is-hidden')) {
      cursorEl.classList.remove('is-hidden');
    }
  });

  // Hide when mouse leaves window
  document.addEventListener('mouseleave', () => {
    cursorEl.classList.add('is-hidden');
  });

  document.addEventListener('mouseenter', () => {
    cursorEl.classList.remove('is-hidden');
  });

  // Delegated hover interaction
  document.addEventListener('mouseover', (e) => {
    const targetWithLabel = e.target.closest('[data-cursor]');
    const interactiveTarget = e.target.closest('button, a, .magnetic-btn, .pill-cta, .toggle-pill-btn, .nav-link');

    if (targetWithLabel) {
      const customLabel = targetWithLabel.getAttribute('data-cursor');
      if (customLabel && label) {
        label.textContent = customLabel;
        cursorEl.classList.add('has-label');
        cursorEl.classList.remove('is-button');
      }
    } else if (interactiveTarget) {
      // Scale ring down to 0.5 over buttons and links without label
      cursorEl.classList.add('is-button');
      cursorEl.classList.remove('has-label');
      if (label) label.textContent = '';
    } else {
      cursorEl.classList.remove('has-label', 'is-button');
      if (label) label.textContent = '';
    }
  });

  document.addEventListener('mouseout', (e) => {
    const interactive = e.target.closest('[data-cursor], button, a, .magnetic-btn, .pill-cta, .toggle-pill-btn, .nav-link');
    if (interactive) {
      cursorEl.classList.remove('has-label', 'is-button');
      if (label) label.textContent = '';
    }
  });
}
