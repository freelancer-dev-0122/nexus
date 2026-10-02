# NEXUS — Autonomous Operations Command Center

A high-performance, portfolio-grade marketing experience for **NEXUS**, an autonomous AI incident orchestration platform. Built with vanilla JavaScript, modern CSS architecture, GSAP ScrollTrigger, Lenis smooth scrolling, and Three.js for refractive optical lens simulation.

---

## What I Built (Portfolio Copy for Upwork & Contra)

> **Copy & paste snippet for Upwork / Contra portfolio showcases:**

```text
Title: NEXUS — Autonomous AI Operations Command Center
Role: Lead Creative Developer & Frontend Architect
Tech: Vanilla JavaScript (ES Modules), Three.js, GSAP & ScrollTrigger, Lenis Smooth Scroll, Custom CSS

Engineered an award-winning, editorial marketing experience for an enterprise AI operations platform. Focused on editorial typography, bespoke micro-interactions, and real-time canvas simulations:

• 3D Optical Glass Lens (Three.js): Custom refractive glass torus with dispersion and dynamic environment mapping, overlapping a fitted condensed headline with lerped mouse parallax and click shockwave distortions.
• Dual-State Pinned Scroll (ScrollTrigger): Pinned 450vh scroll story transitioning from "Nominal" to "Incident" through a dynamic circular clip-path expanding from the 3D lens position, with real-time waveform canvas streaming.
• Horizontal to Vertical Adaptive Pipeline: 300vh horizontal pinned track on desktop with character mask reveals that gracefully converts to a vertical reveal-on-scroll stack on mobile.
• Simulated Live Ops Dashboard: Interactive bento grid with an eBPF service health map, 120ms canvas latency graph, live log feed (capped DOM), AI terminal typewriter, and a scripted 12-second incident cascade timeline with screen shake and scanline sweep.
• Velocity-Skewed Typography: Two-row infinite marquee responding to scroll velocity with real-time skew physics, and expandable capability rows with cursor-following vector schematics.
• Ultra-Responsive & Performant: 60fps on mobile and desktop (1920px down to 375px), DPR capping (2.0 desktop, 1.5 mobile), lazy initialization of offscreen modules, full prefers-reduced-motion support, and keyboard accessibility.
```

---

## Technology Stack

- **Core**: Vanilla JavaScript (ES Modules) — zero framework overhead.
- **Styling**: Vanilla CSS with fluid properties (`clamp()`), design tokens, and hard-contrast editorial split panels. No Tailwind.
- **3D Physics & Refraction**: Three.js (`v0.173`) with custom `MeshPhysicalMaterial`, `RoomEnvironment` PMREM lighting, and mobile geometry LODs.
- **Motion & Scroll Engine**:
  - **Lenis Smooth Scroll**: Synchronized ticker driving GSAP ScrollTrigger updates.
  - **GSAP ScrollTrigger**: Pinned scrubbing, circle clip-path interpolation, and velocity calculations.
  - **GSAP quickTo**: Zero-allocation lerp tracking for custom cursors, floating schematics, and velocity skew.
- **Micro-Libraries**:
  - `DigitRoller`: Slot-machine odometer rolling counter for real-time telemetry.
  - `splitText`: Masked character-by-character reveals.

---

## Design System

### Strict Palette (Editorial Contrast)
- **Bone**: `#E9E6DF` (Signature background tone)
- **Paper**: `#F7F5F0` (Pure high-contrast white-adjacent surface)
- **Ink**: `#0B0F14` (Deep obsidian dark tone, never pure black)
- **Signal-Orange**: `#FF4A12` (Strictly reserved for tiny alerts, telemetry, and cursor accents)
- **Film Grain**: 5% opacity procedural SVG noise overlay.

### Typography
- **Display**: `Anton` (Fluid clamp sizing up to `17rem`, line-height `0.85`, tight letter-spacing `-0.02em`).
- **Body**: `Inter Tight`.
- **Data & Telemetry**: `Geist Mono` with tabular numerals (`tnum`).

