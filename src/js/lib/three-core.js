/**
 * Three.js 3D Hero Core: Autonomous Orchestration Kernel
 * Instanced node lattice + wireframe edge geometry with real-time lerped parallax.
 * Dynamic color interpolation between NOMINAL (#C8FF3D) and INCIDENT (#FF5A1F).
 * Orange pulse rings traveling along edges, node failure flicker, and offscreen pause.
 */
import * as THREE from 'three';
import gsap from 'gsap';

export class ThreeCore {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.container = this.canvas.parentElement;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.coreGroup = null;
    this.nodesMesh = null;
    this.linesMesh = null;
    this.innerKernel = null;
    this.pulseRings = [];

    // State
    this.isNominal = true;
    this.isIncident = false;
    this.incidentRatio = 0; // 0 (Nominal) -> 1 (Full Incident)
    this.isVisible = true;
    this.animationFrameId = null;

    // Mouse parallax
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    // Colors
    this.nominalColor = new THREE.Color(0xC8FF3D); // Lime
    this.incidentColor = new THREE.Color(0xFF5A1F); // Amber-orange
    this.activeColor = this.nominalColor.clone();
    this.activeEdgeColor = this.nominalColor.clone();
    this.activeNodeColor = this.nominalColor.clone();

    this.init();
  }

  init() {
    const width = this.container.offsetWidth || 500;
    const height = this.container.offsetHeight || 500;

    // Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.z = 4.2;

    // Renderer
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(dpr);

    // Group
    this.coreGroup = new THREE.Group();
    this.scene.add(this.coreGroup);

    // Construct 3D Lattice Core (Icosahedron & nested geodesic)
    this.buildGeometry();

    // Mouse tracking
    window.addEventListener('mousemove', (e) => {
      this.mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      this.mouse.targetY = -(e.clientY / window.innerHeight - 0.5) * 2;
    });

    // Resize handler
    window.addEventListener('resize', () => this.onResize());

    // Pause when offscreen
    const observer = new IntersectionObserver(([entry]) => {
      this.isVisible = entry.isIntersecting;
      if (this.isVisible && !this.animationFrameId) {
        this.animate();
      }
    }, { threshold: 0.1 });

    observer.observe(this.canvas);

    // IntersectionObserver will call this.animate() when the canvas becomes visible.
    // Do NOT call this.animate() here directly — that would spawn a second concurrent loop.
  }

  buildGeometry() {
    const isMobile = window.innerWidth < 768;
    const detail = isMobile ? 1 : 2;
    const radius = 1.35;

    const baseGeometry = new THREE.IcosahedronGeometry(radius, detail);
    const wireframeGeo = new THREE.WireframeGeometry(baseGeometry);

    // 1. Edge Lines - opacity ~0.5 as requested
    const lineMaterial = new THREE.LineBasicMaterial({
      color: this.activeEdgeColor,
      transparent: true,
      opacity: 0.5,
      linewidth: 1.0
    });
    this.linesMesh = new THREE.LineSegments(wireframeGeo, lineMaterial);
    this.coreGroup.add(this.linesMesh);

    // 2. Instanced Sphere Nodes at vertices (small nodes so letters stay readable)
    const positionAttr = baseGeometry.getAttribute('position');
    const vertexMap = new Map();
    const uniquePositions = [];

    for (let i = 0; i < positionAttr.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(positionAttr, i);
      const key = `${v.x.toFixed(2)},${v.y.toFixed(2)},${v.z.toFixed(2)}`;
      if (!vertexMap.has(key)) {
        vertexMap.set(key, true);
        uniquePositions.push(v);
      }
    }

    const nodeRadius = isMobile ? 0.024 : 0.020;
    const nodeGeo = new THREE.SphereGeometry(nodeRadius, 8, 8);
    const nodeMat = new THREE.MeshBasicMaterial({
      color: this.activeNodeColor,
      wireframe: false,
      transparent: true,
      opacity: 1.0
    });

    this.nodesMesh = new THREE.InstancedMesh(nodeGeo, nodeMat, uniquePositions.length);
    const dummy = new THREE.Object3D();

    uniquePositions.forEach((pos, idx) => {
      dummy.position.copy(pos);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      this.nodesMesh.setMatrixAt(idx, dummy.matrix);
    });

    this.nodesMesh.instanceMatrix.needsUpdate = true;
    this.coreGroup.add(this.nodesMesh);

    // 3. Inner Concentric Wireframe Nucleus
    const innerGeo = new THREE.OctahedronGeometry(0.7, 1);
    const innerLines = new THREE.WireframeGeometry(innerGeo);
    const innerMat = new THREE.LineBasicMaterial({
      color: this.activeEdgeColor,
      transparent: true,
      opacity: 0.18
    });
    this.innerKernel = new THREE.LineSegments(innerLines, innerMat);
    this.coreGroup.add(this.innerKernel);

    // 4. Orange Pulse Rings along edges for Incident State
    this.pulseRings = [];
    for (let i = 0; i < 3; i++) {
      const ringGeo = new THREE.RingGeometry(1.32, 1.36, 48);
      const ringMat = new THREE.MeshBasicMaterial({
        color: this.incidentColor,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      if (i === 1) ring.rotation.x = Math.PI / 2;
      if (i === 2) ring.rotation.y = Math.PI / 2;
      this.coreGroup.add(ring);
      this.pulseRings.push(ring);
    }
  }

  setColors({ nodeColor, edgeColor, opacity = 0.35 }) {
    if (nodeColor) {
      this.activeNodeColor = new THREE.Color(nodeColor);
      if (this.nodesMesh) this.nodesMesh.material.color.copy(this.activeNodeColor);
    }
    if (edgeColor) {
      this.activeEdgeColor = new THREE.Color(edgeColor);
      if (this.linesMesh) {
        this.linesMesh.material.color.copy(this.activeEdgeColor);
        this.linesMesh.material.opacity = opacity;
      }
      if (this.innerKernel) {
        this.innerKernel.material.color.copy(this.activeEdgeColor);
        this.innerKernel.material.opacity = opacity * 0.5;
      }
    }
  }

  setNodeColor(color) {
    this.setColors({ nodeColor: color });
  }

  setEdgeColor(color, opacity = 0.5) {
    this.setColors({ edgeColor: color, opacity });
  }

  getNodeColor() {
    return this.activeNodeColor;
  }

  getEdgeColor() {
    return this.activeEdgeColor;
  }

  setIncidentRatio(ratio) {
    this.incidentRatio = Math.max(0, Math.min(1, ratio));

    // Smoothly interpolate active color lime -> amber-orange
    this.activeColor.lerpColors(this.nominalColor, this.incidentColor, this.incidentRatio);

    if (this.linesMesh) {
      this.linesMesh.material.color.copy(this.activeColor);
      this.linesMesh.material.opacity = 0.5 + this.incidentRatio * 0.25;
    }

    if (this.nodesMesh) {
      this.nodesMesh.material.color.copy(this.activeColor);
    }

    if (this.innerKernel) {
      this.innerKernel.material.color.copy(this.activeColor);
      this.innerKernel.material.opacity = 0.18 + this.incidentRatio * 0.2;
    }
  }

  setMode(mode) {
    if (mode === 'SEC') {
      gsap.to(this.nominalColor, {
        r: 0.2, g: 0.85, b: 1.0,
        duration: 0.8,
        onUpdate: () => {
          this.setColors({
            nodeColor: this.nominalColor,
            edgeColor: this.nominalColor,
            opacity: 0.38
          });
        }
      });
    } else {
      gsap.to(this.nominalColor, {
        r: 200 / 255, g: 255 / 255, b: 61 / 255,
        duration: 0.8,
        onUpdate: () => {
          this.setColors({
            nodeColor: this.nominalColor,
            edgeColor: this.nominalColor,
            opacity: 0.35
          });
        }
      });
    }
  }

  triggerIncidentSpike() {
    const originalRatio = this.incidentRatio;
    gsap.timeline()
      .to(this, {
        incidentRatio: 1,
        duration: 0.4,
        ease: 'power3.in',
        onUpdate: () => this.setIncidentRatio(this.incidentRatio)
      })
      .to(this.coreGroup.rotation, {
        x: '+=0.8',
        y: '+=1.2',
        duration: 1.5,
        ease: 'power2.out'
      }, 0)
      .to(this, {
        incidentRatio: originalRatio,
        duration: 1.8,
        delay: 5,
        ease: 'power4.out',
        onUpdate: () => this.setIncidentRatio(this.incidentRatio)
      });
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.offsetWidth;
    const height = this.container.offsetHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  }

  animate() {
    if (!this.isVisible) {
      this.animationFrameId = null;
      return;
    }

    // Smooth lerp mouse parallax
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    // Core continuous rotation + mouse parallax tilt
    if (this.coreGroup) {
      const rotSpeed = 0.003 + this.incidentRatio * 0.006;
      this.coreGroup.rotation.y += rotSpeed;
      this.coreGroup.rotation.x += rotSpeed * 0.6;

      this.coreGroup.rotation.y += (this.mouse.x * 0.35 - this.coreGroup.rotation.y) * 0.04;
      this.coreGroup.rotation.x += (-this.mouse.y * 0.25 - this.coreGroup.rotation.x) * 0.04;
    }

    // Inner nucleus counter-rotates
    if (this.innerKernel) {
      this.innerKernel.rotation.y -= 0.006;
      this.innerKernel.rotation.z += 0.003;
    }

    // Orange pulse rings traveling along edges
    if (this.pulseRings && this.incidentRatio > 0.05) {
      const time = Date.now() * 0.003;
      this.pulseRings.forEach((ring, idx) => {
        const wave = (time + idx * 1.0) % 2.5; // 0 to 2.5
        const scale = 0.85 + wave * 0.35;
        ring.scale.set(scale, scale, scale);
        const alpha = Math.max(0, (1 - wave / 2.5) * this.incidentRatio * 0.75);
        ring.material.opacity = alpha;
        ring.material.color.copy(this.incidentColor);
      });
    } else if (this.pulseRings) {
      this.pulseRings.forEach(ring => { ring.material.opacity = 0; });
    }

    // Node failure flicker: random node drops and flashes during incident
    if (this.incidentRatio > 0.25 && this.nodesMesh) {
      const isFlickering = Math.random() > 0.75;
      if (isFlickering) {
        this.nodesMesh.material.opacity = 0.2 + Math.random() * 0.5;
      } else {
        this.nodesMesh.material.opacity = 1.0;
      }
    } else if (this.nodesMesh) {
      this.nodesMesh.material.opacity = 1.0;
    }

    this.renderer.render(this.scene, this.camera);
    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }
}
