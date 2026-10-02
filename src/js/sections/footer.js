/**
 * SECTION C: FOOTER CONTROLLER
 * - Giant "LET'S TALK" fit to container width by measurement
 * - Letter-by-letter scrubbed fill from transparent outline to solid ink
 * - Magnetic black pill button "hello@nexus.ai ↗" with clipboard copy & "COPIED" toast
 * - Hairline-separated row with 3 link columns, status chip, live local clock (odometer digits)
 * - "BACK TO TOP ↑" circular button with Lenis expo.inOut smooth scroll
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DigitRoller } from '../lib/digit-roll.js';
import { scrollTo } from '../lib/lenis-scroll.js';

gsap.registerPlugin(ScrollTrigger);

export function initFooter() {
  const section = document.getElementById('site-footer');
  if (!section) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Giant "LET'S TALK" width-fitting by measurement
  const titleContainer = section.querySelector('.footer-title-wrap');
  const titleEl = document.getElementById('footer-giant-title');

  function fitFooterTitle() {
    if (!titleContainer || !titleEl) return;
    const availableWidth = titleContainer.clientWidth;
    if (!availableWidth) return;

    // Measure at base 100px
    titleEl.style.fontSize = '100px';
    const baseWidth = titleEl.scrollWidth;
    if (baseWidth > 0) {
      const scale = availableWidth / baseWidth;
      const finalFontSize = Math.floor(100 * scale * 0.98); // 98% to avoid subpixel clipping
      titleEl.style.fontSize = `${Math.max(36, finalFontSize)}px`;
    }
  }

  fitFooterTitle();
  window.addEventListener('resize', fitFooterTitle);
  if (document.fonts) {
    document.fonts.ready.then(fitFooterTitle);
  }

  // 2. Letter-by-letter outline-to-solid scrubbed fill
  const letters = section.querySelectorAll('.footer-letter');
  if (prefersReduced) {
    letters.forEach(letter => letter.classList.add('is-filled'));
  } else {
    gsap.timeline({
      scrollTrigger: {
        trigger: titleContainer,
        start: 'top 85%',
        end: 'top 35%',
        scrub: 1
      }
    }).to(letters, {
      color: '#0B0F14',
      stagger: 0.1,
      ease: 'power2.inOut'
    });
  }

  // 3. Email Button Copy to Clipboard + Toast Alert
  const emailBtn = document.getElementById('footer-email-btn');
  const toast = document.getElementById('footer-toast');

  if (emailBtn) {
    emailBtn.addEventListener('click', () => {
      const emailText = 'hello@nexus.ai';
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(emailText).then(() => {
          showToast('COPIED');
        }).catch(() => {
          showToast('hello@nexus.ai');
        });
      } else {
        showToast('COPIED');
      }
    });
  }

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-visible');
    setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 2200);
  }

  // 4. Live Local-Time Clock with Odometer Digits
  const clockEl = document.getElementById('footer-clock');
  const clockRoller = clockEl ? new DigitRoller(clockEl) : null;

  function updateFooterClock() {
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

  updateFooterClock();
  setInterval(updateFooterClock, 1000);

  // 5. Back to Top Circular Button with Lenis expo.inOut
  const backToTopBtn = document.getElementById('back-to-top-btn');
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      scrollTo(0, {
        duration: 1.8,
        easing: (t) => t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2 // expo.inOut
      });
    });
  }

  // Call ScrollTrigger.refresh() after mounting
  ScrollTrigger.refresh();
}
