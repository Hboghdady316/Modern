import { homeSectionVisible } from '../site/js/home-layout.js';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync, chmodSync } from 'node:fs';
import path from 'node:path';

export function openStore(directory, seedPath) {
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    const filename = path.join(directory, 'portfolio.sqlite');
    const db = new DatabaseSync(filename);
    chmodSync(filename, 0o600);
    db.exec(`
      PRAGMA busy_timeout = 5000;
      CREATE TABLE IF NOT EXISTS content (kind TEXT PRIMARY KEY, document TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS snapshots (id TEXT PRIMARY KEY, document TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS metrics (day TEXT NOT NULL, event TEXT NOT NULL, total INTEGER NOT NULL, PRIMARY KEY(day, event));
      CREATE TABLE IF NOT EXISTS media (name TEXT PRIMARY KEY, bytes BLOB NOT NULL);
    `);
    const get = db.prepare('SELECT document FROM content WHERE kind = ?');
    const put = db.prepare('INSERT INTO content VALUES (?, ?) ON CONFLICT(kind) DO UPDATE SET document = excluded.document');
    if (!get.get('draft')) {
        const seed = JSON.parse(readFileSync(seedPath, 'utf8'));
        seed.profile.phone = '';
        seed.profile.services = [
            'Branding & visual identity | Brand identities, logos, and visual systems. | Discover the brand, agree a direction, and deliver usable assets.',
            'Campaigns & social media | Campaign art direction, social designs, and animated posts. | Align on audience, channels, and rollout.',
            'Motion & AI creative | Logo animation, video editing, promotional videos, and AI-assisted visuals. | Agree a storyboard and review drafts before delivery.',
            'Print, editorial & outdoor | Print collateral, editorial layouts, and outdoor artwork. | Confirm production specifications and proof the designs.',
        ];
        seed.profile.qualifications = ['Meska AI · 21 September 2026 · Five days of AI tool personalization and AI advertising video production.'];
        seed.profile.aiApproach = 'I use AI where it supports the creative direction, then refine and review the work before delivery.';
        seed.profile.siteDescription = 'Haitham Boghdady, Senior Graphic Designer & AI Creative Specialist. Branding, social campaigns, motion, print and editorial design.';
        seed.profile.role = 'Senior Graphic Designer & AI Creative Specialist';
        seed.profile.tagline = 'Brand identities, social campaigns, and AI-assisted creative work.';
        seed.settings.sections.skills = false;
        seed.settings.showLearningWidget = false;
        seed.categories.find(c => c.id === 'social-media').name = 'Social Media';
        const document = JSON.stringify(seed);
        put.run('draft', document);
        put.run('published', document);
    }
    return {
        db,
        record: event => db.prepare(`INSERT INTO metrics VALUES (date('now'), ?, 1)
            ON CONFLICT(day, event) DO UPDATE SET total = total + 1`).run(event),
        metrics: () => db.prepare(`SELECT event, SUM(total) total FROM metrics WHERE day >= date('now', '-29 days') GROUP BY event`).all(),
        get: kind => get.get(kind).document,
        put: (kind, document) => put.run(kind, document),
        backup: (id, document) => db.prepare('INSERT INTO snapshots VALUES (?, ?)').run(id, document),
        backups: () => db.prepare('SELECT id FROM snapshots ORDER BY id DESC LIMIT 30').all().map(row => row.id),
        snapshot: id => db.prepare('SELECT document FROM snapshots WHERE id = ?').get(id)?.document,
        addMedia: (name, bytes) => db.prepare('INSERT INTO media VALUES (?, ?)').run(name, bytes),
        media: name => db.prepare('SELECT bytes FROM media WHERE name = ?').get(name)?.bytes,
    };
}

export function publicContent(document) {
    const content = JSON.parse(document);
    delete content.profile.phone;
    content.profile.socials = content.profile.socials.filter(link => link.url);
    const isPublic = p => p.visible !== false && !p.archived && !p.placeholder;
    const live = content.categories.filter(c => c.visible !== false).flatMap(c => c.projects.filter(isPublic));
    content.categories = content.categories.filter(c => c.visible !== false).map(c => ({
        ...c, projects: c.projects.filter(isPublic).concat(live.filter(p => !c.projects.includes(p) && p.extraCategories?.includes(c.id))),
    }));
    if (!content.settings.sections.skills) content.skills = [];
    content.learning = homeSectionVisible(content.settings, 'learning')
        ? content.learning.filter(item => item.visible !== false) : [];
    return content;
}

export function mediaReferences(content) {
    return new Set([content.profile.resumeUrl, content.profile.photoUrl, content.profile.shareImage,
        ...content.categories.flatMap(c => [c.image, ...c.projects.flatMap(p => [p.image, p.videoUrl, p.captions, ...(p.processImages || []), ...(p.galleryImages || [])])])]
        .filter(Boolean).map(value => value.replace(/^\.\.\//, '')));
}
