let content, revision, token, section = 'overview', categoryId = 'social-media', projectIndex = 0, experienceIndex = 0, dirty = false;
const panel = document.getElementById('panel'), saveButton = document.getElementById('save');
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function status(message, error = false) { const el = document.getElementById('status'); el.textContent = message; el.classList.toggle('error', error); }
function markDirty() { dirty = true; saveButton.disabled = false; document.getElementById('save-state').textContent = '● Unsaved changes'; }
function confirmAction(message) { return new Promise(resolve => { const dialog = document.createElement('dialog'); dialog.className = 'confirm-dialog'; dialog.setAttribute('aria-labelledby', 'confirm-title'); dialog.innerHTML = `<form method="dialog"><h2 id="confirm-title">Review this change</h2><p></p><div class="editor-actions"><button class="button secondary" value="cancel">Cancel</button><button class="button danger" value="accept">Continue</button></div></form>`; dialog.querySelector('p').textContent = message; dialog.addEventListener('close', () => { const accepted = dialog.returnValue === 'accept'; dialog.remove(); resolve(accepted); }, { once: true }); document.body.append(dialog); dialog.showModal(); }); }
async function api(url, options = {}) { const response = await fetch(url, { ...options, headers: { 'X-Admin-Token': token, ...options.headers } }); const data = await response.json(); if (!response.ok)
    throw new Error(data.error || 'The request failed.'); return data; }
