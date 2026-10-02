/**
 * INCIDENT THREE.JS GLASS LENS SCENE
 * - Reuses the Three.js glass lens from the hero
 * - Glass lens: MeshPhysicalMaterial (transmission 1, thickness 1.6, roughness 0.03,
 *   ior 1.42, chromatic dispersion, clearcoat) with RoomEnvironment
 * - Environment intensity increased to 1.6
 * - Orange rim light (#FF4A12) for brilliant edge highlights on dark layer
 * - Dark navy backdrop plane behind the lens during INCIDENT state (keeps glass clear, not gray)
 * - Lens travels to right half (~70% viewport height), stays on top of both layers
 * - Exposes getLensScreenPosition() to anchor the expanding circle clip-path
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import gsap from 'gsap';

export class IncidentLensScene {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.container = this.canvas.parentElement;
    this.scene = null;
    this.camera = null;
    this.renderer = null;

    // Lens, Ring, Backdrop & Lights
    this.lensGroup = null;
    this.glassMesh = null;
    this.orangeRing = null;
    this.glassMaterial = null;
    this.navyBackdrop = null;
    this.orangeRimLight = null;

    // State & Animation
    this.currentStage = 'NOMINAL';
    this.time = 0;
    this.animationFrameId = null;
    this.isVisible = true; // Controlled by IntersectionObserver
    this.isIncidentState = false;
    this.ringSpinSpeed = 0.016;
    this.targetSpinSpeed = 0.016;
    this.jitterAmount = 0;
    this.targetJitter = 0;

    // Lens positional interpolation
    this.lensTargetX = 1.35;
    this.lensTargetY = -0.72;
    this.lensCurrentX = 1.35;
    this.lensCurrentY = -0.72;

    this.init();
  }

  init() {
    try {
      const width = this.container.clientWidth || window.innerWidth;
      const height = this.container.clientHeight || window.innerHeight;

      // 1. Scene & Camera
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
      this.camera.position.set(0, 0, 5.2);

      // 2. Transparent Renderer
      const isMobile = window.innerWidth <= 768;
      const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        alpha: true, // Transparent so layers show underneath
        antialias: true,
        powerPreference: 'high-performance'
      });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(dpr);
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      // Exposure adjusted for high dynamic range glass
      this.renderer.toneMappingExposure = 1.35;

      // 3. Environment: RoomEnvironment with intensity 1.6
      const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      if ('environmentIntensity' in this.scene) {
        this.scene.environmentIntensity = 1.6;
      }

      // 4. Lighting: Ambient + Key + Orange Rim Light
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
      this.scene.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
      dirLight.position.set(3, 4, 5);
      this.scene.add(dirLight);

      // Orange Rim Light (#FF4A12) for brilliant specular highlights on glass edges
      this.orangeRimLight = new THREE.DirectionalLight(0xFF4A12, 3.8);
      this.orangeRimLight.position.set(3.5, -2, -2);
      this.scene.add(this.orangeRimLight);

      // 5. Floating Glass Lens, Inner Orange Ring & Dark Navy Backdrop
      this.createGlassLens();

      // 6. Responsive handling, IntersectionObserver & Visibility Change
      this.updateResponsivePosition();
      window.addEventListener('resize', () => this.onResize());

      // Pause rAF when the incident section is offscreen
      const visObserver = new IntersectionObserver(([entry]) => {
        this.isVisible = entry.isIntersecting;
        if (this.isVisible && !this.animationFrameId) {
          this.animate();
        }
      }, { threshold: 0.01 });
      visObserver.observe(this.canvas);

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

      // Start Render Loop
      this.animate();

    } catch (err) {
      console.warn('[IncidentLensScene] WebGL initialization error:', err);
    }
  }

  updateResponsivePosition() {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      // Mobile: lens moves to top half
      this.lensTargetX = 0;
      this.lensTargetY = 0.65;
    } else {
      // Desktop: right half at ~70% viewport height
      if (this.currentStage === 'RESOLVED') {
        this.lensTargetX = 0;
        this.lensTargetY = 0;
      } else {
        this.lensTargetX = 1.35;
        this.lensTargetY = -0.72;
      }
    }
  }

  createGlassLens() {
    this.lensGroup = new THREE.Group();
    this.lensGroup.position.set(this.lensTargetX, this.lensTargetY, 1.2);

    const isMobile = window.innerWidth <= 768;

    // 1. Dark Navy Backdrop Disc behind the lens
    const backdropGeo = new THREE.CircleGeometry(1.65, isMobile ? 24 : 36);
    const backdropMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0x070B10), // Rich dark navy
      transparent: true,
      opacity: 0.0 // Starts invisible in NOMINAL
    });
    this.navyBackdrop = new THREE.Mesh(backdropGeo, backdropMat);
    this.navyBackdrop.position.set(0, 0, -0.6);
    this.lensGroup.add(this.navyBackdrop);

    // 2. Rounded Glass Lens: MeshPhysicalMaterial
    const lensRadius = 0.95;
    const tubeRadius = 0.36;
    const glassGeo = new THREE.TorusGeometry(
      lensRadius,
      tubeRadius,
      isMobile ? 18 : 36,
      isMobile ? 36 : 80
    );

    this.glassMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xffffff),
      transmission: 1.0,         // Pure optical refraction
      thickness: 1.6,
      roughness: 0.03,           // Mirror smooth
      ior: 1.42,
      dispersion: isMobile ? 0 : 0.05, // Disabled on mobile for performance
      clearcoat: isMobile ? 0 : 1.0,
      clearcoatRoughness: 0.03,
      attenuationColor: new THREE.Color(0xffffff),
      attenuationDistance: 3.5,
      transparent: true
    });

    this.glassMesh = new THREE.Mesh(glassGeo, this.glassMaterial);
    this.lensGroup.add(this.glassMesh);

    // 3. Inner Ring Accent (Orange #FF4A12)
    const ringGeo = new THREE.TorusGeometry(lensRadius, 0.018, isMobile ? 10 : 16, isMobile ? 32 : 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0xFF4A12)
    });

    this.orangeRing = new THREE.Mesh(ringGeo, ringMat);
    this.lensGroup.add(this.orangeRing);

    this.scene.add(this.lensGroup);
  }

  setStage(stageName) {
    if (this.currentStage === stageName) return;
    this.currentStage = stageName;

    // Update physical lens properties according to stage
    if (stageName === 'ANOMALY') {
      this.isIncidentState = true;
      this.targetSpinSpeed = 0.075;
      this.targetJitter = 0.035;

      // Dark navy backdrop fades in to keep glass rich and glossy
      if (this.navyBackdrop) {
        gsap.to(this.navyBackdrop.material, { opacity: 0.92, duration: 0.6 });
      }
      if (this.glassMaterial) {
        gsap.to(this.glassMaterial, { dispersion: 0.09, duration: 0.5 });
      }
      if (this.orangeRimLight) {
        gsap.to(this.orangeRimLight, { intensity: 4.5, duration: 0.5 });
      }
    } else if (stageName === 'ISOLATING') {
      this.isIncidentState = true;
      this.targetSpinSpeed = 0.055;
      this.targetJitter = 0.02;

      if (this.navyBackdrop) {
        gsap.to(this.navyBackdrop.material, { opacity: 0.92, duration: 0.6 });
      }
      if (this.glassMaterial) {
        gsap.to(this.glassMaterial, { dispersion: 0.07, duration: 0.5 });
      }
    } else if (stageName === 'RESOLVED') {
      this.isIncidentState = false;
      this.targetSpinSpeed = 0.016;
      this.targetJitter = 0;

      // Dark navy backdrop fades out as circle shrinks
      if (this.navyBackdrop) {
        gsap.to(this.navyBackdrop.material, { opacity: 0.0, duration: 0.8 });
      }
      if (this.glassMaterial) {
        gsap.to(this.glassMaterial, { dispersion: 0.04, duration: 0.8 });
      }
      if (this.orangeRimLight) {
        gsap.to(this.orangeRimLight, { intensity: 2.8, duration: 0.8 });
      }
      this.updateResponsivePosition();
    } else {
      // NOMINAL
      this.isIncidentState = false;
      this.targetSpinSpeed = 0.016;
      this.targetJitter = 0;

      if (this.navyBackdrop) {
        gsap.to(this.navyBackdrop.material, { opacity: 0.0, duration: 0.5 });
      }
      if (this.glassMaterial) {
        gsap.to(this.glassMaterial, { dispersion: 0.04, duration: 0.6 });
      }
      if (this.orangeRimLight) {
        gsap.to(this.orangeRimLight, { intensity: 2.8, duration: 0.6 });
      }
      this.updateResponsivePosition();
    }
  }

  getLensScreenPosition() {
    if (!this.lensGroup || !this.camera) {
      return { x: window.innerWidth * 0.72, y: window.innerHeight * 0.70 };
    }

    const vector = this.lensGroup.position.clone();
    vector.project(this.camera);

    const screenX = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const screenY = (-(vector.y * 0.5) + 0.5) * window.innerHeight;

    return { x: screenX, y: screenY };
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    this.updateResponsivePosition();
  }

  animate() {
    // Stop loop when offscreen or tab hidden
    if (!this.isVisible) {
      this.animationFrameId = null;
      return;
    }

    this.time += 0.016;

    // Smoothly interpolate lens position
    this.lensCurrentX += (this.lensTargetX - this.lensCurrentX) * 0.08;
    this.lensCurrentY += (this.lensTargetY - this.lensCurrentY) * 0.08;

    this.ringSpinSpeed += (this.targetSpinSpeed - this.ringSpinSpeed) * 0.08;
    this.jitterAmount += (this.targetJitter - this.jitterAmount) * 0.1;

    if (this.lensGroup) {
      // Idle float + jitter
      const idleY = Math.sin(this.time * 1.5) * 0.08;
      const jitterX = (Math.random() - 0.5) * this.jitterAmount;
      const jitterY = (Math.random() - 0.5) * this.jitterAmount;

      this.lensGroup.position.x = this.lensCurrentX + jitterX;
      this.lensGroup.position.y = this.lensCurrentY + idleY + jitterY;

      // Subtle tilt
      this.lensGroup.rotation.y = Math.sin(this.time * 0.8) * 0.1 + jitterX * 2;
      this.lensGroup.rotation.x = Math.cos(this.time * 0.7) * 0.08 + jitterY * 2;

      // Inner ring rotation
      if (this.orangeRing) {
        this.orangeRing.rotation.x += this.ringSpinSpeed;
        this.orangeRing.rotation.y += this.ringSpinSpeed * 1.4;
      }
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }

    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }

  destroy() {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    if (this.renderer) this.renderer.dispose();
  }
}
