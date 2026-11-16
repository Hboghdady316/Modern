// Blog posts, open source list, contribution heatmap (port of components/sections/blog-section.tsx)

const blogPosts = [
  {
    id: 1,
    title: "The Future of Web Development: WebAssembly and Beyond",
    excerpt: "Exploring how WebAssembly is revolutionizing web performance and opening new possibilities for web applications.",
    date: "2024-01-15",
    readTime: "8 min read",
    tags: ["WebAssembly", "Performance", "Future Tech"],
    image: "assets/placeholder.svg",
  },
  {
    id: 2,
    title: "Building Immersive 3D Experiences with Three.js",
    excerpt: "A comprehensive guide to creating stunning 3D web experiences using Three.js and modern web technologies.",
    date: "2024-01-10",
    readTime: "12 min read",
    tags: ["Three.js", "3D", "WebGL"],
    image: "assets/placeholder.svg",
  },
  {
    id: 3,
    title: "AI-Powered Development: Tools That Are Changing the Game",
    excerpt: "How artificial intelligence is transforming the development workflow and what it means for developers.",
    date: "2024-01-05",
    readTime: "6 min read",
    tags: ["AI", "Development", "Tools"],
    image: "assets/placeholder.svg",
  },
];

const openSourceProjects = [
  { name: "react-3d-carousel", description: "A performant 3D carousel component for React applications", stars: 234, language: "TypeScript" },
  { name: "webgl-particle-system", description: "High-performance particle system using WebGL", stars: 156, language: "JavaScript" },
  { name: "ai-code-assistant", description: "VS Code extension for AI-powered code completion", stars: 89, language: "TypeScript" },
];

function badge(text) {
  return `<span class="badge">${text}</span>`;
}

function initObserver(container) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.style.transitionDelay = `${el.dataset.delay || 0}ms`;
        el.style.transitionDuration = `${el.dataset.duration || 600}ms`;
        el.classList.add("in-view");
        io.unobserve(el);
      });
    },
    { threshold: 0.15 },
  );
  container.querySelectorAll("[data-animate]").forEach((el) => io.observe(el));
}

function renderPosts() {
  const wrap = document.getElementById("blog-posts");
  if (!wrap) return;

  blogPosts.forEach((post, index) => {
    const el = document.createElement("div");
    el.dataset.animate = "fade-up-sm";
    el.dataset.delay = String(index * 100);
    el.dataset.duration = "600";
    el.innerHTML = `
      <div class="card glass-morphism" style="border:1px solid rgba(255,255,255,0.2);">
        <div class="blog-post-grid">
          <img class="blog-post-img" src="${post.image}" alt="${post.title}" />
          <div class="blog-post-body">
            <h4 class="blog-post-title">${post.title}</h4>
            <p class="blog-post-excerpt">${post.excerpt}</p>
            <div class="blog-post-meta">
              <span><span data-lucide="calendar"></span>${new Date(post.date).toLocaleDateString()}</span>
              <span><span data-lucide="clock"></span>${post.readTime}</span>
            </div>
            <div class="blog-post-tags">${post.tags.map(badge).join("")}</div>
            <button class="btn btn-sm btn-outline-cyan glass-morphism">
              Read More<span data-lucide="external-link"></span>
            </button>
          </div>
        </div>
      </div>
    `;
    wrap.appendChild(el);
  });

  initObserver(wrap);
}

function renderOss() {
  const wrap = document.getElementById("oss-list");
  if (!wrap) return;

  openSourceProjects.forEach((project, index) => {
    const el = document.createElement("div");
    el.dataset.animate = "fade-right-sm";
    el.dataset.delay = String(index * 100);
    el.dataset.duration = "600";
    el.innerHTML = `
      <div class="card glass-morphism" style="border:1px solid rgba(255,255,255,0.2);">
        <div class="oss-card-body">
          <div class="oss-head">
            <h4>${project.name}</h4>
            <div class="oss-stars">⭐ ${project.stars}</div>
          </div>
          <p class="oss-desc">${project.description}</p>
          <div class="oss-foot">
            ${badge(project.language)}
            <button class="btn btn-sm btn-ghost" style="color:#c084fc;">View on GitHub</button>
          </div>
        </div>
      </div>
    `;
    wrap.appendChild(el);
  });

  initObserver(wrap);
}

function renderHeatmap() {
  const grid = document.getElementById("heatmap");
  if (!grid) return;
  for (let i = 0; i < 365; i++) {
    const cell = document.createElement("div");
    const r = Math.random();
    const bg = r > 0.7 ? "#4ade80" : r > 0.5 ? "rgba(74,222,128,0.6)" : r > 0.3 ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.1)";
    cell.className = "heatmap-cell";
    cell.style.background = bg;
    grid.appendChild(cell);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderPosts();
  renderOss();
  renderHeatmap();
  window.__renderIcons?.();
});
