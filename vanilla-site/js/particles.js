// Hero 3D particle background + code constellation (port of components/3d/particle-background.tsx)
import * as THREE from "three";

function webglSupported() {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
  } catch (e) {
    return false;
  }
}

function renderFallback(container) {
  const wrap = document.createElement("div");
  wrap.style.cssText = "position:absolute;inset:0;overflow:hidden;";
  for (let i = 0; i < 50; i++) {
    const dot = document.createElement("div");
    dot.className = "animate-float";
    dot.style.cssText = `
      position:absolute;width:4px;height:4px;background:#22d3ee;border-radius:9999px;opacity:0.6;
      left:${Math.random() * 100}%; top:${Math.random() * 100}%;
      animation-delay:${Math.random() * 6}s; animation-duration:${4 + Math.random() * 4}s;
    `;
    wrap.appendChild(dot);
  }
  container.appendChild(wrap);

  const warning = document.getElementById("webgl-warning");
  if (warning) warning.style.display = "block";
}

function init() {
  const container = document.getElementById("hero-canvas-wrap");
  if (!container) return;

  if (!webglSupported()) {
    renderFallback(container);
    return;
  }

  let renderer;
  try {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000,
    );
    camera.position.set(0, 0, 5);

    renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Particle field
    const particlesCount = 1000;
    const positions = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 15;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0x00ffff,
      size: 0.03,
      transparent: true,
      sizeAttenuation: true,
      depthWrite: false,
    });
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    scene.add(points);

    // Code constellation
    const constellation = new THREE.Group();
    const boxGeo = new THREE.BoxGeometry(0.05, 0.05, 0.05);
    const boxMat = new THREE.MeshBasicMaterial({ color: 0xff00ff, transparent: true, opacity: 0.4 });
    for (let i = 0; i < 20; i++) {
      const mesh = new THREE.Mesh(boxGeo, boxMat);
      mesh.position.set((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
      constellation.add(mesh);
    }
    scene.add(constellation);

    const clock = new THREE.Clock();
    let rafId;
    function animate() {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      points.rotation.x = t * 0.05;
      points.rotation.y = t * 0.02;
      constellation.rotation.y = t * 0.01;
      renderer.render(scene, camera);
    }
    animate();

    function onResize() {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener("resize", onResize);

    renderer.domElement.addEventListener(
      "webglcontextlost",
      (e) => {
        e.preventDefault();
        cancelAnimationFrame(rafId);
        container.innerHTML = "";
        renderFallback(container);
      },
      false,
    );
  } catch (err) {
    container.innerHTML = "";
    renderFallback(container);
  }
}

document.addEventListener("DOMContentLoaded", init);
