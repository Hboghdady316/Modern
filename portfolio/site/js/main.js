import { whenReady } from "./site-content.js";
// Navigation, theme toggle, mobile menu, scroll-reveal system (replaces framer-motion whileInView / animate)

function renderIcons() {
  if (window.lucide) window.lucide.createIcons();
}

// Content is readable before JavaScript or optional animation libraries load.
whenReady(renderIcons);
document.getElementById('optional-icons')?.addEventListener('load', renderIcons);

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
