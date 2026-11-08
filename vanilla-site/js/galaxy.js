import { siteContent, whenReady, escapeHtml } from "./site-content.js";
// Project Galaxy: 3D planets (port of components/3d/project-galaxy.tsx) + filter (project-filter.tsx)
let THREE, OrbitControls, CSS2DRenderer, CSS2DObject;

import { createFallbackGalaxy } from "./galaxy-fallback.js";
import { createRandomPositions } from "./galaxy-layout.js";
import { portfolioCategories } from "./portfolio-data.js";

const projectsData = portfolioCategories;
const filters = [
  { id: "all", label: "All Categories", icon: "🌌" },
  ...portfolioCategories.map((category) => ({ id: category.id, label: category.name, icon: category.icon })),
];

let selectedFilter = "all";
let sceneApi = null;
let selectedLayout = siteContent.settings.defaultLayout;

function initArrangement() {
  const buttons = document.querySelectorAll("[data-layout]");
  const shuffle = document.getElementById("shuffle-planets");
  const status = document.getElementById("galaxy-layout-status");
  function arrange(layout) {
    selectedLayout = layout;
    buttons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.layout === layout)));
    shuffle.hidden = layout !== "random";
    sceneApi?.setArrangement(layout);
    status.textContent = layout === "random"
      ? "Planets are randomly spread. Choose Shuffle again for a new arrangement."
      : "Planets are arranged in an ordered layout.";
  }
  buttons.forEach((button) => button.addEventListener("click", () => arrange(button.dataset.layout)));
  shuffle.addEventListener("click", () => arrange("random"));
  arrange(selectedLayout);
}


function initFilters() {
  const wrap = document.getElementById("project-filters");
  filters.forEach((f) => {
    const btn = document.createElement("button");
    btn.className = `btn btn-md btn-filter glass-morphism hover-scale${f.id === selectedFilter ? " active" : ""}`;
    btn.dataset.filter = f.id;
    btn.setAttribute("aria-pressed", String(f.id === selectedFilter));
    btn.innerHTML = `<span style="margin-right:0.5rem;">${escapeHtml(f.icon)}</span>${escapeHtml(f.label)}`;
    btn.addEventListener("click", () => {
      selectedFilter = f.id;
      wrap.querySelectorAll(".btn-filter").forEach((b) => {
        b.classList.toggle("active", b.dataset.filter === f.id);
        b.setAttribute("aria-pressed", String(b.dataset.filter === f.id));
      });
      sceneApi?.setFilter(selectedFilter);
    });
    wrap.appendChild(btn);
  });
}

function openModal(project) {
  project = { ...project, name: escapeHtml(project.name), description: escapeHtml(project.description), image: escapeHtml(project.image), url: escapeHtml(project.url), formats: project.formats.map(escapeHtml) };
  const overlay = document.getElementById("project-modal");
  const box = document.getElementById("project-modal-box");
  box.innerHTML = `
    <div class="modal-head"><span class="text-cyan">DESIGN CATEGORY</span><button class="modal-close" type="button" aria-label="Close category details">✕</button></div>
    <div class="modal-grid">
      <div><img class="modal-img" src="${project.image}" alt="${project.name}" /></div>
      <div>
        <h3 id="category-title" style="font-size:1.5rem;font-weight:700;color:#fff;margin-bottom:1rem;">${project.name}</h3>
        <p style="color:rgba(255,255,255,0.8);margin-bottom:1rem;">${project.description}</p>
        <div class="modal-tech">${project.formats.map((t) => `<span>${t}</span>`).join("")}</div>
        <div class="modal-actions">
          <a class="btn btn-md btn-outline-purple glass-morphism" href="${project.url}" target="_blank" rel="noopener noreferrer">
            <span data-lucide="external-link"></span>View Projects <span class="sr-only">(opens in a new tab)</span>
          </a>
        </div>
      </div>
    </div>
  `;
  box.querySelector('img').addEventListener('error', event => { event.target.src = 'assets/placeholder.svg'; }, { once: true });
  window.__renderIcons?.();
  box.querySelector(".modal-close").addEventListener("click", () => overlay.close());
  overlay.showModal();
}

