export const escapeMarkup = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

export function publicUrl(value, base) {
    if (!value) return '';
    try {
        const url = new URL(value, base);
        return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch { return ''; }
}

export function portraitMarkup(photo) {
    return `<span data-portrait-fallback${photo ? ' hidden' : ''}>✦</span><img data-profile-portrait alt=""${photo ? ` src="${escapeMarkup(photo)}"` : ' hidden'}>`;
}

const routes = [
        ['Home', './'], ['Work', 'work.html'], ['Project Galaxy', './#projects', 'projects'],
        ['Services', 'services.html'], ['About', './#about', 'about'], ['Contact', 'contact.html'],
];

export function headerMarkup({base, preview = false, path = '', hash = '', profile = {}, settings = {}}) {
    const href = route => {
        const url = new URL(route, base);
        if (preview) url.searchParams.set('preview', '1');
        return url;
    };
    const links = routes.map(([label, route, section]) => {
        const url = href(route);
        const current = path.replace(/\/index\.html$/, '/') === url.pathname && hash === url.hash;
        return `<a href="${escapeMarkup(url.href)}"${section ? ` data-section-link="${section}"` : ''}${section && settings.sections?.[section] === false ? ' hidden' : ''}${label === 'Contact' ? ' class="site-nav-contact"' : ''}${current ? ` aria-current="${url.hash ? 'location' : 'page'}"` : ''}>${label}</a>`;
    }).join('');
    const cv = publicUrl(profile.resumeUrl, base);
    return `<div class="site-header-inner"><a class="site-brand" data-home href="${escapeMarkup(href('./').href)}"><span class="site-portrait" aria-hidden="true">${portraitMarkup(publicUrl(profile.photoUrl, base))}</span><span class="wordmark liquid-gradient font-sora">${escapeMarkup(profile.name || 'Haitham Boghdady')}</span></a><nav aria-label="Main navigation" class="site-menu">${links}<a data-header-cv${cv ? ` href="${escapeMarkup(cv)}"` : ' hidden'}>Download CV</a></nav></div>`;
}

export function footerMarkup({ base, preview = false, profile = {}, settings = {} }) {
    const name = escapeMarkup(profile.name || 'Haitham Boghdady');
    const href = route => {
        const url = new URL(route, base);
        if (preview) url.searchParams.set('preview', '1');
        return escapeMarkup(url.href);
    };
    const links = [...routes, ['Privacy', 'privacy.html']].map(([label, route, section]) =>
        `<a href="${href(route)}"${section ? ` data-section-link="${section}"` : ''}${section && settings.sections?.[section] === false ? ' hidden' : ''}>${label}</a>`).join('');
    const cv = publicUrl(profile.resumeUrl, base);
    return `<div class="shared-footer-inner">
      <a class="site-brand" href="${href('./')}"><span class="site-portrait" aria-hidden="true">${portraitMarkup(publicUrl(profile.photoUrl, base))}</span><span class="wordmark liquid-gradient font-sora">${name}</span></a>
      <nav aria-label="Footer navigation">${links}<a data-footer-cv${cv ? ` href="${escapeMarkup(cv)}"` : ' hidden'}>Download CV</a></nav>
      <p class="shared-footer-copyright" data-site-copyright>© ${new Date().getFullYear()} ${name}. All rights reserved.</p>
    </div>`;
}
