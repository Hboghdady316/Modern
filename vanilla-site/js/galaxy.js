// Project Galaxy: 3D planets (port of components/3d/project-galaxy.tsx) + filter (project-filter.tsx)
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

const projectsData = [
  { id: 1, name: "AI Chat Platform", category: "ai", position: [2, 1, 0], color: "#00ffff", description: "Real-time AI-powered chat application with natural language processing.", technologies: ["React", "Node.js", "OpenAI", "WebSocket"], github: "https://github.com", demo: "https://demo.com", image: "assets/placeholder.svg" },
  { id: 2, name: "E-commerce Platform", category: "frontend", position: [-2, -1, 1], color: "#ff00ff", description: "Modern e-commerce platform with advanced filtering and payment integration.", technologies: ["Next.js", "Stripe", "Prisma", "PostgreSQL"], github: "https://github.com", demo: "https://demo.com", image: "assets/placeholder.svg" },
  { id: 3, name: "API Gateway", category: "backend", position: [0, 2, -2], color: "#ffff00", description: "Scalable API gateway with rate limiting, authentication, and monitoring.", technologies: ["Node.js", "Redis", "Docker", "AWS"], github: "https://github.com", demo: "https://demo.com", image: "assets/placeholder.svg" },
  { id: 4, name: "Open Source UI Library", category: "opensource", position: [-1, 0, 2], color: "#00ff00", description: "Comprehensive React component library with TypeScript support.", technologies: ["React", "TypeScript", "Storybook", "Rollup"], github: "https://github.com", demo: "https://demo.com", image: "assets/placeholder.svg" },
];

const filters = [
  { id: "all", label: "All Projects", icon: "🌌" },
  { id: "frontend", label: "Frontend", icon: "🎨" },
  { id: "backend", label: "Backend", icon: "⚙️" },
  { id: "ai", label: "AI/ML", icon: "🤖" },
  { id: "opensource", label: "Open Source", icon: "🔓" },
];

let selectedFilter = "all";
let sceneApi = null;

function webglSupported() {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
  } catch (e) {
    return false;
  }
}

function initFilters() {
  const wrap = document.getElementById("project-filters");
  filters.forEach((f) => {
    const btn = document.createElement("button");
    btn.className = `btn btn-md btn-filter glass-morphism hover-scale${f.id === selectedFilter ? " active" : ""}`;
    btn.dataset.filter = f.id;
    btn.innerHTML = `<span style="margin-right:0.5rem;">${f.icon}</span>${f.label}`;
    btn.addEventListener("click", () => {
      selectedFilter = f.id;
      wrap.querySelectorAll(".btn-filter").forEach((b) => b.classList.toggle("active", b.dataset.filter === f.id));
      sceneApi?.setFilter(selectedFilter);
    });
    wrap.appendChild(btn);
  });
}

function openModal(project) {
  const overlay = document.getElementById("project-modal");
  const box = document.getElementById("project-modal-box");
  box.innerHTML = `
    <div class="modal-grid">
      <div><img class="modal-img" src="${project.image}" alt="${project.name}" /></div>
      <div>
        <h3 style="font-size:1.5rem;font-weight:700;color:#fff;margin-bottom:1rem;">${project.name}</h3>
        <p style="color:rgba(255,255,255,0.8);margin-bottom:1rem;">${project.description}</p>
        <div class="modal-tech">${project.technologies.map((t) => `<span>${t}</span>`).join("")}</div>
        <div class="modal-actions">
          <a class="btn btn-md btn-outline-cyan glass-morphism" href="${project.github}" target="_blank" rel="noopener noreferrer">
            <span class="icon-github"></span>GitHub
          </a>
          <a class="btn btn-md btn-outline-purple glass-morphism" href="${project.demo}" target="_blank" rel="noopener noreferrer">
            <span data-lucide="external-link"></span>Live Demo
          </a>
        </div>
      </div>
    </div>
  `;
  window.__renderIcons?.();
  overlay.classList.add("open");
}

function initModalClose() {
  const overlay = document.getElementById("project-modal");
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.classList.remove("open");
  });
}

function renderFallbackGrid(container, projects, onClick) {
  container.innerHTML = "";
  const grid = document.createElement("div");
  grid.className = "fallback-grid";
  projects.forEach((project) => {
    const card = document.createElement("div");
    card.className = "card glass-morphism hover-scale";
    card.style.cssText = "border:1px solid rgba(255,255,255,0.2);cursor:pointer;";
    card.innerHTML = `
      <div class="card-body">
        <div class="fallback-icon" style="background:${project.color}20;">🚀</div>
        <h3 style="color:#fff;font-weight:700;margin-bottom:0.5rem;">${project.name}</h3>
        <p style="color:rgba(255,255,255,0.7);font-size:0.9rem;">${project.description}</p>
      </div>
    `;
    card.addEventListener("click", () => onClick(project));
    grid.appendChild(card);
  });
  container.appendChild(grid);
}