const field = (label, path, value, type = 'text', help = '') => `<label class="field">${esc(label)}<input type="${type}" data-bind="${path}" value="${esc(value)}"${type === 'email' ? ' autocomplete="email"' : ''}>${help ? `<small>${esc(help)}</small>` : ''}</label>`;
const area = (label, path, value, lines = false) => `<label class="field">${esc(label)}<textarea data-bind="${path}"${lines ? ' data-lines="true"' : ''}>${esc(lines ? value.join('\n') : value)}</textarea></label>`;
const check = (label, path, value) => `<label class="check"><input type="checkbox" data-bind="${path}"${value ? ' checked' : ''}>${esc(label)}</label>`;
const upload = (label, path, accept) => `<label class="field upload-row">${esc(label)}<input type="file" data-upload="${path}" accept="${accept}"><small>Up to 30 MB. Upload, then Save changes.</small></label>`;
const heading = (title, description) => `<div class="page-heading"><div><span class="eyebrow">WEBSITE CONTROL</span><h1>${esc(title)}</h1><p>${esc(description)}</p></div></div>`;
function readPath(path) { return path.split('.').reduce((value, key) => value[key], content); }
function writePath(path, value) { const keys = path.split('.'), last = keys.pop(); keys.reduce((item, key) => item[key], content)[last] = value; }
function category() { return content.categories.find(c => c.id === categoryId) || content.categories[0]; }
function categoryPicker() { return `<label class="field">Category<select id="category-picker">${content.categories.map(c => `<option value="${c.id}"${c.id === categoryId ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>`; }
function overview() { const all = content.categories.flatMap(c => c.projects), ready = all.filter(p => !p.placeholder && p.visible); return heading('Your creative universe', 'Manage your portfolio from one place. Keep your content fresh, organize projects, and shape the galaxy.') + `<div class="stats"><div class="stat"><span>DESIGN CATEGORIES</span><strong>${content.categories.length}</strong><small>${content.categories.filter(c => c.visible).length} visible planets</small></div><div class="stat"><span>PORTFOLIO PROJECTS</span><strong>${all.length}</strong><small>Across your collections</small></div><div class="stat"><span>READY TO SHOW</span><strong>${ready.length}</strong><small>Visible original projects</small></div><div class="stat"><span>LAYOUT PREVIEWS</span><strong>${all.filter(p => p.placeholder).length}</strong><small>Ready for your artwork</small></div></div><div class="section-heading"><h2>Your galaxy</h2><button class="button secondary" data-action="new-project">+ Add project</button></div><div class="category-grid">${content.categories.map(c => `<article class="category-card"><div class="mini-orbit" data-color="${c.color}"><span></span></div><h3>${esc(c.name)}</h3><p>${c.projects.length} projects · ${c.visible ? 'Visible' : 'Hidden'}</p><button class="button secondary" data-edit-category="${c.id}">Manage collection ↗</button></article>`).join('')}</div><div class="note"><strong>You’re editing project files.</strong> Save changes to update the local website. Publishing the portfolio updates the shared online version. The admin panel runs only on your computer.</div>`; }
function profile() { const p = content.profile, s = content.settings; return heading('Website details', 'Your identity, introduction, contact information, and website settings.') + `<div class="stack"><section class="card"><h2>Identity & introduction</h2><div class="form-grid">${field('Full name', 'profile.name', p.name)}${field('Professional role', 'profile.role', p.role)}${field('Location', 'profile.location', p.location)}${field('Hero tagline', 'profile.tagline', p.tagline)}<div class="full">${area('About biography', 'profile.bio', p.bio)}</div></div></section><section class="card"><h2>Contact & resume</h2><div class="form-grid">${field('Contact email', 'profile.email', p.email, 'email')}${field('Phone', 'profile.phone', p.phone)}<div class="full">${field('Resume URL or PDF path', 'profile.resumeUrl', p.resumeUrl, 'text', 'Use an HTTP(S) link or an uploaded PDF. Leave blank to disable the resume button.')}${upload('Upload resume PDF', 'profile.resumeUrl', 'application/pdf')}</div></div>${p.socials.map((social, i) => `<div class="social-row">${field('Link name', `profile.socials.${i}.name`, social.name)}${field(`${social.name} URL`, `profile.socials.${i}.url`, social.url, 'url', 'Leave blank if this profile is not available.')}</div>`).join('')}</section><section class="card"><h2>Project Galaxy</h2><div class="form-grid">${field('Section heading', 'settings.galaxyTitle', s.galaxyTitle)}<label class="field">Default planet arrangement<select data-bind="settings.defaultLayout"><option value="ordered"${s.defaultLayout === 'ordered' ? ' selected' : ''}>Ordered</option><option value="random"${s.defaultLayout === 'random' ? ' selected' : ''}>Random</option></select></label><div class="full">${area('Galaxy introduction', 'settings.galaxyDescription', s.galaxyDescription)}</div></div></section><section class="card"><h2>Visible home page sections</h2><div class="section-controls">${Object.entries(s.sections).map(([key, value]) => check(key === 'home' ? 'Hero' : key[0].toUpperCase() + key.slice(1), `settings.sections.${key}`, value)).join('')}</div></section></div>`; }
function categories() { const c = category(), i = content.categories.indexOf(c), base = `categories.${i}`; return heading('Galaxy categories', 'Edit the six planets, their colors, descriptions, and category covers.') + `<div class="toolbar">${categoryPicker()}</div><section class="card"><div class="form-grid"><div>${field('Category name', `${base}.name`, c.name)}<br>${field('Planet color', `${base}.color`, c.color, 'color')}<br>${field('Category icon', `${base}.icon`, c.icon)}<br>${check('Show this planet and collection', `${base}.visible`, c.visible)}</div><div><img class="cover-preview" src="/${esc(c.image)}" alt="Category cover">${field('Cover image path or URL', `${base}.image`, c.image)}${upload('Upload category cover', `${base}.image`, 'image/png,image/jpeg,image/webp,image/gif,image/avif')}</div><div class="full">${area('Category description', `${base}.description`, c.description)}</div><div class="full">${area('Formats / tags (one per line)', `${base}.formats`, c.formats, true)}</div></div><div class="editor-actions"><button class="button secondary" data-action="category-projects">Edit projects in this category ↗</button><a class="button secondary" href="/${c.url}" target="_blank" rel="noopener">Preview category ↗</a></div></section>`; }
function projects() { const c = category(), ci = content.categories.indexOf(c); projectIndex = Math.max(0, Math.min(projectIndex, c.projects.length - 1)); const p = c.projects[projectIndex], base = `categories.${ci}.projects.${projectIndex}`; return heading('Projects & media', 'Add your original work, upload images and videos, and arrange each collection.') + `<div class="toolbar">${categoryPicker()}<button class="button primary" data-action="new-project">+ Add project</button></div><div class="editor-layout"><nav class="item-list" aria-label="Projects">${c.projects.map((p, i) => `<button data-project="${i}" aria-current="${i === projectIndex}">${esc(p.title)}<small>${p.placeholder ? 'Layout preview' : 'Original project'} · ${p.visible ? 'Visible' : 'Hidden'}</small></button>`).join('')}</nav>${p ? `<section class="card"><div class="form-grid"><div class="full">${field('Project title', `${base}.title`, p.title)}</div>${field('Filter label / platform', `${base}.platform`, p.platform)}${field('Format', `${base}.format`, p.format)}<div class="full">${area('Project description', `${base}.description`, p.description)}</div><div class="full"><img class="cover-preview" src="${esc(p.image.startsWith('../') ? p.image.replace('..', '') : p.image)}" alt="Project cover">${field('Project image path or URL', `${base}.image`, p.image, 'text', 'Local project image paths start with ../assets/.')}${upload('Upload project image', `${base}.image`, 'image/png,image/jpeg,image/webp,image/gif,image/avif')}</div><div class="full">${field('Video URL (optional)', `${base}.videoUrl`, p.videoUrl, 'text', 'MP4/WebM files play inside the preview. Other HTTP(S) links open the video source.')}${upload('Upload project video', `${base}.videoUrl`, 'video/mp4,video/webm')}</div>${check('Show project in the collection', `${base}.visible`, p.visible)}${check('This is placeholder artwork', `${base}.placeholder`, p.placeholder)}</div><div class="editor-actions"><button class="button secondary" data-action="project-up"${projectIndex === 0 ? ' disabled' : ''}>↑ Move up</button><button class="button secondary" data-action="project-down"${projectIndex === c.projects.length - 1 ? ' disabled' : ''}>↓ Move down</button><button class="button danger" data-action="delete-project">Remove project</button></div></section>` : '<div class="card empty">No projects yet. Add your first project to this collection.</div>'}</div>`; }
function experience() { experienceIndex = Math.max(0, Math.min(experienceIndex, content.timeline.length - 1)); const item = content.timeline[experienceIndex], base = `timeline.${experienceIndex}`; return heading('Experience', 'Update the timeline on your About page, including achievements and creative tools.') + `<div class="toolbar"><button class="button primary" data-action="new-experience">+ Add experience</button></div><div class="editor-layout"><nav class="item-list" aria-label="Experience entries">${content.timeline.map((item, i) => `<button data-experience="${i}" aria-current="${i === experienceIndex}">${esc(item.title)}<small>${esc(item.company)} · ${esc(item.year)}</small></button>`).join('')}</nav>${item ? `<section class="card"><div class="form-grid">${field('Role title', `${base}.title`, item.title)}${field('Company', `${base}.company`, item.company)}${field('Dates', `${base}.year`, item.year)}${field('Location', `${base}.location`, item.location)}<div class="full">${area('Description', `${base}.description`, item.description)}</div><div class="full">${area('Tools / tags (one per line)', `${base}.technologies`, item.technologies, true)}</div><div class="full">${area('Achievements (one per line)', `${base}.achievements`, item.achievements, true)}</div></div><div class="editor-actions"><button class="button secondary" data-action="experience-up"${experienceIndex === 0 ? ' disabled' : ''}>↑ Move up</button><button class="button secondary" data-action="experience-down"${experienceIndex === content.timeline.length - 1 ? ' disabled' : ''}>↓ Move down</button><button class="button danger" data-action="delete-experience">Remove experience</button></div></section>` : '<div class="card empty">Add an experience entry to start your timeline.</div>'}</div>`; }
function skills() { return heading('Skills & learning', 'Edit the skills wheel and learning topics, or hide the template widgets until they reflect your work.') + `<div class="stack"><section class="card"><div class="section-heading"><h2>Skills wheel</h2><button class="button secondary" data-action="new-skill">+ Add skill</button></div><div class="stack">${content.skills.map((item, i) => `<div class="form-grid">${field('Skill name', `skills.${i}.name`, item.name)}${field('Skill group', `skills.${i}.category`, item.category)}${field('Skill level (0–100)', `skills.${i}.level`, item.level, 'number')}${field('Skill color', `skills.${i}.color`, item.color, 'color')}<div class="full">${area('Skill description', `skills.${i}.description`, item.description)}</div><div class="full"><button class="button danger" data-remove-skill="${i}">Remove ${esc(item.name)}</button></div></div>`).join('')}</div></section><section class="card"><div class="section-heading"><h2>Currently learning</h2><button class="button secondary" data-action="new-learning">+ Add learning topic</button></div><div class="stack">${content.learning.map((item, i) => `<div class="form-grid">${field('Learning topic', `learning.${i}.name`, item.name)}${field('Learning progress (0–100)', `learning.${i}.progress`, item.progress, 'number')}${field('Learning icon', `learning.${i}.icon`, item.icon)}<div><button class="button danger" data-remove-learning="${i}">Remove topic</button></div></div>`).join('')}${area('Next up', 'settings.learningNext', content.settings.learningNext)}</div></section><section class="card"><h2>About page widgets</h2><div class="section-controls">${check('Show activity widget', 'settings.showActivityWidget', content.settings.showActivityWidget)}${check('Show learning widget', 'settings.showLearningWidget', content.settings.showLearningWidget)}</div><p class="help">The existing activity widget contains template statistics. Hide it until a real activity feed is connected.</p></section></div>`; }
function backups() { return heading('Backups & transfer', 'Every successful save keeps a recovery snapshot. Export your draft or import a saved content file.') + `<div class="stack"><section class="card"><h2>Transfer website content</h2><div class="toolbar"><button class="button secondary" data-action="export">Download content JSON ↓</button><button class="button secondary" data-action="reload">Reload saved website</button></div><label class="field">Import content JSON<input type="file" id="import-content" accept="application/json,.json"><small>Import loads a draft. Review it, then Save changes to apply it.</small></label></section><section class="card"><h2>Recovery snapshots</h2><div id="backup-list" class="backup-list"><p class="help">Loading backups…</p></div></section><div class="note">Loading a snapshot does not immediately change your website. It becomes an editable draft. Saving it creates another backup of the current website.</div></div>`; }
function render() { if (!content)
    return; document.querySelectorAll('[data-section]').forEach(button => { if (button.dataset.section === section)
    button.setAttribute('aria-current', 'page');
else
    button.removeAttribute('aria-current'); }); panel.innerHTML = ({ overview, profile, categories, projects, experience, skills, backups })[section](); panel.querySelectorAll('[data-color]').forEach(el => el.style.setProperty('--planet', el.dataset.color)); if (section === 'backups')
    loadBackups(); }
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
        if (name === 'new-project')
            return newProject();
        if (name === 'new-skill') {
            content.skills.push({ name: 'New skill', category: 'Design', level: 50, color: '#bd8cff', description: '' });
            markDirty();
        }
        if (name === 'new-learning') {
            content.learning.push({ name: 'New learning topic', icon: '✧', progress: 0 });
            markDirty();
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
async function load() { const data = await api('/api/content'); content = data.content; revision = data.revision; dirty = false; saveButton.disabled = true; document.getElementById('save-state').textContent = 'All changes saved locally'; render(); }
async function save() {
    saveButton.disabled = true;
    saveButton.textContent = 'Saving…';
    const snapshot = JSON.stringify(content);
    try {
        const result = await api('/api/content', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'If-Match': revision }, body: snapshot });
        revision = result.revision;
        if ('BroadcastChannel' in window) {
            const channel = new BroadcastChannel('galaxy-content');
            channel.postMessage({ type: 'saved', revision });
            setTimeout(() => channel.close(), 100);
        }
        try { localStorage.setItem('galaxy-content-update', `${Date.now()}-${revision}`); } catch { /* BroadcastChannel remains available when storage is blocked. */ }
        dirty = JSON.stringify(content) !== snapshot;
        document.getElementById('save-state').textContent = dirty ? '● New edits are not yet saved' : `Saved locally at ${new Date(result.savedAt).toLocaleTimeString()}`;
        status(dirty ? 'Saved the previous draft. Save again to include your newest edits.' : 'Saved to project files. Open local previews refresh automatically. Publish to update the shared online site.');
        if (!dirty)
            render();
    }
    catch (e) {
        status(e.message, true);
    }
    finally {
        saveButton.textContent = 'Save changes';
        saveButton.disabled = !dirty;
    }
}
document.querySelectorAll('[data-section]').forEach(button => button.addEventListener('click', () => { section = button.dataset.section; render(); }));
panel.addEventListener('input', event => { const input = event.target; if (!input.dataset.bind)
    return; let value = input.type === 'checkbox' ? input.checked : input.type === 'number' ? Number(input.value) : input.value; if (input.dataset.lines)
    value = value.split('\n').map(v => v.trim()).filter(Boolean); writePath(input.dataset.bind, value); markDirty(); });
panel.addEventListener('click', event => { const button = event.target.closest('button'); if (!button)
    return; if (button.dataset.action)
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
            return;
        }
        if (input.dataset.upload && input.files[0]) {
            status('Uploading file…');
            const file = input.files[0];
            if (file.size > 30 * 1024 * 1024)
                throw new Error('The file exceeds 30 MB.');
            const data = await api('/api/uploads', { method: 'POST', headers: { 'Content-Type': file.type || 'application/octet-stream' }, body: file });
            writePath(input.dataset.upload, input.dataset.upload.includes('.projects.') ? '../' + data.path : data.path);
            markDirty();
            render();
            status('File uploaded to your project. Save changes to use it on the website.');
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
saveButton.addEventListener('click', save);
window.addEventListener('beforeunload', event => { if (dirty) {
    event.preventDefault();
    event.returnValue = '';
} });
try {
    const session = await fetch('/api/session').then(r => r.json());
    token = session.token;
    if (!token)
        throw Error('Start the admin server with npm run admin, then open /admin/.');
    await load();
}
catch (e) {
    panel.innerHTML = heading('Start the local admin server', 'Open your IDE terminal and run npm run admin. Then visit http://127.0.0.1:8080/admin/.');
    status(e.message, true);
}
