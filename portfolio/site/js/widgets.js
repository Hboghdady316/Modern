import { siteContent, escapeHtml, whenReady } from './site-content.js';
import { homeSectionVisible } from './home-layout.js';

whenReady(() => {
    const list = document.getElementById('learning-list');
    if (!list || !homeSectionVisible(siteContent.settings, 'learning')) return;
    const topics = (siteContent.learning || []).filter(item => item.visible !== false);
    list.innerHTML = topics.map(item => `
        <div class="learning-item">
          <div class="learning-row"><div class="learning-left"><span>${escapeHtml(item.icon)}</span>${escapeHtml(item.name)}</div><span class="learning-pct">${item.progress}%</span></div>
          <div class="progress-track"><div class="progress-fill" style="width:${item.progress}%"></div></div>
        </div>`).join('');
    if (siteContent.settings.learningNext?.trim()) {
        list.insertAdjacentHTML('beforeend', `
          <div class="learning-next"><div class="learning-next-head">Next up</div>
          <p class="learning-next-body">${escapeHtml(siteContent.settings.learningNext)}</p></div>`);
    }
    document.getElementById('learning').hidden = !list.children.length;
});
