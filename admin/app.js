import { homeSections, homeSectionOrder, homeSectionVisible } from '/js/home-layout.js';
import { serviceFields } from '/js/service-content.js';
import { styleSelects, focusSelect } from "/js/select-menu.js";
let content, revision, token, section = 'overview', categoryId = 'social-media', projectIndex = 0, experienceIndex = 0, dirty = false;
const draftButton = document.getElementById('save-draft');
const panel = document.getElementById('panel'), saveButton = document.getElementById('save');
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function status(message, error = false) { const el = document.getElementById('status'); el.textContent = message; el.classList.toggle('error', error); }
let saving = false, uploading = false, unpublished = false;
const previewLink = document.getElementById('preview-draft');
function updateControls() {
    const busy = !content || saving || uploading;
    saveButton.disabled = busy || !(dirty || unpublished);
    draftButton.disabled = busy || !dirty;
    const project = content && section === 'projects' && category().projects[projectIndex];
    previewLink.hidden = !content;
    previewLink.href = project ? `/project.html?id=${encodeURIComponent(project.id)}&preview=1` : '/?preview=1';
    const state = document.getElementById('save-state');
    if (content) state.textContent = uploading ? 'Uploading…' : saving ? 'Saving…' : dirty ? 'Unsaved changes' : unpublished ? 'Draft saved · not published' : 'Up to date';
}
function markDirty() { dirty = true; updateControls(); }
function confirmAction(message) { return new Promise(resolve => { const dialog = document.createElement('dialog'); dialog.className = 'confirm-dialog'; dialog.setAttribute('aria-labelledby', 'confirm-title'); dialog.innerHTML = `<form method="dialog"><h2 id="confirm-title">Review this change</h2><p></p><div class="editor-actions"><button class="button secondary" value="cancel">Cancel</button><button class="button danger" value="accept">Continue</button></div></form>`; dialog.querySelector('p').textContent = message; dialog.addEventListener('close', () => { const accepted = dialog.returnValue === 'accept'; dialog.remove(); resolve(accepted); }, { once: true }); document.body.append(dialog); dialog.showModal(); }); }
async function api(url, options = {}) { const response = await fetch(url, { ...options, headers: { 'X-Admin-Token': token, ...options.headers } }); const data = await response.json(); if (!response.ok)
    throw new Error(data.error || 'The request failed.'); return data; }
