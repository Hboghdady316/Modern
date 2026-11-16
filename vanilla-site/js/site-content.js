import { homeSectionOrder, homeSectionVisible } from './home-layout.js';
import "./site-header.js";
export const isPreview = new URLSearchParams(location.search).get('preview') === '1';
export function previewLink(href) {
    if (!isPreview) return href;
    const url = new URL(href, location.href);
    if (url.origin !== location.origin) return href;
    url.searchParams.set('preview', '1');
    return url.href;
}
const endpoint = new URL('../data/content.json', import.meta.url);
if (isPreview) endpoint.searchParams.set('preview', '1');
async function loadSiteContent() {
    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            const response = await fetch(endpoint, { cache: 'no-store', signal: AbortSignal.timeout(4000) });
            if (isPreview && response.status === 401) {
                const message = document.createElement('p');
                message.className = 'site-content-notice';
                message.textContent = 'Sign in to the owner admin panel to view this draft.';
                document.querySelector('main')?.replaceChildren(message);
                throw new Error('Draft sign-in required.');
            }
            if (!response.ok) throw new Error('Content request failed.');
            return await response.json();
        } catch (error) {
            if (error.message === 'Draft sign-in required.') throw error;
            if (!attempt) continue;
            const notice = document.createElement('div');
            notice.className = 'site-content-notice';
            notice.setAttribute('role', 'alert');
            notice.append('Some page content could not load. ');
            const retry = document.createElement('button');
            retry.type = 'button';
            retry.className = 'project-action';
            retry.textContent = 'Try again';
            retry.addEventListener('click', () => location.reload());
            notice.append(retry);
            document.getElementById('site-header')?.after(notice);
            const timelineStatus = document.querySelector('#timeline-items .section-loading');
            if (timelineStatus) timelineStatus.textContent = 'Work experience could not load.';
            const galaxyStatus = document.getElementById('galaxy-layout-status');
            if (galaxyStatus) galaxyStatus.textContent = 'Project categories could not load.';
            throw error;
        }
    }
}
const initialContent = document.getElementById('initial-site-content');
export const siteContent = initialContent ? JSON.parse(initialContent.textContent) : await loadSiteContent();
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
    if (!document.body.dataset.category && !document.body.dataset.portfolioPage) document.title = p.siteTitle || `${p.name} — ${p.role}`;
    const set = (selector, text) => document.querySelectorAll(selector).forEach(element => { element.textContent = text; });
    set('.hero-role', p.role);
    if (isPreview) for (const anchor of document.querySelectorAll('a[href]')) {
        const href = anchor.getAttribute('href');
        if (!href.startsWith('#')) anchor.href = previewLink(href);
    }
    document.querySelectorAll('a[href="#cv-download"]').forEach(link => { link.hidden = !p.resumeUrl; });
    set('[data-availability]', p.availability || '');
    for (const a of document.querySelectorAll('[data-contact-email]')) { a.href = `mailto:${p.email}`; a.textContent = p.email; }
    for (const a of document.querySelectorAll('[data-booking]')) { a.hidden = !p.bookingUrl; if (p.bookingUrl) a.href = p.bookingUrl; }
    const photoUrl = p.photoUrl ? new URL(p.photoUrl, new URL('../', import.meta.url)).href : '';
    for (const image of document.querySelectorAll('[data-profile-portrait]')) {
        const fallback = image.parentElement.querySelector('[data-portrait-fallback]');
        if (!photoUrl) continue;
        image.addEventListener('load', () => { image.hidden = false; fallback.hidden = true; }, { once: true });
        image.addEventListener('error', () => { image.hidden = true; fallback.hidden = false; }, { once: true });
        if (image.getAttribute('src') !== photoUrl) image.src = photoUrl;
        else if (image.complete && !image.naturalWidth) { image.hidden = true; fallback.hidden = false; }
    }
    for (const cv of document.querySelectorAll('[data-header-cv], [data-footer-cv]')) {
        if (!p.resumeUrl) continue;
        cv.href = new URL(p.resumeUrl, new URL('../', import.meta.url)).href;
        cv.hidden = false;
    }
    const extras = document.getElementById('about-extras');
    if (extras) {
        for (const text of [p.aiApproach, ...(p.qualifications || []), ...(p.testimonials || [])].filter(Boolean)) {
            const item = document.createElement('p'); item.textContent = text; extras.append(item);
        }
    }
    set('.nav-logo, .hero-name, .wordmark', p.name);
    set('.hero-sub', p.tagline);
    set('#about > .container > .section-head .section-desc', p.bio);
    set('#projects .section-title', siteContent.settings.galaxyTitle);
    set('#projects .section-desc', siteContent.settings.galaxyDescription);
    set('.creator-line', `${p.name} · ${p.role} · ${p.location}`);
    set('[data-site-copyright]', `© ${new Date().getFullYear()} ${p.name}. All rights reserved.`);
    set('.contact-panel p:not(.eyebrow)', `Connect with ${p.name} about your next design project.`);
    const contactRows = document.querySelectorAll('.contact-info-row');
    [p.email, p.location].forEach((text, index) => {
        if (contactRows[index]) {
            [...contactRows[index].childNodes].filter(node => node.nodeType === Node.TEXT_NODE).forEach(node => node.remove());
            contactRows[index].append(document.createTextNode(text));
        }
    });
    const links = document.querySelector('.contact-links');
    if (links) {
        links.replaceChildren();
        [[p.email, `mailto:${p.email}`], ...p.socials.filter(s => s.url).map(s => [s.name, s.url])].forEach(([label, href]) => {
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
    const home = document.getElementById('homepage-sections');
    if (home) {
        const order = homeSectionOrder(siteContent.settings);
        const sections = order.map(id => home.querySelector(':scope > #' + id)).filter(Boolean);
        if (sections.some((section, index) => home.children[index] !== section)) home.append(...sections);
        for (const section of sections) {
            if (['services', 'featured'].includes(section.id)) continue; // Their renderers also check for content.
            section.hidden = !homeSectionVisible(siteContent.settings, section.id);
        }
    }
    for (const a of document.querySelectorAll('[data-section-link]')) {
        a.hidden = !homeSectionVisible(siteContent.settings, a.dataset.sectionLink);
    }
    const resume = document.querySelector('#cv-download');
    if (resume) {
        resume.disabled = !p.resumeUrl;
        resume.title = p.resumeUrl ? 'Open resume' : 'Resume coming soon';
        if (p.resumeUrl) resume.addEventListener('click', () => { location.href = p.resumeUrl; });
    }
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

if (!isPreview) {
    const count = event => {
        if (navigator.doNotTrack === '1' || navigator.globalPrivacyControl) return;
        fetch('/api/metric', { method: 'POST', body: event, keepalive: true }).catch(() => {});
    };
    if (['work', 'project'].includes(document.body.dataset.portfolioPage) || document.body.dataset.category) count('portfolio_visit');
    document.addEventListener('click', event => {
        const target = event.target.closest('a,button');
        if (!target) return;
        if (target.matches('#cv-download') && siteContent.profile.resumeUrl) count('cv_click');
        if (target.matches('[data-booking], a[href^="mailto:"], a[href$="#contact"], a[href*="contact.html"]')) count('contact_action');
    });
}