function initScene(container) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(0, 0, 6);

  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.domElement.style.position = "absolute";
  renderer.domElement.style.inset = "0";
  container.appendChild(renderer.domElement);

  const labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(container.clientWidth, container.clientHeight);
  labelRenderer.domElement.style.position = "absolute";
  labelRenderer.domElement.style.top = "0";
  labelRenderer.domElement.style.left = "0";
  labelRenderer.domElement.style.pointerEvents = "none";
  container.appendChild(labelRenderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.3));
  const p1 = new THREE.PointLight(0xffffff, 0.8);
  p1.position.set(5, 5, 5);
  scene.add(p1);
  const p2 = new THREE.PointLight(0xff00ff, 0.4);
  p2.position.set(-5, -5, -5);
  scene.add(p2);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableZoom = true;
  controls.enablePan = true;
  controls.enableRotate = true;
  controls.maxDistance = 10;
  controls.minDistance = 3;

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let hovered = null;
  let planetGroup = new THREE.Group();
  scene.add(planetGroup);

  function buildPlanets(filter) {
    scene.remove(planetGroup);
    planetGroup = new THREE.Group();
    scene.add(planetGroup);

    const filtered = projectsData.filter((p) => filter === "all" || p.category === filter);
    filtered.forEach((project) => {
      const group = new THREE.Group();
      group.position.set(...project.position);
      group.userData.project = project;

      const sphereMat = new THREE.MeshStandardMaterial({
        color: project.color,
        emissive: project.color,
        emissiveIntensity: 0.05,
        transparent: true,
        opacity: 0.7,
      });
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16), sphereMat);
      sphere.userData.project = project;
      group.add(sphere);

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.5, 0.6, 16),
        new THREE.MeshBasicMaterial({ color: project.color, transparent: true, opacity: 0.2, side: THREE.DoubleSide }),
      );
      ring.rotation.x = Math.PI / 2;
      group.add(ring);

      const label = document.createElement("div");
      label.className = "skills-label";
      label.textContent = project.name;
      const labelObj = new CSS2DObject(label);
      labelObj.position.set(0, -0.8, 0);
      group.add(labelObj);

      planetGroup.add(group);
    });
  }

  buildPlanets(selectedFilter);

  function onPointerMove(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }
  renderer.domElement.addEventListener("pointermove", onPointerMove);
  renderer.domElement.addEventListener("pointerleave", () => {
    hovered = null;
    document.body.style.cursor = "auto";
  });
  renderer.domElement.addEventListener("click", (event) => {
    onPointerMove(event);
    const meshes = planetGroup.children.map((g) => g.children[0]);
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(meshes);
    if (intersects.length) openModal(intersects[0].object.userData.project);
  });

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    const meshes = [];
    planetGroup.children.forEach((g) => meshes.push(g.children[0]));
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(meshes);
    hovered = intersects.length ? intersects[0].object : null;
    document.body.style.cursor = hovered ? "pointer" : "auto";

    planetGroup.children.forEach((g) => {
      const mesh = g.children[0];
      mesh.rotation.y = t * 0.3;
      mesh.rotation.x = Math.sin(t) * 0.05;
      mesh.material.emissiveIntensity = mesh === hovered ? 0.2 : 0.05;
    });

    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
  }
  animate();

  function onResize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    labelRenderer.setSize(w, h);
  }
  window.addEventListener("resize", onResize);

  return { setFilter: buildPlanets };
}

function init() {
  const container = document.getElementById("projects-canvas-target");
  if (!container) return;

  initFilters();
  initModalClose();

  if (!webglSupported()) {
    renderFallbackGrid(container, projectsData, openModal);
    return;
  }

  try {
    sceneApi = initScene(container);
    const originalSetFilter = sceneApi.setFilter;
    sceneApi.setFilter = (f) => originalSetFilter(f);
  } catch (err) {
    renderFallbackGrid(container, projectsData, openModal);
    sceneApi = {
      setFilter: (f) => {
        selectedFilter = f;
        renderFallbackGrid(container, projectsData.filter((p) => f === "all" || p.category === f), openModal);
      },
    };
  }
}

document.addEventListener("DOMContentLoaded", init);
