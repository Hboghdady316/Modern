import { headerMarkup, footerMarkup } from './public-markup.js';
// The same navigation is mounted on every public page, independent of the content request.
const header = document.getElementById('site-header');
if (header) {
    const base = new URL('../', import.meta.url);
    const keepPreview = new URLSearchParams(location.search).get('preview') === '1';
    if (!header.firstElementChild) header.innerHTML = headerMarkup({ base, preview: keepPreview, path: location.pathname, hash: location.hash });
    function syncCurrentLink() {
        for (const anchor of header.querySelectorAll('.site-menu a[href]:not([data-header-cv])')) {
            const url = new URL(anchor.href);
            if (location.pathname.replace(/\/index\.html$/, '/') === url.pathname && location.hash === url.hash)
                anchor.setAttribute('aria-current', url.hash ? 'location' : 'page');
            else anchor.removeAttribute('aria-current');
        }
    }
    syncCurrentLink();
    window.addEventListener('hashchange', syncCurrentLink);
    header.addEventListener('click', event => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const anchor = event.target.closest('.site-menu a[href]:not([data-header-cv]), [data-home][href]');
        if (!anchor || anchor.target || anchor.hasAttribute('download')) return;
        const destination = new URL(anchor.href);
        // Other destinations already get a full document navigation. For fragments
        // in the current document, preserve the destination in history and reload it.
        if (destination.origin !== location.origin || destination.pathname !== location.pathname || destination.search !== location.search) return;
        event.preventDefault();
        if (destination.hash !== location.hash) history.pushState(null, '', destination.href);
        if (!destination.hash) history.scrollRestoration = 'manual';
        location.reload();
    });
    if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(() => {
            document.documentElement.style.setProperty('--site-header-height', header.offsetHeight + 'px');
        }).observe(header);
    }
}

const footer = document.getElementById('site-footer');
if (footer && !footer.firstElementChild) {
    footer.innerHTML = footerMarkup({
        base: new URL('../', import.meta.url),
        preview: new URLSearchParams(location.search).get('preview') === '1',
    });
}
