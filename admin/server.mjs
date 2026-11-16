import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { randomBytes, randomUUID, createHash, timingSafeEqual } from 'node:crypto';
import { openStore, publicContent, mediaReferences } from './store.mjs';
import { renderPublicPage } from './public-page.mjs';
import { validateContent } from './validation.mjs';
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif', '.mp4': 'video/mp4', '.webm': 'video/webm', '.pdf': 'application/pdf', '.vtt': 'text/vtt; charset=utf-8' };
const uploadTypes = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif', 'video/mp4': 'mp4', 'video/webm': 'webm', 'application/pdf': 'pdf', 'text/vtt': 'vtt' };
export function createAdminServer(root = repoRoot, options = {}) {
    const siteRoot = path.join(root, 'vanilla-site'), adminRoot = path.join(root, 'admin');
    const dataDir = path.resolve(options.dataDir || path.join(root, '.portfolio-data'));
    if (dataDir === siteRoot || dataDir.startsWith(siteRoot + path.sep))
        throw Error('PORTFOLIO_DATA_DIR must be outside the public web root.');
    const store = openStore(dataDir, path.join(siteRoot, 'data/content.json'));
    const origin = options.origin;
    const password = options.password;
    const webhook = options.inquiryWebhook ? new URL(options.inquiryWebhook) : null;
    if (webhook && webhook.protocol !== 'https:' && !options.deliverInquiry)
        throw new Error('INQUIRY_WEBHOOK must use HTTPS.');
    const deliverInquiry = options.deliverInquiry || (webhook && (async message => {
        const response = await fetch(webhook, {
            method: 'POST', redirect: 'error', signal: AbortSignal.timeout(10_000),
            headers: { 'Content-Type': 'application/json', ...(options.inquiryToken ? { Authorization: 'Bearer ' + options.inquiryToken } : {}) },
            body: JSON.stringify(message),
        });
        if (!response.ok) throw Error('Inquiry provider rejected the message.');
    }));
    const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
    let inquiries = 0, inquiryWindow = 0;
    if (origin && (!password || password.length < 16 || new URL(origin).protocol !== 'https:'))
        throw new Error('Hosted mode requires an HTTPS PUBLIC_ORIGIN and an ADMIN_PASSWORD of at least 16 characters.');
    const sessions = new Map();
    let loginFailures = 0, loginWindow = 0;
    const same = (a, b) => timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest());
    const cookie = (id, age) => `portfolio_session=${id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${age}${origin ? '; Secure' : ''}`;
    function session(req) {
        const id = (req.headers.cookie || '').match(/(?:^|; )portfolio_session=([a-f0-9]{64})(?:;|$)/)?.[1];
        const auth = sessions.get(id);
        if (auth?.expires > Date.now()) return auth;
        if (id) sessions.delete(id);
    }
    const revision = buffer => createHash('sha256').update(buffer).digest('hex');
    function json(res, status, value, headers = {}) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers }); res.end(JSON.stringify(value)); }
    async function body(req, max = 5 * 1024 * 1024) { let total = 0; const chunks = []; for await (const chunk of req) {
        total += chunk.length;
        if (total > max) {
            const e = new Error('File or request is too large.');
            e.status = 413;
            throw e;
        }
        chunks.push(chunk);
    } return Buffer.concat(chunks); }
    const server = http.createServer(async (req, res) => {
        try {
            const localHosts = [`127.0.0.1:${server.address().port}`, `localhost:${server.address().port}`];
            const allowedHosts = origin ? [new URL(origin).host] : localHosts;
            if (!allowedHosts.includes(req.headers.host)) return json(res, 403, { error: 'Invalid host.' });
            const expectedOrigin = origin || `http://${req.headers.host}`;
            const pathname = decodeURIComponent(new URL(req.url, expectedOrigin).pathname);
            if (pathname !== path.posix.normalize(pathname) || pathname.includes('\\') || pathname.includes('\0'))
                return json(res, 404, { error: 'Not found.' });
            const protectedRoute = pathname.startsWith('/api/') || new URL(req.url, expectedOrigin).searchParams.get('preview') === '1';
            if ((protectedRoute || !['GET', 'HEAD'].includes(req.method)) &&
                ((req.headers.origin && req.headers.origin !== expectedOrigin) || req.headers['sec-fetch-site'] === 'cross-site'))
                return json(res, 403, { error: 'Origin is not allowed.' });
            const active = session(req);
            if (pathname === '/data/content.json' && ['GET', 'HEAD'].includes(req.method)) {
                const preview = new URL(req.url, expectedOrigin).searchParams.get('preview') === '1';
                if (preview && !active) return json(res, 401, { error: 'Sign in to preview drafts.' });
                return json(res, 200, preview ? JSON.parse(store.get('draft')) : publicContent(store.get('published')));
            }
            if (pathname === '/api/login' && req.method === 'POST') {
                if (Date.now() > loginWindow + 60_000) { loginWindow = Date.now(); loginFailures = 0; }
                if (loginFailures >= 8) return json(res, 429, { error: 'Too many attempts. Try again in a minute.' });
                const input = JSON.parse(await body(req, 4096));
                if (password && (typeof input.password !== 'string' || !same(input.password, password))) {
                    loginFailures++;
                    return json(res, 401, { error: 'Incorrect password.' });
                }
                const id = randomBytes(32).toString('hex'), token = randomBytes(32).toString('hex');
                for (const [key, value] of sessions) if (value.expires <= Date.now()) sessions.delete(key);
                if (active) sessions.delete(active.id);
                sessions.set(id, { id, token, expires: Date.now() + 8 * 60 * 60_000 });
                return json(res, 200, { token }, { 'Set-Cookie': cookie(id, 8 * 3600) });
            }
            if (pathname === '/api/session' && req.method === 'GET')
                return active ? json(res, 200, { token: active.token }) : json(res, 401, { passwordRequired: Boolean(password) });
            if (pathname === '/api/logout' && req.method === 'POST' && active && same(String(req.headers['x-admin-token'] || ''), active.token)) {
                sessions.delete(active.id);
                return json(res, 200, {}, { 'Set-Cookie': cookie('', 0) });
            }
            if (pathname === '/api/metric' && req.method === 'POST') {
                const event = (await body(req, 64)).toString();
                if (!['portfolio_visit','contact_action','cv_click'].includes(event)) return json(res, 400, { error: 'Invalid metric.' });
                if (req.headers.dnt !== '1' && req.headers['sec-gpc'] !== '1') store.record(event);
                return json(res, 202, {});
            }
            if (pathname === '/api/inquiry' && req.method === 'POST') {
                if (!deliverInquiry) return json(res, 503, { error: 'Online inquiries are unavailable. Please use email.' });
                let input;
                try { input = JSON.parse(await body(req, 32_000)); } catch { return json(res, 400, { error: 'Invalid inquiry.' }); }
                const labels = { project: 'Project inquiry', job: 'Job opportunity', other: 'Collaboration / other' };
                if (!input || !Object.hasOwn(labels, input.type) || input.website ||
                    !['name', 'email', 'message'].every(key => typeof input[key] === 'string' && input[key].trim()) ||
                    input.name.length > 150 || input.email.length > 250 || input.message.length > 5000 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email))
                    return json(res, 400, { error: 'Check your inquiry type, name, email and message.' });
                if (Date.now() > inquiryWindow + 60_000) { inquiryWindow = Date.now(); inquiries = 0; }
                if (++inquiries > 12) return json(res, 429, { error: 'Too many requests. Try again in a minute.' });
                const fields = {};
                for (const key of ['service','timeline','budget','reference','company','role','arrangement'])
                    if (typeof input[key] === 'string') fields[key] = input[key].trim().slice(0, 300);
                try {
                    await deliverInquiry({ to: JSON.parse(store.get('published')).profile.email, subject: labels[input.type], type: input.type,
                        name: input.name.trim(), replyTo: input.email.trim(), message: input.message.trim(), fields });
                } catch { return json(res, 502, { error: 'Your message could not be delivered. Try again or use email.' }); }
                if (req.headers.dnt !== '1' && req.headers['sec-gpc'] !== '1') {
                    try { store.record('inquiry_delivered'); } catch { console.warn('Could not record inquiry count.'); }
                }
                return json(res, 200, { delivered: true });
            }
            if (pathname.startsWith('/api/')) {
                if (!active || !same(String(req.headers['x-admin-token'] || ''), active.token))
                    return json(res, 401, { error: 'Admin session expired. Reload and sign in.' });
                if (pathname === '/api/content' && req.method === 'GET') {
                    const raw = store.get('draft');
                    return json(res, 200, { content: JSON.parse(raw), revision: revision(raw), unpublished: raw !== store.get('published') });
                }
                if ((pathname === '/api/content' && req.method === 'PUT') || (pathname === '/api/validate' && req.method === 'POST')) {
                    let value;
                    try {
                        value = JSON.parse(await body(req));
                    }
                    catch (e) {
                        if (e.status)
                            throw e;
                        json(res, 400, { error: 'Invalid JSON file.' });
                        return;
                    }
                    try {
                        validateContent(value);
                    }
                    catch (e) {
                        json(res, 400, { error: e.message });
                        return;
                    }
                    if (pathname === '/api/validate') {
                        json(res, 200, { content: value });
                        return;
                    }
                    const old = store.get('draft');
                    if (req.headers['if-match'] !== revision(old))
                        return json(res, 409, { error: 'Content changed in another panel. Export your draft, then reload before saving.' });
                    const id = `${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID()}.json`;
                    const output = JSON.stringify(value);
                    const publish = new URL(req.url, expectedOrigin).searchParams.get('publish') === '1';
                    store.db.exec('BEGIN IMMEDIATE');
                    try {
                        store.backup(id, old);
                        store.put('draft', output);
                        if (publish) store.put('published', output);
                        store.db.exec('COMMIT');
                    } catch (error) {
                        store.db.exec('ROLLBACK');
                        throw error;
                    }
                    return json(res, 200, { revision: revision(output), backup: id, savedAt: new Date().toISOString(), published: publish, unpublished: output !== store.get('published') });
                }
                if (pathname === '/api/metrics' && req.method === 'GET') return json(res, 200, { counts: store.metrics() });
                if (pathname === '/api/backups' && req.method === 'GET')
                    return json(res, 200, { backups: store.backups() });
                if (pathname.startsWith('/api/backups/') && req.method === 'GET') {
                    const document = store.snapshot(pathname.slice('/api/backups/'.length));
                    return document ? json(res, 200, { content: JSON.parse(document) }) : json(res, 404, { error: 'Backup not found.' });
                }
                if (pathname === '/api/uploads' && req.method === 'POST') {
                    const type = (req.headers['content-type'] || '').split(';')[0], extension = uploadTypes[type];
                    if (!extension) {
                        json(res, 400, { error: 'Upload PNG, JPG, WebP, GIF, AVIF, MP4, WebM, PDF, or WebVTT files.' });
                        return;
                    }
                    const bytes = await body(req, 30 * 1024 * 1024);
                    if (!bytes.length) {
                        json(res, 400, { error: 'The file is empty.' });
                        return;
                    }
                    const name = `${randomUUID()}.${extension}`;
                    store.addMedia(name, bytes);
                    json(res, 201, { path: `assets/uploads/${name}` });
                    return;
                }
                json(res, 404, { error: 'API endpoint not found.' });
                return;
            }
            if (!['GET', 'HEAD'].includes(req.method)) {
                json(res, 405, { error: 'Method not allowed.' });
                return;
            }
            if (pathname.startsWith('/assets/uploads/')) {
                const name = pathname.slice('/assets/uploads/'.length);
                const allowed = mediaReferences(publicContent(store.get('published'))).has(`assets/uploads/${name}`);
                if (!/^[a-zA-Z0-9_-]+\.(png|jpe?g|webp|gif|avif|mp4|webm|pdf|vtt)$/.test(name) || (!allowed && !active))
                    return json(res, 404, { error: 'Media not found.' });
                const bytes = store.media(name) || await readFile(path.join(siteRoot, 'assets/uploads', name));
                const headers = { 'Content-Type': types[path.extname(name)], 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Accept-Ranges': 'bytes' };
                let start = 0, end = bytes.length - 1;
                const range = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range || '');
                if (range) {
                    start = Number(range[1]); end = range[2] ? Math.min(Number(range[2]), end) : end;
                    if (start > end) { res.writeHead(416, { 'Content-Range': `bytes */${bytes.length}` }); return res.end(); }
                    headers['Content-Range'] = `bytes ${start}-${end}/${bytes.length}`;
                }
                res.writeHead(range ? 206 : 200, { ...headers, 'Content-Length': end - start + 1 });
                return res.end(req.method === 'HEAD' ? undefined : bytes.subarray(start, end + 1));
            }
            if (pathname === '/robots.txt') {
                res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
                return res.end('User-agent: *\nDisallow: /admin/\nDisallow: /api/\nDisallow: /*preview=1\n' + (origin ? `Sitemap: ${origin}/sitemap.xml\n` : ''));
            }
            if (pathname === '/sitemap.xml' && origin) {
                const content = publicContent(store.get('published'));
                const routes = ['/', '/work.html', '/services.html', '/contact.html', '/privacy.html',
                    ...content.categories.map(c => '/' + c.url),
                    ...new Set(content.categories.flatMap(c => c.projects.map(p => '/project.html?id=' + encodeURIComponent(p.id))))];
                res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'no-store' });
                return res.end(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(route => `<url><loc>${escape(origin + route)}</loc></url>`).join('')}</urlset>`);
            }
            if (pathname.startsWith('/data/')) return json(res, 404, { error: 'Not found.' });
            const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/');
            const base = isAdmin ? adminRoot : siteRoot;
            let relative = isAdmin ? pathname.replace(/^\/admin\/?/, '') : pathname.slice(1);
            if (!relative || relative.endsWith('/'))
                relative += 'index.html';
            // Only the browser panel is served from admin/; server code and backups stay private.
            if (isAdmin && !['index.html', 'app.js', 'style.css'].includes(relative)) {
                json(res, 404, { error: 'Not found.' });
                return;
            }
            const file = path.resolve(base, relative);
            if (!file.startsWith(base + path.sep) || relative.split('/').some(part => part.startsWith('.'))) {
                json(res, 403, { error: 'Not allowed.' });
                return;
            }
            let status = 200;
            let bytes = await readFile(file).catch(async error => {
                if (isAdmin || !['ENOENT', 'EISDIR'].includes(error.code) || (path.extname(file) && !file.endsWith('.html'))) throw error;
                status = 404;
                return readFile(path.join(siteRoot, '404.html'));
            });
            const type = status === 404 ? types['.html'] : types[path.extname(file)] || 'application/octet-stream';
            if (!isAdmin && (status === 404 || file.endsWith('.html'))) {
                const url = new URL(req.url, expectedOrigin);
                const preview = url.searchParams.get('preview') === '1';
                const content = preview && active ? JSON.parse(store.get('draft')) : publicContent(store.get('published'));
                const profile = content.profile;
                const project = pathname === '/project.html' && content.categories.flatMap(c => c.projects).find(p => p.id === url.searchParams.get('id'));
                const category = content.categories.find(c => pathname === '/portfolio/category.html' ? c.id === url.searchParams.get('id') : '/' + c.url === pathname);
                if (!preview && ((pathname === '/project.html' && !project) || (pathname.startsWith('/portfolio/') && !category))) status = 404;
                const html = !preview || active
                    ? renderPublicPage(bytes.toString(), content, { origin: expectedOrigin, pathname, preview })
                    : bytes.toString();
                const title = project || category ? (project?.title || category.name) + ' | ' + profile.name
                    : pathname === '/' || pathname === '/index.html' ? profile.siteTitle || profile.name + ' | ' + profile.role
                    : html.match(/<title>(.*?)<\/title>/)?.[1] || profile.name;
                const description = project?.description || category?.description || ((pathname === '/' || pathname === '/index.html') && profile.siteDescription);
                const image = project?.image || category?.image || profile.shareImage;
                const canonical = new URL(pathname === '/index.html' ? '/' : pathname, expectedOrigin);
                if (project) canonical.searchParams.set('id', project.id);
                if (category && pathname === '/portfolio/category.html') canonical.searchParams.set('id', category.id);
                const tags = preview || status === 404 ? '<meta name="robots" content="noindex,nofollow">' :
                    `<link rel="canonical" href="${escape(canonical.href)}"><meta property="og:url" content="${escape(canonical.href)}"><meta property="og:title" content="${escape(title)}">` +
                    (description ? `<meta property="og:description" content="${escape(description)}">` : '') +
                    (image ? `<meta property="og:image" content="${escape(new URL(image.replace(/^\.\.\//, ''), expectedOrigin + '/').href)}">` : '');
                bytes = Buffer.from(html.replace(/<title>.*?<\/title>/, () => `<title>${escape(title)}</title>`)
                    .replace(/<meta name="description"[^>]*>/, tag => description ? `<meta name="description" content="${escape(description)}">` : tag)
                    .replace('</head>', () => tags + '</head>'));
            }
            const headers = { 'Content-Type': type, 'Content-Length': bytes.length, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin' };
            if (isAdmin)
                headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' https: http: data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'";
            res.writeHead(status, headers);
            res.end(req.method === 'HEAD' ? undefined : bytes);
        }
        catch (e) {
            if (!res.headersSent)
                json(res, e.code === 'ENOENT' ? 404 : e.status || 500, { error: e.code === 'ENOENT' ? 'Not found.' : e.status ? e.message : 'Could not complete the operation. Try again.' });
            else
                res.end();
        }
    });
    server.on('close', () => store.db.close());
    return server;
}
if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
    if (process.env.NODE_ENV === 'production' && !process.env.PUBLIC_ORIGIN)
        throw Error('Production requires PUBLIC_ORIGIN and ADMIN_PASSWORD.');
    const port = Number(process.env.ADMIN_PORT || 8080);
    const server = createAdminServer(repoRoot, { dataDir: process.env.PORTFOLIO_DATA_DIR, origin: process.env.PUBLIC_ORIGIN, password: process.env.ADMIN_PASSWORD, inquiryWebhook: process.env.INQUIRY_WEBHOOK, inquiryToken: process.env.INQUIRY_WEBHOOK_TOKEN });
    server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? `Port ${port} is in use. Stop the other preview or set ADMIN_PORT=8081.` : error.message); process.exitCode = 1; });
    server.listen(port, '127.0.0.1', () => console.log(`Portfolio: http://127.0.0.1:${port}/\nAdmin panel: http://127.0.0.1:${port}/admin/\nContent is stored in SQLite. Ctrl+C to stop.`));
}
