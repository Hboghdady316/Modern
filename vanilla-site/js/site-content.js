const response = await fetch(new URL('../data/content.json', import.meta.url), { cache: 'no-store' });
if (!response.ok)
    throw new Error('Website content could not be loaded.');
export const siteContent = await response.json();
export function whenReady(callback) {
    if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', callback, { once: true });
    else
        callback();
}
export function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}
export function applySiteContent() {
    const p = siteContent.profile;
    document.title = `${p.name} — ${document.body.dataset.category ? 'Design Portfolio' : p.role}`;
    const set = (selector, text) => document.querySelectorAll(selector).forEach(element => { element.textContent = text; });
    set('.nav-logo, .hero-name, .wordmark', p.name);
    set('.hero-sub', p.tagline);
    set('#about .section-head .section-desc', p.bio);
    set('#projects .section-title', siteContent.settings.galaxyTitle);
    set('#projects .section-desc', siteContent.settings.galaxyDescription);
    set('.creator-line', `${p.name} · ${p.role} · ${p.location}`);
    set('.footer-copy, .footer > span', `© ${new Date().getFullYear()} ${p.name} · Design portfolio`);
    set('.contact-panel p:not(.eyebrow)', `Connect with ${p.name} about your next design project.`);
    const contactRows = document.querySelectorAll('.contact-info-row');
    [p.email, p.phone, p.location].forEach((text, index) => {
        if (contactRows[index]) {
            [...contactRows[index].childNodes].filter(node => node.nodeType === Node.TEXT_NODE).forEach(node => node.remove());
            contactRows[index].append(document.createTextNode(text));
        }
    });
    const tel = `tel:${p.phone.replace(/[^+\d]/g, '')}`;
    const links = document.querySelector('.contact-links');
    if (links) {
        links.replaceChildren();
        [[p.email, `mailto:${p.email}`], [p.phone, tel], ...p.socials.filter(s => s.url).map(s => [s.name, s.url])].forEach(([label, href]) => {
            const a = document.createElement('a');
            a.textContent = label;
            a.href = href;
            if (href.startsWith('http')) {
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
            }
            links.appendChild(a);
        });
    }
    document.querySelectorAll('.ai-bubble').forEach(element => { element.textContent = `Have a question about ${p.name}’s work? Send a message using the form.`; });
    document.querySelectorAll('.ai-suggestions .badge').forEach((element, index) => { element.textContent = [`Tell me about ${p.name}’s experience`, 'Discuss a design project', 'Request a meeting'][index] || ''; });
    for (const [id, visible] of Object.entries(siteContent.settings.sections)) {
        const section = document.getElementById(id);
        if (section)
            section.hidden = !visible;
        document.querySelectorAll(`a[href="#${id}"]`).forEach(a => { a.hidden = !visible; });
    }
    const activity = document.getElementById('github-widget-card');
    if (activity)
        activity.parentElement.hidden = !siteContent.settings.showActivityWidget;
    const learning = document.getElementById('learning-list');
    if (learning)
        learning.closest('.card').parentElement.hidden = !siteContent.settings.showLearningWidget;
    const resume = document.querySelector('#home .hero-cta button:nth-child(2)');
    if (resume) {
        resume.disabled = !p.resumeUrl;
        resume.title = p.resumeUrl ? 'Open resume' : 'Resume coming soon';
        if (p.resumeUrl)
            resume.addEventListener('click', () => window.open(p.resumeUrl, '_blank', 'noopener'));
    }
    document.querySelector('#home .hero-cta button:first-child')?.addEventListener('click', () => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' }));
}
whenReady(applySiteContent);

// Refresh open previews after a successful save in the same-origin local admin.
// Only a revision notification is stored; content continues to come from disk.
let refreshPending = false;
function refreshSavedContent() {
    if (refreshPending) return;
    refreshPending = true;
    window.location.reload();
}
if ('BroadcastChannel' in window) {
    const channel = new BroadcastChannel('galaxy-content');
    channel.addEventListener('message', event => { if (event.data?.type === 'saved') refreshSavedContent(); });
}
window.addEventListener('storage', event => { if (event.key === 'galaxy-content-update' && event.newValue) refreshSavedContent(); });
