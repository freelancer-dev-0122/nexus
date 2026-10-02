/**
 * NAVIGATION CONTROLLER
 * - Mobile full-screen overlay toggle with staggered link reveal
 * - Accessible keyboard navigation (Escape to close, aria-expanded updates)
 * - Smooth anchor scrolling integrated with Lenis
 */
import gsap from 'gsap';
import { scrollTo, getLenis } from './lenis-scroll.js';

export function initNav() {
  const menuToggle = document.getElementById('nav-menu-toggle');
  const overlay = document.getElementById('mobile-nav-overlay');
  const closeBtn = document.getElementById('mobile-nav-close');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');
  const ctaBtn = document.getElementById('cta-access');

  if (!overlay) return;

  function openMenu() {
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    if (menuToggle) menuToggle.setAttribute('aria-expanded', 'true');
    // Stop Lenis — body.overflow:hidden does NOT stop Lenis's wheel interception
    const lenis = getLenis();
    if (lenis) lenis.stop();

    // Stagger in links
    gsap.fromTo(mobileLinks,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power3.out' }
    );
  }

  function closeMenu() {
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
    // Resume Lenis scroll
    const lenis = getLenis();
    if (lenis) lenis.start();
  }

  if (menuToggle) {
    menuToggle.addEventListener('click', openMenu);
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeMenu);
  }

  // Close on Escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) {
      closeMenu();
    }
  });

  // Smooth scroll handler for all anchor links
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href && href !== '#' && href.startsWith('#')) {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          closeMenu();
          scrollTo(target, { duration: 1.5 });
        }
      }
    });
  });

  // CTA Access button scrolls to footer
  if (ctaBtn) {
    ctaBtn.addEventListener('click', () => {
      scrollTo('#site-footer', { duration: 1.6 });
    });
  }
}
