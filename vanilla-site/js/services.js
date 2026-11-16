import { homeSectionVisible } from './home-layout.js';
import { serviceFields } from './service-content.js';
import { siteContent } from './site-content.js';
import { element, link } from './work-cards.js';

const services = (siteContent.profile.services || []).map(serviceFields).filter(service => service.title.trim());
for (const list of document.querySelectorAll('[data-service-cards]')) {
    const compact = list.hasAttribute('data-compact');
    for (const [index, { title, description, process }] of services.entries()) {
        const card = element('article');
        card.className = 'project-panel service-card';
        const number = element('span', String(index + 1).padStart(2, '0'));
        number.className = 'service-number';
        number.setAttribute('aria-hidden', 'true');
        const heading = element(compact ? 'h3' : 'h2', title);
        heading.className = 'font-sora';
        card.append(number, heading);
        if (description) card.append(element('p', description));
        if (!compact && process) {
            const how = element('div');
            how.className = 'service-process';
            how.append(element('strong', 'How we’ll work'), element('p', process));
            card.append(how);
        }
        if (!compact) {
            const actions = element('div');
            actions.className = 'project-actions';
            const work = link('work.html', 'Browse work'), inquire = link('contact.html', 'Get in touch');
            work.className = inquire.className = 'project-action';
            actions.append(work, inquire);
            card.append(actions);
        }
        list.append(card);
    }
    if (compact) {
        const section = document.getElementById('services');
        section.hidden = !services.length || !homeSectionVisible(siteContent.settings, 'services');
    }
    else document.getElementById('services-empty').hidden = Boolean(services.length);
}
