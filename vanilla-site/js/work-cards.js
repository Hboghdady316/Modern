import { siteContent, previewLink } from './site-content.js';

export const projects = new Map();
for (const category of siteContent.categories) {
    for (const project of category.projects) {
        if (!projects.has(project.id)) projects.set(project.id, { ...project, groups: [] });
        projects.get(project.id).groups.push(category);
    }
}
export const ordered = [...projects.values()].sort((a, b) => (a.featuredOrder || Infinity) - (b.featuredOrder || Infinity) || 0);
export const asset = (value = '') => value.replace(/^\.\.\//, '');
export function element(tag, text) {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    return node;
}
export function link(href, text) {
    const node = element('a', text);
    node.href = previewLink(href);
    return node;
}
export function imageFor(project) {
    const image = element('img');
    image.src = asset(project.image) || 'assets/placeholder.svg';
    image.onerror = () => { image.onerror = null; image.src = 'assets/placeholder.svg'; };
    image.alt = project.alt || project.title;
    image.loading = 'lazy';
    image.width = 600; image.height = 450;
    return image;
}
export function card(project) {
    const article = element('article');
    article.className = 'work-card';
    const a = link(`project.html?id=${encodeURIComponent(project.id)}`, '');
    a.append(imageFor(project), element('h2', project.title), element('p', project.groups.map(c => c.name).join(' · ')));
    article.append(a);
    return article;
}
