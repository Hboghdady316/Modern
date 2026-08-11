// Contact form + social links (port of components/sections/contact-section.tsx)
import { showToast } from "./main.js";

const socials = [
  { name: "GitHub", icon: "🐙", cls: "gh" },
  { name: "LinkedIn", icon: "💼", cls: "li" },
  { name: "Twitter", icon: "🐦", cls: "tw" },
  { name: "Discord", icon: "🎮", cls: "dc" },
];

function renderSocials() {
  const wrap = document.getElementById("social-links");
  if (!wrap) return;
  socials.forEach((s) => {
    const a = document.createElement("a");
    a.href = "#";
    a.className = `social-link ${s.cls}`;
    a.innerHTML = `<span style="font-size:1.1rem;">${s.icon}</span><span>${s.name}</span>`;
    a.addEventListener("click", (e) => e.preventDefault());
    wrap.appendChild(a);
  });
}

function initMic() {
  const micBtn = document.getElementById("mic-toggle");
  if (!micBtn) return;
  let recording = false;

  function render() {
    micBtn.classList.toggle("recording", recording);
    micBtn.innerHTML = recording ? '<span data-lucide="mic"></span>' : '<span data-lucide="mic-off"></span>';
    window.__renderIcons?.();
  }
  render();

  micBtn.addEventListener("click", () => {
    recording = !recording;
    render();
    if (recording) {
      showToast({ title: "Voice input activated 🎤", description: "Speak your message and I'll transcribe it for you!" });
    }
  });
}

function initForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    await new Promise((resolve) => setTimeout(resolve, 1000));

    showToast({ title: "Message sent! 🚀", description: "Thanks for reaching out. I'll get back to you soon!" });
    form.reset();
    submitBtn.disabled = false;
  });
}

function initSuggestionBadges() {
  document.querySelectorAll(".ai-suggestions .badge").forEach((b) => {
    b.style.cursor = "pointer";
    b.addEventListener("click", () => {
      document.getElementById("cf-message").value = b.textContent;
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderSocials();
  initMic();
  initForm();
  initSuggestionBadges();
});