---

## Section Architecture

1. **Loader & Viewport Root**:
   - `0% → 100%` loader with kernel init notes and bottom ink progress line.
   - Wipes open via `clip-path: inset(0% 0% 100% 0%)` into a single `100svh` desktop hero view.
2. **Floating Pill Navigation & Mobile Overlay**:
   - Desktop pill nav with status badge and magnetic black pill CTA.
   - On mobile (`≤768px`), collapses to a `[MENU]` pill that triggers a full-screen obsidian overlay with staggered links and escape key handling.
3. **Hero Stage & Refractive 3D Lens**:
   - Three.js canvas featuring a refractive glass lens with an inner orange ring overlapping the title.
   - Click shockwave ripple distorting CanvasTexture letters.
   - Automatic HTML/CSS fallback if WebGL is unavailable.
   - Bottom Bar: Hard split with animated thin-line SVG blueprint and 3 rolling telemetry stats with `OPS` / `SEC` toggle.
4. **Signature Scroll: Nominal → Incident → Resolved**:
   - Single GSAP timeline scrubbed over `450vh` (shortened to `300vh` on mobile).
   - Expanding circle `clip-path` anchored to the 3D lens position revealing the dark incident layer.
   - Real-time animated canvas waveform switching from calm baseline to violent anomaly jitter.
5. **The Pipeline (01 Detect, 02 Reason, 03 Act)**:
   - Pinned horizontal scroll track on desktop with masked character typography and SVG decision trees.
   - Mobile breakpoint automatically transitions to a vertical reveal-on-scroll stack without horizontal pinning.
6. **The Control Room (Live Ops Dashboard)**:
   - Bento grid layout with 12x6 service health map, streaming canvas latency curve, live log stream (max 14 DOM nodes), and AI terminal.
   - Single-source-of-truth state object driving a scripted 12-second incident sequence with camera shake, scanline sweep, and reverse wave healing.
7. **Capabilities**:
   - 5 interactive rows with bottom-up ink wipe reveals, arrow rotations, and cursor-following SVG previews.
   - Touch tap-to-expand fallback.
8. **Big Marquee**:
   - 2 stacked rows (filled paper vs outlined type) with scroll velocity skewing up to `6deg`.
   - Hover and offscreen pause.
9. **Footer**:
   - Measured "LET'S TALK" headline fitting edge-to-edge with scroll-scrubbed outline-to-solid fill.
   - Magnetic email pill with clipboard copy and toast alert.
   - Local clock with odometer digits, link directory, and "BACK TO TOP ↑" button with Lenis `expo.inOut` ease.

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Setup & Local Development
```bash
# Clone the repository
git clone <repo-url>
cd NEXUS

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

Open `http://localhost:5173/` in your browser.

### Production Build & Preview
```bash
# Compile and optimize production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## Deployment

The project builds to the `dist/` directory with pre-configured single-page application (SPA) rewrite rules:

### Vercel
Deploy with zero configuration via the included `vercel.json`:
```bash
vercel deploy
```

### Netlify
Deploy directly using the included `netlify.toml`:
```bash
netlify deploy --prod --dir=dist
```

---

## Accessibility & Performance

- **Reduced Motion**: Respects `prefers-reduced-motion: reduce` across all animations (disables camera shake, scanlines, marquee skew, and scrubbed circle masks).
- **Performance Optimization**:
  - DPR capped at `2.0` on desktop and `1.5` on mobile.
  - Three.js lens geometry segments reduced and chromatic dispersion disabled on mobile.
  - Canvases, intervals, and render loops automatically paused when offscreen (`IntersectionObserver`) or when the tab is hidden (`visibilitychange`).
  - Lazy initialization for offscreen dashboard and footer components.
- **Keyboard Navigation**: Focus rings in signal-orange (`:focus-visible`) and skip-to-content landmark link.
- **Semantic Structure**: Proper `<header>`, `<nav>`, `<main>`, `<section>`, and `<footer>` HTML5 landmarks.
