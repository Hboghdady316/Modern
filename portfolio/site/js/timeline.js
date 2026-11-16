import { siteContent, escapeHtml, whenReady } from "./site-content.js";
const timelineData = siteContent.timeline.map(item => ({...item,
  year: escapeHtml(item.year), title: escapeHtml(item.title), company: escapeHtml(item.company), location: escapeHtml(item.location), description: escapeHtml(item.description), technologies: item.technologies.map(escapeHtml), achievements: item.achievements.map(escapeHtml)
}));

function badge(text) {
  return `<span class="badge">${text}</span>`;
}

function openDetail(item) {
  const dialog = document.createElement("dialog");
  dialog.className = "project-viewer timeline-dialog";
  dialog.setAttribute("aria-labelledby", "experience-dialog-title");
  dialog.innerHTML = `
    <div class="project-viewer-head">
      <h3 id="experience-dialog-title" class="font-sora">${item.title}</h3>
      <form method="dialog"><button class="project-action">Close</button></form>
    </div>
    <p>${item.description}</p>
    ${item.achievements.length ? `<h4>Key achievements</h4><ul class="modal-achieve">${item.achievements.map(a => `<li>${a}</li>`).join("")}</ul>` : ""}
    <div class="modal-tech">${item.technologies.map(badge).join("")}</div>
  `;
  dialog.addEventListener("close", () => dialog.remove(), { once: true });
  document.body.append(dialog);
  dialog.showModal();
}

function render() {
  const wrap = document.getElementById("timeline-items");
  if (!wrap) return;

  if (!timelineData.length) {
    wrap.textContent = 'Experience details coming soon.';
    return;
  }
  const fragment = document.createDocumentFragment();
  timelineData.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = `timeline-item${index % 2 !== 0 ? " reverse" : ""}`;

    row.innerHTML = `
      <div class="timeline-card-col">
        <div class="timeline-card">
          <div class="card glass-morphism" style="border:1px solid rgba(255,255,255,0.2);">
            <div class="card-body">
              <div class="timeline-row">
                <span data-lucide="calendar" class="text-cyan"></span>
                <span class="timeline-year">${item.year}</span>
              </div>
              <h3 class="timeline-title">${item.title}</h3>
              <div class="timeline-row">
                <span data-lucide="briefcase" class="text-purple"></span>
                <span class="timeline-company">${item.company}</span>
              </div>
              ${
                item.location
                  ? `<div class="timeline-row">
                <span data-lucide="map-pin" class="text-green"></span>
                <span class="timeline-location">${item.location}</span>
              </div>`
                  : ""
              }
              <p class="timeline-desc">${item.description}</p>
              <div class="timeline-tags">${item.technologies.map((t) => badge(t)).join("")}</div>
              <button type="button" class="project-action timeline-details">View experience</button>
            </div>
          </div>
        </div>
      </div>
      <div class="timeline-node-col"><div class="timeline-node"></div></div>
      <div class="timeline-spacer"></div>
    `;

    row.querySelector(".timeline-details").addEventListener("click", () => openDetail(item));
    fragment.appendChild(row);
  });

  wrap.replaceChildren(fragment);
  window.__renderIcons?.();

}
whenReady(render);
