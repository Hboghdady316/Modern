import { socialMediaProjects } from "./portfolio-data.js";

const list = document.getElementById("project-list");
const search = document.getElementById("project-search");
const dialog = document.getElementById("artwork-dialog");
let filter = "all";

function openArtwork(project) {
  const image = document.getElementById("artwork-image");
  image.src = project.image;
  image.alt = project.placeholder ? `Layout preview for ${project.title}; original artwork to come` : project.title;
  document.getElementById("artwork-title").textContent = project.title;
  document.getElementById("artwork-description").textContent = project.description;
  document.getElementById("artwork-status").textContent = project.placeholder ? "Placeholder artwork — this is a layout preview, not a completed client project." : "";
  dialog.querySelector(".eyebrow").textContent = project.placeholder ? "COLLECTION PREVIEW" : "SOCIAL MEDIA DESIGNS";
  dialog.showModal();
}

function renderProjects() {
  const query = search.value.trim().toLowerCase();
  const projects = socialMediaProjects.filter((p) => (filter === "all" || p.platform === filter) && `${p.title} ${p.description} ${p.platform} ${p.format}`.toLowerCase().includes(query));
  list.replaceChildren();
  projects.forEach((project) => {
    const row = document.createElement("article");
    row.className = "project-row";
    // Fixed template; project content is assigned as text below.
    row.innerHTML = `<button class="project-thumb" type="button"><img loading="lazy" width="600" height="450" /></button><div><p class="eyebrow"></p><h3></h3><p class="description"></p></div><div class="project-meta"><span class="index"></span><div class="tags"><span class="platform"></span><span class="format"></span></div><button class="view-button" type="button"></button></div>`;
    row.querySelector(".eyebrow").textContent = project.placeholder ? "LAYOUT PREVIEW / ARTWORK TO COME" : "SOCIAL MEDIA DESIGN";
    row.querySelector("h3").textContent = project.title;
    row.querySelector(".description").textContent = project.description;
    row.querySelector(".index").textContent = String(socialMediaProjects.indexOf(project) + 1).padStart(2, "0");
    row.querySelector(".platform").textContent = project.platform;
    row.querySelector(".format").textContent = project.format;
    const image = row.querySelector("img");
    image.src = project.image;
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
