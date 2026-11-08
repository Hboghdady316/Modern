// 3D Skill Wheel (port of components/3d/skill-wheel.tsx)
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

import { siteContent, escapeHtml, whenReady } from "./site-content.js";
const skillsData = siteContent.skills.map((skill, index, skills) => ({...skill, name: escapeHtml(skill.name), category: escapeHtml(skill.category), description: escapeHtml(skill.description), position: [Math.cos(index / skills.length * Math.PI * 2) * 3, Math.sin(index / skills.length * Math.PI * 2) * 3, 0]}));


function makeLabel(html, extraClass) {
  const div = document.createElement("div");
  div.className = `skills-label${extraClass ? " " + extraClass : ""}`;
  div.innerHTML = html;
  return div;
}

function renderFallbackGrid(container, onSkillClick) {
  const grid = document.createElement("div");
  grid.className = "fallback-grid";
  skillsData.forEach((skill) => {
    const card = document.createElement("div");
    card.className = "card glass-morphism hover-scale";
    card.style.cssText = "border:1px solid rgba(255,255,255,0.2);cursor:pointer;";
    card.innerHTML = `
      <div class="card-body" style="text-align:center;">
        <div style="width:4rem;height:4rem;border-radius:9999px;margin:0 auto 0.75rem;display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:700;background:${skill.color}20;color:${skill.color};">
          ${skill.level}%
        </div>
        <h3 style="color:#fff;font-weight:600;margin-bottom:0.25rem;">${skill.name}</h3>
        <p style="color:rgba(255,255,255,0.6);font-size:0.875rem;">${skill.category}</p>
      </div>
    `;
    card.addEventListener("click", () => onSkillClick(skill));
    grid.appendChild(card);
  });
  container.appendChild(grid);
}

function initDetailPanel() {
  const panel = document.getElementById("skill-detail-panel");
  function show(skill) {
    panel.innerHTML = `
      <div class="skill-detail-head">
        <h3>${skill.name}</h3>
        <button class="modal-close" id="skill-detail-close">✕</button>
      </div>
      <div class="skill-detail-meta">
        <span class="skill-detail-cat">${skill.category}</span>
        <div style="display:flex;align-items:center;gap:0.5rem;">
          <div class="skill-bar-track"><div class="skill-bar-fill" id="skill-bar-fill"></div></div>
          <span class="text-white" style="opacity:0.8;">${skill.level}%</span>
        </div>
      </div>
      <p class="skill-detail-desc">${skill.description}</p>
    `;
    panel.classList.add("open");
    requestAnimationFrame(() => {
      const fill = document.getElementById("skill-bar-fill");
      if (fill) fill.style.width = `${skill.level}%`;
    });
    document.getElementById("skill-detail-close").addEventListener("click", () => panel.classList.remove("open"));
  }
  return { show };
}

function init() {
  const container = document.getElementById("skills-canvas-target");
  if (!container) return;
  const detailPanel = initDetailPanel();


  try {
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

    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const p1 = new THREE.PointLight(0xffffff, 0.8);
    p1.position.set(5, 5, 5);
    scene.add(p1);
    const p2 = new THREE.PointLight(0xff00ff, 0.4);
    p2.position.set(-5, -5, -5);
    scene.add(p2);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.enableRotate = true;
    controls.maxDistance = 8;
    controls.minDistance = 4;

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let hovered = null;

    const orbs = skillsData.map((skill) => {
      const size = (skill.level / 100) * 0.6 + 0.2;
      const geo = new THREE.SphereGeometry(size, 16, 16);
      const mat = new THREE.MeshStandardMaterial({
        color: skill.color,
        emissive: skill.color,
        emissiveIntensity: 0.05,
        transparent: true,
        opacity: 0.7,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...skill.position);
      mesh.userData.skill = skill;
      mesh.userData.baseScale = 1;
      scene.add(mesh);

      const label = makeLabel(
        `${skill.name}<div class="pct">${skill.level}%</div>`,
      );
      const labelObj = new CSS2DObject(label);
      labelObj.position.set(0, -size - 0.5, 0);
      mesh.add(labelObj);

      return mesh;
    });

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
      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(orbs);
      if (intersects.length) detailPanel.show(intersects[0].object.userData.skill);
    });

    const startedAt = performance.now();
    function animate() {
      requestAnimationFrame(animate);
      const t = (performance.now() - startedAt) / 1000;

      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(orbs);
      hovered = intersects.length ? intersects[0].object : null;
      document.body.style.cursor = hovered ? "pointer" : "auto";

      orbs.forEach((mesh) => {
        mesh.rotation.y = t * 0.2;
        const isHovered = mesh === hovered;
        mesh.material.emissiveIntensity = isHovered ? 0.2 : 0.05;
        const scale = isHovered ? 1.1 + Math.sin(t * 2) * 0.05 : 1;
        mesh.scale.setScalar(scale);
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
  } catch (err) {
    container.innerHTML = "";
    renderFallbackGrid(container, detailPanel.show);
  }
}

whenReady(init);
