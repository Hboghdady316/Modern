// Navigation, theme toggle, mobile menu, scroll-reveal system (replaces framer-motion whileInView / animate)

function renderIcons() {
  if (window.lucide) window.lucide.createIcons();
}

// ---- Theme toggle (mirrors next-themes: default dark, toggled + persisted) ----
const root = document.documentElement;
const themeToggleBtn = document.getElementById("theme-toggle");

function applyTheme(theme) {
  root.classList.toggle("light", theme === "light");
  root.classList.toggle("dark", theme !== "light");
  if (themeToggleBtn) {
    themeToggleBtn.innerHTML =
      theme === "light" ? '<span data-lucide="moon"></span>' : '<span data-lucide="sun"></span>';
    renderIcons();
  }
}

const savedTheme = localStorage.getItem("theme") || "dark";
applyTheme(savedTheme);

themeToggleBtn?.addEventListener("click", () => {
  const next = root.classList.contains("light") ? "dark" : "light";
  localStorage.setItem("theme", next);
  applyTheme(next);
});

// ---- Mobile menu toggle ----
const mobileBtn = document.getElementById("mobile-menu-btn");
const mobileMenu = document.getElementById("mobile-menu");
let mobileOpen = false;

function setMobileIcon() {
  mobileBtn.innerHTML = mobileOpen ? '<span data-lucide="x"></span>' : '<span data-lucide="menu"></span>';
  renderIcons();
}
setMobileIcon();

mobileBtn?.addEventListener("click", () => {
  mobileOpen = !mobileOpen;
  mobileMenu.classList.toggle("open", mobileOpen);
  setMobileIcon();
});

mobileMenu?.querySelectorAll("a").forEach((a) => {
  a.addEventListener("click", () => {
    mobileOpen = false;
    mobileMenu.classList.remove("open");
    setMobileIcon();
  });
});

// ---- Nav background on scroll ----
const nav = document.getElementById("nav");
function handleScroll() {
  nav.classList.toggle("scrolled", window.scrollY > 50);
}
window.addEventListener("scroll", handleScroll, { passive: true });
handleScroll();

// ---- Reveal-on-scroll (whileInView equivalent) ----
// Elements inside the hero (#home) animate immediately on load (matches `animate` prop);
// everything else animates once it scrolls into view (matches `whileInView`).
function initReveal() {
  const els = document.querySelectorAll("[data-animate]");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = el.dataset.delay || 0;
          const duration = el.dataset.duration || 800;
          el.style.transitionDelay = `${delay}ms`;
          el.style.transitionDuration = `${duration}ms`;
          el.classList.add("in-view");
          io.unobserve(el);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
  );

  els.forEach((el) => {
    const inHero = el.closest("#home");
    if (inHero) {
      const delay = el.dataset.delay || 0;
      const duration = el.dataset.duration || 800;
      el.style.transitionDelay = `${delay}ms`;
      el.style.transitionDuration = `${duration}ms`;
      requestAnimationFrame(() => el.classList.add("in-view"));
    } else {
      io.observe(el);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderIcons();
  initReveal();
});

// ---- Toasts (replaces useToast / <Toaster />) ----
export function showToast({ title, description, duration = 4000 }) {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = "toast glass-morphism";
  toast.innerHTML = `
    <div class="toast-title">${title}</div>
    ${description ? `<div class="toast-desc">${description}</div>` : ""}
  `;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

window.__showToast = showToast;
window.__renderIcons = renderIcons;
