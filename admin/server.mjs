import http from 'node:http';
import { readFile, writeFile, mkdir, rename, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { randomBytes, randomUUID, createHash, timingSafeEqual } from 'node:crypto';
import { validateContent } from './validation.mjs';
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif', '.mp4': 'video/mp4', '.webm': 'video/webm', '.pdf': 'application/pdf' };
const uploadTypes = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif', 'video/mp4': 'mp4', 'video/webm': 'webm', 'application/pdf': 'pdf' };
export function createAdminServer(root = repoRoot) {
    const siteRoot = path.join(root, 'vanilla-site'), adminRoot = path.join(root, 'admin'), contentFile = path.join(siteRoot, 'data/content.json'), backupRoot = path.join(root, 'admin/.backups');
    const token = randomBytes(32).toString('hex');
    let queue = Promise.resolve();
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
    function auth(req) { const provided = Buffer.from(String(req.headers['x-admin-token'] || '')), expected = Buffer.from(token); return provided.length === expected.length && timingSafeEqual(provided, expected); }
    const server = http.createServer(async (req, res) => {
        try {
            // Loopback binding + strict Host/Origin checks protect the local file-writing API.
            const allowedHosts = new Set([`127.0.0.1:${server.address().port}`, `localhost:${server.address().port}`]);
            if (!allowedHosts.has(req.headers.host)) {
                json(res, 403, { error: 'Local access only.' });
                return;
            }
            if (req.headers.origin && ![...allowedHosts].map(host => `http://${host}`).includes(req.headers.origin)) {
                json(res, 403, { error: 'Origin is not allowed.' });
                return;
            }
            if (req.headers['sec-fetch-site'] === 'cross-site') {
                json(res, 403, { error: 'Cross-site requests are not allowed.' });
                return;
            }
            const pathname = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
            if (pathname.startsWith('/api/')) {
                if (pathname === '/api/session' && req.method === 'GET') {
                    json(res, 200, { token });
                    return;
                }
                if (!auth(req)) {
                    json(res, 403, { error: 'Admin session expired. Reload the panel.' });
                    return;
                }
                if (pathname === '/api/content' && req.method === 'GET') {
                    const raw = await readFile(contentFile);
                    json(res, 200, { content: JSON.parse(raw), revision: revision(raw) });
                    return;
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
                    const save = async () => {
                        const old = await readFile(contentFile);
                        if (req.headers['if-match'] !== revision(old)) {
                            json(res, 409, { error: 'Content changed in another panel. Export your draft, then reload before saving.' });
                            return;
                        }
                        await mkdir(backupRoot, { recursive: true });
                        const id = `${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID()}.json`;
                        await writeFile(path.join(backupRoot, id), old, { flag: 'wx', mode: 0o600 });
                        const output = JSON.stringify(value, null, 2) + '\n', temp = `${contentFile}.${randomUUID()}.tmp`;
                        await writeFile(temp, output);
                        await rename(temp, contentFile);
                        json(res, 200, { revision: revision(output), backup: id, savedAt: new Date().toISOString() });
                    };
                    const work = queue.then(save);
                    queue = work.catch(() => { });
                    await work;
                    return;
                }
                if (pathname === '/api/backups' && req.method === 'GET') {
                    const files = await readdir(backupRoot).catch(() => []);
                    json(res, 200, { backups: files.filter(f => f.endsWith('.json')).sort().reverse() });
                    return;
                }
                if (pathname.startsWith('/api/backups/') && req.method === 'GET') {
                    const id = pathname.slice('/api/backups/'.length);
                    if (!/^[a-zA-Z0-9-]+\.json$/.test(id)) {
                        json(res, 400, { error: 'Invalid backup ID.' });
                        return;
                    }
                    json(res, 200, { content: JSON.parse(await readFile(path.join(backupRoot, id))) });
                    return;
                }
                if (pathname === '/api/uploads' && req.method === 'POST') {
                    const type = (req.headers['content-type'] || '').split(';')[0], extension = uploadTypes[type];
                    if (!extension) {
                        json(res, 400, { error: 'Upload PNG, JPG, WebP, GIF, AVIF, MP4, WebM, or PDF files.' });
                        return;
                    }
                    const bytes = await body(req, 30 * 1024 * 1024);
                    if (!bytes.length) {
                        json(res, 400, { error: 'The file is empty.' });
                        return;
                    }
                    const name = `${randomUUID()}.${extension}`, folder = path.join(siteRoot, 'assets/uploads');
                    await mkdir(folder, { recursive: true });
                    await writeFile(path.join(folder, name), bytes, { flag: 'wx' });
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
            const info = await stat(file);
            if (!info.isFile()) {
                json(res, 404, { error: 'Not found.' });
                return;
            }
            const headers = { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Content-Length': info.size, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin' };
            if (isAdmin)
                headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' https: http: data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'";
            res.writeHead(200, headers);
            res.end(req.method === 'HEAD' ? undefined : await readFile(file));
        }
        catch (e) {
            if (!res.headersSent)
                json(res, e.code === 'ENOENT' ? 404 : e.status || 500, { error: e.code === 'ENOENT' ? 'Not found.' : e.status ? e.message : 'Could not complete the operation. Try again.' });
            else
                res.end();
        }
    });
    return server;
}
if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
    const port = Number(process.env.ADMIN_PORT || 8080);
    const server = createAdminServer();
    server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? `Port ${port} is in use. Stop the other preview or set ADMIN_PORT=8081.` : error.message); process.exitCode = 1; });
    server.listen(port, '127.0.0.1', () => console.log(`Portfolio: http://127.0.0.1:${port}/\nAdmin panel: http://127.0.0.1:${port}/admin/\nSaves update vanilla-site/data/content.json. Ctrl+C to stop.`));
}