const field = (label, path, value, type = 'text', help = '') => `<label class="field">${esc(label)}<input type="${type}" data-bind="${path}" value="${esc(value)}"${type === 'email' ? ' autocomplete="email"' : ''}>${help ? `<small>${esc(help)}</small>` : ''}</label>`;
const area = (label, path, value, lines = false) => `<label class="field">${esc(label)}<textarea data-bind="${path}"${lines ? ' data-lines="true"' : ''}>${esc(lines ? value.join('\n') : value)}</textarea></label>`;
const check = (label, path, value) => `<label class="check"><input type="checkbox" data-bind="${path}"${value ? ' checked' : ''}>${esc(label)}</label>`;
const upload = (label, path, accept, help = 'Files up to 30 MB.') => `<label class="field upload-row">${esc(label)}<input type="file" data-upload="${path}" accept="${accept}"><small>${esc(help)}</small></label>`;
const photoTypes = 'image/png,image/jpeg,image/webp,image/gif,image/avif';
const photoSource = value => value.replace(/^\.\.\//, '/').replace(/^assets\//, '/assets/');
function photoPicker(label, path, current, multiple = false) {
    const images = multiple ? current : current ? [current] : [];
    return `<fieldset class="photo-picker"><legend>${esc(label)}</legend>
        ${images.length ? `<div class="photo-previews">${images.map((src, index) => `<div>
            <img src="${esc(photoSource(src))}" alt="${esc(multiple ? `${label} ${index + 1}` : `Current ${label.toLowerCase()}`)}" loading="lazy">
            ${multiple ? `<button type="button" class="button secondary" data-remove-photo="${path}" data-photo-index="${index}" aria-label="Remove ${esc(label.toLowerCase())} ${index + 1}">Remove</button>` : ''}
        </div>`).join('')}</div>` : ''}
        <input type="file" aria-label="${multiple ? 'Add photos to ' + esc(label.toLowerCase()) : 'Choose ' + esc(label.toLowerCase())}" data-upload="${path}" accept="${photoTypes}"${multiple ? ' multiple' : ''}>
        <small>${multiple ? 'Choose one or more photos. Existing photos stay in place.' : images.length ? 'Choose a file to replace this photo.' : 'Choose a photo from your computer.'}</small>
    </fieldset>`;
}
const heading = (title, description) => `<div class="page-heading"><div><h1>${esc(title)}</h1><p>${esc(description)}</p></div></div>`;
function readPath(path) { return path.split('.').reduce((value, key) => value[key], content); }
function writePath(path, value) { const keys = path.split('.'), last = keys.pop(); keys.reduce((item, key) => item[key], content)[last] = value; }
function category() { return content.categories.find(c => c.id === categoryId) || content.categories[0]; }
function categoryPicker() { return `<label class="field">Category<select id="category-picker">${content.categories.map(c => `<option value="${c.id}"${c.id === categoryId ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>`; }
function overview() { const all = content.categories.flatMap(c => c.projects), ready = all.filter(p => !p.placeholder && p.visible); return heading('Dashboard', 'See your portfolio status and recent website activity.') + `<div class="stats"><div class="stat"><span>DESIGN CATEGORIES</span><strong>${content.categories.length}</strong><small>${content.categories.filter(c => c.visible).length} visible planets</small></div><div class="stat"><span>PORTFOLIO PROJECTS</span><strong>${all.length}</strong><small>Across your collections</small></div><div class="stat"><span>READY TO SHOW</span><strong>${ready.length}</strong><small>Visible original projects</small></div><div class="stat"><span>LAYOUT PREVIEWS</span><strong>${all.filter(p => p.placeholder).length}</strong><small>Ready for your artwork</small></div></div><div class="section-heading"><h2>Your galaxy</h2><button class="button secondary" data-action="new-project">+ Add project</button></div><div class="category-grid">${content.categories.map(c => `<article class="category-card"><div class="mini-orbit" data-color="${c.color}"><span></span></div><h3>${esc(c.name)}</h3><p>${c.projects.length} projects · ${c.visible ? 'Visible' : 'Hidden'}</p><button class="button secondary" data-edit-category="${c.id}">Manage collection ↗</button></article>`).join('')}</div><section class="card"><h2>Activity · last 30 days</h2><p id="metrics">Loading totals…</p></section><div class="note"><strong>You’re editing SQLite content.</strong> Save draft to preview privately, or Save & publish to update the website served here.</div>`; }
const profileLists = {
    services: ['Services you offer', 'Service', 'Add the services shown on the homepage and Services page.'],
    qualifications: ['Qualifications', 'Qualification', 'Add training, certifications, or other credentials to About Me.'],
    testimonials: ['Testimonials', 'Testimonial', 'Add approved quotes to About Me.'],
};
function profileList(key) {
    const [title, label, help] = profileLists[key];
    const entries = content.profile[key] || [];
    return `<section class="card settings-group">
        <div class="section-heading"><div><h2>${title}</h2><p class="help">${help}</p></div><button type="button" class="button secondary" data-add-setting="${key}"${entries.length >= 30 ? ' disabled' : ''}>Add ${label.toLowerCase()}</button></div>
        <div class="settings-card-grid">${entries.map((entry, index) => {
            const base = `profile.${key}.${index}`;
            const service = key === 'services' ? serviceFields(entry) : null;
            return `<article class="settings-item"><h3>${label} ${index + 1}</h3>
                ${key === 'services'
                    ? field('Service title', `${base}.title`, service.title) + area('Description', `${base}.description`, service.description) + area('How we’ll work (optional)', `${base}.process`, service.process)
                    : area(label, base, entry)}
                <button type="button" class="button secondary" data-remove-setting="${key}" data-entry-index="${index}" aria-label="Remove ${label.toLowerCase()} ${index + 1}">Remove</button>
            </article>`;
        }).join('') || '<p class="help">Nothing added yet.</p>'}</div>
    </section>`;
}
function siteOptions(p, s) {
    return `<details class="card more-settings" id="site-options"><summary>More website settings</summary>
      <div class="stack">
        ${Object.keys(profileLists).map(profileList).join('')}
        <div class="settings-card-grid">
          <section class="card settings-group"><h2>Creative approach</h2>${area('How you use AI in your work', 'profile.aiApproach', p.aiApproach)}</section>
          <section class="card settings-group"><h2>Search and sharing</h2>
            ${field('Site title', 'profile.siteTitle', p.siteTitle)}
            ${area('Search description', 'profile.siteDescription', p.siteDescription)}
            ${photoPicker('Sharing image', 'profile.shareImage', p.shareImage)}
          </section>
          <section class="card settings-group"><h2>Project Galaxy</h2>
            ${field('Section heading', 'settings.galaxyTitle', s.galaxyTitle)}
            ${area('Galaxy introduction', 'settings.galaxyDescription', s.galaxyDescription)}
            <label class="field">Default planet arrangement<select data-bind="settings.defaultLayout">
              <option value="ordered"${s.defaultLayout === 'ordered' ? ' selected' : ''}>Ordered</option>
              <option value="random"${s.defaultLayout === 'random' ? ' selected' : ''}>Random</option>
            </select></label>
          </section>

        </div>
      </div>
    </details>`;
}
function homepageLayout(settings) {
    const order = homeSectionOrder(settings);
    return `<section class="card settings-group" id="homepage-layout">
      <h2>Homepage layout</h2>
      <p class="help">Move sections up or down to change their order. Turn off any section you want to hide.</p>
      <ol class="layout-list">${order.map((id, index) => `<li>
        <label class="layout-switch"><input type="checkbox" role="switch" data-bind="settings.sections.${id}"${homeSectionVisible(settings, id) ? ' checked' : ''}><span>${homeSections[id]}</span></label>
        <div class="layout-moves">
          <button class="button secondary" type="button" data-move-section="${id}" data-direction="-1" aria-label="Move ${homeSections[id]} up"${index === 0 ? ' disabled' : ''}>↑ Up</button>
          <button class="button secondary" type="button" data-move-section="${id}" data-direction="1" aria-label="Move ${homeSections[id]} down"${index === order.length - 1 ? ' disabled' : ''}>↓ Down</button>
        </div></li>`).join('')}</ol>
    </section>`;
}
function learningEditor() {
    const items = content.learning;
    return `<section class="card settings-group learning-editor">
      <div class="section-heading"><h2>Currently Learning</h2><button class="button secondary" type="button" data-action="new-learning"${items.length >= 30 ? ' disabled' : ''}>Add topic</button></div>
      <p class="help">Choose which topics appear and the order visitors see them.</p>
      <div class="settings-card-grid">${items.map((item, index) => `<article class="settings-item">
        <h3>${esc(item.name)}</h3>
        ${field('Topic', `learning.${index}.name`, item.name)}
        ${field('Progress (0–100)', `learning.${index}.progress`, item.progress, 'number')}
        ${field('Icon', `learning.${index}.icon`, item.icon)}
        <label class="setting-switch"><span>Show this topic</span><input type="checkbox" role="switch" data-bind="learning.${index}.visible"${item.visible !== false ? ' checked' : ''}></label>
        <div class="layout-moves">
          <button class="button secondary" type="button" data-move-learning="${index}" data-direction="-1" aria-label="Move ${esc(item.name)} up"${index === 0 ? ' disabled' : ''}>↑ Up</button>
          <button class="button secondary" type="button" data-move-learning="${index}" data-direction="1" aria-label="Move ${esc(item.name)} down"${index === items.length - 1 ? ' disabled' : ''}>↓ Down</button>
          <button class="button secondary" type="button" data-remove-learning="${index}" aria-label="Remove learning topic ${index + 1}">Remove</button>
        </div></article>`).join('') || '<p class="help">No learning topics yet.</p>'}</div>
      ${area('Next up (optional)', 'settings.learningNext', content.settings.learningNext)}
    </section>`;
}
function profile() { const p = content.profile, s = content.settings; return heading('Website details', 'Your identity, introduction, contact information, and website settings.') + `<div class="stack">${homepageLayout(s)}<section class="card"><h2>Identity & introduction</h2><div class="form-grid">${field('Full name', 'profile.name', p.name)}${field('Professional role', 'profile.role', p.role)}${field('Location', 'profile.location', p.location)}${field('Hero tagline', 'profile.tagline', p.tagline)}<div class="full">${area('About biography', 'profile.bio', p.bio)}</div></div></section><section class="card"><h2>Contact & resume</h2><div class="form-grid">${field('Contact email', 'profile.email', p.email, 'email')}${field('Booking link', 'profile.bookingUrl', p.bookingUrl, 'url')}${field('Availability', 'profile.availability', p.availability)}${photoPicker('Profile photo', 'profile.photoUrl', p.photoUrl)}<div class="full">${field('Resume URL or PDF path', 'profile.resumeUrl', p.resumeUrl, 'text', 'Use an HTTP(S) link or an uploaded PDF. Leave blank to disable the resume button.')}${upload('Upload resume PDF', 'profile.resumeUrl', 'application/pdf')}</div></div>${p.socials.map((social, i) => `<div class="social-row">${field('Link name', `profile.socials.${i}.name`, social.name)}${field(`${social.name} URL`, `profile.socials.${i}.url`, social.url, 'url', 'Leave blank if this profile is not available.')}</div>`).join('')}</section><details class="card more-settings" id="learning-options"><summary>Currently Learning topics</summary>${learningEditor()}</details>${siteOptions(p, s)}</div>`; }
function categories() { const c = category(), i = content.categories.indexOf(c), base = `categories.${i}`; return heading('Galaxy categories', 'Add, edit or remove categories and manage their planet appearance.') + `<div class="toolbar">${categoryPicker()}<button class="button secondary" data-action="new-category">+ Add category</button></div><section class="card"><div class="form-grid"><div>${field('Category name', `${base}.name`, c.name)}<p>Category ID: ${esc(c.id)}</p>${field('Planet color', `${base}.color`, c.color, 'color')}<br>${field('Category icon', `${base}.icon`, c.icon)}<br>${check('Show this planet and collection', `${base}.visible`, c.visible)}</div><div>${photoPicker('Category cover', `${base}.image`, c.image)}</div><div class="full">${area('Category description', `${base}.description`, c.description)}</div><div class="full">${area('Formats / tags (one per line)', `${base}.formats`, c.formats, true)}</div></div><div class="editor-actions"><button class="button secondary" data-action="category-projects">Edit projects in this category ↗</button><button class="button danger" data-action="delete-category">Remove empty category</button><a class="button secondary" href="/${c.url}${c.url.includes('?') ? '&' : '?'}preview=1" target="_blank" rel="noopener">Preview category ↗</a></div></section>`; }
function projectStatus(project, group) {
    if (project.archived) return 'Archived';
    if (project.placeholder) return 'Example';
    return project.visible && group.visible ? 'Ready to show' : 'Hidden';
}
function projects() {
    const group = category(), ci = content.categories.indexOf(group);
    projectIndex = Math.max(0, Math.min(projectIndex, group.projects.length - 1));
    const project = group.projects[projectIndex], base = `categories.${ci}.projects.${projectIndex}`;
    const picker = `<div class="project-picker">${categoryPicker()}
        ${project ? `<label class="field">Project<select id="project-picker">${group.projects.map((item, index) => `<option value="${index}"${index === projectIndex ? ' selected' : ''}>${esc(item.title)} · ${projectStatus(item, group)}</option>`).join('')}</select></label>` : ''}
        <button type="button" class="button secondary" data-action="new-project">Add a project</button></div>`;
    const title = heading('Projects', 'Choose a project, update its details and photos, then preview or publish.');
    if (!project) return title + picker + '<p class="card empty">No projects in this category yet. Select Add a project to get started.</p>';

    return title + picker + `<section class="card project-editor">
        <div class="form-grid">
            <div class="full">${field('Project title', `${base}.title`, project.title)}</div>
            <div class="full">${area('Short description', `${base}.description`, project.description)}</div>
            <div class="full project-cover">${photoPicker('Cover image', `${base}.image`, project.image)}</div>
            <details class="full more-settings" id="project-photos"><summary>More photos</summary>
                <div class="form-grid">
                    ${photoPicker('Gallery photos', `${base}.galleryImages`, project.galleryImages || [], true)}
                    ${photoPicker('Process photos', `${base}.processImages`, project.processImages || [], true)}
                </div>
            </details>
            <div class="full project-visibility">
                <label class="field">Show on website<select id="project-visibility">
                    <option value="example"${project.placeholder && !project.archived ? ' selected' : ''}>Keep as an example</option>
                    <option value="ready"${!project.placeholder && project.visible && !project.archived ? ' selected' : ''}>Ready to show when I publish</option>
                    <option value="hidden"${!project.placeholder && !project.visible && !project.archived ? ' selected' : ''}>Hide from the website</option>
                    ${project.archived ? '<option value="archived" selected>Archived</option>' : ''}
                </select></label>
                ${group.visible ? '' : '<p class="help">This category is hidden. To show this project, turn on the category as well.</p>'}
                <p class="help">Saving a draft keeps your changes private. Publishing updates the website.</p>
            </div>
            <details class="full more-settings" id="project-options"><summary>More project options</summary>
                <div class="form-grid">
                    ${field('Project type', `${base}.platform`, project.platform)}${field('Format', `${base}.format`, project.format)}
                    ${field('Video link', `${base}.videoUrl`, project.videoUrl)}
                    ${upload('Choose a video', `${base}.videoUrl`, 'video/mp4,video/webm')}
                    ${field('Featured position (0 = not featured)', `${base}.featuredOrder`, project.featuredOrder || 0, 'number')}
                    <fieldset><legend>Also show in</legend>${content.categories.filter(item => item.id !== group.id).map(item => `<label class="check"><input type="checkbox" data-extra-category="${esc(item.id)}"${project.extraCategories?.includes(item.id) ? ' checked' : ''}>${esc(item.name)}</label>`).join('')}</fieldset>
                    <label class="field">Move to another category<select id="move-project"><option value="">Choose category</option>${content.categories.filter(item => item.id !== group.id).map(item => `<option value="${esc(item.id)}">${esc(item.name)}</option>`).join('')}</select></label>
                    ${['client','year','industry','context','objective','audience','role','approach','outcomes','deliverables','credits','alt','caption','aiProcess'].map(key => area(key === 'alt' ? 'Image alternative text' : key === 'aiProcess' ? 'AI contribution and process' : key[0].toUpperCase() + key.slice(1), `${base}.${key}`, project[key])).join('')}
                    ${field('Captions link', `${base}.captions`, project.captions)}
                    ${upload('Choose WebVTT captions', `${base}.captions`, '.vtt,text/vtt')}
                    ${check('Archive project', `${base}.archived`, project.archived)}
                </div>
                <div class="editor-actions">
                    <button type="button" class="button secondary" data-action="project-up"${projectIndex === 0 ? ' disabled' : ''}>Move up</button>
                    <button type="button" class="button secondary" data-action="project-down"${projectIndex === group.projects.length - 1 ? ' disabled' : ''}>Move down</button>
                    <button type="button" class="button danger" data-action="delete-project">Remove project</button>
                </div>
            </details>
        </div>
    </section>`;
}
function experience() { experienceIndex = Math.max(0, Math.min(experienceIndex, content.timeline.length - 1)); const item = content.timeline[experienceIndex], base = `timeline.${experienceIndex}`; return heading('Experience', 'Update the timeline on your About page, including achievements and creative tools.') + `<div class="toolbar"><button class="button primary" data-action="new-experience">+ Add experience</button></div><div class="editor-layout"><nav class="item-list" aria-label="Experience entries">${content.timeline.map((item, i) => `<button data-experience="${i}" aria-current="${i === experienceIndex}">${esc(item.title)}<small>${esc(item.company)} · ${esc(item.year)}</small></button>`).join('')}</nav>${item ? `<section class="card"><div class="form-grid">${field('Role title', `${base}.title`, item.title)}${field('Company', `${base}.company`, item.company)}${field('Dates', `${base}.year`, item.year)}${field('Location', `${base}.location`, item.location)}<div class="full">${area('Description', `${base}.description`, item.description)}</div><div class="full">${area('Tools / tags (one per line)', `${base}.technologies`, item.technologies, true)}</div><div class="full">${area('Achievements (one per line)', `${base}.achievements`, item.achievements, true)}</div></div><div class="editor-actions"><button class="button secondary" data-action="experience-up"${experienceIndex === 0 ? ' disabled' : ''}>↑ Move up</button><button class="button secondary" data-action="experience-down"${experienceIndex === content.timeline.length - 1 ? ' disabled' : ''}>↓ Move down</button><button class="button danger" data-action="delete-experience">Remove experience</button></div></section>` : '<div class="card empty">Add an experience entry to start your timeline.</div>'}</div>`; }
function skills() { return heading('Skills & learning', 'Add skills, choose whether to show them on the homepage, and edit learning topics.') + `<div class="stack"><section class="card"><div class="section-heading"><h2>Homepage skills</h2><button class="button secondary" data-action="new-skill">+ Add skill</button></div><label class="setting-switch"><span>Show Skills on the homepage</span><input type="checkbox" role="switch" data-bind="settings.sections.skills"${content.settings.sections.skills ? ' checked' : ''}></label><div class="stack skill-cards">${content.skills.map((item, i) => `<div class="form-grid settings-item">${field('Skill name', `skills.${i}.name`, item.name)}${field('Skill group', `skills.${i}.category`, item.category)}${field('Skill level (0–100)', `skills.${i}.level`, item.level, 'number')}${field('Skill color', `skills.${i}.color`, item.color, 'color')}<div class="full">${area('Skill description', `skills.${i}.description`, item.description)}</div><div class="full"><button class="button danger" data-remove-skill="${i}">Remove ${esc(item.name)}</button></div></div>`).join('')}</div></section>${learningEditor()}</div>`; }
function backups() { return heading('Backups & transfer', 'Every successful save keeps a recovery snapshot. Export your draft or import a saved content file.') + `<div class="stack"><section class="card"><h2>Transfer website content</h2><div class="toolbar"><button class="button secondary" data-action="export">Download content JSON ↓</button><button class="button secondary" data-action="reload">Reload saved website</button></div><label class="field">Import content JSON<input type="file" id="import-content" accept="application/json,.json"><small>Import loads a draft. Review it, then Save changes to apply it.</small></label></section><section class="card"><h2>Recovery snapshots</h2><div id="backup-list" class="backup-list"><p class="help">Loading backups…</p></div></section><div class="note">Loading a snapshot does not immediately change your website. It becomes an editable draft. Saving it creates another backup of the current website.</div></div>`; }
function render() { if (!content)
    return;
    const activeOptions = panel.querySelector('#project-options[open]');
    const photosOpen = panel.querySelector('#project-photos[open]');
    const learningOptions = panel.querySelector('#learning-options[open]');
    const siteOptions = panel.querySelector('#site-options[open]');
    const setup = document.getElementById('more-tools');
    if (setup.querySelector(`[data-section="${section}"]`)) setup.open = true;
    document.querySelectorAll('[data-section]').forEach(button => { if (button.dataset.section === section)
    button.setAttribute('aria-current', 'page');
else
    button.removeAttribute('aria-current'); }); panel.innerHTML = ({ overview, profile, categories, projects, experience, skills, backups })[section]();
    const options = panel.querySelector('#project-options');
    if (photosOpen && panel.querySelector('#project-photos')) panel.querySelector('#project-photos').open = true;
    if (options && activeOptions) options.open = true;
    if (siteOptions && panel.querySelector('#site-options')) panel.querySelector('#site-options').open = true;
    if (learningOptions && panel.querySelector('#learning-options')) panel.querySelector('#learning-options').open = true;
    styleSelects(panel);
    updateControls();
    panel.querySelectorAll('[data-color]').forEach(el => el.style.setProperty('--planet', el.dataset.color)); if (section === 'backups') loadBackups();
    if (section === 'overview') api('/api/metrics').then(({ counts }) => {
        const el = document.getElementById('metrics');
        if (!el) return;
        const labels = { portfolio_visit: 'Work views', contact_action: 'Contact clicks', cv_click: 'CV clicks', inquiry_delivered: 'Delivered inquiries' };
        el.textContent = Object.entries(labels).map(([event, label]) => label + ': ' + (counts.find(row => row.event === event)?.total || 0)).join(' · ');
    }).catch(() => { const el = document.getElementById('metrics'); if (el) el.textContent = 'Totals unavailable.'; }); }
async function loadBackups() { try {
    const data = await api('/api/backups');
    const list = document.getElementById('backup-list');
    if (!list)
        return;
    list.innerHTML = data.backups.length ? data.backups.slice(0, 30).map(id => `<div class="backup-item"><span>${esc(id.slice(0, 23).replace('T', ' '))}</span><button class="button secondary" data-backup="${esc(id)}">Load as draft</button></div>`).join('') : '<p class="help">Your first backup appears after you save a change.</p>';
}
catch (e) {
    status(e.message, true);
} }
function newProject() { const c = category(); c.projects.push({ id: crypto.randomUUID(), title: 'Untitled project', platform: c.formats[0] || 'Design', format: '', description: '', image: `../${c.image}`, placeholder: true, visible: true, videoUrl: '' }); projectIndex = c.projects.length - 1; section = 'projects'; markDirty(); render(); }
function move(list, index, step) { const next = index + step; if (next < 0 || next >= list.length)
    return index; [list[index], list[next]] = [list[next], list[index]]; markDirty(); return next; }
async function action(name) {
    try {
        if (name === 'new-category') {
            if (content.categories.length >= 12) throw Error('The portfolio supports up to 12 categories.');
            const id = 'collection-' + crypto.randomUUID().slice(0, 8);
            const index = content.categories.length;
            content.categories.push({ id, category: id, url: 'portfolio/category.html?id=' + id, name: 'New category',
                description: '', icon: '✦', image: 'assets/placeholder.svg', color: '#bd8cff',
                visible: true, formats: [], projects: [], position: [(index % 3 - 1) * 2, index % 6 < 3 ? 1.25 : -1.25, 0] });
            categoryId = id;
            markDirty(); render(); return;
        }
        if (name === 'delete-category') {
            const current = category();
            if (current.projects.length) throw Error('Remove or reassign its projects before deleting this category.');
            if (content.categories.length === 1) throw Error('Keep at least one category in the editor.');
            if (!await confirmAction('Remove this empty category from the draft?')) return;
            content.categories = content.categories.filter(c => c.id !== current.id);
            for (const project of content.categories.flatMap(c => c.projects))
                if (project.extraCategories) project.extraCategories = project.extraCategories.filter(id => id !== current.id);
            categoryId = content.categories[0].id; projectIndex = 0;
            markDirty(); render(); return;
        }
        if (name === 'new-project')
            return newProject();
        if (name === 'new-skill') {
            if (content.skills.length >= 30) throw Error('You can have up to 30 skills.');
            content.skills.unshift({ name: 'New skill', category: 'Design', level: 50, color: '#bd8cff', description: '' });
            content.settings.sections.skills = true;
            markDirty();
            render();
            panel.querySelector('[data-bind="skills.0.name"]')?.focus();
            status('New skill added at the top. Publish to show Skills on the homepage.');
            return;
        }
        if (name === 'new-learning') {
            if (content.learning.length >= 30) return;
            const index = content.learning.push({ name: 'New learning topic', icon: '✧', progress: 0, visible: true }) - 1;
            markDirty();
            render();
            panel.querySelector(`[data-bind="learning.${index}.name"]`)?.focus();
            return;
        }
        if (name === 'category-projects') {
            section = 'projects';
            projectIndex = 0;
        }
        if (name === 'project-up' || name === 'project-down')
            projectIndex = move(category().projects, projectIndex, name === 'project-up' ? -1 : 1);
        if (name === 'experience-up' || name === 'experience-down')
            experienceIndex = move(content.timeline, experienceIndex, name === 'experience-up' ? -1 : 1);
        if (name === 'delete-project') {
            if (!await confirmAction('Remove this project from your draft? Save changes to apply the removal.'))
                return;
            category().projects.splice(projectIndex, 1);
            markDirty();
        }
        if (name === 'new-experience') {
            content.timeline.push({ id: crypto.randomUUID(), year: 'Present', title: 'New role', company: '', location: '', description: '', technologies: [], achievements: [] });
            experienceIndex = content.timeline.length - 1;
            markDirty();
        }
        if (name === 'delete-experience') {
            if (!await confirmAction('Remove this experience entry from your draft?'))
                return;
            content.timeline.splice(experienceIndex, 1);
            markDirty();
        }
        if (name === 'export') {
            const url = URL.createObjectURL(new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' }));
            const a = document.createElement('a');
            a.href = url;
            a.download = 'galaxy-content.json';
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            return;
        }
        if (name === 'reload') {
            if (dirty && !await confirmAction('Discard unsaved edits and reload the saved website?'))
                return;
            await load();
            return;
        }
        render();
    }
    catch (e) {
        status(e.message, true);
    }
}
async function load() {
    const data = await api('/api/content');
    content = data.content;
    revision = data.revision;
    unpublished = data.unpublished;
    if (!content.categories.some(group => group.id === categoryId)) categoryId = content.categories[0].id;
    dirty = false;
    document.getElementById('owner-tools').hidden = false;
    document.getElementById('owner-actions').hidden = false;
    render();
}
async function save(publish) {
    if (saving || uploading || !content) return false;
    saving = true;
    updateControls();
    const snapshot = JSON.stringify(content);
    try {
        const result = await api('/api/content' + (publish ? '?publish=1' : ''), { method: 'PUT', headers: { 'Content-Type': 'application/json', 'If-Match': revision }, body: snapshot });
        revision = result.revision;
        unpublished = result.unpublished;
        if (publish && 'BroadcastChannel' in window) {
            const channel = new BroadcastChannel('galaxy-content');
            channel.postMessage({ type: 'saved', revision });
            setTimeout(() => channel.close(), 100);
        }
        try { if (publish) localStorage.setItem('galaxy-content-update', `${Date.now()}-${revision}`); } catch { /* Another tab can still refresh manually. */ }
        dirty = JSON.stringify(content) !== snapshot;
        status(dirty ? 'Your newest edits still need to be saved.' : publish ? 'Published. Open or refresh the website to see your changes.' : 'Draft saved. Preview it before publishing.');
        return !dirty;
    } catch (error) {
        status(error.message, true);
        return false;
    } finally {
        saving = false;
        updateControls();
    }
}
document.querySelectorAll('[data-section]').forEach(button => button.addEventListener('click', () => { section = button.dataset.section; render(); }));
panel.addEventListener('input', event => { const input = event.target; if (!input.dataset.bind)
    return; let value = input.type === 'checkbox' ? input.checked : input.type === 'number' ? Number(input.value) : input.value; if (input.dataset.lines)
    value = value.split('\n').map(v => v.trim()).filter(Boolean);
    const service = /^profile\.services\.(\d+)\./.exec(input.dataset.bind);
    if (service) {
        const index = Number(service[1]);
        content.profile.services[index] = serviceFields(content.profile.services[index]);
    }
    writePath(input.dataset.bind, value);
    markDirty();
    if (section === 'projects' && input.dataset.bind.endsWith('.title')) {
        const option = document.querySelector('#project-picker option:checked');
        if (option) option.textContent = (value || 'Untitled project') + ' · ' + projectStatus(category().projects[projectIndex], category());
    }
    if (section === 'projects' && input.dataset.bind.endsWith('.archived')) {
        render();
        panel.querySelector('[data-bind$=".archived"]')?.focus();
    }
});
panel.addEventListener('click', event => { const button = event.target.closest('button'); if (!button)
    return;
    if (button.dataset.moveSection) {
        const id = button.dataset.moveSection;
        const order = homeSectionOrder(content.settings);
        const index = order.indexOf(id);
        if (!Object.hasOwn(homeSections, id)) return;
        const position = move(order, index, Number(button.dataset.direction));
        if (position === index) return;
        content.settings.homeOrder = order;
        render();
        const sameDirection = panel.querySelector(`[data-move-section="${id}"][data-direction="${button.dataset.direction}"]:not([disabled])`);
        (sameDirection || panel.querySelector(`[data-bind="settings.sections.${id}"]`))?.focus();
        status(`${homeSections[id]} moved to position ${position + 1}.`);
        return;
    }
    if (button.dataset.moveLearning !== undefined) {
        const index = Number(button.dataset.moveLearning);
        const position = move(content.learning, index, Number(button.dataset.direction));
        if (position === index) return;
        render();
        const next = panel.querySelector(`[data-move-learning="${position}"][data-direction="${button.dataset.direction}"]:not([disabled])`);
        (next || panel.querySelector(`[data-bind="learning.${position}.name"]`))?.focus();
        status(`Learning topic moved to position ${position + 1}.`);
        return;
    }
    if (button.dataset.addSetting || button.dataset.removeSetting) {
        const key = button.dataset.addSetting || button.dataset.removeSetting;
        if (!Object.hasOwn(profileLists, key)) return;
        const entries = content.profile[key] ??= [];
        if (button.dataset.addSetting) {
            if (entries.length >= 30) return;
            const index = entries.push(key === 'services' ? { title: '', description: '', process: '' } : '') - 1;
            markDirty();
            render();
            panel.querySelector(`[data-bind="profile.${key}.${index}${key === 'services' ? '.title' : ''}"]`)?.focus();
        } else {
            entries.splice(Number(button.dataset.entryIndex), 1);
            markDirty();
            render();
            panel.querySelector(`[data-add-setting="${key}"]`)?.focus();
            status('Card removed from the draft. Publish to update the website.');
        }
        return;
    }
    if (button.dataset.removePhoto) {
        if (uploading) { status('Wait for the photos to finish uploading.'); return; }
        readPath(button.dataset.removePhoto).splice(Number(button.dataset.photoIndex), 1);
        markDirty();
        render();
        panel.querySelector(`[data-upload="${button.dataset.removePhoto}"]`)?.focus();
        status('Photo removed from this edit. Publish to update the website.');
        return;
    }
    if (button.dataset.action)
    action(button.dataset.action); if (button.dataset.editCategory) {
    categoryId = button.dataset.editCategory;
    section = 'categories';
    render();
} if (button.dataset.project !== undefined) {
    projectIndex = Number(button.dataset.project);
    render();
} if (button.dataset.experience !== undefined) {
    experienceIndex = Number(button.dataset.experience);
    render();
} if (button.dataset.backup)
    loadBackup(button.dataset.backup); if (button.dataset.removeSkill !== undefined) {
    content.skills.splice(Number(button.dataset.removeSkill), 1);
    markDirty();
    render();
} if (button.dataset.removeLearning !== undefined) {
    content.learning.splice(Number(button.dataset.removeLearning), 1);
    markDirty();
    render();
    panel.querySelector('[data-action="new-learning"]')?.focus();
} });
async function loadBackup(id) { try {
    if (dirty && !await confirmAction('Replace unsaved edits with this backup draft?'))
        return;
    const data = await api(`/api/backups/${encodeURIComponent(id)}`);
    const validated = await api('/api/validate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data.content) });
    content = validated.content;
    markDirty();
    render();
    status('Backup loaded as a draft. Review your content, then Save changes to apply it.');
}
catch (e) {
    status(e.message, true);
} }
panel.addEventListener('change', async (event) => {
    const input = event.target;
    try {
        if (input.id === 'category-picker') {
            categoryId = input.value;
            projectIndex = 0;
            render();
            focusSelect(document.getElementById('category-picker'));
            return;
        }
        if (input.id === 'project-picker') {
            projectIndex = Number(input.value);
            render();
            focusSelect(document.getElementById('project-picker'));
            return;
        }
        if (input.id === 'project-visibility') {
            const project = category().projects[projectIndex];
            const value = input.value;
            project.placeholder = value === 'example';
            project.visible = value === 'ready' || value === 'example';
            project.archived = value === 'archived';
            markDirty();
            const option = document.querySelector('#project-picker option:checked');
            if (option) option.textContent = project.title + ' · ' + projectStatus(project, category());
            return;
        }
        if (input.dataset.extraCategory) {
            const project = category().projects[projectIndex];
            const ids = new Set(project.extraCategories || []);
            if (input.checked) ids.add(input.dataset.extraCategory); else ids.delete(input.dataset.extraCategory);
            project.extraCategories = [...ids];
            markDirty(); return;
        }
        if (input.id === 'move-project' && input.value) {
            const destination = content.categories.find(group => group.id === input.value);
            if (!destination || destination.projects.length >= 200) throw Error('The destination collection is full.');
            const [project] = category().projects.splice(projectIndex, 1);
            project.extraCategories = (project.extraCategories || []).filter(id => id !== destination.id);
            destination.projects.push(project);
            categoryId = destination.id; projectIndex = destination.projects.length - 1;
            markDirty(); render(); return;
        }
        if (input.dataset.upload && input.files[0]) {
            if (uploading) { input.value = ''; throw Error('Wait for the current upload to finish.'); }
            const files = [...input.files];
            const keys = input.dataset.upload.split('.'), key = keys.pop();
            const root = content, target = readPath(keys.join('.'));
            const multiple = input.multiple;
            if (files.some(file => file.size > 30 * 1024 * 1024)) { input.value = ''; throw Error('Choose files under 30 MB each.'); }
            if (multiple && (target[key]?.length || 0) + files.length > 30) { input.value = ''; throw Error('Choose up to 30 photos per group.'); }
            const stillEditingTarget = () => content === root &&
                (!keys.includes('projects') || content.categories.some(group => group.projects.includes(target))) &&
                (keys[0] !== 'categories' || keys.includes('projects') || content.categories.includes(target));
            uploading = true;
            updateControls();
            let added = 0;
            try {
                for (const file of files) {
                    if (!stillEditingTarget()) throw Error('The item changed during upload. Please choose the files again.');
                    status(files.length > 1 ? `Uploading photo ${added + 1} of ${files.length}…` : 'Uploading file…');
                    const data = await api('/api/uploads', { method: 'POST', headers: { 'Content-Type': file.name.toLowerCase().endsWith('.vtt') ? 'text/vtt' : file.type || 'application/octet-stream' }, body: file });
                    if (!stillEditingTarget()) throw Error('The item changed during upload. Please choose the files again.');
                    const source = keys.includes('projects') ? '../' + data.path : data.path;
                    if (multiple) (target[key] ??= []).push(source);
                    else target[key] = source;
                    added++;
                    markDirty();
                }
                status(multiple ? `${added} ${added === 1 ? 'photo' : 'photos'} added. Preview or publish when ready.` : 'File added. Preview or publish when ready.');
            } catch (error) {
                throw Error(added && stillEditingTarget() ? `${added} uploaded. Remaining files were not added: ${error.message}` : error.message);
            } finally {
                input.value = '';
                uploading = false;
                if (added && stillEditingTarget()) render();
                else updateControls();
            }
        }
        if (input.id === 'import-content' && input.files[0]) {
            if (dirty && !await confirmAction('Replace unsaved edits with the imported draft?'))
                return;
            const file = input.files[0];
            if (file.size > 5 * 1024 * 1024)
                throw new Error('Content JSON must be under 5 MB.');
            const data = await api('/api/validate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: await file.text() });
            content = data.content;
            markDirty();
            render();
            status('Content imported as a draft. Review it, then Save changes.');
        }
    }
    catch (e) {
        status(e.message, true);
    }
});
saveButton.addEventListener('click', () => save(true));
draftButton.addEventListener('click', () => save(false));
previewLink.addEventListener('click', async event => {
    if (!dirty && !uploading && !saving) return;
    event.preventDefault();
    if (uploading || saving) { status('Wait for the current change to finish, then try again.'); return; }
    const tab = window.open('about:blank', '_blank');
    if (tab) tab.opener = null;
    const href = previewLink.href;
    if (await save(false)) {
        if (tab) tab.location.replace(href);
        else location.href = href;
    } else tab?.close();
});
document.getElementById('logout').addEventListener('click', async () => {
    if (dirty && !await confirmAction('Discard unsaved changes and sign out?')) return;
    try { await api('/api/logout', { method: 'POST' }); dirty = false; location.reload(); }
    catch (error) { status(error.message, true); }
});
window.addEventListener('beforeunload', event => { if (dirty) {
    event.preventDefault();
    event.returnValue = '';
} });
async function start() {
    const response = await fetch('/api/session');
    const session = await response.json();
    if (session.token) {
        token = session.token;
        document.getElementById('logout').hidden = false;
        await load();
        return;
    }
    panel.innerHTML = heading('Owner sign-in', 'Sign in to edit and publish your portfolio.') + `<form class="card stack" id="login-form">${session.passwordRequired ? '<label class="field">Owner password<input type="password" name="password" autocomplete="current-password" required></label>' : '<p>This preview is accessible only on this computer.</p>'}<button class="button primary">Sign in</button></form>`;
    document.getElementById('save-state').textContent = 'Signed out';
    document.getElementById('login-form').addEventListener('submit', async event => {
        event.preventDefault();
        try {
            const result = await api('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: new FormData(event.target).get('password') || '' }) });
            token = result.token;
            document.getElementById('logout').hidden = false;
            await load();
            status('');
        } catch (error) { status(error.message, true); }
    });
}
start().catch(error => status(error.message, true));
