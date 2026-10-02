/**
 * NEXUS LOADER
 * - Bone background, thin ink progress line at bottom
 * - Huge mono percentage 0→100 at bottom-left
 * - Small "NEXUS // SYS_INIT" label top-left
 * - At 100% slides up with expo.inOut clip-path wipe, then triggers hero entrance
 */
import gsap from 'gsap';

export function initLoader(onComplete) {
  const loaderEl = document.getElementById('app-loader');
  const percentEl = document.getElementById('loader-percent');
  const fillEl = document.getElementById('loader-fill');
  const statusNote = document.getElementById('loader-status-note');

  if (!loaderEl) {
    if (onComplete) onComplete();
    return;
  }

  const stages = [
    { threshold: 20, msg: 'SYS_BOOT // DISPATCH_KERNELS' },
    { threshold: 50, msg: 'OPTICAL_MESH // PMREM_WARMUP' },
    { threshold: 80, msg: 'CAUSAL_GRAPH // TOPOLOGY_SYNC' },
    { threshold: 100, msg: 'READY // ALL_SYSTEMS_NOMINAL' }
  ];

  let currentPercent = 0;

  const tl = gsap.timeline({
    onComplete: () => {
      // Slides up with an expo.inOut clip-path wipe
      gsap.to(loaderEl, {
        clipPath: 'inset(0% 0% 100% 0%)',
        duration: 1.15,
        ease: 'expo.inOut',
        onComplete: () => {
          loaderEl.classList.add('is-finished');
          loaderEl.style.display = 'none';
          document.documentElement.classList.remove('is-loading');
          document.body.classList.remove('is-loading');
          if (onComplete) onComplete();
        }
      });
    }
  });

  // Animate 0 -> 100
  tl.to({ val: 0 }, {
    val: 100,
    duration: 1.6,
    ease: 'power2.out',
    onUpdate: function () {
      const val = Math.floor(this.targets()[0].val);
      if (val !== currentPercent) {
        currentPercent = val;
        if (percentEl) percentEl.textContent = val;
        if (fillEl) fillEl.style.width = `${val}%`;

        const stage = stages.find(s => val <= s.threshold) || stages[stages.length - 1];
        if (stage && statusNote) {
          statusNote.textContent = stage.msg;
        }
      }
    }
  });
}
