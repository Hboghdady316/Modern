import { homeSectionVisible } from './home-layout.js';
import { siteContent } from './site-content.js';
import { ordered, card } from './work-cards.js';
const group = document.getElementById('featured-work');
if (group) {
    const featured = ordered.filter(p => p.featuredOrder > 0);
    group.append(...(featured.length ? featured : ordered).slice(0, 3).map(card));
    group.closest('section').hidden = !ordered.length || !homeSectionVisible(siteContent.settings, 'featured');
}
