/**
 * SECTION A: CAPABILITIES
 * - Char reveal headline "BUILT TO RUN WITHOUT YOU."
 * - 5 interactive rows with ink wipe-up, text inversion to paper, 45deg arrow rotation, and 16px shift
 * - Cursor-following SVG illustrations (unique per row, thin lines, orange accent) with quickTo easing
 * - Staggered row reveal on scroll enter
 * - Tap-to-expand on touch devices
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { splitText } from '../lib/text-splitter.js';

gsap.registerPlugin(ScrollTrigger);

export function initCapabilities() {
  const section = document.getElementById('capabilities-section');
  if (!section) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

  // 1. Headline Character Reveal
  const headlineEl = section.querySelector('.cap-headline');
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

  // 2. Rows Stagger Entrance
  const rows = section.querySelectorAll('.cap-row');
  gsap.fromTo(rows,
    { y: 40, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: 0.8,
      stagger: 0.1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.capabilities-list',
        start: 'top 82%',
        toggleActions: 'play none none none'
      }
    }
  );

  // 3. Cursor-following floating SVG preview container
  const floatingPreview = document.getElementById('cap-floating-preview');
  let setPreviewX = null;
  let setPreviewY = null;

  if (floatingPreview && !isTouch) {
    setPreviewX = gsap.quickTo(floatingPreview, 'x', { duration: 0.35, ease: 'power3.out' });
    setPreviewY = gsap.quickTo(floatingPreview, 'y', { duration: 0.35, ease: 'power3.out' });
  }

  // SVG previews definitions (unique per capability)
  const previews = [
    // 01: Detection - eBPF Radar & Sensor Concentric Rings
    `<svg class="cap-preview-svg" viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="42" stroke="#F7F5F0" stroke-width="1.2" stroke-opacity="0.3" stroke-dasharray="3 3"/>
      <circle cx="50" cy="50" r="28" stroke="#F7F5F0" stroke-width="1.2" stroke-opacity="0.6"/>
      <circle cx="50" cy="50" r="14" stroke="#FF4A12" stroke-width="1.5"/>
      <line x1="50" y1="8" x2="50" y2="92" stroke="#F7F5F0" stroke-width="1" stroke-opacity="0.4"/>
      <line x1="8" y1="50" x2="92" y2="50" stroke="#F7F5F0" stroke-width="1" stroke-opacity="0.4"/>
      <circle cx="50" cy="50" r="3" fill="#FF4A12"/>
      <circle cx="68" cy="36" r="3.5" fill="#FF4A12"/>
    </svg>`,

    // 02: Causal Reasoning - Directed Acyclic Graph (DAG)
    `<svg class="cap-preview-svg" viewBox="0 0 100 100" fill="none">
      <path d="M25 50 L50 25 L75 50 L50 75 Z" stroke="#F7F5F0" stroke-width="1.2" stroke-opacity="0.4"/>
      <line x1="25" y1="50" x2="50" y2="50" stroke="#FF4A12" stroke-width="1.4"/>
      <line x1="50" y1="50" x2="75" y2="50" stroke="#FF4A12" stroke-width="1.4"/>
      <line x1="50" y1="25" x2="50" y2="75" stroke="#F7F5F0" stroke-width="1" stroke-opacity="0.5"/>
      <circle cx="25" cy="50" r="5" stroke="#F7F5F0" stroke-width="1.2" fill="#11161D"/>
      <circle cx="50" cy="25" r="4" stroke="#F7F5F0" stroke-width="1.2" fill="#11161D"/>
      <circle cx="50" cy="50" r="6" stroke="#FF4A12" stroke-width="1.5" fill="#11161D"/>
      <circle cx="75" cy="50" r="5" stroke="#F7F5F0" stroke-width="1.2" fill="#11161D"/>
      <circle cx="50" cy="75" r="4" stroke="#F7F5F0" stroke-width="1.2" fill="#11161D"/>
    </svg>`,

    // 03: Remediation - Geometric Shield & Verification Gate
    `<svg class="cap-preview-svg" viewBox="0 0 100 100" fill="none">
      <polygon points="50,15 82,30 82,65 50,85 18,65 18,30" stroke="#F7F5F0" stroke-width="1.3" stroke-opacity="0.5"/>
      <polygon points="50,26 72,36 72,60 50,74 28,60 28,36" stroke="#FF4A12" stroke-width="1.2"/>
      <path d="M40 50 L47 57 L62 42" stroke="#FF4A12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,

    // 04: Continuous Learning - Neural Invariant Feedback Curve
    `<svg class="cap-preview-svg" viewBox="0 0 100 100" fill="none">
      <path d="M15 70 C35 70 35 30 50 30 C65 30 65 70 85 70" stroke="#F7F5F0" stroke-width="1.4" stroke-opacity="0.4"/>
      <path d="M15 30 C35 30 35 70 50 70 C65 70 65 30 85 30" stroke="#FF4A12" stroke-width="1.5"/>
      <circle cx="50" cy="50" r="4" fill="#FF4A12"/>
      <circle cx="15" cy="30" r="3" fill="#F7F5F0"/>
      <circle cx="85" cy="30" r="3" fill="#F7F5F0"/>
      <circle cx="15" cy="70" r="3" fill="#F7F5F0"/>
      <circle cx="85" cy="70" r="3" fill="#F7F5F0"/>
    </svg>`,

    // 05: Fleet Observability - Distributed Constellation Ring
    `<svg class="cap-preview-svg" viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="36" stroke="#F7F5F0" stroke-width="1.2" stroke-opacity="0.3"/>
      <polygon points="50,18 78,34 78,66 50,82 22,66 22,34" stroke="#F7F5F0" stroke-width="1.2" stroke-opacity="0.5"/>
      <circle cx="50" cy="18" r="3" fill="#FF4A12"/>
      <circle cx="78" cy="34" r="3" fill="#F7F5F0"/>
      <circle cx="78" cy="66" r="3" fill="#FF4A12"/>
      <circle cx="50" cy="82" r="3" fill="#F7F5F0"/>
      <circle cx="22" cy="66" r="3" fill="#FF4A12"/>
      <circle cx="22" cy="34" r="3" fill="#F7F5F0"/>
      <circle cx="50" cy="50" r="6" stroke="#FF4A12" stroke-width="1.5"/>
    </svg>`
  ];

  // 4. Row Hover & Touch Interactions
  rows.forEach((row, idx) => {
    if (isTouch) {
      // Touch tap-to-expand
      row.addEventListener('click', () => {
        const wasActive = row.classList.contains('is-active');
        rows.forEach(r => r.classList.remove('is-active'));
        if (!wasActive) {
          row.classList.add('is-active');
        }
      });
    } else {
      // Desktop hover
      row.addEventListener('mouseenter', (e) => {
        if (floatingPreview && previews[idx]) {
          floatingPreview.innerHTML = previews[idx];
          floatingPreview.classList.add('is-visible');
          if (setPreviewX && setPreviewY) {
            setPreviewX(e.clientX + 90);
            setPreviewY(e.clientY - 20);
          }
        }
      });

      row.addEventListener('mousemove', (e) => {
        if (floatingPreview && setPreviewX && setPreviewY) {
          setPreviewX(e.clientX + 90);
          setPreviewY(e.clientY - 20);
        }
      });

      row.addEventListener('mouseleave', () => {
        if (floatingPreview) {
          floatingPreview.classList.remove('is-visible');
        }
      });
    }
  });
}