function initModalClose() {
  const overlay = document.getElementById("project-modal");
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      const rect = overlay.getBoundingClientRect();
      if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) overlay.close();
    }
  });
}

function initScene(container, onUnavailable) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, (container.clientWidth || 1) / (container.clientHeight || 600), 0.1, 1000);
  camera.position.set(0, 0, 6);

  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(Math.max(1, container.clientWidth), Math.max(1, container.clientHeight));
  renderer.domElement.style.position = "absolute";
  renderer.domElement.style.inset = "0";
  container.appendChild(renderer.domElement);

  const labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(Math.max(1, container.clientWidth), Math.max(1, container.clientHeight));
  labelRenderer.domElement.style.position = "absolute";
  labelRenderer.domElement.style.top = "0";
  labelRenderer.domElement.style.left = "0";
  labelRenderer.domElement.style.pointerEvents = "none";
  container.appendChild(labelRenderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.65));
  const p1 = new THREE.PointLight(0xffffff, 0.8);
  p1.position.set(5, 5, 5);
  scene.add(p1);
  const p2 = new THREE.PointLight(0xff00ff, 0.4);
  p2.position.set(-5, -5, -5);
  scene.add(p2);

  const controls = new OrbitControls(camera, renderer.domElement);
  // Scrolling the page must not silently zoom the planets out of view.
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableRotate = true;
  controls.maxDistance = 10;
  controls.minDistance = 3;

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let hovered = null;
  let planetGroup = new THREE.Group();
  scene.add(planetGroup);
  let randomPositions = null;
  let randomNarrow = null;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function planetPosition(project, single) {
    if (single) return [0, 0, 0];
    const index = projectsData.indexOf(project);
    const narrow = container.clientWidth / container.clientHeight < 1;
    if (selectedLayout === "random") {
      if (!randomPositions || randomNarrow !== narrow) {
        randomPositions = createRandomPositions(projectsData.length, narrow);
        randomNarrow = narrow;
      }
      return randomPositions[index];
    }
    return narrow ? [index % 2 ? 1 : -1, 1.8 - Math.floor(index / 2) * 1.8, 0] : project.position;
  }

  function setArrangement() {
    if (selectedLayout === "random") randomPositions = null;
    planetGroup.children.forEach((group) => {
      const position = planetPosition(group.userData.project, planetGroup.children.length === 1);
      group.userData.targetPosition = new THREE.Vector3(...position);
      if (reducedMotion.matches) group.position.copy(group.userData.targetPosition);
    });
  }

  function buildPlanets(filter) {
    planetGroup.traverse((object) => {
      object.geometry?.dispose();
      object.material?.dispose();
      if (object.isCSS2DObject) object.element.remove();
    });
    scene.remove(planetGroup);
    planetGroup = new THREE.Group();
    scene.add(planetGroup);

    const filtered = projectsData.filter((p) => filter === "all" || p.category === filter);
    filtered.forEach((project) => {
      const group = new THREE.Group();
      group.position.set(...planetPosition(project, filtered.length === 1));
      group.userData.project = project;

      const sphereMat = new THREE.MeshStandardMaterial({
        color: project.color,
        emissive: project.color,
        emissiveIntensity: 0.18,
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

  let previousFrameTime = performance.now();
  const startedAt = previousFrameTime;
  let frame;
  let disposed = false;
  let failed = false;
  function unavailable() {
    if (failed || disposed) return;
    failed = true;
    cancelAnimationFrame(frame);
    requestAnimationFrame(onUnavailable);
  }
  function contextLost(event) { event.preventDefault(); unavailable(); }
  renderer.domElement.addEventListener('webglcontextlost', contextLost);
  function animate() {
    if (disposed || failed) return;
    frame = requestAnimationFrame(animate);
    const now = performance.now();
    const delta = Math.min((now - previousFrameTime) / 1000, 0.1);
    previousFrameTime = now;
    const t = (now - startedAt) / 1000;

    const meshes = [];
    planetGroup.children.forEach((g) => meshes.push(g.children[0]));
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(meshes);
    hovered = intersects.length ? intersects[0].object : null;
    document.body.style.cursor = hovered ? "pointer" : "auto";

    planetGroup.children.forEach((g) => {
      if (g.userData.targetPosition) g.position.lerp(g.userData.targetPosition, reducedMotion.matches ? 1 : 1 - Math.exp(-7 * delta));
      const mesh = g.children[0];
      mesh.rotation.y = t * 0.3;
      mesh.rotation.x = Math.sin(t) * 0.05;
      mesh.material.emissiveIntensity = mesh === hovered ? 0.35 : 0.18;
    });

    try {
      controls.update();
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
    } catch (error) {
      console.warn('Galaxy rendering unavailable; keeping the planet view accessible.', error);
      unavailable();
    }
  }
  function onResize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (!w || !h || disposed) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    labelRenderer.setSize(w, h);
    buildPlanets(selectedFilter);
  }
  const sizeObserver = new ResizeObserver(onResize);
  sizeObserver.observe(container);
  onResize();
  animate();

  return { setFilter: buildPlanets, setArrangement, dispose() {
    disposed = true;
    cancelAnimationFrame(frame);
    sizeObserver.disconnect();
    renderer.domElement.removeEventListener('webglcontextlost', contextLost);
    controls.dispose();
    scene.traverse(object => { object.geometry?.dispose(); object.material?.dispose(); if (object.isCSS2DObject) object.element.remove(); });
    renderer.dispose();
    document.body.style.cursor = 'auto';
  } };
}

async function init() {
  const container = document.getElementById("projects-canvas-target");
  if (!container) return;

  const access = document.querySelector('.category-access');
  access.replaceChildren();
  projectsData.forEach(category => {
    const entry = document.createElement('div'); entry.className = 'category-entry glass-morphism';
    const button = document.createElement('button'); button.type = 'button'; button.className = 'btn btn-md btn-ghost'; button.dataset.categoryDetails = category.id; button.textContent = category.name;
    const link = document.createElement('a'); link.href = category.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = 'View Projects ↗'; link.setAttribute('aria-label', `View ${category.name} projects (opens in a new tab)`);
    entry.append(button, link); access.append(entry);
  });
  initFilters();
  initArrangement();
  initModalClose();
  document.querySelectorAll("[data-category-details]").forEach((button) => {
    const category = projectsData.find((item) => item.id === button.dataset.categoryDetails);
    if (category) button.addEventListener("click", () => openModal(category));
  });

  function useFallback() {
    sceneApi?.dispose?.();
    sceneApi = createFallbackGalaxy(container, { projects: projectsData, getLayout: () => selectedLayout, onSelect: openModal });
    sceneApi.setFilter(selectedFilter);
    document.getElementById("galaxy-layout-status").textContent = 'Showing lightweight planets. Ordered, Random, and category details remain available.';
  }
  if (new URLSearchParams(window.location.search).get("galaxy") === "2d") {
    useFallback();
    return;
  }

  // Load graphics inside the recovery boundary: a failed module download must
  // still leave usable planets and category controls.
  useFallback();
  try {
    const modules = await Promise.all([import("three"), import("three/addons/controls/OrbitControls.js"), import("three/addons/renderers/CSS2DRenderer.js")]);
    [THREE, { OrbitControls }, { CSS2DRenderer, CSS2DObject }] = modules;
    sceneApi.dispose();
    container.replaceChildren();
    sceneApi = initScene(container, useFallback);
    document.getElementById("galaxy-layout-status").textContent = selectedLayout === "random"
      ? "Planets are randomly spread. Choose Shuffle again for a new arrangement."
      : "Planets are arranged in an ordered layout.";
    const originalSetFilter = sceneApi.setFilter;
    sceneApi.setFilter = (f) => originalSetFilter(f);
  } catch (err) {
    useFallback();

  }
}

whenReady(init);
