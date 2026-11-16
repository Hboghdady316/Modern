import { createRandomPositions } from './galaxy-layout.js';

// Shared interactive planet map for project categories and skills.
export function createFallbackGalaxy(container, {
  projects, getLayout, onSelect, label = 'Design category planets', labelFor = item => item.name,
}) {
  container.replaceChildren();
  const map = document.createElement('div');
  map.className = 'galaxy-map-fallback';
  const grid = projects.length > 6;
  if (grid) map.classList.add('galaxy-grid-fallback');
  map.setAttribute('aria-label', label);
  container.appendChild(map);
  let filter = 'all';
  let scattered = null;
  let previousNarrow;
  function render() {
    const narrow = container.clientWidth < 600;
    if (previousNarrow !== narrow) scattered = null;
    previousNarrow = narrow;
    const selected = projects.filter(project => filter === 'all' || project.category === filter);
    if (getLayout() === 'random' && !scattered) {
      if (grid) {
        // Large collections shuffle their slots instead of squeezing into six positions.
        scattered = projects.map((_, index) => index);
        for (let i = scattered.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [scattered[i], scattered[j]] = [scattered[j], scattered[i]];
        }
      } else scattered = createRandomPositions(projects.length, narrow);
    }
    map.replaceChildren();
    if (grid && getLayout() === 'random') selected.sort((a, b) => scattered[projects.indexOf(a)] - scattered[projects.indexOf(b)]);
    selected.forEach(project => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'fallback-planet';
      if (!grid) {
        const index = projects.indexOf(project);
        const [x, y] = selected.length === 1 ? [0, 0] : getLayout() === 'random' ? scattered[index]
          : narrow ? [index % 2 ? 1 : -1, 1.8 - Math.floor(index / 2) * 1.8] : [(index % 3 - 1) * 2.2, index < 3 ? 1.25 : -1.25];
        button.style.left = `${50 + x * (narrow ? 24 : 11)}%`;
        button.style.top = `${50 - y * 17}%`;
      }
      button.style.setProperty('--planet-color', project.color);
      const orb = document.createElement('span'); orb.className = 'fallback-planet-orb'; orb.setAttribute('aria-hidden', 'true');
      const label = document.createElement('span'); label.className = 'fallback-planet-label'; label.textContent = labelFor(project);
      button.append(orb, label);
      button.addEventListener('click', () => onSelect(project));
      map.appendChild(button);
    });
  }
  const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => {
    if (previousNarrow !== (container.clientWidth < 600)) render();
  }) : null;
  if (observer) observer.observe(container);
  else window.addEventListener('resize', render);
  render();
  return {
    setFilter(value) { filter = value; render(); },
    setArrangement() { if (getLayout() === 'random') scattered = null; render(); },
    dispose() { observer?.disconnect(); if (!observer) window.removeEventListener('resize', render); },
  };
}
