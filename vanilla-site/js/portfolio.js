import { siteContent, applySiteContent } from "./site-content.js";
import { portfolioCategories } from "./portfolio-data.js";

const category = siteContent.categories.find((item) => item.id === document.body.dataset.category) || siteContent.categories[0];
const categoryProjects = category.visible ? category.projects.filter(project => project.visible) : [];
applySiteContent();
document.title = `${category.name} | ${siteContent.profile.name}`;
document.querySelector('h1').textContent = category.name;
document.querySelector('.breadcrumb [aria-current]').textContent = category.name;
document.querySelector('.intro-copy').textContent = category.description;
document.querySelector('.intro-bottom > span').textContent = category.formats.join(' · ').toUpperCase();
document.querySelector('.preview-note').hidden = !category.visible || !categoryProjects.some(project => project.placeholder);
document.getElementById('empty-state').textContent = category.visible ? 'No matching projects. Try another search or select All work.' : 'This collection is currently unavailable.';

const filterContainer = document.getElementById("collection-filters");
["all", ...new Set(categoryProjects.map((project) => project.platform))].forEach((value) => {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.filter = value;
  button.textContent = value === "all" ? "All work" : value;
  button.setAttribute("aria-pressed", String(value === "all"));
  filterContainer.appendChild(button);
});
const switcher = document.querySelector(".category-switcher");
portfolioCategories.forEach((item) => {
  const link = document.createElement("a");
  link.href = `./${item.id}.html`;
  link.textContent = item.name;
  if (item.id === category.id) link.setAttribute("aria-current", "page");
  switcher.appendChild(link);
});

const list = document.getElementById("project-list");
const search = document.getElementById("project-search");
const dialog = document.getElementById("artwork-dialog");
let filter = "all";

function openArtwork(project) {
  const image = document.getElementById("artwork-image");
  const video = document.getElementById('artwork-video');
  const videoLink = document.getElementById('artwork-video-link');
  const directVideo = project.videoUrl && /\.(mp4|webm)(?:[?#].*)?$/i.test(project.videoUrl);
  video.hidden = !directVideo; image.hidden = !!directVideo;
  if (directVideo) video.src = project.videoUrl; else video.removeAttribute('src');
  videoLink.hidden = !project.videoUrl || !!directVideo;
  if (project.videoUrl) videoLink.href = project.videoUrl;
  image.src = project.image || '../assets/placeholder.svg';
  image.onerror = () => { image.onerror = null; image.src = '../assets/placeholder.svg'; };
  image.alt = project.placeholder ? `Layout preview for ${project.title}; original artwork to come` : project.title;
  document.getElementById("artwork-title").textContent = project.title;
  document.getElementById("artwork-description").textContent = project.description;
  document.getElementById("artwork-status").textContent = project.placeholder ? "Placeholder artwork — this is a layout preview, not a completed client project." : "";
  dialog.querySelector(".eyebrow").textContent = project.placeholder ? "COLLECTION PREVIEW" : category.name.toUpperCase();
  dialog.showModal();
}

function renderProjects() {
  const query = search.value.trim().toLowerCase();
  const projects = categoryProjects.filter((p) => (filter === "all" || p.platform === filter) && `${p.title} ${p.description} ${p.platform} ${p.format}`.toLowerCase().includes(query));
  list.replaceChildren();
  projects.forEach((project) => {
    const row = document.createElement("article");
    row.className = "project-row";
    // Fixed template; project content is assigned as text below.
    row.innerHTML = `<button class="project-thumb" type="button"><img loading="lazy" width="600" height="450" /></button><div><p class="eyebrow"></p><h3></h3><p class="description"></p></div><div class="project-meta"><span class="index"></span><div class="tags"><span class="platform"></span><span class="format"></span></div><button class="view-button" type="button"></button></div>`;
    row.querySelector(".eyebrow").textContent = project.placeholder ? "LAYOUT PREVIEW / ARTWORK TO COME" : category.name.toUpperCase();
    row.querySelector("h3").textContent = project.title;
    row.querySelector(".description").textContent = project.description;
    row.querySelector(".index").textContent = String(categoryProjects.indexOf(project) + 1).padStart(2, "0");
    row.querySelector(".platform").textContent = project.platform;
    row.querySelector(".format").textContent = project.format;
    const image = row.querySelector("img");
    image.src = project.image || '../assets/placeholder.svg';
  image.onerror = () => { image.onerror = null; image.src = '../assets/placeholder.svg'; };
    image.alt = project.placeholder ? `Placeholder composition for ${project.title}` : project.title;
    const label = project.placeholder ? "View preview" : "View project";
    row.querySelector(".view-button").textContent = `${label} ↗`;
    row.querySelectorAll("button").forEach((button) => {
      button.setAttribute("aria-label", `${label}: ${project.title}`);
      button.addEventListener("click", () => openArtwork(project));
    });
    list.appendChild(row);
  });
  document.getElementById("project-count").textContent = `${projects.length} ${projects.every((p) => p.placeholder) ? (projects.length === 1 ? "layout preview" : "layout previews") : (projects.length === 1 ? "project" : "projects")}`;
  document.getElementById("empty-state").hidden = projects.length > 0;
}
document.querySelectorAll("[data-filter]").forEach((button) => button.addEventListener("click", () => {
  filter = button.dataset.filter;
  document.querySelectorAll("[data-filter]").forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
  renderProjects();
}));
search.addEventListener("input", renderProjects);
document.getElementById("close-artwork").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
});
renderProjects();

dialog.addEventListener("close", () => { const video = document.getElementById("artwork-video"); video.pause(); video.removeAttribute("src"); video.load(); });
