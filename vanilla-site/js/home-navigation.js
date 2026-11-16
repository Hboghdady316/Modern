// Fragment positions can change when the database-driven homepage renders.
const sections = new Set(['about', 'projects', 'services', 'experience', 'learning', 'featured', 'skills', 'contact']);
let ready;
let navigation = 0;

function alignSection() {
    const hash = location.hash;
    const request = ++navigation;
    if (!sections.has(hash.slice(1))) return;
    ready ??= Promise.allSettled([
        document.readyState === 'loading'
            ? new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, { once: true }))
            : Promise.resolve(),
        import('./timeline.js'), import('./galaxy.js'), import('./services.js'), import('./featured.js'), import('./widgets.js'), import('./skills.js'),
    ]);
    ready.then(() => {
        requestAnimationFrame(() => requestAnimationFrame(() => {
            if (navigation !== request || location.hash !== hash) return;
            const section = document.getElementById(hash.slice(1));
            if (section && !section.hidden) section.scrollIntoView({ block: 'start', behavior: 'instant' });
        }));
    });
}
window.addEventListener('hashchange', alignSection);
alignSection();
