import { homeSectionOrder, homeSectionVisible } from '../vanilla-site/js/home-layout.js';
import { escapeMarkup as esc, headerMarkup, footerMarkup, portraitMarkup, publicUrl } from '../vanilla-site/js/public-markup.js';

export function renderPublicPage(html, content, { origin, pathname, preview }) {
    const base = new URL('/', origin);
    const profile = content.profile;
    html = html.replace('<header id="site-header" class="site-header"></header>', () =>
        `<header id="site-header" class="site-header">${headerMarkup({base, preview, path: pathname, profile, settings: content.settings})}</header>`);
    html = html.replace('<footer id="site-footer" class="shared-footer"></footer>', () =>
        `<footer id="site-footer" class="shared-footer">${footerMarkup({base, preview, profile, settings: content.settings})}</footer>`);
    if (pathname === '/' || pathname === '/index.html') {
        const rows = content.timeline.map((item, index) => `<div class="timeline-item${index % 2 ? ' reverse' : ''}">
          <div class="timeline-card-col"><div class="timeline-card"><div class="card glass-morphism"><div class="card-body">
            <p class="timeline-year">${esc(item.year)}</p><h3 class="timeline-title">${esc(item.title)}</h3>
            <p class="timeline-company">${esc(item.company)}</p>${item.location ? `<p class="timeline-location">${esc(item.location)}</p>` : ''}
            <p class="timeline-desc">${esc(item.description)}</p>
            <div class="timeline-tags">${item.technologies.map(tag => `<span class="badge">${esc(tag)}</span>`).join('')}</div>
          </div></div></div></div><div class="timeline-node-col"><div class="timeline-node"></div></div><div class="timeline-spacer"></div>
        </div>`).join('');
        const categories = content.categories.filter(category => category.visible !== false);
        const planets = categories.map(category => {
            const url = new URL(category.url, base);
            if (preview) url.searchParams.set('preview', '1');
            const color = /^#[0-9a-f]{6}$/i.test(category.color) ? category.color : '#bd8cff';
            return `<a class="fallback-planet" href="${esc(url.href)}" style="--planet-color:${color}"><span class="fallback-planet-orb" aria-hidden="true"></span><span class="fallback-planet-label">${esc(category.name)}</span></a>`;
        }).join('');
        html = html
            .replace(/(<div class="timeline-items" id="timeline-items">)<p[^>]*>.*?<\/p><\/div>/, (_, start) => start + (rows || 'Experience details coming soon.') + '</div>')
            .replace(/(<div id="projects-canvas-target"[^>]*>)<\/div>/, (_, start) => start + `<div class="galaxy-map-fallback galaxy-grid-fallback initial-planet-map" aria-label="Design category planets">${planets}</div></div>`)
            .replace('Loading project categories…', () => categories.length ? 'Choose a planet to explore its collection.' : 'No categories are currently visible.')
            .replace('<span data-portrait-fallback>✦</span><img data-profile-portrait alt="" hidden>', () => portraitMarkup(publicUrl(profile.photoUrl, base)));
        html = html.replace(/(<!-- home-layout:start -->)([\s\S]*?)(<!-- home-layout:end -->)/, (_, start, layout, end) => {
            const blocks = new Map([...layout.matchAll(/<!-- home-block:([a-z]+) -->([\s\S]*?)<!-- \/home-block -->/g)].map(([, id, markup]) => [id, markup.trim()]));
            if (!blocks.size) return start + layout + end;
            const ordered = homeSectionOrder(content.settings).filter(id => blocks.has(id)).map(id => {
                const markup = blocks.get(id);
                return homeSectionVisible(content.settings, id) ? markup : markup.replace(/^<section(?![^>]*\shidden(?:[\s=>]))/, '<section hidden');
            });
            return start + '\n' + ordered.join('\n') + '\n' + end;
        });
    }
    // Use the exact snapshot already authorized for this response, without a second fetch.
    const snapshot = JSON.stringify(content).replace(/</g, '\\u003c');
    return html.replace('</body>', () => `<script type="application/json" id="initial-site-content">${snapshot}</script></body>`);
}
