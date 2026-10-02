/**
 * Hero Background Interactive Grid Canvas
 * Renders subtle geometric dot matrix that gently disperses / reacts to mouse.
 * Caps DPR at 2, pauses when offscreen.
 */

export function initHeroGridCanvas() {
  const canvas = document.getElementById('hero-grid-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let animationId = null;
  let isVisible = true;

  let width = 0;
  let height = 0;
  let mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000 };

  const spacing = 40;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    width = canvas.parentElement.offsetWidth;
    height = canvas.parentElement.offsetHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
  }

  window.addEventListener('resize', resize);
  resize();

  window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.targetX = e.clientX - rect.left;
    mouse.targetY = e.clientY - rect.top;
  });

  // IntersectionObserver to pause when offscreen
  const observer = new IntersectionObserver(([entry]) => {
    isVisible = entry.isIntersecting;
    if (isVisible && !animationId) {
      loop();
    }
  }, { threshold: 0.05 });

  observer.observe(canvas);

  // Also stop when tab is hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      isVisible = false;
      if (animationId) { cancelAnimationFrame(animationId); animationId = null; }
    } else {
      const rect = canvas.getBoundingClientRect();
      isVisible = rect.bottom > 0 && rect.top < window.innerHeight;
      if (isVisible && !animationId) loop();
    }
  });


  function loop() {
    if (!isVisible) {
      animationId = null;
      return;
    }

    // Lerp mouse
    mouse.x += (mouse.targetX - mouse.x) * 0.08;
    mouse.y += (mouse.targetY - mouse.y) * 0.08;

    ctx.clearRect(0, 0, width, height);

    const cols = Math.ceil(width / spacing) + 1;
    const rows = Math.ceil(height / spacing) + 1;

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const baseX = c * spacing;
        const baseY = r * spacing;

        // Interaction distance
        const dx = mouse.x - baseX;
        const dy = mouse.y - baseY;
        const dist = Math.hypot(dx, dy);

        let offsetX = 0;
        let offsetY = 0;
        let alpha = 0.18;
        let radius = 1.2;

        if (dist < 140) {
          const force = (1 - dist / 140);
          offsetX = -(dx / dist) * force * 12;
          offsetY = -(dy / dist) * force * 12;
          alpha = 0.18 + force * 0.45;
          radius = 1.2 + force * 1.5;
        }

        ctx.fillStyle = `rgba(11, 15, 20, ${alpha})`;
        ctx.beginPath();
        ctx.arc(baseX + offsetX, baseY + offsetY, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    animationId = requestAnimationFrame(loop);
  }

  loop();
}
