import { siteContent, whenReady } from './site-content.js';
import { createFallbackGalaxy } from './galaxy-fallback.js';

whenReady(() => {
    const container = document.getElementById('skills-canvas-target');
    if (!container || !siteContent.settings.sections.skills) return;
    const skills = siteContent.skills || [];
    const panel = document.getElementById('skill-detail-panel');
    if (!skills.length) {
        container.textContent = 'Skills coming soon.';
        container.style.minHeight = '0';
        return;
    }
    createFallbackGalaxy(container, {
        projects: skills,
        getLayout: () => siteContent.settings.defaultLayout,
        label: 'Skill planets',
        labelFor: skill => `${skill.name} · ${skill.level}%`,
        onSelect(skill) {
            document.getElementById('skill-dialog-title').textContent = skill.name;
            document.getElementById('skill-dialog-category').textContent = skill.category;
            document.getElementById('skill-dialog-meter').value = skill.level;
            document.getElementById('skill-dialog-level').textContent = `${skill.level}%`;
            const description = document.getElementById('skill-dialog-description');
            description.textContent = skill.description;
            description.hidden = !skill.description;
            panel.showModal();
        },
    });
});
