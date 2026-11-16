import { styleSelects } from "./select-menu.js";
import { siteContent, isPreview, previewLink } from './site-content.js';
import { ordered, element, card } from './work-cards.js';

const page = document.body.dataset.portfolioPage;
if (isPreview) {
    for (const anchor of document.querySelectorAll('a[href]')) anchor.href = previewLink(anchor.getAttribute('href'));
}
if (page === 'work') {
    const filter = document.getElementById('work-filter'), grid = document.getElementById('work-grid');
    for (const category of siteContent.categories) {
        const option = element('option', category.name); option.value = category.id; filter.append(option);
    }
    function render() {
        const shown = ordered.filter(p => !filter.value || p.groups.some(c => c.id === filter.value));
        grid.replaceChildren(...shown.map(card));
        document.getElementById('work-empty').hidden = shown.length > 0;
    }
    const galaxy = document.getElementById('galaxy-link');
    galaxy.hidden = !siteContent.categories.some(category => category.visible !== false) || siteContent.settings.sections.projects === false;
    styleSelects();
    filter.addEventListener('change', render);
    render();
}
