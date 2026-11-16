import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createAdminServer } from './server.mjs';
import { validateContent } from './validation.mjs';
const original = JSON.parse(await readFile(new URL('../site/data/content.json', import.meta.url), 'utf8'));

test('content validation rejects unsafe URLs and duplicate project IDs', () => {
    validateContent(structuredClone(original));
    const serviceCards = structuredClone(original);
    serviceCards.profile.services = ['Legacy title | Legacy description | Legacy process', { title: 'Visual identity', description: 'Research | strategy', process: '' }];
    assert.doesNotThrow(() => validateContent(serviceCards));
    serviceCards.profile.services[1].title = '';
    assert.throws(() => validateContent(serviceCards), /Service 2 title/);

    const bad = structuredClone(original);
    bad.categories[0].projects[0].image = 'javascript:alert(1)';
    assert.throws(() => validateContent(bad), /HTTP/);
    const duplicate = structuredClone(original);
    duplicate.categories[1].projects.push(duplicate.categories[0].projects[0]);
    assert.throws(() => validateContent(duplicate), /unique/);
});

test('owner sign-in, drafts, publishing, private media, recovery and inbox delivery', async t => {
    const root = await mkdtemp(path.join(tmpdir(), 'galaxy-admin-test-'));
    await mkdir(path.join(root, 'portfolio/site/data'), { recursive: true });
    await mkdir(path.join(root, 'portfolio/admin'), { recursive: true });
    const file = path.join(root, 'portfolio/site/data/content.json');
    await writeFile(file, JSON.stringify(original));
    await mkdir(path.join(root, 'portfolio/site/portfolio'));
    await writeFile(path.join(root, 'portfolio/site/portfolio/category.html'), '<head><title>Category</title></head>');
    await writeFile(path.join(root, 'portfolio/site/project.html'), '<head><title>Project</title></head>');
    const homeTemplate = await readFile(new URL('../site/index.html', import.meta.url));
    await writeFile(path.join(root, 'portfolio/site/index.html'), homeTemplate);
    const contactTemplate = await readFile(new URL('../site/contact.html', import.meta.url));
    await writeFile(path.join(root, 'portfolio/site/contact.html'), contactTemplate);
    const delivered = [];
    let failDelivery = false;
    const password = 'test-owner-password';
    let server, origin;
    async function start() {
        server = createAdminServer(root, { password, deliverInquiry: async message => {
            if (failDelivery) throw Error('Unavailable');
            delivered.push(message);
        } });
        await new Promise((resolve, reject) => server.once('error', reject).listen(0, '127.0.0.1', resolve));
        origin = `http://127.0.0.1:${server.address().port}`;
    }
    const close = () => new Promise(resolve => server.close(resolve));
    await start();
    t.after(async () => { if (server.listening) await close(); await rm(root, { recursive: true, force: true }); });
    const request = (route, opts) => fetch(origin + route, opts);
    const data = async route => (await request(route)).json();
    const login = password => request('/api/login', { method: 'POST', body: JSON.stringify({ password }) });
    assert.equal((await request('/api/content')).status, 401);
    assert.equal((await request('/data/content.json?preview=1')).status, 401);
    assert.equal((await login('wrong')).status, 401);
    const response = await login(password);
    const cookie = response.headers.get('set-cookie').split(';')[0];
    assert.match(response.headers.get('set-cookie'), /HttpOnly; SameSite=Strict/);
    const { token } = await response.json();
    const call = (route, opts = {}) => request(route, { ...opts, headers: { Cookie: cookie, 'X-Admin-Token': token, ...opts.headers } });
    assert.equal((await call('/api/content', { headers: { Origin: 'https://other.example' } })).status, 403);
    assert.equal((await call('/admin/server.mjs')).status, 404);

    const initial = await data('/data/content.json');
    assert.deepEqual(initial.categories.map(c => c.id), original.categories.filter(c => c.visible).map(c => c.id));
    assert.ok(initial.categories.every(c => c.projects.length === 0), 'example projects stay private');
    const rawHome = await (await request('/')).text();
    const rawContact = await (await request('/contact.html')).text();
    assert.equal((rawHome.match(/<a class="fallback-planet"/g) || []).length, initial.categories.length);
    assert.equal((rawHome.match(/class="timeline-item(?: reverse)?"/g) || []).length, initial.timeline.length);
    assert.match(rawHome, /id="initial-site-content"/);
    const menu = html => [...html.match(/<nav aria-label="Main navigation" class="site-menu">([\s\S]*?)<\/nav>/)[1].matchAll(/>([^<>]+)<\/a>/g)].map(match => match[1]);
    assert.deepEqual(menu(rawHome), menu(rawContact));
    const footer = html => html.match(/<footer id="site-footer" class="shared-footer">([\s\S]*?)<\/footer>/)?.[1];
    assert.ok(footer(rawHome));
    assert.equal(footer(rawHome), footer(rawContact));
    assert.match(footer(rawHome), /privacy\.html/);
    assert.match(footer(rawHome), /All rights reserved/);

    assert.equal(Object.hasOwn(initial.profile, 'phone'), false);
    const { content, revision } = await (await call('/api/content')).json();
    content.profile.tagline = 'SQLite test tagline';
    const project = content.categories[0].projects[0];
    project.title = 'Published test project';
    project.placeholder = false;
    content.categories.push({ ...content.categories[1], id: 'ai-visuals', category: 'ai-visuals', url: 'portfolio/category.html?id=ai-visuals', name: 'AI Visuals', projects: [] });
    project.extraCategories = [content.categories[1].id, 'ai-visuals'];
    const gif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    const uploaded = await (await call('/api/uploads', { method: 'POST', headers: { 'Content-Type': 'image/gif' }, body: gif })).json();
    project.image = '../' + uploaded.path;
    content.profile.photoUrl = uploaded.path;
    assert.equal((await request('/' + uploaded.path)).status, 404);
    assert.equal((await request('/assets//uploads/' + uploaded.path.split('/').pop())).status, 404);
    assert.equal((await call('/' + uploaded.path)).status, 200);
    const save = (rev, publish = false) => call('/api/content' + (publish ? '?publish=1' : ''), {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'If-Match': rev }, body: JSON.stringify(content),
    });
    const draft = await save(revision);
    assert.equal(draft.status, 200);
    const savedDraft = await draft.json();
    assert.equal((await save(revision, true)).status, 409);
    assert.equal((await data('/data/content.json')).profile.tagline, initial.profile.tagline);
    assert.equal((await (await call('/data/content.json?preview=1')).json()).profile.tagline, 'SQLite test tagline');
    assert.equal((await request('/project.html?id=' + project.id)).status, 404);
    content.settings.homeOrder = ['learning', 'projects', 'home'];
    content.settings.sections.learning = true;
    content.settings.sections.experience = false;
    content.learning = [
        { name: 'Visible learning topic', icon: '', progress: 5 },
        { name: 'Hidden learning topic', icon: '', progress: 10, visible: false },
    ];
    const published = await (await save(savedDraft.revision, true)).json();
    assert.equal(published.published, true);
    const reorderedHome = await (await request('/')).text();
    const layout = reorderedHome.match(/<!-- home-layout:start -->([\s\S]*?)<!-- home-layout:end -->/)[1];
    const sectionIds = Array.from(layout.matchAll(/<section[^>]*\sid="([a-z]+)"/g), match => match[1]);
    assert.deepEqual(sectionIds.slice(0, 3), ['learning', 'projects', 'home']);
    assert.match(layout, /<section hidden id="experience"/);
    assert.match(reorderedHome, /Visible learning topic/);
    assert.doesNotMatch(reorderedHome, /Hidden learning topic/);

    for (const route of ['/', '/index.html', '/contact.html']) {
        assert.match(await (await request(route)).text(), /data-profile-portrait alt="" src="[^"]+\/assets\/uploads\//);
    }

    const site = await data('/data/content.json');
    assert.equal(site.profile.tagline, content.profile.tagline);
    assert.deepEqual(site.categories.filter(c => c.projects.length).map(c => c.projects.map(p => p.id)), [[project.id], [project.id], [project.id]]);
    assert.equal(site.categories.length, initial.categories.length + 1);
    assert.match(await (await request('/project.html?id=' + project.id)).text(), /Published test project/);
    assert.match(await (await request('/portfolio/category.html?id=ai-visuals')).text(), /AI Visuals/);
    const media = await request('/' + uploaded.path, { headers: { Range: 'bytes=0-4' } });
    assert.equal(media.status, 206);
    assert.deepEqual(Buffer.from(await media.arrayBuffer()), gif.subarray(0, 5));
    const backup = await (await call('/api/backups/' + savedDraft.backup)).json();
    assert.equal(backup.content.profile.tagline, initial.profile.tagline);
    assert.deepEqual(JSON.parse(await readFile(file)), original);

    const inquiry = body => request('/api/inquiry', { method: 'POST', body: JSON.stringify(body) });
    const message = { name: 'Test', email: 'reply@example.test', type: 'job', message: 'Test inquiry' };
    assert.equal((await inquiry({ ...message, website: 'bot' })).status, 400);
    assert.equal((await inquiry(message)).status, 200);
    assert.equal((await request('/api/metric', { method: 'POST', body: 'contact_action' })).status, 202);
    await request('/api/metric', { method: 'POST', body: 'contact_action', headers: { DNT: '1' } });
    const metrics = await (await call('/api/metrics')).json();
    assert.deepEqual(Object.fromEntries(metrics.counts.map(row => [row.event, row.total])), { contact_action: 1, inquiry_delivered: 1 });
    assert.equal(delivered[0].subject, 'Job opportunity');
    failDelivery = true;
    assert.equal((await inquiry(message)).status, 502);
    assert.equal((await call('/api/logout', { method: 'POST' })).status, 200);
    assert.equal((await call('/api/content')).status, 401);

    await close();
    await start();
    assert.equal((await data('/data/content.json')).profile.tagline, 'SQLite test tagline');
    assert.deepEqual(Buffer.from(await (await request('/' + uploaded.path)).arrayBuffer()), gif);
    content.categories[0].projects[0].archived = true;
    content.profile.photoUrl = '';
    const relogin = await login(password);
    const auth = { Cookie: relogin.headers.get('set-cookie').split(';')[0], 'X-Admin-Token': (await relogin.json()).token };
    assert.equal((await request('/api/content?publish=1', { method: 'PUT', headers: { ...auth, 'If-Match': published.revision }, body: JSON.stringify(content) })).status, 200);
    assert.equal((await request('/' + uploaded.path)).status, 404);
    assert.equal((await request('/project.html?id=' + project.id)).status, 404);
});
