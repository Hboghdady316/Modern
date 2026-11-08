const ids = ['social-media', 'logos-branding', 'outdoors', 'printings', 'magazines-catalogues', 'videos'];
function fail(message) { throw new Error(message); }
function string(value, label, max = 2000, required = false) {
    if (typeof value !== 'string' || value.length > max || (required && !value.trim()))
        fail(`${label} is required and must be at most ${max} characters.`);
    return value;
}
function bool(value, label) { if (typeof value !== 'boolean')
    fail(`${label} must be true or false.`); }
function list(value, label, max) { if (!Array.isArray(value) || value.length > max)
    fail(`${label} must contain at most ${max} entries.`); }
function url(value, label, kind = 'web') {
    string(value, label, 2000);
    if (!value)
        return;
    if (kind === 'image' && /^(\.\.\/)?assets\/[a-zA-Z0-9_./-]+$/.test(value) && !value.split('/').slice(value.startsWith('../') ? 1 : 0).includes('..'))
        return;
    if (kind === 'resume' && /^assets\/[a-zA-Z0-9_./-]+\.pdf$/.test(value) && !value.split('/').includes('..'))
        return;
    let parsed;
    try {
        parsed = new URL(value);
    }
    catch {
        fail(`${label} must be a valid HTTP(S) URL or supported asset path.`);
    }
    if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password)
        fail(`${label} must use HTTP(S), without embedded credentials.`);
}
function strings(value, label) { list(value, label, 30); value.forEach(v => string(v, label, 300)); }
export function validateContent(input) {
    // Reject special keys before copying or merging imported JSON.
    function inspect(value) { if (value && typeof value === 'object')
        for (const key of Object.keys(value)) {
            if (['__proto__', 'prototype', 'constructor'].includes(key))
                fail('Unsupported object key.');
            inspect(value[key]);
        } }
    inspect(input);
    if (!input || input.schemaVersion !== 1)
        fail('Unsupported content version.');
    const p = input.profile, s = input.settings;
    if (!p || !s || !s.sections)
        fail('Profile and site settings are required.');
    for (const key of ['name', 'role', 'location', 'email', 'phone', 'tagline', 'bio'])
        string(p[key], `Profile ${key}`, key === 'bio' ? 6000 : 300, ['name', 'email'].includes(key));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email))
        fail('Enter a valid contact email.');
    url(p.resumeUrl, 'Resume link', 'resume');
    list(p.socials, 'Social links', 12);
    p.socials.forEach(v => { string(v.name, 'Social name', 80, true); string(v.icon, 'Social icon', 20); url(v.url, 'Social link'); });
    if (!['ordered', 'random'].includes(s.defaultLayout))
        fail('Choose Ordered or Random.');
    string(s.galaxyTitle, 'Galaxy title', 150, true);
    string(s.galaxyDescription, 'Galaxy introduction', 2000);
    for (const key of ['home', 'about', 'projects', 'skills', 'contact'])
        bool(s.sections[key], `Section ${key}`);
    list(input.categories, 'Categories', 6);
    if (input.categories.length !== 6 || new Set(input.categories.map(c => c.id)).size !== 6 || input.categories.some(c => !ids.includes(c.id)))
        fail('Keep the six existing category IDs. Hide a category instead of deleting it.');
    for (const c of input.categories) {
        string(c.name, 'Category name', 100, true);
        string(c.description, 'Category description', 6000);
        string(c.icon, 'Category icon', 20);
        bool(c.visible, 'Category visibility');
        if (!/^#[0-9a-f]{6}$/i.test(c.color))
            fail('Planet color must use a six-digit hex value.');
        if (c.category !== c.id || c.url !== `portfolio/${c.id}.html`)
            fail('Category destination cannot be changed.');
        if (!Array.isArray(c.position) || c.position.length !== 3 || c.position.some(n => typeof n !== 'number' || !Number.isFinite(n) || Math.abs(n) > 5))
            fail('Invalid planet position.');
        url(c.image, 'Category cover', 'image');
        strings(c.formats, 'Category formats');
        list(c.projects, 'Projects per category', 200);
        const projectIds = new Set();
        for (const project of c.projects) {
            string(project.id, 'Project ID', 100, true);
            if (projectIds.has(project.id))
                fail('Project IDs must be unique within a category.');
            projectIds.add(project.id);
            for (const key of ['title', 'platform', 'format', 'description'])
                string(project[key], `Project ${key}`, key === 'description' ? 6000 : 300, key === 'title');
            bool(project.placeholder, 'Placeholder status');
            bool(project.visible, 'Project visibility');
            url(project.image, 'Project image', 'image');
            url(project.videoUrl, 'Video URL', 'image');
        }
    }
    list(input.timeline, 'Experience entries', 30);
    for (const item of input.timeline) {
        if (!['number', 'string'].includes(typeof item.id))
            fail('Experience ID is required.');
        for (const key of ['year', 'title', 'company', 'location', 'description'])
            string(item[key], `Experience ${key}`, key === 'description' ? 6000 : 300, ['year', 'title'].includes(key));
        strings(item.technologies, 'Experience tags');
        strings(item.achievements, 'Achievements');
    }
    input.skills ??= [];
    input.learning ??= [];
    s.showActivityWidget ??= true;
    s.showLearningWidget ??= true;
    s.learningNext ??= '';
    for (const key of ['showActivityWidget', 'showLearningWidget'])
        bool(s[key], key);
    string(s.learningNext, 'Next learning topic', 2000);
    list(input.skills, 'Skills', 30);
    for (const skill of input.skills) {
        for (const key of ['name', 'category', 'description'])
            string(skill[key], `Skill ${key}`, key === 'description' ? 2000 : 200, key === 'name');
        if (!Number.isFinite(skill.level) || skill.level < 0 || skill.level > 100)
            fail('Skill level must be between 0 and 100.');
        if (!/^#[0-9a-f]{6}$/i.test(skill.color))
            fail('Skill color must use a six-digit hex value.');
    }
    list(input.learning, 'Learning items', 30);
    for (const item of input.learning) {
        string(item.name, 'Learning topic', 200, true);
        string(item.icon, 'Learning icon', 20);
        if (!Number.isFinite(item.progress) || item.progress < 0 || item.progress > 100)
            fail('Learning progress must be between 0 and 100.');
    }
    return input;
}
