import { siteContent, isPreview, previewLink } from './site-content.js';
import { projects, ordered, asset, element, link, imageFor, card } from './work-cards.js';

const project = projects.get(new URLSearchParams(location.search).get('id'));
const byId = id => document.getElementById(id);
const detail = byId('project-detail');
const actions = byId('project-actions');
const sections = byId('project-sections');
const viewer = byId('project-viewer');
const viewerImage = byId('viewer-image');

viewerImage.addEventListener('load', () => {
    viewer.classList.toggle('project-viewer-tall', viewerImage.naturalHeight > viewerImage.naturalWidth);
});

if (isPreview) {
    for (const anchor of document.querySelectorAll('a[href]')) {
        const href = anchor.getAttribute('href');
        if (!href.startsWith('#')) anchor.href = previewLink(href);
    }
}

function make(tag, className, text) {
    const node = element(tag, text);
    node.className = className;
    return node;
}

function action(href, text, primary = false) {
    const anchor = href.startsWith('#') ? element('a', text) : link(href, text);
    if (href.startsWith('#')) anchor.href = href;
    anchor.className = 'project-action' + (primary ? ' project-action-primary' : '');
    return anchor;
}

function section(id, title, parent = detail) {
    const panel = make('section', 'project-panel');
    panel.id = id;
    const heading = make('h2', 'font-sora', title);
    heading.id = id + '-title';
    panel.setAttribute('aria-labelledby', heading.id);
    panel.append(heading);
    parent.append(panel);
    sections.append(action('#' + id, title));
    sections.hidden = false;
    return panel;
}

function artwork(src, label, cover = false) {
    const button = make('button', 'project-artwork');
    button.type = 'button';
    button.setAttribute('aria-label', 'Enlarge ' + label);
    const image = imageFor({ ...project, image: src, alt: label });
    if (cover) {
        image.loading = 'eager';
        image.fetchPriority = 'high';
    }
    const caption = make('span', 'project-artwork-hint', 'Enlarge image');
    caption.setAttribute('aria-hidden', 'true');
    button.append(image, caption);
    button.addEventListener('click', () => {
        viewerImage.src = image.currentSrc || image.src;
        viewerImage.alt = label;
        viewer.showModal();
        viewer.scrollTop = 0;
    });
    return button;
}

if (!project) {
    byId('project-title').textContent = 'Project unavailable';
    actions.append(action('work.html', 'Browse all work', true));
} else {
    const category = project.groups[0];
    const hero = document.querySelector('.project-hero');
    if (/^#[0-9a-f]{6}$/i.test(category?.color)) hero.style.setProperty('--project-glow', category.color);
    byId('project-title').textContent = project.title;
    document.title = `${project.title} | ${siteContent.profile.name}`;
    byId('project-kicker').textContent = project.placeholder ? 'LAYOUT PREVIEW' : category?.name || 'SELECTED WORK';
    const trail = byId('project-trail');
    if (category) trail.append(' / ', link(category.url, category.name));
    const current = element('span', project.title);
    current.setAttribute('aria-current', 'page');
    trail.append(' / ', current);
    if (project.description?.trim()) {
        byId('project-lead').textContent = project.description;
        byId('project-lead').hidden = false;
    }
    const chips = byId('project-chips');
    for (const group of project.groups) chips.append(link(group.url, group.name));
    for (const value of new Set([project.platform, project.format].filter(value => value?.trim()))) chips.append(element('span', value));
    chips.hidden = !chips.childElementCount;

    const showcase = byId('project-showcase');
    if (project.image) {
        const cover = make('figure', 'project-cover-frame');
        cover.append(artwork(project.image, project.alt || project.title, true));
        if (project.caption) cover.append(make('figcaption', 'project-caption', project.caption));
        showcase.append(cover);
        showcase.hidden = false;
    } else if (!project.videoUrl) {
        hero.classList.add('project-hero-text');
    }

    if (project.videoUrl) {
        const panel = section('project-film', 'Watch the project');
        if (/\.(mp4|webm)(?:[?#].*)?$/i.test(project.videoUrl)) {
            const video = element('video');
            video.controls = true;
            video.preload = 'none';
            video.src = asset(project.videoUrl);
            if (project.image) video.poster = asset(project.image);
            video.setAttribute('aria-label', project.title);
            if (project.captions) {
                const track = element('track');
                Object.assign(track, { kind: 'captions', src: asset(project.captions), srclang: 'en', label: 'English' });
                video.append(track);
            }
            panel.append(video);
        } else panel.append(action(asset(project.videoUrl), 'Open video', true));
        actions.append(action('#project-film', 'Watch the project', true));
    }
    for (const [id, heading, images] of [['project-gallery', 'Final artwork', project.galleryImages], ['project-process', 'Behind the work', project.processImages]]) {
        if (!images?.length) continue;
        const panel = section(id, heading);
        const gallery = make('div', 'project-gallery');
        images.forEach((src, index) => gallery.append(artwork(src, `${project.title} — ${heading.toLowerCase()} ${index + 1}`)));
        panel.append(gallery);
    }
    const groups = [
        ['Project at a glance', { client: 'Client', year: 'Year', industry: 'Industry', context: 'Context', role: 'My role' }],
        ['The brief', { objective: 'Objective', audience: 'Audience', deliverables: 'Deliverables' }],
        ['Creative approach', { approach: 'Direction', aiProcess: 'AI contribution', outcomes: 'Outcomes', credits: 'Credits' }],
    ].map(([title, fields]) => [title, Object.entries(fields).filter(([key]) => project[key]?.trim())]).filter(([, fields]) => fields.length);
    if (groups.length) {
        const panel = section('project-story', 'Project details');
        const grid = make('div', 'project-facts-grid');
        for (const [heading, fields] of groups) {
            const group = make('div', 'project-facts');
            group.append(make('h3', 'font-sora', heading));
            const list = element('dl');
            for (const [key, label] of fields) list.append(element('dt', label), element('dd', project[key]));
            group.append(list);
            grid.append(group);
        }
        panel.append(grid);
    }
    const related = ordered.filter(p => p.id !== project.id && p.groups.some(c => project.groups.some(g => g.id === c.id))).slice(0, 3);
    if (related.length) {
        const panel = section('project-related', 'Related work');
        const grid = make('div', 'work-grid');
        grid.append(...related.map(card));
        panel.append(grid);
    }
    const back = action(category?.url || 'work.html', category ? `Back to ${category.name}` : 'Browse all work', !actions.childElementCount && !project.galleryImages?.length);
    if (!actions.childElementCount && project.galleryImages?.length) actions.append(action('#project-gallery', 'Explore the artwork', true));
    actions.append(back);

    const closing = make('aside', 'project-panel project-contact');
    const copy = element('div');
    copy.append(make('p', 'eyebrow', 'LET’S CREATE'), make('h2', 'font-sora', 'Have a project in mind?'));
    closing.append(copy, action('contact.html', 'Get in touch', true));
    detail.append(closing);
}
