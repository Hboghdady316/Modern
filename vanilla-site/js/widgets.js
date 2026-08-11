// Live GitHub widget + Currently Learning widget
// (port of components/widgets/live-github-widget.tsx + currently-learning-widget.tsx)

const learningData = [
  { name: "WebAssembly", progress: 75, icon: "🔧" },
  { name: "Rust", progress: 60, icon: "🦀" },
  { name: "Machine Learning", progress: 45, icon: "🤖" },
  { name: "Blockchain", progress: 30, icon: "⛓️" },
];

function initGithubWidget() {
  const commitsEl = document.getElementById("gh-commits");
  const lastCommitEl = document.getElementById("gh-last-commit");
  if (!commitsEl) return;

  let commits = parseInt(commitsEl.textContent, 10);

  setInterval(() => {
    commits += Math.floor(Math.random() * 3);
    commitsEl.textContent = String(commits);
    lastCommitEl.textContent = Math.random() > 0.5 ? "Just now" : "1 hour ago";
  }, 30000);
}

function initLearningWidget() {
  const list = document.getElementById("learning-list");
  if (!list) return;

  learningData.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "learning-item";
    row.dataset.animate = "fade-left";
    row.dataset.delay = String(index * 100);
    row.dataset.duration = "500";
    row.innerHTML = `
      <div class="learning-row">
        <div class="learning-left"><span style="font-size:1.1rem;">${item.icon}</span>${item.name}</div>
        <span class="learning-pct">${item.progress}%</span>
      </div>
      <div class="progress-track"><div class="progress-fill" data-progress="${item.progress}"></div></div>
    `;
    list.appendChild(row);
  });

  const nextUp = document.createElement("div");
  nextUp.className = "learning-next hover-scale";
  nextUp.innerHTML = `
    <div class="learning-next-head"><span data-lucide="zap" style="color:#facc15;"></span>Next Up:</div>
    <div class="learning-next-body">Exploring quantum computing applications in web development</div>
  `;
  list.appendChild(nextUp);

  window.__renderIcons?.();

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.style.transitionDelay = `${el.dataset.delay || 0}ms`;
        el.style.transitionDuration = `${el.dataset.duration || 500}ms`;
        el.classList.add("in-view");
        const fill = el.querySelector(".progress-fill");
        if (fill) fill.style.width = `${fill.dataset.progress}%`;
        io.unobserve(el);
      });
    },
    { threshold: 0.2 },
  );
  list.querySelectorAll("[data-animate]").forEach((el) => io.observe(el));
}

document.addEventListener("DOMContentLoaded", () => {
  initGithubWidget();
  initLearningWidget();
});
