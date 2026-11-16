export const homeSections = Object.freeze({
    home: 'Homepage intro',
    about: 'About Me',
    experience: 'Work experience',
    services: 'Services I Offer',
    learning: 'Currently Learning',
    featured: 'Selected Work',
    projects: 'Project Galaxy',
    skills: 'Skills Matrix',
    contact: 'Contact',
});

export function homeSectionOrder(settings) {
    const defaults = Object.keys(homeSections);
    const order = Array.isArray(settings.homeOrder) ? settings.homeOrder.filter(id => Object.hasOwn(homeSections, id)) : [];
    return [...new Set([...order, ...defaults])];
}

export function homeSectionVisible(settings, id) {
    return (settings.sections?.[id] ?? (id === 'learning' ? settings.showLearningWidget : true)) !== false;
}
