// Interactive Timeline (port of components/interactive-timeline.tsx)

const timelineData = [
  {
    id: 1,
    year: "2024",
    title: "Senior Full-Stack Developer",
    company: "TechCorp Inc.",
    location: "San Francisco, CA",
    description: "Leading development of next-generation web applications using cutting-edge technologies.",
    technologies: ["React", "Node.js", "TypeScript", "AWS"],
    achievements: ["Increased performance by 40%", "Led team of 8 developers", "Architected microservices"],
  },
  {
    id: 2,
    year: "2022",
    title: "Creative Technologist",
    company: "Digital Agency",
    location: "New York, NY",
    description: "Bridged design and development to create immersive digital experiences.",
    technologies: ["Three.js", "WebGL", "React", "Python"],
    achievements: ["Won 3 design awards", "Created viral AR campaign", "Mentored junior developers"],
  },
  {
    id: 3,
    year: "2020",
    title: "Frontend Developer",
    company: "StartupXYZ",
    location: "Austin, TX",
    description: "Built responsive web applications and mobile-first experiences.",
    technologies: ["Vue.js", "JavaScript", "CSS3", "Firebase"],
    achievements: ["Launched 5 products", "Improved UX metrics by 60%", "Built design system"],
  },
];

function badge(text) {
  return `<span class="badge">${text}</span>`;
}

function openDetail(item) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-box glass-morphism">
      <h3 style="font-size:1.5rem;font-weight:700;color:#fff;margin-bottom:1rem;">${item.title}</h3>
      <p style="color:rgba(255,255,255,0.8);margin-bottom:1.5rem;">${item.description}</p>
      <h4 style="font-size:1.125rem;font-weight:600;color:#22d3ee;margin-bottom:0.75rem;">Key Achievements:</h4>
      <ul class="modal-achieve">${item.achievements.map((a) => `<li>${a}</li>`).join("")}</ul>
      <div class="modal-tech">${item.technologies.map((t) => badge(t)).join("")}</div>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add("open"));

  function close() {
    overlay.classList.remove("open");
    setTimeout(() => overlay.remove(), 250);
  }
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  overlay.querySelector(".modal-box").addEventListener("click", (e) => e.stopPropagation());
}

function render() {
  const wrap = document.getElementById("timeline-items");
  if (!wrap) return;

  timelineData.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = `timeline-item${index % 2 !== 0 ? " reverse" : ""}`;
    row.dataset.animate = "fade-up";
    row.dataset.delay = String(index * 200);
    row.dataset.duration = "600";

    row.innerHTML = `
      <div class="timeline-card-col">
        <div class="timeline-card hover-scale">
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
              <div class="timeline-row">
                <span data-lucide="map-pin" class="text-green"></span>
                <span class="timeline-location">${item.location}</span>
              </div>
              <p class="timeline-desc">${item.description}</p>
              <div class="timeline-tags">${item.technologies.map((t) => badge(t)).join("")}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="timeline-node-col"><div class="timeline-node"></div></div>
      <div class="timeline-spacer"></div>
    `;

    row.querySelector(".timeline-card").addEventListener("click", () => openDetail(item));
    wrap.appendChild(row);
  });

  window.__renderIcons?.();

  // newly injected [data-animate] items need the observer main.js already set up on DOMContentLoaded;
  // re-run a lightweight version here since these nodes were added after that pass.
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          el.style.transitionDelay = `${el.dataset.delay || 0}ms`;
          el.style.transitionDuration = `${el.dataset.duration || 800}ms`;
          el.classList.add("in-view");
          io.unobserve(el);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
  );
  wrap.querySelectorAll("[data-animate]").forEach((el) => io.observe(el));
}

document.addEventListener("DOMContentLoaded", render);
