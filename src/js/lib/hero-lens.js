/**
 * Three.js Hero Signature Scene
 * - Huge "NEXUS" title drawn into CanvasTexture (Anton, solid ink #0B0F14, full opacity)
 * - 96px top safe area (nav) and 40px clear space between labels row and title
 * - Fitted inside remaining area (max 58% of height)
 * - Rounded glass lens/ring clamped fully inside hero (never overlaps nav)
 * - Click shockwave: fires a ripple from cursor distorting title letters and spins lens once
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import gsap from 'gsap';

export class HeroLensScene {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.fallbackEl = document.querySelector('.hero-fallback-title');
    this.isWebGLSupported = true;

    if (!this.canvas) return;

    this.container = this.canvas.parentElement;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.textPlane = null;
    this.textCanvas = null;
    this.textCtx = null;
    this.textTexture = null;

    // Lens and inner accent ring
    this.lensGroup = null;
    this.glassMesh = null;
    this.orangeRing = null;

    // Mouse & Animation
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.hasUserMovedMouse = false;
    this.animationFrameId = null;
    this.isVisible = true; // Controlled by IntersectionObserver
    this.time = 0;

    // Shockwave ripple state
    this.shockwave = {
      active: false,
      x: 0,
      y: 0,
      radius: 0,
      maxRadius: 1200,
      strength: 0
    };

    // Character stagger offsets for entrance animation
    this.letterOffsets = [0, 0, 0, 0, 0]; // N, E, X, U, S
    this.letterAlphas = [1, 1, 1, 1, 1];

    this.init();
  }

  init() {
    try {
      const width = this.container.clientWidth || window.innerWidth;
      const height = this.container.clientHeight || (window.innerHeight - 190);

      // 1. Scene & Camera
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0xE9E6DF); // Bone background

      this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
      this.camera.position.set(0, 0, 5.2);

      // 2. Renderer (DPR capped at 2 on desktop, 1.5 on mobile)
      const isMobile = window.innerWidth <= 768;
      const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        powerPreference: 'high-performance'
      });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(dpr);
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.05;

      // 3. Environment: RoomEnvironment via PMREMGenerator for soft glass reflections
      const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

      // 4. Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
      this.scene.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 1.3);
      dirLight.position.set(3, 4, 5);
      this.scene.add(dirLight);

      // 5. Background Title Plane with CanvasTexture
      this.createTextPlane(width, height);

      // 6. Floating Glass Lens & Inner Orange Ring
      this.createGlassLens();

      // 7. Event Listeners & Tab Visibility
      window.addEventListener('mousemove', (e) => this.onMouseMove(e));
      window.addEventListener('resize', () => this.onResize());
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.isVisible = false;
          if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
          }
        } else if (this.isVisible) {
          this.animate();
        }
      });

      // Pause rAF when hero canvas scrolls offscreen
      const visObserver = new IntersectionObserver(([entry]) => {
        this.isVisible = entry.isIntersecting;
        if (this.isVisible && !this.animationFrameId) {
          this.animate();
        }
      }, { threshold: 0.01 });
      visObserver.observe(this.canvas);

      // Click shockwave
      this.canvas.addEventListener('click', (e) => this.onClickShockwave(e));

      if (document.fonts) {
        document.fonts.ready.then(() => {
          this.updateTextCanvas();
        });
      }

      // Start RAF Loop
      this.animate();

    } catch (err) {
      console.warn('[NEXUS] WebGL initialization failed, switching to HTML fallback:', err);
      this.enableFallback();
    }
  }

  createTextPlane(viewportWidth, viewportHeight) {
    const vFOV = THREE.MathUtils.degToRad(this.camera.fov);
    const planeDist = this.camera.position.z;
    const frustumHeight = 2 * Math.tan(vFOV / 2) * planeDist;
    const frustumWidth = frustumHeight * (viewportWidth / viewportHeight);

    this.textCanvas = document.createElement('canvas');
    this.textCanvas.width = 2048;
    this.textCanvas.height = 1024;
    this.textCtx = this.textCanvas.getContext('2d');

    this.updateTextCanvas();

    this.textTexture = new THREE.CanvasTexture(this.textCanvas);
    this.textTexture.minFilter = THREE.LinearFilter;
    this.textTexture.magFilter = THREE.LinearFilter;
    this.textTexture.generateMipmaps = false;

    const planeGeo = new THREE.PlaneGeometry(frustumWidth, frustumHeight);
    const planeMat = new THREE.MeshBasicMaterial({
      map: this.textTexture,
      transparent: false
    });

    this.textPlane = new THREE.Mesh(planeGeo, planeMat);
    this.textPlane.position.z = 0;
    this.scene.add(this.textPlane);
  }

  updateTextCanvas() {
    if (!this.textCtx || !this.textCanvas) return;
    const ctx = this.textCtx;
    const cw = this.textCanvas.width;
    const ch = this.textCanvas.height;

    // Background: Bone #E9E6DF
    ctx.fillStyle = '#E9E6DF';
    ctx.fillRect(0, 0, cw, ch);

    const heroAreaHeight = this.container.clientHeight || (window.innerHeight - 190);
    const heroAreaWidth = this.container.clientWidth || window.innerWidth;

    // 1. Reserve 96px top safe area (nav) + at least 40px clear space between labels and title
    // Plus bottom margin ~30px
    const navSafeArea = 96;
    const labelsAndSpacing = 28 + 40; // 40px clear space
    const topReservedPx = navSafeArea + labelsAndSpacing; // ~164px
    const remainingHeightPx = Math.max(180, heroAreaHeight - topReservedPx - 32);

    // Title max height: max 58% of remaining area height
    const maxTitleHeightPx = remainingHeightPx * 0.58;
    const scaleToCanvasY = ch / heroAreaHeight;
    const targetMaxHeightOnCanvas = maxTitleHeightPx * scaleToCanvasY;

    // Available width = container minus 32px padding each side
    const availableWidthRatio = Math.max(0.55, (heroAreaWidth - 64) / heroAreaWidth);
    const targetWidthOnCanvas = cw * availableWidthRatio;

    // Measure at base 200px font
    ctx.font = '200px Anton, Impact, sans-serif';
    const letters = ['N', 'E', 'X', 'U', 'S'];
    
    let totalBaseWidth = 0;
    const letterBaseWidths = letters.map(l => {
      const w = ctx.measureText(l).width;
      totalBaseWidth += w;
      return w;
    });

    // Tight letter spacing: -0.02em
    const letterSpacingBase = -200 * 0.02;
    totalBaseWidth += letterSpacingBase * (letters.length - 1);

    const scaleWidth = targetWidthOnCanvas / totalBaseWidth;
    const scaleHeight = targetMaxHeightOnCanvas / (200 * 0.85);
    const finalFontSize = Math.floor(200 * Math.min(scaleWidth, scaleHeight));

    ctx.font = `${finalFontSize}px Anton, Impact, sans-serif`;
    // Title color must be solid ink #0B0F14 at full opacity (no transparency, no blend mode)
    ctx.fillStyle = '#0B0F14';
    ctx.textBaseline = 'middle';

    const letterSpacing = -finalFontSize * 0.02;
    let totalWidth = 0;
    const letterWidths = letters.map(l => {
      const w = ctx.measureText(l).width;
      totalWidth += w;
      return w;
    });
    totalWidth += letterSpacing * (letters.length - 1);

    const startX = (cw - totalWidth) / 2;

    // Position title centered vertically within the remaining area
    const remainingCenterPx = topReservedPx + (remainingHeightPx / 2);
    const centerY = remainingCenterPx * scaleToCanvasY;

    let currentX = startX;

    // Draw letters with full opacity
    letters.forEach((char, idx) => {
      const charWidth = letterWidths[idx];
      const offsetY = (this.letterOffsets[idx] || 0) * scaleToCanvasY;

      // Shockwave displacement pulse
      let shockDisplacementX = 0;
      let shockDisplacementY = 0;
      if (this.shockwave.active && this.shockwave.strength > 0.01) {
        const charCenterCanvasX = currentX + charWidth / 2;
        const charCenterCanvasY = centerY;
        const dist = Math.hypot(charCenterCanvasX - this.shockwave.x, charCenterCanvasY - this.shockwave.y);
        const waveDist = Math.abs(dist - this.shockwave.radius);
        if (waveDist < 180) {
          const waveFactor = Math.sin((waveDist / 180) * Math.PI) * this.shockwave.strength;
          const angle = Math.atan2(charCenterCanvasY - this.shockwave.y, charCenterCanvasX - this.shockwave.x);
          shockDisplacementX = Math.cos(angle) * waveFactor * 32;
          shockDisplacementY = Math.sin(angle) * waveFactor * 24;
        }
      }

      ctx.save();
      ctx.globalAlpha = 1.0; // Solid ink at full opacity
      ctx.fillText(char, currentX + shockDisplacementX, centerY + offsetY + shockDisplacementY);
      ctx.restore();

      currentX += charWidth + letterSpacing;
    });

    if (this.textTexture) {
      this.textTexture.needsUpdate = true;
    }
  }

  createGlassLens() {
    this.lensGroup = new THREE.Group();
    // Position inside the hero below nav
    this.lensGroup.position.set(0.35, -0.15, 1.2);

    const isMobile = window.innerWidth <= 768;

    // Rounded Glass Lens
    const lensRadius = 0.95;
    const tubeRadius = 0.36;
    const glassGeo = new THREE.TorusGeometry(
      lensRadius,
      tubeRadius,
      isMobile ? 18 : 36,
      isMobile ? 36 : 80
    );

    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xffffff),
      transmission: 1.0,         // Pure optical glass transmission
      thickness: 1.5,            // Refraction depth
      roughness: 0.05,           // Smooth surface
      ior: 1.4,                  // Glass optical index
      dispersion: isMobile ? 0 : 0.04, // Disabled on mobile for performance
      clearcoat: isMobile ? 0 : 1.0,
      clearcoatRoughness: 0.04,
      attenuationColor: new THREE.Color(0xffffff),
      attenuationDistance: 3.0,
      transparent: true
    });

    this.glassMesh = new THREE.Mesh(glassGeo, glassMaterial);
    this.lensGroup.add(this.glassMesh);

    // Inner Orange Ring Accent
    const ringGeo = new THREE.TorusGeometry(lensRadius, 0.016, isMobile ? 10 : 16, isMobile ? 32 : 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0xFF4A12) // Signal Orange
    });

    this.orangeRing = new THREE.Mesh(ringGeo, ringMat);
    this.lensGroup.add(this.orangeRing);

    this.scene.add(this.lensGroup);
  }

  enableFallback() {
    this.isWebGLSupported = false;
    const heroStage = document.querySelector('.hero-stage');
    if (heroStage) {
      heroStage.classList.add('is-webgl-fallback');
    }
  }

  onClickShockwave(e) {
    const rect = this.canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert to canvas coordinates
    this.shockwave.active = true;
    this.shockwave.x = (clickX / rect.width) * this.textCanvas.width;
    this.shockwave.y = (clickY / rect.height) * this.textCanvas.height;
    this.shockwave.radius = 0;
    this.shockwave.strength = 1.0;

    // Animate shockwave radius & strength
    gsap.killTweensOf(this.shockwave);
    gsap.to(this.shockwave, {
      radius: 1400,
      strength: 0,
      duration: 0.85,
      ease: 'power2.out',
      onUpdate: () => {
        this.updateTextCanvas();
      },
      onComplete: () => {
        this.shockwave.active = false;
        this.updateTextCanvas();
      }
    });

    // Spin the lens once
    if (this.lensGroup) {
      gsap.to(this.lensGroup.rotation, {
        z: '+=6.283',
        y: '+=3.1415',
        duration: 0.85,
        ease: 'power2.out'
      });
      gsap.fromTo(this.lensGroup.scale,
        { x: 1.15, y: 1.15, z: 1.15 },
        { x: 1, y: 1, z: 1, duration: 0.75, ease: 'elastic.out(1, 0.4)' }
      );
    }
  }

  animateEntrance() {
    this.updateTextCanvas();

    if (this.lensGroup) {
      gsap.from(this.lensGroup.scale, {
        x: 0,
        y: 0,
        z: 0,
        duration: 1.2,
        delay: 0.2,
        ease: 'elastic.out(1, 0.5)'
      });
    }
  }

  onMouseMove(e) {
    this.hasUserMovedMouse = true;
    const rect = this.canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

    // Map to camera coordinates
    this.mouse.targetX = x * 1.35;
    this.mouse.targetY = y * 0.75;

    // Check proximity to lens for "DRAG" cursor
    if (this.lensGroup && this.camera) {
      const lensPos = this.lensGroup.position.clone().project(this.camera);
      const screenLensX = (lensPos.x * 0.5 + 0.5) * window.innerWidth;
      const screenLensY = (-(lensPos.y * 0.5) + 0.5) * rect.height;
      const distToLens = Math.hypot(e.clientX - screenLensX, e.clientY - screenLensY);

      if (distToLens < 140) {
        this.canvas.setAttribute('data-cursor', 'DRAG');
      } else {
        this.canvas.setAttribute('data-cursor', 'SCROLL');
      }
    }
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const vFOV = THREE.MathUtils.degToRad(this.camera.fov);
    const planeDist = this.camera.position.z;
    const frustumHeight = 2 * Math.tan(vFOV / 2) * planeDist;
    const frustumWidth = frustumHeight * (width / height);

    if (this.textPlane) {
      this.textPlane.geometry.dispose();
      this.textPlane.geometry = new THREE.PlaneGeometry(frustumWidth, frustumHeight);
    }

    this.updateTextCanvas();
  }

  enableFallback() {
    this.isWebGLSupported = false;
    if (this.canvas) this.canvas.style.display = 'none';
    if (this.fallbackEl) this.fallbackEl.style.display = 'block';
  }

  animate() {
    // Stop loop when offscreen or tab hidden
    if (!this.isVisible) {
      this.animationFrameId = null;
      return;
    }

    this.time += 0.016;

    // Smooth lerp mouse tracking
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.06;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.06;

    if (this.lensGroup) {
      // Idle float when untouched
      const idleFloatY = Math.sin(this.time * 1.3) * 0.08;
      const idleFloatX = Math.cos(this.time * 1.1) * 0.05;

      const rawX = 0.35 + this.mouse.x + (this.hasUserMovedMouse ? 0 : idleFloatX);
      const rawY = -0.15 + this.mouse.y + idleFloatY;

      // CLAMP THE LENS TO STAY FULLY INSIDE THE HERO (never overlapping the 96px top nav)
      // Top clamp: max Y = 0.12 (keeps top edge of lens below 96px nav)
      // Bottom clamp: min Y = -0.72 (keeps bottom edge inside hero)
      // Horizontal clamp: -1.45 to +1.45
      this.lensGroup.position.x = Math.max(-1.45, Math.min(1.45, rawX));
      this.lensGroup.position.y = Math.max(-0.72, Math.min(0.12, rawY));

      // Gentle movement tilt
      const targetRotY = this.mouse.x * 0.32 + Math.sin(this.time * 0.8) * 0.04;
      const targetRotX = -this.mouse.y * 0.28 + Math.cos(this.time * 0.8) * 0.04;
      this.lensGroup.rotation.y += (targetRotY - this.lensGroup.rotation.y) * 0.06;
      this.lensGroup.rotation.x += (targetRotX - this.lensGroup.rotation.x) * 0.06;

      // Orange inner ring rotates
      if (this.orangeRing) {
        this.orangeRing.rotation.x += 0.014;
        this.orangeRing.rotation.y += 0.020;
      }
    }

    this.renderer.render(this.scene, this.camera);
    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }

  destroy() {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    if (this.renderer) this.renderer.dispose();
  }
}
