import { createRandomPositions } from './galaxy-layout.js';

// A selectable planet view remains available even when WebGL cannot render.
export function createFallbackGalaxy(container, { projects, getLayout, onSelect }) {
  container.replaceChildren();
  const map = document.createElement('div');
  map.className = 'galaxy-map-fallback';
  map.setAttribute('aria-label', 'Design category planets');
  container.appendChild(map);
  let filter = 'all';
  let scattered = null;
  let previousNarrow;
  function render() {
    const narrow = container.clientWidth < 600;
    if (previousNarrow !== narrow) scattered = null;
    previousNarrow = narrow;
    const selected = projects.filter(project => filter === 'all' || project.category === filter);
    if (!scattered) scattered = createRandomPositions(projects.length, narrow);
    map.replaceChildren();
    selected.forEach(project => {
      const index = projects.indexOf(project);
      const [x, y] = selected.length === 1 ? [0, 0] : getLayout() === 'random' ? scattered[index]
        : narrow ? [index % 2 ? 1 : -1, 1.8 - Math.floor(index / 2) * 1.8] : project.position;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'fallback-planet';
      button.style.left = `${50 + x * (narrow ? 24 : 11)}%`;
      button.style.top = `${50 - y * 17}%`;
      button.style.setProperty('--planet-color', project.color);
      const orb = document.createElement('span'); orb.className = 'fallback-planet-orb'; orb.setAttribute('aria-hidden', 'true');
      const label = document.createElement('span'); label.className = 'fallback-planet-label'; label.textContent = project.name;
      button.append(orb, label);
      button.addEventListener('click', () => onSelect(project));
      map.appendChild(button);
    });
  }
  const observer = new ResizeObserver(render); observer.observe(container);
  render();
  return {
    setFilter(value) { filter = value; render(); },
    setArrangement() { if (getLayout() === 'random') scattered = null; render(); },
    dispose() { observer.disconnect(); },
  };
}
